# Lama Ecommerce

Next.js 16 storefront + admin ecommerce app with **TypeScript**, **Tailwind CSS**, **Supabase** (Auth, Postgres, Storage, RLS), and **Zod** validation.

Layering: `actions/` → `services/` → `repositories/` → Supabase.

## Prerequisites

- **Node.js 22+**
- **npm**
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local DB / migrations)

## Setup

### 1. Install

```bash
npm install
```

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in `.env.local` (see [`.env.example`](.env.example)):

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only; never expose to the client |
| `ENCRYPTION_KEY` | Yes (order links) | 64 hex chars (32 bytes) for AES-GCM order-id encryption |
| `DATABASE_URL` or `SUPABASE_DB_URL` | Ops / backups | Used by backup extract |
| `STRIPE_*` / `NEXT_PUBLIC_STRIPE_*` | No | Payments deferred |

### 3. Database

Migrations live in [`supabase/migrations/`](supabase/migrations/).

**Remote project**

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

**Local stack**

```bash
supabase start
supabase db reset   # applies migrations
```

Point `.env.local` at the local or remote Supabase URL and keys as appropriate.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest (unit + feature) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright smoke (see below) |

### E2E (local only)

Playwright is **not** run in CI. With the app running:

```bash
npx playwright install chromium
# PowerShell
$env:E2E_RUN="1"; $env:E2E_BASE_URL="http://127.0.0.1:3000"; npm run test:e2e
```

## App layout

| Area | Path |
|------|------|
| Public storefront | `app/(public)/` (+ home at `app/page.tsx`) |
| Account | `app/(useraccount)/` |
| Admin | `app/admin/` |
| Server actions | `actions/` |
| Business logic | `services/` |
| Data access | `repositories/` |
| Shared infra | `lib/` (Supabase clients, auth helpers, validators, utils) |

## Docs

- [`docs/[03] Bedrock`](docs/[03]%20Bedrock/) — architecture and structure
- [`docs/[05] Phases`](docs/[05]%20Phases/) — phased delivery notes
- [`docs/[02] Tests`](docs/[02]%20Tests/) — test plan / RLS checklist
- [`docs/[01] Reports`](docs/[01]%20Reports/) — audits and status

## CI

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on push/PR: `lint` → `test` → `build` (with dummy Supabase env for the build step).
