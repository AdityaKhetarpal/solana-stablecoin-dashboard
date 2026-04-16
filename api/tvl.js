module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Historical TVL data — cache for 1 hour; serve stale up to 10 min while revalidating
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 13000);
    const r = await fetch('https://api.llama.fi/v2/historicalChainTvl/Solana', { signal: ac.signal });
    clearTimeout(t);
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    const data = await r.json();
    return res.json(data);
  } catch (e) {
    console.error('tvl:', e.message);
    return res.status(502).json({ error: e.message });
  }
};
