# Feature Test Blocks — Lama Ecommerce

**Purpose:** Work through testing **one feature block at a time**.  
**How to use:** Pick the next unchecked block → add the listed Vitest and/or E2E cases → mark done → move on.

**Stack reminder**
- **Vitest** = unit + feature tests with mocks (fast, offline). Lives in `/tests`.
- **E2E (Playwright)** = real browser against a running app. Lives in `/e2e`. Run with `$env:E2E_RUN="1"; npm run test:e2e` (webServer starts Next).
- **Manual / RLS** = live Supabase checks (see [[02] RLS Checklist](./[02]%20RLS%20ChecklistT.md)).

**Legend**
| Tag | Meaning |
|-----|---------|
| ✅ | Already covered (enough for this block’s core) |
| 🟡 | Partial — some cases exist, gaps listed |
| ❌ | Missing — needs new tests |
| V | Vitest |
| E | Playwright E2E |
| M | Manual / RLS |

**Suggested order:** Blocks are numbered by risk (money, authz, identity first). Do not skip Block 0–3 early.

---

## Block 0 — Smoke & shell
**Status:** ✅  
**Routes:** `/`, `/contact-us`, `/admin` redirect, footer links, `/search`  
**Spec:** `e2e/smoke.spec.ts`

| Need | Type | Cases |
|------|------|--------|
| Home loads | E ✅ | Title present |
| Contact form visible | E ✅ | Name + email labels |
| Non-admin denied `/admin` | E ✅ | Redirect away |
| Footer / nav links resolve | E ✅ | about, shipping-terms, terms, privacy_policy, products |
| Search page empty state | E ✅ | “Start a search” prompt |

**Done when:** Smoke green + static link sanity checked.

---

## Block 1 — Auth (login / signup / reset / callback)
**Status:** ✅ (E2E gated on env creds where needed)  
**Routes:** `/auth/login`, `/auth/signup`, `/auth/reset-password`, `/auth/reset-password/confirm`, `/auth/callback`  
**Services:** `auth.service`, guest handoff on callback  
**Spec:** `e2e/auth.spec.ts`  

Env: `E2E_USER_*`, `E2E_ADMIN_*`, `E2E_INACTIVE_*` (optional; tests skip when missing).

| Need | Type | Cases |
|------|------|--------|
| Permissions helpers | V ✅ | `permissions`, `require-admin`, safe redirect, login banner |
| Auth callback + guest handoff | V ✅ | `auth-callback.test.ts` |
| Change / confirm password service | V ✅ | `change-password-service.test.ts` |
| Login happy path (user) | E ✅ | Needs `E2E_USER_*` |
| Login admin → analytics | E ✅ | Needs `E2E_ADMIN_*` |
| Login inactive → rejected | E ✅ | Needs `E2E_INACTIVE_*` |
| Signup validation errors | E ✅ | No creds needed |
| Already logged-in cannot open login | E ✅ | Needs `E2E_USER_*` |
| Reset password request always “success” | E ✅ | Anti-enumeration copy |
| Open-redirect blocked | V/E ✅ | Unit + E2E sanitize |

**Done when:** Login/signup/reset paths work in browser; inactive + admin landing covered.

---

## Block 2 — Guest session & merge-on-login
**Status:** 🟡 (order claim deferred to Block 8)  
**Routes:** any storefront commerce; login callback  
**Services:** guest cookie, cart merge, wishlist claim, order claim  
**Spec:** `e2e/guest-merge.spec.ts`  

| Need | Type | Cases |
|------|------|--------|
| Guest cookie create/read/clear | V ✅ | `guest-session`, `apply-guest-session-cookie` |
| Guest cart race / scoping | V ✅ | `guest-cart-unique-session`, `guest-repo-scoping` |
| Merge on login action | V ✅ | `merge-guest-on-login.test.ts` |
| Guest ATC then login merges cart | E ✅ | Needs `E2E_USER_*` + seeded products |
| Guest wishlist then login claims | E ✅ | Needs `E2E_USER_*` + seeded products |
| Guest order then login claims (email match) | E 🟡 | Placeholder skip until Block 8 checkout |
| Admin login clears guest cookie without claim | E ✅ | Needs `E2E_ADMIN_*` |

**Done when:** Guest → login handoff proven in E2E for cart + wishlist (+ order if fixtures allow).

---

