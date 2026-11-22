# Tests docs

Automated tests for lama_ecommerce.

| Doc | Purpose |
|-----|---------|
| [[01] Test Plan](./[01]%20Test%20Plan.md) | Master plan: Wave 1–4 ✅ |
| [[02] RLS Checklist](./[02]%20RLS%20ChecklistT.md) | Live DB / RLS verification checklist |
| [[03] Feature Test Blocks](./[03]%20Feature%20Test%20Blocks.md) | Per-feature Vitest + E2E checklist — work one block at a time |

## Run

```powershell
npm test
npm run test:watch

# Playwright E2E (local only — not in CI)
npx playwright install chromium

# Recommended day-to-day
npm run test:e2e:smoke          # shell only (~20–40s)
npm run test:e2e:core           # auth + cart + checkout + orders + merge

# Full chromium suite (skips duplicate smoke project)
npm run test:e2e

# Everything including smoke project
npm run test:e2e:all
```

`scripts/e2e-run.mjs` sets `E2E_RUN=1`, forces `127.0.0.1`, and **only** reuses an existing Next if it answers HTTP quickly. Otherwise it starts a fresh server (avoids the Windows IPv6 / dead-port freeze).

Optional env:

| Var | Meaning |
|-----|---------|
| `E2E_WORKERS` | Parallel workers (default up to 4) |
| `E2E_STRICT=1` | Fail instead of skip when fixtures missing |
| `E2E_WEB_SERVER=prod` | `next build && next start` |
| `E2E_REUSE_SERVER=0` | Never reuse (always spawn) |
| `E2E_PORT` | Default `3005` |

Projects: `setup` → `chromium`; `smoke` is independent.

Unit/feature sources: `/tests` · E2E: `/e2e`
