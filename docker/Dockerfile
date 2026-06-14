# IndieWork — production image. Debian-slim (reliable native modules: pg, sharp).
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ---- dependencies ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# ---- build ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---- runtime ----
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY drizzle ./drizzle
COPY src ./src
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc next.config.ts tsconfig.json drizzle.config.ts ./

EXPOSE 3000
# Migrate + ensure a default workspace (both idempotent), then serve.
CMD ["sh", "-c", "node --import tsx src/server/db/migrate.ts && node --import tsx src/server/db/seed.ts && pnpm start --port 3000 --hostname 0.0.0.0"]
