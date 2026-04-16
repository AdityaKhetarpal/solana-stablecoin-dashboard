module.exports = async function handler(req, res) {
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 9000);
    const r = await fetch('https://stablecoins.llama.fi/stablecoincharts/Solana', { signal: ac.signal });
    clearTimeout(t);
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    const data = await r.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    return res.json(data);
  } catch (e) {
    console.error('supply:', e.message);
    return res.status(502).json({ error: e.message });
  }
};
