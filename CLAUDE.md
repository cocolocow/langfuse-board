# langfuse-board

CEO/business dashboard for LLM observability, plugged into Langfuse.

## Stack

- Monorepo: Turborepo + pnpm
- Language: TypeScript (strict)
- Backend: Hono
- Frontend: React + Vite + shadcn/ui + Recharts + Tailwind
- Tests: Vitest (unit + integration), Playwright (e2e)
- Router: wouter

## Commands

- `pnpm install` — Install all dependencies
- `pnpm dev` — Start api + dashboard in dev mode
- `pnpm build` — Production build
- `pnpm test` — Run all tests
- `pnpm test:unit` — Unit tests only
- `pnpm test:integration` — Integration tests only
- `pnpm test:e2e` — Playwright e2e tests

## Code Conventions

- TDD: write tests BEFORE implementation, always
- Business logic in `packages/shared/` as pure functions
- Server validates ALL client inputs (Zod schemas in shared)
- No over-engineering: simplest solution first
- All code, comments, variable names in English

## Architecture

- `packages/shared` — Types, pure transformers, Zod validators (zero framework deps)
- `apps/api` — Hono backend, proxies Langfuse API with in-memory cache
- `apps/dashboard` — React SPA, calls api, renders charts

## Design

- Theme: Electric Indigo (dark + neon #6366f1)
- Use skills: /ui-ux-pro-max, /frontend-design, /make-interfaces-feel-better, /emilkowalski-design
- Reference: Midday for aesthetic, Plausible for simplicity

## Git

- Commit messages: English, concise, explain "why"
- One commit = one cohesive change
- Tests must pass before commit
