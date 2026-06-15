#!/usr/bin/env bash
# Full reset of the public demo: wipe everything visitors created, then re-seed
# the curated sample data. Run on the VPS (it needs host `psql` + the compose
# stack). Schedule it from cron, e.g. daily at 04:00:
#   0 4 * * * cd /home/<user>/indiework && ./reset-demo.sh >> reset-demo.log 2>&1
#
# Why truncate (not DROP DATABASE): no superuser needed, and the demo container
# can stay up. seed-sample alone only resets its 4 known projects — truncating
# first also clears any projects/tasks visitors added.
set -euo pipefail

cd "$(dirname "$0")"
COMPOSE="docker compose -f compose.prod.yml"
ENV_FILE=".env.demo"

# Pull DATABASE_URL out of .env.demo (the demo DB, never the real one).
DEMO_DB_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2-)"
if [ -z "${DEMO_DB_URL:-}" ]; then
  echo "✗ DATABASE_URL not found in $ENV_FILE" >&2
  exit 1
fi
# The container reaches Postgres via host.docker.internal; from the host itself
# that name usually isn't resolvable, so talk to localhost instead.
DEMO_DB_URL="${DEMO_DB_URL/host.docker.internal/127.0.0.1}"

echo "→ truncating all public tables in the demo database…"
psql "$DEMO_DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
  END LOOP;
END $$;
SQL

echo "→ re-seeding sample data…"
$COMPOSE run --rm demo node --import tsx src/server/db/seed-sample.ts

echo "✓ demo reset complete"
