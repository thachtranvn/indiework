# Upgrading IndieWork (identity + attribution)

If you installed IndieWork **before** the identity/attribution release, follow these steps
after `git pull`:

## 1. Update environment variables

Add to your `.env` (or Docker env file):

```bash
ADMIN_EMAIL=your@email.com
ADMIN_PASSWORD=your-secure-password
```

`ADMIN_EMAIL` / `ADMIN_PASSWORD` become your web login credentials. The seed script
creates the admin user on first boot after migration.

Keep your existing `COOKIE_SECRET` and `API_TOKEN` — they still work:

- **`API_TOKEN`** — still accepted as a Bearer token for REST/MCP, but is **deprecated**.
  It maps to a `default-agent` user so existing MCP clients keep working. Plan to migrate
  to per-agent API keys before any multi-tenant deployment.
- **`APP_PASSWORD`** — no longer used. You can remove it from `.env`.

## 2. Run migrations + seed

### Local (pnpm on the host)

**Postgres:**

```bash
pnpm db:migrate
pnpm db:seed
```

**SQLite:**

```bash
pnpm db:push:sqlite
pnpm db:seed:sqlite
```

### Docker

The app image **already runs migrate + seed on every container start** (see
`docker/Dockerfile` CMD). After you update `.env` and deploy a new image, you usually
**do not** need to run these by hand — just recreate the app container:

```bash
# VPS (compose.prod.yml next to your .env)
docker compose -f compose.prod.yml pull
docker compose -f compose.prod.yml up -d app

# Local full stack (Postgres in Docker)
docker compose -f docker/compose.postgres-container.yml up -d --build app
```

`docker compose restart` is **not** enough: it does not re-run the entrypoint and may
not reload `env_file`. Prefer `up -d` after changing `.env`.

**Manual run inside a running container** (same as the entrypoint, env comes from
compose — do **not** use `pnpm db:*` there; those scripts expect a `.env` file on disk):

```bash
# VPS
docker compose -f compose.prod.yml exec app node --import tsx src/server/db/migrate.ts
docker compose -f compose.prod.yml exec app node --import tsx src/server/db/seed.ts

# Local compose (service name: app)
docker compose -f docker/compose.postgres-container.yml exec app node --import tsx src/server/db/migrate.ts
docker compose -f docker/compose.postgres-container.yml exec app node --import tsx src/server/db/seed.ts
```

Both commands are idempotent — safe on existing data (see backfill table below).

## 3. Sign in

The `/login` screen now asks for **email + password** instead of a single shared password.
Use the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set above.

## What changed

- New `users` table (admin + agent identities)
- Tasks and comments track `createdById` (who created them)
- Agent comments show an **Agent** badge in the UI
- MCP/REST writes attributed to the authenticated agent user
- Legacy rows backfilled automatically by `db:seed`

## Forks on older data

The seed backfill is idempotent:

| Legacy data | Assigned to |
|---|---|
| Comments with `source` = mcp or agent | `default-agent` |
| Comments with `source` = web or api | admin |
| All tasks without `createdById` | admin |

No manual SQL required.

## Reset admin password

`ADMIN_PASSWORD` in `.env` is only read when the admin user is **first created** (`db:seed`).
Changing it later does **not** update the database automatically.

1. Set the new password in `.env`:

```bash
ADMIN_EMAIL=your@email.com
ADMIN_PASSWORD=new-password-here
```

2. Sync the hash:

```bash
pnpm db:reset-admin-password          # Postgres on the host
# or
pnpm db:reset-admin-password:sqlite   # SQLite on the host

# Docker (after `up -d` so the container has the new ADMIN_PASSWORD):
docker compose -f compose.prod.yml exec app \
  node --import tsx src/server/db/reset-admin-password.ts
```

3. Sign in at `/login` with the new password.

This only updates `users.password_hash` for the matching admin email. Your tasks,
comments, and projects are untouched.
