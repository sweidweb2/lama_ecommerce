# RLS integration checklist (Wave 3)

Automated Vitest suites use **mocks** (no live DB). Use this checklist against a linked Supabase project (local or staging) after migrations are applied.

## Prerequisites

```powershell
npx supabase db push
# or: npx supabase start  (local)
```

Anon key + a test user + a guest session cookie required.

---

## Guest cart / order isolation

| # | Check | Pass? |
|---|--------|-------|
| 1 | Guest A with `guest_session_id` cookie can read only their cart rows | ☐ |
| 2 | Guest B cannot SELECT Guest A cart / cart_items via PostgREST anon | ☐ |
| 3 | Guest cannot read an authenticated user’s order via anon + order id | ☐ |
| 4 | Authenticated user cannot read another user’s orders (`user_id` mismatch) | ☐ |
| 5 | `process_checkout` assigns `user_id` / `session_id` from auth context, not client spoof | ☐ |

## Public inserts closed

| # | Check | Pass? |
|---|--------|-------|
| 6 | Anon `INSERT` into `contact_us` fails (no public insert policy) | ☐ |
| 7 | Anon `INSERT` into `leads` fails | ☐ |
| 8 | Contact/lead still work via Next server actions (service role after rate limit) | ☐ |

## Deny-all → policies tables

| # | Check | Pass? |
|---|--------|-------|
| 9 | Anon can `SELECT` `shipping_zones` / `shipping_fees` | ☐ |
| 10 | Anon cannot `SELECT` `promo_codes` or `product_stats` | ☐ |
| 11 | Authenticated owner can `SELECT` own `payments` / `shipments` via order join | ☐ |
| 12 | Non-owner cannot `SELECT` another user’s payment/shipment | ☐ |

## Admin

| # | Check | Pass? |
|---|--------|-------|
| 13 | Admin role can manage promo / shipping / orders via session or service paths | ☐ |
| 14 | Non-admin hitting `/api/admin/backups/extract` gets 403 | ☐ |

Mark rows ✅ when verified; keep evidence (SQL / screenshots) in the PR if changing RLS.
