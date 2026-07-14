# Guest Flow — Wishlist add / remove

**Scope:** Add / remove wishlist items as a guest (session cookie), view public `/wishlist`, PDP heart toggle.  
**Out of scope:** Cart merge (separate), auth account UX beyond login merge gap, admin CRUD of wishlists.

**Verdict:** Not all good. Guests can toggle wishlist on the PDP and see items on `/wishlist` (service-role + `guest_session_id`). Correctness gaps: **no merge on login**, **no remove on list**, broken filters/stats, and duplicate-risk without a unique constraint. Use the checklists below to fix.

---

## Happy path (what works today)

1. Middleware mints HttpOnly `guest_session_id` on `/wishlist` (and other public routes).
2. Open `/products/[slug]` → pick color / size / material → **Add to wishlist** (`ProductCustomization` → `toggleWishlistAction` → `addToWishlistForGuest` → admin client insert on `wishlists`).
3. Heart reflects state via `checkWishlistStatusAction` / `isInWishlistForGuest`.
4. Open `/wishlist` → `getWishlistItemsForGuest(sessionId)` → grid of `ProductCard`s.
5. Toggle again on the same variant on PDP → **Remove** (`removeWishlistItemByVariantForGuest`).

```text
PDP (variant selected)
  → toggleWishlistAction(customised_product_id)
  → guest: getOrCreateGuestSessionId
  → checkIfInWishlistForGuest / add | remove (service role, session_id + user_id IS NULL)
  → revalidatePath(/wishlist, /products)
  → /wishlist lists rows for that session
```

Auth path (same UI): `user_id` + session Supabase client + RLS `user_id = auth.uid()` (no service role).

---

## P0 — Correctness (fix first)

- [ ] **Guest wishlist not merged on login**  
  Cart merges on `SIGNED_IN` (`mergeGuestCartOnLoginAction`); wishlist does not. Guest saves items → logs in → `/wishlist` shows **user** list only; guest rows stay orphaned under the old `session_id`.  
  **Where:** `providers/AuthProvider.tsx`; `actions/cart.ts` (cart only); no `mergeGuestWishlist*` in `services/wishlist.service.ts` / `repositories/wishlist.repository.ts`.  
  **Do:** On login, claim guest wishlist rows (set `user_id`, clear `session_id`) or upsert into user wishlist then delete guest duplicates; clear/ignore cookie session wishlist after claim.

- [ ] **Wishlist page cannot remove items**  
  `/wishlist` (and `/account/wishlist`) render `ProductCard` only. Comments admit a remove button is missing. Removal requires returning to PDP, selecting the **same** variant, and toggling again. Wrong variant = looks like “still in wishlist” / new row.  
  **Where:** `app/(public)/wishlist/page.tsx`; `app/(useraccount)/account/wishlist/page.tsx`; unused `removeFromWishlist` / `removeWishlistItemById`.  
  **Do:** Per-row remove (by `wishlist_id` or `customised_product_id`) + show saved variant (color/size/material).

- [ ] **No DB unique on owner + variant → duplicate rows**  
  App does existence check then insert; no unique on `(user_id, customised_product_id)` or `(session_id, customised_product_id)`. Concurrent double-clicks / races can insert duplicates. Toggle-remove deletes by variant and clears all matches, but list still shows multi-card until fixed.  
  **Where:** `wishlists` schema (`supabase/migrations/20260126141860_initial.sql`); `addWishlistItem` / `addWishlistItemForGuest`.  
  **Do:** Partial unique indexes (user vs guest) + treat conflict as success / idempotent add.

---

## P1 — Incomplete / wrong wishlist behavior

- [ ] **Inactive / deleted product embeds vanish silently**  
  Map drops rows when `customised_products.products` is null (RLS hides inactive products for auth reads). Guest fetch uses **admin** client → inactive products still appear. Auth guests-turned-users can lose visible lines while DB rows remain.  
  **Where:** `repositories/wishlist.repository.ts` (`WISHLIST_SELECT` + `.filter(Boolean)`).  
  **Do:** Surface “unavailable” placeholders, or prune wishlist when product/variant goes inactive; align guest vs auth visibility.

- [ ] **Featured / trending filters always broken**  
  Page filters on `product.is_featured` / `is_trending`, but `WISHLIST_SELECT` does **not** select those columns → always `undefined`. “Featured only” → empty; “Not featured” → all; stats “Featured” count stays 0.  
  **Where:** `app/(public)/wishlist/page.tsx`; `WishlistStats.tsx`; `wishlist.repository.ts` select list.  
  **Do:** Include `is_featured` / `is_trending` in select, or remove those filters/stats.

- [ ] **Category filter uses `DUMMY_CATEGORIES`**  
  Filter options are fake constants, not categories present in the wishlist (or live `categories` table). Real category slugs often never match → empty grid after filter.  
  **Where:** `components/(public)/wishlist/WishlistFilters.tsx` (`DUMMY_CATEGORIES`).  
  **Do:** Build options from wishlist items (or `getCategoriesService`).

