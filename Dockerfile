FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/dashboard/package.json apps/dashboard/

# Install dependencies
FROM base AS deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build shared
FROM deps AS build-shared
COPY packages/shared/ packages/shared/
COPY tsconfig.base.json ./
RUN pnpm --filter @langfuse-board/shared build

# Build dashboard
FROM build-shared AS build-dashboard
COPY apps/dashboard/ apps/dashboard/
RUN pnpm --filter @langfuse-board/dashboard build

# Production image
FROM base AS production
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod

COPY --from=build-shared /app/packages/shared/dist packages/shared/dist
COPY --from=build-shared /app/packages/shared/src packages/shared/src
COPY apps/api/src apps/api/src
COPY apps/api/tsconfig.json apps/api/
COPY tsconfig.base.json ./
COPY --from=build-dashboard /app/apps/dashboard/dist apps/dashboard/dist

EXPOSE 3001
ENV NODE_ENV=production

CMD ["pnpm", "--filter", "@langfuse-board/api", "dev"]
