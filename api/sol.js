// SOL price history — tries DefiLlama first, falls back to CoinGecko if slow/down

async function fromDefiLlama(weekly) {
  if (weekly) {
    const start = 1577836800; // 2020-01-01
    const span  = Math.min(Math.ceil((Date.now() / 1000 - start) / (7 * 86400)), 499);
    const url   = `https://coins.llama.fi/chart/coingecko:solana?start=${start}&span=${span}&period=1w`;
    const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    return r.json();
  } else {
    const start = Math.floor(Date.now() / 1000) - 100 * 86400;
    const url   = `https://coins.llama.fi/chart/coingecko:solana?start=${start}&span=100&period=1d`;
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    return r.json();
  }
}

async function fromCoinGecko() {
  const url = 'https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=100';
  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`CoinGecko upstream ${r.status}`);
  const cg = await r.json();
  // Normalize to DefiLlama's shape so the frontend needs no changes
  const prices = (cg.prices || []).map(([ts, price]) => ({
    timestamp: Math.floor(ts / 1000),
    price,
  }));
  return { coins: { 'coingecko:solana': { prices } } };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Cache for 10 min; serve stale up to 5 more min while revalidating
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');

  const weekly = req.query?.weekly === '1';

  try {
    let data;
    try {
      data = await fromDefiLlama(weekly);
    } catch (primaryErr) {
      if (weekly) throw primaryErr; // weekly chart isn't critical — let it fail quietly
      console.warn('sol: DefiLlama failed, trying CoinGecko —', primaryErr.message);
      data = await fromCoinGecko();
    }
    return res.json(data);
  } catch (e) {
    console.error('sol:', e.message);
    return res.status(502).json({ error: e.message });
  }
};
