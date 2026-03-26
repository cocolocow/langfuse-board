# langfuse-board

The executive dashboard for LLM observability. Plug into your Langfuse instance and get a beautiful, CEO-friendly view of your AI costs, usage, and quality.

**Built for people who don't want to read traces.**

## Features

- **Cost Overview** — Total spend, daily trends, projections, breakdown by model and trace
- **Usage Analytics** — Active users, traces/day, token consumption, top users
- **Quality Metrics** — Average & P95 latency, error rates, quality scores
- **Smart Caching** — Respects Langfuse API rate limits with intelligent TTL-based caching
- **Dark Theme** — Electric Indigo neon aesthetic, designed for large screens

## Quick Start

### Demo mode (no Langfuse needed)

```bash
git clone https://github.com/your-username/langfuse-board.git
cd langfuse-board
cp .env.example .env
pnpm install
```

The `.env` already has `LANGFUSE_MOCK=true` — start and see realistic demo data:

```bash
# Terminal 1: API
pnpm --filter @langfuse-board/api dev

# Terminal 2: Dashboard
pnpm --filter @langfuse-board/dashboard dev
```

Open http://localhost:3000

### Connect to Langfuse

Edit `.env`:

```env
LANGFUSE_MOCK=false
LANGFUSE_HOST=https://cloud.langfuse.com
LANGFUSE_PUBLIC_KEY=pk-lf-your-key
LANGFUSE_SECRET_KEY=sk-lf-your-key
```

### Docker

```bash
cp .env.example .env
# Edit .env with your Langfuse keys
docker compose up
```

## Architecture

```
langfuse-board/
├── packages/shared/     # Types, pure functions, Zod validators
├── apps/api/            # Hono backend — proxies Langfuse with cache
└── apps/dashboard/      # React + Vite + Tailwind + Recharts
```

**Data flow:**
```
Langfuse → API (cache 5min/1h) → Dashboard (React Query)
```

The API caches responses to stay within Langfuse rate limits (100-2000 calls/day depending on plan).

## Tech Stack

| Layer | Tech |
|-------|------|
| Monorepo | Turborepo + pnpm |
| Language | TypeScript (strict) |
| Backend | Hono |
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Routing | wouter |
| Data | React Query |
| Tests | Vitest |

## Development

```bash
pnpm install
pnpm test          # Run all tests
pnpm test:unit     # Unit tests only
pnpm test:integration  # Integration tests
pnpm dev           # Start everything
```

## API Endpoints

All endpoints accept `?from=ISO&to=ISO&granularity=day|week|month`

| Endpoint | Description |
|----------|-------------|
| `GET /api/overview` | KPI cards + trend charts |
| `GET /api/costs` | Cost breakdown by model/trace |
| `GET /api/usage` | Users, traces, tokens |
| `GET /api/quality` | Latency, errors, scores |
| `GET /api/health` | API + Langfuse status |

## Contributing

1. Fork the repo
2. Create a branch (`git checkout -b feature/something`)
3. Write tests first, then implement
4. Make sure all tests pass (`pnpm test`)
5. Commit with a clear message
6. Open a PR

## License

MIT
