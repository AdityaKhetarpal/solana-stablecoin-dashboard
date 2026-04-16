module.exports = async function handler(req, res) {
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 9000);
    const r = await fetch('https://stablecoins.llama.fi/stablecoins?includePrices=true', { signal: ac.signal });
    clearTimeout(t);
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    const raw = await r.json();

    // Filter server-side — only return stablecoins with Solana supply > $500k
    // This shrinks the 10MB global payload to ~50KB before sending to the browser
    const filtered = (raw.peggedAssets || [])
      .filter(s => (s.chainCirculating?.Solana?.current?.peggedUSD || 0) > 500_000)
      .map(s => ({
        symbol: s.symbol,
        name: s.name,
        price: s.price,
        chainCirculating: { Solana: s.chainCirculating?.Solana },
      }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    return res.json({ peggedAssets: filtered });
  } catch (e) {
    console.error('stables:', e.message);
    return res.status(502).json({ error: e.message });
  }
};
