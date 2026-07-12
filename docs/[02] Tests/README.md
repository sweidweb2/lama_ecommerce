# Tests docs

Automated tests for lama_ecommerce.

| Doc | Purpose |
|-----|---------|
| [TEST_PLAN.md](./TEST_PLAN.md) | Master plan: Wave 1–3 ✅ |
| [RLS_CHECKLIST.md](./RLS_CHECKLIST.md) | Live DB / RLS verification checklist |

## Run

```powershell
npm test
npm run test:watch

# Optional Playwright (app running + browsers installed)
$env:E2E_RUN="1"
npx playwright install chromium
npm run test:e2e
```

Unit/feature sources: `/tests` · E2E: `/e2e`
