// Live stablecoin TVL per top Solana protocol — fetched from DefiLlama
const PROTOCOLS = [
  { key: 'kamino',            label: 'Kamino'   },
  { key: 'drift',             label: 'Drift'    },
  { key: 'marginfi',          label: 'Marginfi' },
  { key: 'orca',              label: 'Orca'     },
  { key: 'jupiter-perpetuals',label: 'Jupiter'  },
];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  try {
    const results = await Promise.allSettled(
      PROTOCOLS.map(p =>
        fetch(`https://api.llama.fi/tvl/${p.key}`, {
          signal: AbortSignal.timeout(8000),
        })
          .then(r => (r.ok ? r.json() : null))
          .then(tvl => ({ label: p.label, tvl: typeof tvl === 'number' ? tvl : null }))
      )
    );

    const data = results
      .filter(r => r.status === 'fulfilled' && r.value.tvl != null)
      .map(r => r.value)
      .sort((a, b) => b.tvl - a.tvl);

    return res.json({ protocols: data });
  } catch (e) {
    console.error('protocols:', e.message);
    return res.status(502).json({ error: e.message });
  }
};