## Block 3 — Admin cannot shop
**Status:** ✅ (needs `E2E_ADMIN_*`)  
**Routes:** `/cart`, `/wishlist`, storefront ATC  
**Services:** `assertCanShopAsCustomer`, middleware redirects  
**Spec:** `e2e/admin-cannot-shop.spec.ts`

| Need | Type | Cases |
|------|------|--------|
| Service/action rejection | V ✅ | `admin-cannot-shop.test.ts` |
| Middleware: admin `/cart` → analytics | E ✅ | Redirect |
| Middleware: admin `/wishlist` → analytics | E ✅ | Redirect |
| Admin PDP: ATC/wishlist blocked in UI | E ✅ | “Admins cannot shop…” + no ATC |

**Done when:** Admin cannot complete storefront commerce in browser.

---

## Block 4 — Catalog browse & search
**Status:** ✅  
**Routes:** `/`, `/products`, `/search`  
**Services:** `product.service` public reads  
**Spec:** `e2e/catalog.spec.ts`

| Need | Type | Cases |
|------|------|--------|
| Slug resolve / empty filters | V ✅ | `product-service.test.ts` (partial) |
| Products page loads grid | E ✅ | Grid or “No products found” |
| Filter by category/brand query | E ✅ | Category button updates `?category=` |
| Pagination | E ✅ | Next → `page=2` when multi-page |
| Search with `q` | E ✅ | Zero-state + token search when catalog exists |
| Unknown category slug → empty | E ✅ | No crash |

**Done when:** Browse + search happy paths + empty states in E2E.

---

## Block 5 — Product detail (PDP)
**Status:** ✅  
**Routes:** `/products/[slug]`  
**Spec:** `e2e/pdp.spec.ts`

| Need | Type | Cases |
|------|------|--------|
| getBySlug / related helpers | V ✅ | product-service public helpers |
| View tracking service | V ✅ | `product-view-service.test.ts` |
| Unknown slug → 404 | E ✅ | Page Not Found |
| Variant select (color/size) | E ✅ | In stock after select |
| ATC from PDP (guest) | E ✅ | Cart gains item |
| Wishlist toggle from PDP | E ✅ | Heart → In wishlist |
| Guest cannot submit review | E ✅ | Sign in to review |
| Guest cannot ask Q&A | E ✅ | Sign in to ask |
| Related products section | E ✅ | When present (else skip) |

**Done when:** Guest can ATC/wishlist; reviews/Q&A gated; 404 works.

---

## Block 6 — Cart
**Status:** 🟡  
**Routes:** `/cart`  
**Services:** `cart.service`  

| Need | Type | Cases |
|------|------|--------|
| Add / reuse cart / qty / admin list | V ✅ | `cart-service.test.ts` |
| Guest concurrent create | V ✅ | `guest-cart-unique-session` |
| Open cart empty state | E ❌ | Empty copy + resume banner absent |
| Update quantity | E ❌ | Line qty changes |
| Remove line | E ❌ | Line gone |
| Floating cart button (non-admin) | E ❌ | Visible on public pages |
| Stock clamp / error message | E ❌ | Over-stock rejected |

**Done when:** Guest cart CRUD works in browser.

---

## Block 7 — Wishlist
**Status:** 🟡  
**Routes:** `/wishlist`, `/account/wishlist` → `/wishlist`  
**Services:** `wishlist.service`  

| Need | Type | Cases |
|------|------|--------|
| Add / toggle / claim / inactive | V ✅ | `wishlist-service.test.ts` |
| Helpers map/filter | V ✅ | unit wishlist helpers |
| Guest wishlist page lists items | E ❌ | After PDP heart |
| Remove from wishlist page | E ❌ | Item disappears |
| Filters (featured/trending/price) | E ❌ | Empty vs filtered list |
| Unavailable product card | E ❌ | Shows unavailable state |

**Done when:** Guest + logged-in wishlist flows work in E2E.

---

## Block 8 — Checkout
**Status:** 🟡  
**Routes:** `/cart` sidebar → checkout  
**Services:** `checkout.service`, order email, purchase count  

| Need | Type | Cases |
|------|------|--------|
| Shipping zone / no client totals | V ✅ | `checkout-service.test.ts` |
| Checkout Zod | V ✅ | `checkout.create.test.ts` |
| Order email send/skip | V ✅ | `order-email-service.test.ts` |
| Guest checkout → order details | E ❌ | Requires shipping zone + address + email |
| Logged-in checkout + save address | E ❌ | Address book updated |
| Invalid / expired promo fails | E ❌ | Error, cart kept |
| Missing shipping zone fails | E ❌ | Clear error |
| Email failure does not undo order | V/E 🟡 | Service mocked ✅; E2E optional |

