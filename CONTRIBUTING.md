# Contributing to langfuse-board

Thanks for your interest in contributing! This project is open source and we welcome contributions of all kinds — bug fixes, new features, docs improvements, and more.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Setup

```bash
git clone https://github.com/cocolocow/langfuse-board.git
cd langfuse-board
cp .env.example .env
pnpm install
```

The default `.env` has `LANGFUSE_MOCK=true` — you don't need a Langfuse account to develop.

```bash
pnpm dev    # Starts API + Dashboard
pnpm test   # Runs all tests
```

Dashboard: http://localhost:3000 — API: http://localhost:3001

## Development Workflow

### TDD — Tests First

We write tests before implementation. Always.

```bash
pnpm test:unit          # Fast, run often
pnpm test:integration   # API route tests
pnpm test               # Everything
```

### Code Conventions

- **TypeScript strict** — No `any`, no `@ts-ignore`
- **English everywhere** — Code, comments, variable names, commits, PRs
- **Pure functions** — Business logic goes in `packages/shared/`, framework-free and fully testable
- **Server validates everything** — Zod schemas in shared, validated on every API input
- **No over-engineering** — Simplest solution first. Three similar lines > premature abstraction

### Architecture

```
packages/shared/     → Types, pure transformers, Zod validators (zero deps)
apps/api/            → Hono backend, proxies Langfuse API with in-memory cache
apps/dashboard/      → React SPA, calls API, renders charts
```

Data flows one way: **Langfuse → API (cached) → Dashboard (React Query)**

## Making Changes

1. **Fork** the repo and create a branch from `main`
2. **Write tests** for your change
3. **Implement** the change
4. **Run tests** — all must pass before opening a PR

```bash
pnpm test
pnpm typecheck
```

5. **Commit** with a clear message explaining *why*, not just *what*

```
add cost breakdown by trace name

Users need to see which features cost the most,
not just which models.
```

6. **Open a PR** against `main`

## Pull Request Guidelines

- Keep PRs focused — one change per PR
- Add tests for new features and bug fixes
- Update types in `packages/shared/` if you change API contracts
- Screenshots welcome for UI changes

## Good First Issues

Look for issues labeled [`good first issue`](https://github.com/cocolocow/langfuse-board/labels/good%20first%20issue) — these are scoped, well-documented, and a great way to get started.

## Questions?

Open an issue or start a discussion. We're happy to help.
