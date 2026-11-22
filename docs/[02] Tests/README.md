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

# Optional Playwright (Chromium once; webServer starts Next on :3005)
$env:E2E_RUN="1"
npm run test:e2e
```

Unit/feature sources: `/tests` · E2E: `/e2e`
