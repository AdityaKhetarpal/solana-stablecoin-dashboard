const NOTION_API_KEY = (process.env.NOTION_API_KEY || '').trim();
const NOTION_DB_ID   = (process.env.NOTION_DB_ID  || '').trim();
const NOTION_VERSION = '2022-06-28';

const ALLOWED_ORIGINS = [
  'https://solanastablecoin.bingo',
  'https://www.solanastablecoin.bingo',
  'https://solanastablecoin.vercel.app',
];

const headers = () => ({
  'Authorization': `Bearer ${NOTION_API_KEY}`,
  'Content-Type': 'application/json',
  'Notion-Version': NOTION_VERSION,
});

// Simple in-memory rate limit: max 5 requests per IP per 60s window
const rateLimitMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const window = 60_000;
  const max = 5;
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > window) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }
  if (entry.count >= max) return true;
  entry.count++;
  rateLimitMap.set(ip, entry);
  return false;
}

module.exports = async function handler(req, res) {
  // CORS — only allow requests from the dashboard domains
  const origin = req.headers['origin'] || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Reject requests not originating from allowed domains
  const referer = req.headers['referer'] || '';
  const originOk = ALLOWED_ORIGINS.includes(origin);
  const refererOk = ALLOWED_ORIGINS.some(o => referer.startsWith(o));
  if (!originOk && !refererOk) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Rate limiting per IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const { email, source } = req.body || {};

  // Email validation — max 254 chars (RFC 5321), basic format check
  if (!email || typeof email !== 'string' || email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  const cleanEmail = email.trim().toLowerCase();

  // Sanitize source field — trim, max 100 chars, fallback
  const cleanSource = typeof source === 'string'
    ? source.trim().slice(0, 100)
    : 'Q1 2026 Report';

  if (!NOTION_API_KEY || !NOTION_DB_ID) {
    console.error('subscribe: NOTION_API_KEY or NOTION_DB_ID not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    // Check for duplicate — don't store the same email twice
    const dupCheck = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        filter: { property: 'Email', email: { equals: cleanEmail } },
        page_size: 1,
      }),
    });
    const dupData = await dupCheck.json();
    if (dupData.results?.length > 0) {
      // Already in the list — silently succeed (don't reveal this to the client)
      return res.status(200).json({ ok: true });
    }

    // Insert new subscriber row
    const create = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        parent: { database_id: NOTION_DB_ID },
        properties: {
          'Name':           { title:     [{ text: { content: cleanEmail } }] },
          'Email':          { email:     cleanEmail },
          'Source Page':    { rich_text: [{ text: { content: cleanSource } }] },
          'Status':         { select:    { name: 'Active' } },
          'Report Interest':{ rich_text: [{ text: { content: 'Q2 2026' } }] },
        },
      }),
    });

    if (!create.ok) {
      const err = await create.json();
      console.error('subscribe: Notion error', err);
      return res.status(502).json({ error: 'Could not save subscription' });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('subscribe:', e.message);
    return res.status(500).json({ error: 'Internal error' });
  }
};