**Done when:** One guest + one user checkout succeed in E2E against seed data.

---

## Block 9 — Orders (storefront)
**Status:** 🟡  
**Routes:** `/orders`, `/orders/find`, `/order_details/[id]`, `/orders/[id]/invoice`  
**Services:** `order.service`, `order_access.service`  

| Need | Type | Cases |
|------|------|--------|
| Ownership / claim / invoice ACL | V ✅ | `order-ownership`, `order-invoice-page`, `storefront-orders-list` |
| Display helpers | V ✅ | `order-display.test.ts` |
| Logged-in orders list | E ❌ | Shows user’s orders |
| Guest find-order / access email | E ❌ | Generic success; rate limit optional |
| Order details with signed `t` | E ❌ | Opens without session when token valid |
| Invoice same ACL | E ❌ | Allowed vs 404 |
| Encrypted id without ownership → 404 | E ❌ | |

**Done when:** List + details + find-order ACL proven in E2E.

---

## Block 10 — Profile & addresses
**Status:** 🟡  
**Routes:** `/account`, `/profile` → `/account`  
**Services:** `profile.service`, `address.service`, `auth` change password  

| Need | Type | Cases |
|------|------|--------|
| Profile gates / own update | V ✅ | `profile-service.test.ts` |
| Address service | V ✅ | `address-service.test.ts` |
| Address Zod | V ✅ | `user-address.base.test.ts` |
| Unauth `/account` → login | E ❌ | `?redirect=/account` |
| Edit full name | E ❌ | Persists |
| Change password | E ❌ | Success / wrong current password |
| Address CRUD + set default | E ❌ | List updates |
| Inactive user on `/account` | E ❌ | Signed out |

**Done when:** Account page auth + profile + address CRUD in E2E.

---

## Block 11 — Contact & newsletter leads
**Status:** ✅  
**Routes:** `/contact-us`, footer lead, `/unsubscribe`  

| Need | Type | Cases |
|------|------|--------|
| Honeypot + rate limit actions | V ✅ | `contact-lead-actions`, `rate-limit` |
| Lead create / unsub / resub / admin dup | V ✅ | lead feature tests |
| Contact Zod / lead Zod | V ✅ | validators |
| Submit contact form success | E ✅ | Thank-you / success UI (`e2e/contact-leads.spec.ts`) |
| Honeypot field → fake success | E ✅ | Success toast with honeypot filled |
| Footer join-list success | E ✅ | Subscribe toast |
| Unsubscribe with valid token | E ✅ | Confirmation (service-role seed) |
| Unsubscribe invalid token | E ✅ | Missing / invalid / expired |

**Done when:** Contact + subscribe + unsubscribe work in E2E.

---

## Block 12 — Reviews & Q&A (storefront)
**Status:** ✅  
**Routes:** PDP sections  
**Services:** `review.service`, `product_question.service`  

| Need | Type | Cases |
|------|------|--------|
| Admin gates + public Q&A create | V ✅ | `review-admin-auth`, `product-qa-public`, `contact-qa-admin-auth` |
| Logged-in create review | E ✅ | Pending toast + awaiting approval (`e2e/reviews-qa.spec.ts`) |
| One review per product | E ✅ | Form hidden after first submit |
| Logged-in ask question | E ✅ | Success toast; pending hidden from guests |
| Only approved+answered Q visible publicly | E ✅ | Seeded approved Q+A visible; pending not |

**Done when:** Auth user can review/ask; public visibility rules hold.

---

## Block 13 — Admin shell & analytics
**Status:** ✅  
**Routes:** `/admin` → `/admin/analytics`  

| Need | Type | Cases |
|------|------|--------|
| Analytics Result envelope | V ✅ | `analytics-admin-auth`, aggregates unit |
| Guest → login redirect | E ✅ | (`e2e/admin-analytics.spec.ts`) |
| Customer → `/` | E ✅ | Auto-seeds customer when `E2E_USER_*` unset |
| Admin sees analytics KPIs | E ✅ | Page loads without error banner |
| Date preset changes URL/query | E ✅ | Same admin session: `preset=last_30d` / `this_month` |

