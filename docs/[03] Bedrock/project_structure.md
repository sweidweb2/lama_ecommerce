# Project Structure

## Full project structure (from root)

```
lama_ecommerce/
├── .env.local
├── .env.example
├── .gitignore
├── next.config.ts
├── tsconfig.json
├── package.json
├── middleware.ts                 # auth & role protection
├── README.md
│
├── public/
│
├── app/
│   ├── layout.tsx                # root layout
│   ├── globals.css
│   ├── page.tsx                  # home
│   │
│   ├── (public)/                 # PUBLIC STOREFRONT
│   │   ├── layout.tsx
│   │   ├── products/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── wishlist/
│   │   ├── orders/
│   │   ├── profile/
│   │   ├── contact-us/
│   │   └── auth/
│   │       ├── login/
│   │       ├── signup/
│   │       └── callback/route.ts
│   │
│   ├── (useraccount)/            # LOGGED-IN ACCOUNT
│   │   └── account/
│   │       ├── page.tsx
│   │       └── wishlist/
│   │
│   ├── admin/                    # ADMIN PANEL
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── products/
│   │   ├── orders/
│   │   ├── users/
│   │   ├── categories/
│   │   ├── brands/
│   │   ├── reviews/
│   │   ├── shippings/
│   │   ├── promocodes/
│   │   ├── carts/
│   │   ├── analytics/
│   │   ├── backups/
│   │   └── …
│   │
│   └── api/
│       ├── auth/
│       └── admin/
│
├── actions/                      # server actions (thin)
├── services/                     # business logic + authz
├── repositories/                 # Supabase data access only
│
├── components/
│   ├── ui/                       # shadcn-style primitives
│   ├── common/
│   ├── (public)/
│   ├── (useraccount)/
│   └── admin/
│
├── lib/
│   ├── supabase/                 # clients (browser, server, admin, middleware)
│   ├── auth/
│   ├── validators/               # Zod schemas
│   ├── constants/
│   └── utils/
│
├── types/
├── tests/                        # Vitest unit + feature
├── e2e/                          # Playwright smoke
├── supabase/
│   └── migrations/
└── docs/
```

---

## Key rules

### 1. No Supabase calls in components

Supabase access belongs in **`repositories/`** only. Services orchestrate repositories; actions call services.

### 2. Admin logic ≠ storefront logic

Keep UI separated under:

- `components/admin`
- `components/(public)` / `components/(useraccount)`

### 3. Authorization layers (3 levels)

| Layer | Responsibility |
|-------|----------------|
| `middleware.ts` | route protection |
| Supabase RLS | data protection |
| `services/` | business-rule authz |

### 4. Admin tables

Complex admin tables live under `components/admin` (often TanStack Table).

---

## Mental model

| Directory | Purpose |
|-----------|---------|
| `app/` | routing & layouts |
| `actions/` | server actions (orchestration) |
| `services/` | business logic |
| `repositories/` | data access (Supabase only) |
| `components/` | UI |
| `lib/` | infrastructure & shared helpers |
| Supabase RLS | data-level security |
