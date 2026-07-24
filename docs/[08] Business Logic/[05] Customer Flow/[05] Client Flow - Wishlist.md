# Client Flow — Wishlist (Account + Public)

**Scope:** Logged-in customer wishlist from `flow.md`: public `/wishlist`, account `/account/wishlist`, PDP heart (auth path), guest → user claim on login.  
**Out of scope:** Guest-only cookie path details (Guest Wishlist); admin wishlist CRUD (none).

**Verdict:** Auth **add/remove on PDP**, **list + remove on `/wishlist`**, and **saved variant display** work. **Guest wishlist claim on login is implemented** (`claimGuestWishlistService` inside `performGuestSessionHandoff` — before cookie clear). Remaining gaps: broken filters/stats (shared with public page). `/account/wishlist` redirects to `/wishlist`.

---

## Happy path (what works today)

1. Logged-in user opens PDP → picks variant → heart (`ProductCustomization` → `toggleWishlistAction`).
2. Auth branch: `checkIfInWishlist` → `addToWishlist` / `removeFromWishlistByVariant` (session client + RLS `user_id`).
3. `revalidatePath('/wishlist')`, `/account/wishlist`, `/products`.
4. `/wishlist`: `getWishlistItems(user.id)` → filters/stats/pagination → `WishlistItemCard` (variant + remove).
5. `/account/wishlist`: permanent redirect to `/wishlist`.
6. List remove → `removeWishlistItemAction(wishlist_id)` → `removeFromWishlist(userId, id)`.
7. Guest hearts → login / email-confirm callback: `performGuestSessionHandoff` → claim orders → merge cart → **`claimGuestWishlistService`** (dedupe + attach `user_id`) → clear cookie → revalidate `/wishlist`.

```text
PDP heart → toggleWishlistAction(user_id)
  → add|remove wishlists (RLS)
  → /wishlist list by user_id (WishlistItemCard)

List remove → removeWishlistItemAction(wishlist_id)

Login / auth callback → performGuestSessionHandoff
  → orders → cart → claimGuestWishlistService → clear cookie
```

---

## Capability checklist

| Capability | Status | Notes |
|------------|--------|--------|
| PDP add / remove (auth) | Yes | Same UI as guest; `user_id` path |
| List on `/wishlist` | Yes | Filters/stats buggy |
| List on `/account/wishlist` | Redirect | → `/wishlist` |
| Remove from list page | **Yes** | `removeWishlistItemAction` + `WishlistItemCard` |
| Guest → user claim on login | **Yes** | `claimGuestWishlistService` |
| Unique (owner, variant) | Yes | Migration `20260719170000` |

---

## P0 — Correctness (fix first)

- [x] ✅ **Wishlist list pages cannot remove items** done✅  
  Both `/wishlist` and `/account/wishlist` render `ProductCard` only. Removal requires PDP + same variant. Wrong variant looks “still wishlisted” / risk of new row.  
  **Where:** `app/(public)/wishlist/page.tsx`; `app/(useraccount)/account/wishlist/page.tsx`; unused `removeFromWishlist` / `removeWishlistItemById`.  
  **Do:** Per-row remove by `wishlist_id`; show saved variant on the card.  
  **Also tracked:** Guest Wishlist P0 (shared UI).  
  **Done:** `WishlistItemCard` + `removeWishlistItemAction` (auth by id); variant color/size/material line; account page redirects to `/wishlist`.

---

## P1 — Incomplete / wrong wishlist behavior

- [x] ✅ **Duplicate surfaces diverge** done✅  
  Navbar → `/wishlist` only. `/account/wishlist` has no filters/stats; toggle never revalidates account path.  
  **Where:** both pages; `Navbar.tsx`; `actions/wishlist.ts`.  
  **Do:** Canonical page + redirect, or shared RSC; `revalidatePath` both.  
  **Done:** `/account/wishlist` redirects to `/wishlist`. (Former hub `ProfileActions` removed with `/profile` → `/account` redirect.)

- [x] ✅ **Featured / trending filters + stats broken** done✅  
  Select omits `is_featured` / `is_trending`.  
  **Where:** `wishlist.repository.ts`; `wishlist/page.tsx`; `WishlistStats.tsx`.  
  **Do:** Add columns or drop filters/stats.  
  **Done:** Columns in `WISHLIST_SELECT`; `filterWishlistItems` + stats use available products.