**Done when:** Authz to analytics + page loads for admin.

---

## Block 14 — Admin catalog (products / variants / images)
**Status:** 🟡  
**Routes:** `/admin/products`, `/create`, `/[id]`  

| Need | Type | Cases |
|------|------|--------|
| Product / variant / image services | V ✅ | Wave 4 feature tests |
| Product Zod (+ with variants) | V ✅ | validators |
| List loads with filters | E ❌ | |
| Create product (minimal) | E ❌ | Appears in list |
| Edit product flags/price | E ❌ | |
| Add variant + stock rules UI error | E ❌ | Reduce stock with order history |
| Upload image + set primary | E ❌ | |
| Delete blocked when refs exist | E ❌ | Error message |

**Done when:** Admin can create/edit a product with one variant + image in E2E.

---

## Block 15 — Admin brands & categories
**Status:** 🟡  
**Routes:** `/admin/brands`, `/admin/categories`  

| Need | Type | Cases |
|------|------|--------|
| Brand / category services | V ✅ | Wave 4 |
| Brand / category Zod | V ✅ | |
| Create / edit / delete brand | E ❌ | |
| Delete brand blocked by products | E ❌ | |
| Create category + parent | E ❌ | |
| Delete category re-parent / blocked | E ❌ | |

**Done when:** CRUD + delete guards work in E2E.

---

## Block 16 — Admin orders & shipments
**Status:** ✅  
**Routes:** `/admin/orders`, `/admin/orders/[id]`  

| Need | Type | Cases |
|------|------|--------|
| Order admin authz | V ✅ | `order-admin-auth` |
| Shipment update service | V ✅ | `shipment-service` |
| Orders list + filters | E ✅ | Status filter + clear (`e2e/admin-orders.spec.ts`) |
| Status stepper: valid transition | E ✅ | pending → processing |
| Status skip/reverse rejected | E ✅ | Delivered disabled from pending |
| Ship requires carrier + tracking | E ✅ | Confirm disabled until fields; creates shipment |
| Edit shipment | E ✅ | Carrier/tracking update toast |
| Delete pending order (restock) | E ✅ | Success toast + redirect |
| Refuse delete shipped/delivered | E ✅ | Failed toast with status message |

**Done when:** Status machine + shipment + delete rules proven in E2E.

---

## Block 17 — Admin carts & admin checkout
**Status:** ✅  
**Routes:** `/admin/carts`, `/admin/carts/[id]`  

| Need | Type | Cases |
|------|------|--------|
| Admin cart list/detail service | V ✅ | cart-service admin cases |
| Create cart for user without cart | E ✅ | Session-id cart (`e2e/admin-carts.spec.ts`) |
| Add/edit/delete lines | E ✅ | Add Items → qty update → delete |
| Checkout as cart owner | E ✅ | Order placed for session cart |
| Empty cart checkout fails | E ✅ | Checkout failed / cart is empty |

**Done when:** Admin can build a cart and checkout for a customer.

---

## Block 18 — Admin users
**Status:** ✅  
**Routes:** `/admin/users`  

| Need | Type | Cases |
|------|------|--------|
| Profile admin gates + reset password | V ✅ | `profile-service`, `admin-reset-password` |
| List + search/filter | E ✅ | q / role / status + Clear (`e2e/admin-users.spec.ts`) |
| Create user | E ✅ | Appears in search |
| Deactivate user | E ✅ | Login rejected as inactive |
| Promote to admin | E ✅ | Lands on analytics; `/cart` redirected |
| Reset password | E ✅ | Login with new password |

**Done when:** User lifecycle + role change covered in E2E.

---

## Block 19 — Admin reviews / Q&A / contact / leads
**Status:** 🟡  
**Routes:** `/admin/reviews`, `/admin/qa`, `/admin/contact`, `/admin/leads`  

| Need | Type | Cases |
|------|------|--------|
| Admin authz + lead duplicate | V ✅ | review/contact-qa/lead tests |
| Moderate review pending → approved | E ❌ | |
| Answer Q&A (auto-approve) | E ❌ | Visible on PDP after |
| Contact status toggle + CSV | E ❌ | |
| Lead create duplicate email error | E ❌ | |
| Lead CSV export | E ❌ | |

**Done when:** Moderation + CRM admin flows work in E2E.

---

## Block 20 — Admin promo codes & shipping zones
**Status:** 🟡  
**Routes:** `/admin/promocodes`, `/admin/shippings`  

