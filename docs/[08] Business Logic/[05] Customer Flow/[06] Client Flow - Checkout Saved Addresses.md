# Client Flow — Checkout Saved Addresses

**Scope:** Logged-in customer `flow.md` bullet: place order with **saved addresses** / **save address after checkout**.  
**Out of scope:** Guest free-text checkout (Guest Buying); full address CRUD on `/account` (Account doc); Stripe / payment UI (Buying deferred); cart pricing/stock (Client Buying).

**Verdict:** Select + prefill + optional “Save this address” **work** for authenticated users. Gaps: **email never prefilled** from account. Save dedupes identical rows; first-ever checkout save becomes default. Save-after-checkout failures are surfaced via toast (order still succeeds).

---

## Happy path (what works today)

1. Auth user opens `/cart` → `getAddressesByUserId` → `savedAddresses` (guest gets `null` → no picker).
2. `CartSidebar`: default = `is_default` else first; prefills country/city/address/postal/phone.
3. User may pick another saved address or “Enter new address”; fields stay editable.
4. Save checkbox when logged in and (no addresses **or** new **or** fields ≠ selected).
5. Place order → `checkoutAction` → `process_checkout`; if `save_address && user`, await create **or** update (`save_address_mode` + `saved_address_id`); create uses `is_default: true` when address book empty; dedupe skips identical insert; return `addressSaved`; toast success/failure (order still OK).
6. Order stores **address snapshot** (no `user_address_id` FK). Address book remains on `/account`.

```text
/cart (auth)
  → getAddressesByUserId
  → CartSidebar select / prefill / save checkbox (+ update vs create radios)
  → checkoutAction(save_address?, save_address_mode?, saved_address_id?)
  → process_checkout (snapshot on order)
  → optional await createAddressForUser | updateAddressForUser → addressSaved
```

---

## Capability checklist

| Capability | Status | Notes |
|------------|--------|--------|
| Load saved addresses on cart | Yes | Auth only |
| Prefill default / first address | Yes | Phone from address |
| Prefill email from auth user | **No** | Starts empty |
| Select saved → place order | Yes | Snapshot |
| Edit fields after select | Yes | Save checkbox + update/create radios |
| Save new address after checkout | Yes | Failure/success toast; first save is default; deduped |
| Update selected address after checkout | Yes | When editing selected + “Update existing” |
| Guest save checkbox | Hidden | `savedAddresses === null` |

---

## P0 — Correctness (fix first)

_None verified that fully blocks “pick a saved address and place a valid order” when the cart has lines and the form is complete._

---

## P1 — Incomplete / wrong saved-address checkout

- [ ] **Email not prefilled from account**  
  `email` state starts `""`; auth `user.email` never passed into sidebar. Phone only from address (profile has no phone).  
  **Where:** `app/(public)/cart/page.tsx`; `CartSidebar.tsx`.  
  **Do:** Pass `user.email` (and optional last-used phone) as initial contact.

- [x] ✅ **`itemCount` missing on cart page** done✅  
  `CartSidebar` expects `itemCount`; page does not pass it → Place order may not disable when `items.length === 0`.  
  **Where:** `app/(public)/cart/page.tsx` vs `CartSidebarProps`.  
  **Do:** Pass `itemCount={items.length}` (or equivalent).  
  **Done:** Cart page computes and passes `itemCount` to `CartSidebar`.

- [x] ✅ **Save-after-checkout failures are silent** done✅  
  Order succeeds; `createAddressForUser` was fire-and-forget / `.catch(console.error)`; no toast — user thinks it saved.  
  **Where:** `services/checkout.service.ts`; `CartSidebar.tsx`.  
  **Do:** Await + surface result, or toast on failure.  
  **Done:** Await `createAddressForUser`; return `addressSaved`; CartSidebar toasts on failure; `/account` revalidated only when save succeeded.

