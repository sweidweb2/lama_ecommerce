# Client Flow — Wishlist (Account + Public)

**Scope:** Logged-in customer wishlist from `flow.md`: public `/wishlist`, account `/account/wishlist`, PDP heart (auth path), guest → user claim on login.  
**Out of scope:** Guest-only cookie path details (Guest Wishlist); admin wishlist CRUD (none).

**Verdict:** Auth **add/remove on PDP** and **list on `/wishlist`** work. **Guest wishlist claim on login is implemented** (`claimGuestWishlistService` inside `performGuestSessionHandoff` — before cookie clear). Remaining gaps: **no remove on list pages**, duplicate `/wishlist` vs `/account/wishlist`, broken filters/stats (shared with public page). Guest Flow docs that still say “no merge” are **stale** relative to current code.

---

## Happy path (what works today)

1. Logged-in user opens PDP → picks variant → heart (`ProductCustomization` → `toggleWishlistAction`).
2. Auth branch: `checkIfInWishlist` → `addToWishlist` / `removeFromWishlistByVariant` (session client + RLS `user_id`).
3. `revalidatePath('/wishlist')`, `/products` (not `/account/wishlist`).
4. `/wishlist`: `getWishlistItems(user.id)` → filters/stats/pagination → `ProductCard` grid.
5. `/account/wishlist`: middleware auth + `is_active` → same fetch → simpler grid (no filters/stats).
6. Guest hearts → login / email-confirm callback: `performGuestSessionHandoff` → claim orders → merge cart → **`claimGuestWishlistService`** (dedupe + attach `user_id`) → clear cookie → revalidate `/wishlist`.

```text
PDP heart → toggleWishlistAction(user_id)
  → add|remove wishlists (RLS)
  → /wishlist | /account/wishlist list by user_id

Login / auth callback → performGuestSessionHandoff
  → orders → cart → claimGuestWishlistService → clear cookie
```

---

## Capability checklist

| Capability | Status | Notes |
|------------|--------|--------|
| PDP add / remove (auth) | Yes | Same UI as guest; `user_id` path |
| List on `/wishlist` | Yes | Filters/stats buggy |
| List on `/account/wishlist` | Yes | No nav link; simpler UI |
| Remove from list page | **No** | PDP toggle only |
| Guest → user claim on login | **Yes** | `claimGuestWishlistService` |
| Unique (owner, variant) | Yes | Migration `20260719170000` |

---

## P0 — Correctness (fix first)

- [ ] **Wishlist list pages cannot remove items**  
  Both `/wishlist` and `/account/wishlist` render `ProductCard` only. Removal requires PDP + same variant. Wrong variant looks “still wishlisted” / risk of new row.  
  **Where:** `app/(public)/wishlist/page.tsx`; `app/(useraccount)/account/wishlist/page.tsx`; unused `removeFromWishlist` / `removeWishlistItemById`.  
  **Do:** Per-row remove by `wishlist_id`; show saved variant on the card.  
  **Also tracked:** Guest Wishlist P0 (shared UI).

---

## P1 — Incomplete / wrong wishlist behavior

- [ ] **Duplicate surfaces diverge**  
  Navbar + ProfileActions → `/wishlist` only. `/account/wishlist` has no filters/stats; toggle never revalidates account path.  
  **Where:** both pages; `Navbar.tsx`; `ProfileActions.tsx`; `actions/wishlist.ts`.  
  **Do:** Canonical page + redirect, or shared RSC; `revalidatePath` both.

- [ ] **Featured / trending filters + stats broken**  
  Select omits `is_featured` / `is_trending`.  
  **Where:** `wishlist.repository.ts`; `wishlist/page.tsx`; `WishlistStats.tsx`.  
  **Do:** Add columns or drop filters/stats.

- [ ] **Category filter uses `DUMMY_CATEGORIES`**  
  **Where:** `WishlistFilters.tsx`.  
  **Do:** Options from wishlist items / live categories.

- [ ] **List hides saved variant**  
  Repo maps `variant`; UI ignores it.  
  **Do:** Badge / variant-aware card; optional ATC from list.

- [ ] **Inactive products vanish silently**  
  RLS null embed → filtered out.  
  **Do:** Unavailable placeholder or prune rows.

- [ ] **Handoff toast / tests may omit wishlist**  
  Toast may still say “cart or orders”; merge tests may not mock `claimGuestWishlistService`.  
  **Where:** `AuthProvider.tsx`; `tests/feature/merge-guest-on-login.test.ts`.  
  **Do:** Include wishlist in copy + mocks; assert claim → cart → wishlist → clear.

---

## P2 — DX / polish

- [ ] Dead `WishlistButton`; no navbar wishlist count  
- [ ] Stats ignore `price_override`  
- [ ] Errors → empty list (no error banner)  
- [ ] `/account/wishlist` soft login UI unreachable under middleware  

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
| Remove from list page | **Gap** (P0) |
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
| List remove | No | No |

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

**Highest-impact remaining:** list-page remove + show variant → unify `/wishlist` vs account → fix filters/stats → toast/tests include wishlist claim.
