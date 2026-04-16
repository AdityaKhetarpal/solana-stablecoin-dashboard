# Solana Stablecoin Analytics

> Real-time analytics for Solana's $16B+ stablecoin market — live supply charts, peg health, DeFi TVL, SOL price, cross-chain rankings, and free quarterly research reports.

**Live site:** [solanastablecoin.bingo](https://solanastablecoin.bingo)

---

## Overview

A lightweight, zero-dependency dashboard that tracks every meaningful stablecoin flowing through the Solana ecosystem. All data is pulled from public APIs — no paywalls, no authentication required to view.

Built with vanilla HTML/CSS/JS and deployed on Vercel with serverless API routes that proxy and cache upstream data, keeping the frontend fast and the browser free of CORS issues.

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Overview — KPIs, supply breakdown, peg health, chain rankings |
| `/live` | Real-time charts — supply trends, DeFi TVL, SOL price, protocol breakdown |
| `/q1-2026` | Q1 2026 quarterly research report |
| `/q2-2026` | Q2 2026 quarterly research report |
| `/q3-2026` | Q3 2026 quarterly research report |
| `/q4-2026` | Q4 2026 quarterly research report |

---

## Architecture

```
browser  →  HTML/CSS/JS (static)
               ↓
         /api/*  (Vercel Serverless Functions)
               ↓
         DefiLlama · CoinGecko · Alternative.me
```

All API routes live in `/api/` and act as thin, cached proxies. This keeps API keys off the client, reduces upstream load, and serves stale data during outages.

### API Routes

| Endpoint | Data source | Cache |
|----------|-------------|-------|
| `GET /api/stables` | DefiLlama — stablecoin list (Solana only, filtered server-side) | 5 min |
| `GET /api/supply` | DefiLlama — historical Solana stablecoin supply | 5 min |
| `GET /api/chains` | DefiLlama — stablecoin supply by chain | 5 min |
| `GET /api/tvl` | DefiLlama — historical Solana DeFi TVL | 1 hour |
| `GET /api/protocols` | DefiLlama — TVL for top Solana protocols | 5 min |
| `GET /api/sol` | DefiLlama / CoinGecko fallback — SOL price history | 10 min |
| `GET /api/feargreed` | Alternative.me — crypto fear & greed index | 30 min |
| `POST /api/subscribe` | Notion — newsletter subscription (rate-limited, dedup'd) | — |

---

## Tech Stack

- **Frontend** — Vanilla HTML, CSS, JavaScript (no framework, no build step)
- **Charts** — [Chart.js 4](https://www.chartjs.org/)
- **Fonts** — Inter (Google Fonts)
- **Backend** — Vercel Serverless Functions (Node.js)
- **Data** — [DefiLlama](https://defillama.com/) · [CoinGecko](https://coingecko.com/) · [Alternative.me](https://alternative.me/)
- **Newsletter** — Notion API (subscriber storage)
- **Hosting** — [Vercel](https://vercel.com/)

---

## Running Locally

**Prerequisites:** Node.js 20+, [Vercel CLI](https://vercel.com/docs/cli)

```bash
# Install Vercel CLI
npm i -g vercel

# Clone the repo
git clone https://github.com/AdityaKhetarpal/solana-stablecoin-dashboard.git
cd solana-stablecoin-dashboard

# Link to your Vercel project (first time only)
vercel link

# Pull environment variables
vercel env pull .env.local

# Start local dev server (runs API routes + static files)
vercel dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values.

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NOTION_API_KEY` | Yes (for `/api/subscribe`) | Notion integration token |
| `NOTION_DB_ID` | Yes (for `/api/subscribe`) | Target Notion database ID |

All other data sources (DefiLlama, CoinGecko, Alternative.me) are public APIs — no keys needed.

---

## Deployment

The project deploys automatically via Vercel on every push to `main`.

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

Set `NOTION_API_KEY` and `NOTION_DB_ID` in your Vercel project's environment variables dashboard before deploying to production.

---

## Security

- API keys are stored exclusively as Vercel environment variables — never in source code
- `subscribe` endpoint enforces CORS (allowlist), referer validation, and IP-based rate limiting (5 req/min)
- All HTML pages ship with strict `Content-Security-Policy`, `X-Frame-Options: DENY`, `HSTS`, and `Permissions-Policy` headers via `vercel.json`
- `node_modules/`, `.env*.local`, and `.vercel/` are gitignored

---

## Data Sources

| Data | Source |
|------|--------|
| Stablecoin supply & composition | [stablecoins.llama.fi](https://stablecoins.llama.fi) |
| DeFi TVL (chain + protocol) | [api.llama.fi](https://api.llama.fi) |
| SOL price history | [coins.llama.fi](https://coins.llama.fi) / CoinGecko fallback |
| Fear & Greed Index | [alternative.me/fng](https://alternative.me/crypto/fear-and-greed-index/) |
| Volume & holder data (Q1 report) | TokenTerminal · TradingView |

---

## License

MIT — free to fork, adapt, and deploy.

---

Built by [@0xAditya_k](https://x.com/0xAditya_k)