- [x] ✅ **Category filter uses `DUMMY_CATEGORIES`** done✅  
  **Where:** `WishlistFilters.tsx`.  
  **Do:** Options from wishlist items / live categories.  
  **Done:** `categoriesFromWishlistItems` on `/wishlist` passed into `WishlistFilters`.

- [x] ✅ **List hides saved variant** done✅  
  Repo maps `variant`; UI ignores it.  
  **Do:** Badge / variant-aware card; optional ATC from list.  
  **Done:** `WishlistItemCard` shows color · size · material + ATC for that `customised_product_id`.

- [x] ✅ **Inactive products vanish silently** done✅  
  RLS null embed → filtered out.  
  **Do:** Unavailable placeholder or prune rows.  
  **Done:** `mapWishlistJoinRow` + `UnavailableWishlistCard`.

- [x] ✅ **Handoff toast / tests may omit wishlist** done✅  
  Toast may still say “cart or orders”; merge tests may not mock `claimGuestWishlistService`.  
  **Where:** `AuthProvider.tsx`; `tests/feature/merge-guest-on-login.test.ts`.  
  **Do:** Include wishlist in copy + mocks; assert claim → cart → wishlist → clear.  
  **Done:** Toast includes wishlist; merge tests mock/assert `claimGuestWishlistService`.

---

## P2 — DX / polish

- [x] ✅ Dead `WishlistButton`; no navbar wishlist count — see Guest Wishlist P1 (deleted button + navbar badge)
- [x] ✅ Stats ignore `price_override` — `unitPrice` via `resolveCartUnitPrice`; stats + price filter use it
- [x] ✅ Errors → empty list (no error banner) — list getters return Result; `/wishlist` error + retry UI
- [x] ✅ `/account/wishlist` soft login UI unreachable under middleware done✅ — page redirects to `/wishlist`  

---

## Deferred / works-as-implemented

| Behavior | Why OK |
|----------|--------|
| Auth writes via session + RLS | Intended vs guest service-role |
| Claim before cookie clear | `performGuestSessionHandoff` |
| Unique (user\|session, variant) | Migration present |
| Cross-device sync by `user_id` | Account identity |
| Move-all wishlist → cart / shareable list | Later |

---

## Edge-case matrix

| Case | Status |
|------|--------|
| Auth PDP toggle add/remove | Works |
| Auth `/wishlist` list | Works (filters/stats broken) |
| Auth `/account/wishlist` | Works (no filters; weak nav) |
| Guest wishlist → password login | Works (claim in handoff) |
| Guest wishlist → email confirm | Works if callback runs `performGuestSessionHandoff` |
| Duplicate variant on claim | Deduped |
| Remove from list page | Works (`removeWishlistItemAction`) |
| Wrong variant on PDP after save | Confusing / new row risk |
| Inactive product on list | Silent drop |
| Logged out `/account/wishlist` | Middleware → login |

---

## Guest vs User wishlist

| | Guest | User |
|--|-------|------|
| Owner | `session_id` | `user_id` |
| Writes | Service role after cookie check | Session + RLS |
| List | `/wishlist` | `/wishlist` + `/account/wishlist` |
| Claim on login | — | **Yes** (current code) |
| List remove | Yes | Yes |

---

## Key file map

| Concern | Path |
|---------|------|
| Public list | `app/(public)/wishlist/page.tsx` |
| Account list | `app/(useraccount)/account/wishlist/page.tsx` |
| Toggle / status | `actions/wishlist.ts` |
| Service + claim | `services/wishlist.service.ts` (`claimGuestWishlistService`) |
| Repo | `repositories/wishlist.repository.ts` |
| PDP heart | `ProductCustomization.tsx` |
| Handoff | `actions/cart.ts` (`performGuestSessionHandoff`), `AuthProvider.tsx`, `auth/callback/route.ts` |
| Unique migration | `supabase/migrations/20260719170000_wishlists_unique_owner_variant.sql` |

---

## Related docs

- Index: `flow.md` (User → Wishlist account + public)
- Guest Wishlist (merge item may be stale): `[02] Guest Flow/[06] Guest Flow - Wishlist.md`
- Guest capabilities inheritance: `[02] Client Flow - Guest Capabilities.md` (update merge row if still open there)
- Account shell: `[03] Client Flow - Account.md`

**Highest-impact remaining:** fix filters/stats → toast/tests include wishlist claim.
