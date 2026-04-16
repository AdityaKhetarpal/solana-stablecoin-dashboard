module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=300');
  try {
    const ac = new AbortController();
    const t  = setTimeout(() => ac.abort(), 8000);
    const r  = await fetch('https://api.alternative.me/fng/?limit=2', { signal: ac.signal });
    clearTimeout(t);
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    const json = await r.json();
    return res.json({ data: json.data });
  } catch (e) {
    console.error('feargreed:', e.message);
    return res.status(502).json({ error: e.message });
  }
};
