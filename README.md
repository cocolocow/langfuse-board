# langfuse-board

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/cocolocow/langfuse-board/actions/workflows/ci.yml/badge.svg)](https://github.com/cocolocow/langfuse-board/actions/workflows/ci.yml)

**Connect your Langfuse. Get a dashboard your CEO can actually read.**

Your AI costs, usage, and quality — in one screen, no traces, no jargon. Built for the people who pay for the AI, not the people who build it.

<!-- TODO: Add screenshot here -->
<!-- ![langfuse-board screenshot](docs/screenshot.png) -->

## Features

- **Cost Overview** — Total spend, daily trends, monthly projections, breakdown by model
- **Usage Analytics** — Active users, requests/day, token consumption, top users
- **Quality Metrics** — Average & P95 latency, error rates, quality scores
- **Live Feed** — Real-time stream of traces with status, cost, and custom dimensions
- **Custom Dimensions** — Configure breakdowns by any Langfuse metadata field
- **Smart Caching** — Stays within Langfuse API rate limits (works on the free plan)
- **Dark Theme** — Electric Indigo aesthetic, designed for large screens

## Quick Start

### Demo mode (no Langfuse needed)

```bash
git clone https://github.com/cocolocow/langfuse-board.git
cd langfuse-board
cp .env.example .env
pnpm install
pnpm dev
```

Open http://localhost:3000 — you'll see the dashboard with realistic mock data.

### Connect to Langfuse

Edit `.env`:

```env
LANGFUSE_MOCK=false
LANGFUSE_HOST=https://cloud.langfuse.com
LANGFUSE_PUBLIC_KEY=pk-lf-your-key
LANGFUSE_SECRET_KEY=sk-lf-your-key
```

Then `pnpm dev` again.

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
Langfuse → API (cached) → Dashboard (React Query)
```

The API caches responses to stay within Langfuse rate limits — works on the free plan (100 calls/day).

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
pnpm dev               # Start API + Dashboard
pnpm test              # Run all tests
pnpm test:unit         # Unit tests only
pnpm test:integration  # Integration tests
pnpm typecheck         # TypeScript checks
```

## API Endpoints

All endpoints accept `?from=ISO&to=ISO`

| Endpoint | Description |
|----------|-------------|
| `GET /api/overview` | KPI cards + trend charts |
| `GET /api/costs` | Cost breakdown by model |
| `GET /api/usage` | Users, traces, tokens |
| `GET /api/quality` | Latency, errors, scores |
| `GET /api/feed` | Live trace feed |
| `GET /api/breakdown` | Breakdown by custom dimension |
| `GET /api/config` | Board configuration |
| `GET /api/health` | API + Langfuse status |

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, conventions, and how to submit a PR.

Looking for a place to start? Check out the [good first issues](https://github.com/cocolocow/langfuse-board/labels/good%20first%20issue).

## License

[MIT](LICENSE)
