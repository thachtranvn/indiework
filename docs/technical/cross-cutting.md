# Cross-cutting concerns

> Auth, storage, config, and the multi-tenant scaffolding — the parts every surface leans on
> but no single surface owns.

## Authentication & authorization

Two credential paths converge on a `userId` (and, for bearer, a workspace + role) **at the
entry point** — never from the request body. [src/server/auth/](../../src/server/auth):

| File | Role |
|---|---|
| [session.ts](../../src/server/auth/session.ts) | Signed session cookie. `createSessionValue(userId)` → `userId.issuedAtMs.hmac` (HMAC-SHA256, `COOKIE_SECRET`); `parseSessionValue` verifies signature + 30-day expiry. Uses Web Crypto, so it works on the Edge. |
| [token.ts](../../src/server/auth/token.ts) | Bearer auth for REST + MCP. `resolveBearerPrincipal` → `{ userId, workspaceId, scope }` via an `api_keys` lookup, with a legacy static `API_TOKEN` fallback. `requireBearer(req)` → `userId | null`. |
| [password.ts](../../src/server/auth/password.ts) | `scrypt` hashing (`node:crypto`). `hashPassword` → `salt:derivedHex`; `verifyPassword` is timing-safe. |
| [require-session.ts](../../src/server/auth/require-session.ts) | Server-Action / RSC guard. `requireSession()` → `userId` (throws `unauthorized()` if absent); `getCurrentUser()` → public user. |
| [require-api-user.ts](../../src/server/auth/require-api-user.ts) | Hybrid guard: accepts **bearer or session cookie**. Used by the attachment download route so the web UI can fetch a file inline without a token. |
| [resolve-ctx.ts](../../src/server/auth/resolve-ctx.ts) | Builds the request `Ctx`: `ctxFromSession` (validates membership, looks up role) and `ctxFromBearer` (resolves a token to workspace + role). |
| [ctx.ts](../../src/server/auth/ctx.ts) | The RBAC policy. `Ctx = { userId, workspaceId, role }`; `can(role, action)` is a **pure, deny-by-default** function over actions like `task:*`, `project:*`, `member:*`, `apikey:*`. |
| [rate-limit.ts](../../src/server/auth/rate-limit.ts) | `LoginRateLimiter` (per-IP exponential backoff + global soft delay) for the login form; `apiRateState(req)` for REST/MCP throttling (→ `429` + `Retry-After`). |
| [safe-next.ts](../../src/server/auth/safe-next.ts) | Post-login redirect guard: only `/app/*` targets are allowed, stopping open-redirect and a `/login → /login` loop. |

**Authorization shape.** `can(role, action)` is deny-by-default: `owner` → all; `admin`,
`member`, `viewer` → progressively fewer actions; reads are gated by tenant scope rather than
by `can()`. Today the app runs single-user (the owner), but the policy is already in place so
the multi-tenant track can switch it on without reworking the call sites.

## Object storage (attachments)

[src/server/storage/](../../src/server/storage) abstracts file bytes behind one interface so
the attachment service doesn't care where files live:

```
ObjectStorage (types.ts)
  ├── createMemoryStorage()  — dev / test fallback (in-process)
  └── createR2Storage()      — Cloudflare R2 (S3-compatible), production
```

`getObjectStorage()` ([storage/index.ts](../../src/server/storage/index.ts)) picks the
implementation from config, as a lazily-initialized singleton:

- `R2_CONFIGURED` (all four `R2_*` vars present) → **R2**.
- else, non-production → **in-memory**.
- else (production, unconfigured) → throws `badRequest('Attachment storage is not configured …')`.

`attachmentService.upload` writes bytes here and stores metadata in the DB; `open` streams
them back through the download route; `remove` deletes from both. The upload path enforces a
size cap (`attachment-limits.ts`) and sets content headers (`attachment-headers.ts`).

## Configuration

[env.ts](../../src/server/env.ts) validates `process.env` with Zod at startup and **fails fast**
with a readable message listing every problem. It's imported only by server code + node
scripts, so secrets never reach the client bundle. Key knobs:

| Var | Purpose |
|---|---|
| `DB_DRIVER` | `postgres` (default) or `sqlite` |
| `DATABASE_URL` | required when `DB_DRIVER=postgres` |
| `SQLITE_PATH` | SQLite file path (default `./data/iw.db`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | the web login identity (`APP_PASSWORD` is deprecated, kept for back-compat) |
| `COOKIE_SECRET` | ≥32 chars; signs the session cookie |
| `API_TOKEN` | bearer token for REST + MCP (legacy static fallback) |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` | all-or-nothing; enables R2 storage |

Cross-field rules are enforced in a `superRefine`: Postgres requires a URL; the four `R2_*`
vars must be set together.

## Multi-tenant scaffolding (present, dormant)

`main` ships several pieces that the single-user product doesn't strictly need yet, so the
team / multi-tenant track ([pivot/](../pivot/)) can grow in without a rewrite:

- **workspaces** above projects, with a `memberService` (`roleOf`, `listForUser`,
  `ensureMembership`) and the RBAC policy in `ctx.ts`.
- **identity & attribution:** a `users` table (roles `admin` / `agent` as labels), with
  `created_by_id` on tasks and comments, and `comments.source` tracking the *channel* (web /
  api / mcp / agent) separately from the *principal* (`created_by_id`).
- `ctxFromBearer` already resolves a token to a workspace + role.

These are deliberately minimal (a label, a column, a policy function) rather than a built-out
team surface — see [pivot/team-gap-analysis.md](../pivot/team-gap-analysis.md) for what a real
team product would still need.

## Identity & attribution

The split worth internalizing: **who** did it vs **through what**.

- `created_by_id` (principal) — the user/agent that authored a task or comment.
- `comments.source` (channel) — `web · api · mcp · agent`, the surface it came in through.

A comment posted by the AI via MCP is `created_by_id = <agent user>` **and** `source = mcp`;
the two are independent and both are recorded. Design detail:
[pivot/identity-attribution-design.md](../pivot/identity-attribution-design.md).