- [ ] **List hides which variant was saved**  
  Wishlist stores `customised_product_id`; UI shows product-level card (base `price`, no color/size/material). Guest cannot tell which SKU they hearted; ATC from card is not wired.  
  **Where:** page mapping + `ProductCard`; variant data exists in repo map but unused in JSX.  
  **Do:** Pass variant into card / badge; optional “Add this variant to cart”.

- [ ] **Delete returns success even when nothing deleted**  
  `.delete().eq(...)` with 0 rows still yields `{ success: true }`. Toggle can flip UI then re-check correctly, but raw remove APIs are lying.  
  **Where:** `removeWishlistItemById` / `ByVariant` / `ByVariantForGuest`.  
  **Do:** Check `count` / returning row; fail or no-op explicitly.

- [ ] **No validate-before-insert that variant is buyable**  
  Guest path service-role inserts any UUID that passes Zod + FK. Inactive product / zero-stock variants can still be wishlisted.  
  **Where:** `addWishlistItemForGuest` / `toggleWishlistAction`.  
  **Do:** Resolve variant + parent `is_active` (and optionally stock) before insert.

---

## P2 — DX / dead / stale / UX

- [ ] **Dead `WishlistButton`**  
  Shared button never imported; PDP uses inline toggle in `ProductCustomization`. Unused `productId` prop; comment still talks about ProductCard first-variant ATC.  
  **Where:** `components/common/WishlistButton.tsx`.  
  **Do:** Wire on cards / wishlist rows, or delete.

- [ ] **Duplicate wishlist surfaces**  
  Public `/wishlist` (guest + auth) and `/account/wishlist` (auth only) differ (filters/stats only on public). Navbar always links `/wishlist`. Easy to diverge further.  
  **Where:** `app/(public)/wishlist/page.tsx`; `app/(useraccount)/account/wishlist/page.tsx`; `Navbar.tsx`.  
  **Do:** One canonical page + redirect, or share one server component.

- [ ] **Navbar heart has no count**  
  Link only; no badge of wishlist length (cart has a decorative dot, also not real count).  
  **Where:** `components/common/Navbar.tsx`.  
  **Do:** Optional count from session/user wishlist length.

- [ ] **Wishlist total value ignores `price_override`**  
  Stats sum `products.price` only; buying flow prices `COALESCE(price_override, base)`.  
  **Where:** `WishlistStats.tsx`; select omits variant `price_override`.  
  **Do:** Sum effective unit price per saved variant.

- [ ] **Errors swallowed as empty wishlist**  
  Repo catch / PostgREST errors → `[]` / `false`. Guest sees empty state on failure.  
  **Where:** `wishlist.repository.ts` get/check helpers.  
  **Do:** Surface error to page / toast; log with context.

- [ ] **`removeWishlistItemById` unused**  
  Service exposes remove-by-id; actions only toggle by variant.  
  **Where:** `services/wishlist.service.ts`; `actions/wishlist.ts`.  
  **Do:** Use for list remove, or drop.

- [x] ✅ **Brand embed null for guests on list (same as browse)** done✅  
  `brands` has no public SELECT; wishlist embed `brands(*)` is null under RLS. Guest admin select bypasses wishlists RLS but **joins still subject to brands RLS** depending on client — verify brands null on cards.  
  **Where:** brands policies; `WISHLIST_SELECT`.  
  **Do:** Public brands read (see Guest Browse P0) or drop brand from wishlist select.  
  **Done:** Migration `20260714190000_public_read_brands.sql` — same public brands SELECT as Browse P0; wishlist embeds can resolve brand rows for guests.

- [ ] **Service layer is thin pass-through**  
  No auth checks, ownership asserts, or merge rules in `wishlist.service.ts` — all in repo/action. Fine today for guests (cookie gated in action) but easy to misuse repos.  
  **Where:** `services/wishlist.service.ts`.  
  **Do:** Keep validation/ownership in service when expanding (merge, remove-by-id).

---

## Deferred (not bugs — planned later)

- [ ] Wishlist → cart “move all” / move one  
- [ ] Cross-device sync beyond login merge (account-only, intentional)  
- [ ] Shareable wishlist links

---

## DB tables in this flow

| Table | Role |
|-------|------|
| `wishlists` | Rows owned by `user_id` **or** `session_id` (`user_id`/`session_id` check); guest writes via service role |
| `customised_products` | Saved variant FK; delete blocked if wishlist refs |
| `products` / images / categories / brands | Embeds for list cards (brands RLS caveat) |
| Cookie `guest_session_id` | Guest ownership key (middleware + `lib/auth/guest-session`) |

---

## Guest vs authenticated

| | Auth | Guest |
|--|------|--------|
| Owner | `user_id` | `session_id` + `user_id IS NULL` |
| Writes | Session client + RLS | Service role after cookie in action |
| Reads | Session client + RLS | Service role scoped by `session_id` |
| Toggle entry | Same `toggleWishlistAction` | Same |
| Login | — | **No wishlist merge** (cart only) |
| Routes | `/wishlist`, `/account/wishlist` | `/wishlist` public |

Guests can add/remove and view wishlist **without** signing in. Signing in without a merge **drops the guest list from the UI**.

---

**Highest-impact fixes:** merge guest wishlist on login → remove + show variant on `/wishlist` → unique constraint → fix featured/trending select + real categories → delete or wire `WishlistButton`.
