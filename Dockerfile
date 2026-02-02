# Solar Energy App - Production Dockerfile
# Multi-stage build: frontend + backend, single image

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate
WORKDIR /app

# Stage 1: Install deps and build frontend
FROM base AS frontend-build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/frontend/package.json packages/frontend/
COPY packages/backend/package.json packages/backend/
COPY packages/types/package.json packages/types/
RUN pnpm install --frozen-lockfile
COPY packages/types packages/types
COPY packages/frontend packages/frontend
RUN pnpm --filter frontend run build

# Stage 2: Build backend
FROM base AS backend-build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/frontend/package.json packages/frontend/
COPY packages/backend/package.json packages/backend/
COPY packages/types/package.json packages/types/
RUN pnpm install --frozen-lockfile
COPY packages/types packages/types
COPY packages/backend packages/backend
RUN pnpm --filter @solar-energy-app/types run build && pnpm --filter backend run build

# Stage 3: Production image
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate
WORKDIR /app

# Production deps only (backend)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/frontend/package.json packages/frontend/
COPY packages/backend/package.json packages/backend/
COPY packages/types/package.json packages/types/
RUN pnpm install --frozen-lockfile --prod

COPY packages/types/package.json packages/types/
COPY --from=backend-build /app/packages/types/dist packages/types/dist
COPY --from=backend-build /app/packages/backend/dist packages/backend/dist
COPY --from=frontend-build /app/packages/frontend/dist packages/frontend/dist

ENV NODE_ENV=production
ENV PORT=3000
ENV STATIC_DIR=/app/packages/frontend/dist

EXPOSE 3000

CMD ["node", "packages/backend/dist/server.js"]