- [x] ✅ **No dedupe on save** done✅  
  Same street/city/phone can create many `user_addresses` rows.  
  **Where:** checkout save path; `createAddress`.  
  **Do:** Match existing row or upsert; skip identical insert.  
  **Done:** `findAddressByFields` + `createAddressForUser` returns existing match (promotes via RPC when `is_default`).

- [x] ✅ **Checkout save never becomes default** done✅  
  Always `is_default: false`; first-ever address from checkout is non-default.  
  **Where:** `checkout.service.ts`.  
  **Do:** `is_default: true` when user has zero addresses, or “Make default” checkbox.  
  **Done:** Checkout sets `is_default: true` when `getAddressesByUserId` returns empty (no checkbox).

---

## P2 — DX / polish

- [x] ✅ **No “update this address” — edits only create a new row if save is checked** done✅  
  **Done:** When editing a selected saved address, checkbox + radios: Update existing vs Save as new; `save_address_mode` / `saved_address_id` wired through action → service.

- [x] ✅ **Checkout phone rules (8–15 digits) vs address-book Zod (min 5) can diverge** done✅  
  **Done:** Both use shared `phoneSchema` / `checkoutPhoneSchema` (8–15 digits).

- [x] ✅ **No feature tests for saved-address select / `save_address`** done✅  
  **Done:** `checkout-service` feature tests for create/update/fail/`save_address: false`; schema unit tests for update-without-id.

- [x] ✅ **Revalidate `/account` on save is enough; no cart toast for “Address saved”** done✅  
  **Done:** CartSidebar toasts “Address saved” when `addressSaved === true` (and failure toast when false).

---

## Deferred / works-as-implemented

| Behavior | Why OK |
|----------|--------|
| Guest: free-text only, no save | `savedAddresses === null` |
| Order uses address snapshot, not live address id | Snapshot design |
| Address CRUD / default races on `/account` | Account `[03]` |
| Stripe / client pay UI | Buying deferred |
| Prefers `is_default` then first | `pickDefaultAddressId` |

---

## Edge-case matrix

| Case | Status |
|------|--------|
| Auth + ≥1 address, default set | Prefills default |
| Auth + addresses, no default | Prefills first |
| Auth + zero addresses | No select; save checkbox shown |
| Select saved → place order | Works (snapshot) |
| Select → edit fields | Save checkbox + update/create radios |
| “Enter new address” | Clears fields; save checkbox (create only) |
| Check save → order OK | Create or update; `addressSaved`; success toast |
| Check save → write fails | Order OK; failure toast |
| Save duplicate of existing | Skips insert; returns existing |
| Prefill email from account | **No** |
| Prefill phone without address | **No** |
| Guest checkout | No picker / save |
| Empty cart + Place order | Gated via `itemCount` |

---

## Guest vs User checkout (addresses only)

| | Guest | User |
|--|-------|------|
| Address fields | Free text | Free text + optional saved select |
| Save after order | No | Optional checkbox |
| Prefill | None | Address book (not email) |
| Order storage | Snapshot | Snapshot |

---

## Key file map

| Concern | Path |
|---------|------|
| Load addresses | `app/(public)/cart/page.tsx` |
| UI select / save checkbox | `components/(public)/cart/CartSidebar.tsx` |
| Action flag | `actions/checkout.ts` |
| Save after order | `services/checkout.service.ts` |
| Address create | `services/address.service.ts`, `repositories/address.repository.ts` |
| Account address UI | `components/account/AddressList.tsx` |
| Validators | `lib/validators/checkout/checkout.ts`, `lib/validators/user_address/*` |

---

## Related docs

- Index: `flow.md` (User → Place order with saved addresses…)
- Full buying path: `[01] Client Flow - Buying.md`
- Address CRUD: `[03] Client Flow - Account.md`
- Guest checkout: `[02] Guest Flow/[02] Guest Flow - Buying.md`

**Highest-impact remaining:** prefill email.