| Need | Type | Cases |
|------|------|--------|
| Soft admin gates | V ✅ | `promo-admin-auth`, `shipping-zone-admin` |
| Public shipping zones ungated | V ✅ | shipping-zone test |
| Create / edit / deactivate promo | E ❌ | |
| Promo rejected at checkout when expired | E ❌ | ties to Block 8 |
| Create shipping zone; appears at checkout | E ❌ | |

**Done when:** Admin CRUD + storefront consumption linked.

---

## Block 21 — Admin product-views & backups
**Status:** 🟡  
**Routes:** `/admin/product-views`, `/admin/backups`  
**API:** `/api/admin/backups/extract`  

| Need | Type | Cases |
|------|------|--------|
| Product-view admin empty + track | V ✅ | `product-view-service` |
| Backup admin + extract route auth | V ✅ | backup feature tests |
| Product-views page loads | E ❌ | |
| Backup extract as admin downloads | E ❌ | |
| Extract as non-admin denied | E 🟡 | Covered partly by Vitest route auth |

**Done when:** Views page + backup extract auth proven.

---

## Block 22 — Admin account
**Status:** 🟡  
**Routes:** `/admin/account`  

| Need | Type | Cases |
|------|------|--------|
| Own profile update (shared service) | V ✅ | profile-service |
| Admin account page loads | E ❌ | |
| Change display name | E ❌ | |
| Change password | E ❌ | |

**Done when:** Admin self-account works like customer account (scoped).

---

## Block 23 — Cross-cutting security (ongoing)
**Status:** 🟡  

| Need | Type | Cases |
|------|------|--------|
| Rate limit helper | V ✅ | `rate-limit.test.ts` |
| Encrypted IDs are not ACL | E/M ❌ | Guessing ciphertext without auth fails |
| RLS checklist | M 🟡 | Keep [RLS Checklist](./[02]%20RLS%20ChecklistT.md) current |
| CI runs Vitest | ✅ | `.github/workflows/ci.yml` |
| CI optional E2E job | ❌ | Only when ready (seed DB + secrets) |

**Done when:** RLS checklist current; optional CI E2E decided.

---

## Progress tracker

Copy and check off as you finish blocks:

```
[x] 0 Smoke & shell
[x] 1 Auth
[x] 2 Guest merge-on-login (order claim → Block 8)
[x] 3 Admin cannot shop
[x] 4 Catalog browse & search
[x] 5 PDP
[ ] 6 Cart
[ ] 7 Wishlist
[ ] 8 Checkout
[ ] 9 Orders (storefront)
[ ] 10 Profile & addresses
[x] 11 Contact & leads
[x] 12 Reviews & Q&A (storefront)
[x] 13 Admin shell & analytics
[ ] 14 Admin catalog
[ ] 15 Admin brands & categories
[x] 16 Admin orders & shipments
[x] 17 Admin carts & checkout
[x] 18 Admin users
[ ] 19 Admin reviews / Q&A / contact / leads
[ ] 20 Admin promo & shipping
[ ] 21 Admin views & backups
[ ] 22 Admin account
[ ] 23 Cross-cutting security
```

---

## Notes for fixtures (E2E)

E2E blocks that mutate data need **seed data** (admin user, customer user, at least one active product with variant + stock, one shipping zone). Prefer a dedicated test seed script or stable staging DB — do not rely on production.

Suggested env for E2E (local) — also readable from `.env.local` via `playwright.config.ts`.  
Default base URL is **`http://127.0.0.1:3005`** (avoids colliding with another app on `:3000`).
```powershell
$env:E2E_RUN="1"
# $env:E2E_PORT="3005"
# $env:E2E_REUSE_SERVER="1"   # only if THIS app is already on E2E_PORT
# $env:E2E_ADMIN_EMAIL="admin@example.com"
# $env:E2E_ADMIN_PASSWORD="password"
# $env:E2E_USER_EMAIL="..."
# $env:E2E_USER_PASSWORD="..."
# $env:E2E_INACTIVE_EMAIL="..."
# $env:E2E_INACTIVE_PASSWORD="..."
npm run test:e2e
# or only blocks 0–2:
npm run test:e2e -- e2e/smoke.spec.ts e2e/auth.spec.ts e2e/guest-merge.spec.ts
```

Vitest stays the default quality gate (`npm test`). Add E2E block-by-block; do not try to cover every block in one PR.
