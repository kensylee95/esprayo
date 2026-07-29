# esprayo

Real-time digital "money spraying" for live events. Guests join a live gift
room during a wedding, party, or celebration, spray money from an in-app
wallet, and see it land on a live leaderboard — instantly, for everyone in
the room.

Built as a TypeScript monorepo: a NestJS backend handling real-time wallet
transfers over WebSockets, and a Next.js PWA frontend.

---

## Table of contents

- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Core design decisions](#core-design-decisions)
- [Deployment](#deployment)
- [Known limitations / roadmap](#known-limitations--roadmap)

---

## Architecture

```
┌─────────────────┐        WebSocket (gift-room)         ┌──────────────────┐
│                  │◄─────────────────────────────────────►│                  │
│   user-web       │        REST (auth, events,            │   user-api       │
│   (Next.js PWA)  │        wallet, uploads)                │   (NestJS)       │
│                  │────────────────────────────────────────►│                  │
└─────────────────┘                                        └────────┬─────────┘
                                                                     │
                                          ┌──────────────────────────┼──────────────────────────┐
                                          ▼                          ▼                          ▼
                                    ┌───────────┐             ┌─────────────┐            ┌──────────────┐
                                    │ Postgres  │             │    Redis    │            │   Supabase   │
                                    │(TypeORM)  │             │(cache, BullMQ│            │   Storage    │
                                    │source of  │             │ queues, rate │            │  (uploads)   │
                                    │  truth    │             │  limiting)   │            └──────────────┘
                                    └───────────┘             └─────────────┘

                                          External services: Termii (SMS OTP), Google OAuth,
                                          Web Push (VAPID)
```

A second NestJS app, `admin-api`, shares the same backend codebase (`libs/`)
for internal/admin operations.

## Tech stack

**Backend** (`apps/api`)
- NestJS 11, TypeScript
- PostgreSQL via TypeORM (source of truth for balances, wallets, events, users)
- Redis (`ioredis`) — balance cache, distributed locks, OTP rate limiting
- BullMQ — async persistence of wallet debits, background jobs
- Socket.IO (`@nestjs/websockets`) — real-time gift-room events
- Passport + JWT — auth; Google OAuth for social login
- Termii — SMS OTP delivery
- `web-push` — browser push notifications (VAPID)
- Supabase Storage — file/image uploads

**Frontend** (`apps/user-web`)
- Next.js 16 (App Router), React 19
- TanStack Query — data fetching/caching
- Serwist — PWA/service worker, offline support
- Framer Motion, Lottie — animation
- Custom SCSS design system (`packages/app_styles`) with shared design
  tokens and mobile-first responsive mixins

**Shared**
- `pnpm` workspaces monorepo (`packages/socket-events`, `packages/redis-keys`,
  `packages/app_styles`)
- Docker (multi-stage builds) for `api` and `admin`
- Deployed via Fly.io (API) and Vercel (frontend)

## Project structure

```
esprayo/
├── apps/
│   ├── api/                  # NestJS monorepo (user-api + admin-api)
│   │   ├── apps/
│   │   │   ├── user-api/     # public-facing API + WebSocket gateway
│   │   │   └── admin-api/    # internal/admin API
│   │   └── libs/             # shared modules: auth, wallet, otp, gift,
│   │                         # users, termii, push, redis, ...
│   └── user-web/             # Next.js PWA
│       └── src/
│           ├── app/          # routes (App Router)
│           ├── ui/           # page-level components + shared UI
│           ├── services/     # API client wrappers
│           └── helpers/      # auth/token, request helpers
├── packages/
│   ├── socket-events/        # shared socket event name/type contracts
│   ├── redis-keys/           # shared Redis key naming conventions
│   └── app_styles/           # shared SCSS design tokens & mixins
├── Dockerfile.api
├── Dockerfile.admin
└── fly.toml
```

## Getting started

### Prerequisites

- Node.js 22+
- pnpm (`corepack enable && corepack prepare pnpm@10.24.0 --activate`)
- A PostgreSQL database
- A Redis instance (e.g. [Upstash](https://upstash.com))
- Accounts/keys for: Termii (SMS), Google OAuth, Supabase Storage, and a
  generated VAPID key pair for web push

### Install

```bash
git clone https://github.com/<your-org>/esprayo.git
cd esprayo
pnpm install
```

### Configure environment variables

Copy the example file and fill it in (see
[Environment variables](#environment-variables) below):

```bash
cp apps/api/.env.example apps/api/.env
```

The frontend (`apps/user-web`) doesn't ship an `.env.example` yet — create
`apps/user-web/.env.local` with the variables listed below.

### Run database migrations

```bash
cd apps/api
pnpm run migration:apply
```

### Run in development

From the repo root, this starts every workspace's `dev` script in parallel
(API + frontend):

```bash
pnpm dev
```

Or run them individually:

```bash
pnpm --filter api dev:api     # user-api on :3001
pnpm --filter api dev:admin   # admin-api
pnpm --filter web dev         # Next.js frontend
```

## Environment variables

### `apps/api/.env`

| Variable | Description |
|---|---|
| `PORT` | Port for the API to listen on |
| `DATABASE_URL` | Postgres connection string |
| `MIGRATION_URL` | Connection string used by TypeORM migrations |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth app credentials |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL registered with Google |
| `REDIS_URL` | Redis connection string (`rediss://` for TLS) |
| `JWT_SECRET` | Secret used to sign access tokens |
| `JWT_EXPIRATION` | Token lifetime, e.g. `"1d"` |
| `TERMII_API_KEY` / `TERMII_BASE_URL` | Termii SMS OTP provider credentials |
| `FRONT_END_URL` | Frontend origin — used for OAuth redirects and WebSocket CORS |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_STORAGE_BUCKET` | Supabase Storage for uploads |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_MAILTO` | Web push credentials (generate with `npx web-push generate-vapid-keys`) |

> ⚠️ Never commit real values for any of these, even into `.env.example` —
> example files should only ever contain placeholders.

### `apps/user-web/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API |
| `NEXT_PUBLIC_APP_URL` | Public URL of the frontend itself |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID (public) |
| `NEXT_PUBLIC_GOOGLE_REDIRECT_URL` | OAuth redirect URL |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_BUCKET` | Supabase client-side config |
| `NEXT_PUBLIC_VAPID_KEY` | Public VAPID key for push subscription |

Google sign-in is optional at runtime — the login page and phone-number
login work without `NEXT_PUBLIC_GOOGLE_CLIENT_ID` set; only the Google
button is affected.

## Available scripts

**Root**

| Command | Description |
|---|---|
| `pnpm dev` | Run every workspace's dev script in parallel |
| `pnpm clean` | Remove all `node_modules` across the workspace |

**`apps/api`**

| Command | Description |
|---|---|
| `pnpm dev:api` | Start `user-api` in watch mode |
| `pnpm dev:admin` | Start `admin-api` in watch mode |
| `pnpm build` | Build both API apps |
| `pnpm start:prod:api` | Run the built `user-api` |
| `pnpm migration:create` | Generate a new TypeORM migration |
| `pnpm migration:apply` | Run pending migrations |
| `pnpm migration:revert` | Revert the last migration |
| `pnpm lint` / `pnpm lint:fix` | Lint the API codebase |
| `pnpm test` | Run Jest unit tests |
| `pnpm test:e2e` | Run Jest e2e tests |

**`apps/user-web`**

| Command | Description |
|---|---|
| `pnpm dev` | Start the Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` / `pnpm lint:fix` | Lint via Biome |
| `pnpm format` | Format via Biome |

## Core design decisions

A few things worth understanding before touching the wallet/gift code:

- **Postgres is the source of truth for balances; Redis is a fast cache in
  front of it.** Debits use a single atomic Lua script (`GET` + compare +
  `DECRBY` in one round trip) to avoid a check-then-decrement race between
  concurrent sprays. The DB write happens asynchronously via a BullMQ job
  so users get instant feedback without waiting on a Postgres write on the
  hot path.
- **Cache-miss fallback.** If a wallet's Redis cache key has expired (24h
  TTL) but the wallet legitimately exists in Postgres, `debit()` re-hydrates
  the cache from the DB and retries once, rather than incorrectly telling a
  real wallet owner their wallet doesn't exist.
- **Deadlock avoidance in transfers.** `transfer()` locks both wallet rows
  with `pessimistic_write`, but always locks the two user IDs in sorted
  order — so two simultaneous transfers between the same pair of users
  can't deadlock each other by acquiring locks in opposite orders.
- **Idempotent gift sends.** Each gift carries a payment `reference`. A
  Redis `SET NX` lock prevents concurrent duplicate processing, and a DB
  `ON CONFLICT (reference) DO NOTHING` constraint prevents duplicate
  persistence even if a client retries after a dropped response.
- **Auth is secure-by-default.** `JwtAuthGuard` is registered globally via
  `APP_GUARD`; routes must explicitly opt out with `@Public()` rather than
  opting in to auth per-route. The same guard validates the JWT on
  WebSocket handshakes for the gift-room gateway.
- **OAuth token handoff never touches a URL.** The Google login redirect
  hands off a short-lived, single-use random code (stored in Redis with a
  60s TTL) instead of the real JWT, which the frontend then exchanges via
  `POST /auth/exchange-code`. Putting a live access token directly in a URL
  is avoided because URLs end up in server/CDN logs, browser history, and
  can leak via `Referer` headers.
- **OTP send is rate-limited two ways** — per-IP (Nest throttler) and
  per-phone-number (Redis counter) — since per-IP alone doesn't stop
  someone from spamming OTPs to a victim's number from multiple IPs.

## Deployment

- `apps/api` is deployed to **Fly.io** via `Dockerfile.api` (`fly.toml`
  configures the `user-api` app). `Dockerfile.admin` builds `admin-api`
  separately. Both run as a non-root user in production.
- `apps/user-web` is deployed to **Vercel**.
- Local development can tunnel through Cloudflare Tunnels
  (`frontend-tunnel-config.yml`, `api-tunnel-config.yml`) if you need a
  public URL for OAuth callback testing without deploying.

## Known limitations / roadmap

Being upfront about what's not done yet:

- **No automated test coverage.** A `jest` setup exists but there are no
  test files yet — the highest-value place to start would be the wallet
  and gift-sending logic, given it's the money-handling core.
- **No CI pipeline** (no GitHub Actions) — linting/tests aren't enforced
  on push yet.
- **Small crash-window gap** between a Redis debit succeeding and its
  BullMQ persistence job being enqueued — if the process crashes in that
  exact window, that debit is reflected in the cache but never queued for
  DB persistence. Rare, but a known edge case rather than a solved one.
- **Frontend token storage** uses a client-JS-readable cookie (via the
  Cookie Store API), which is XSS-exposed in the same way `localStorage`
  would be. The more robust fix is having the server set an `httpOnly`
  cookie directly, which would need a small contract change between
  frontend and backend.
- **README/docs are still growing** — this file documents what exists
  today; PRs to expand it are welcome.