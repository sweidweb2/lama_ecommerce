# Project Structure

## 📁 Full Project Structure (from root)

```
lama_ecommerce/
├── .env.local
├── .env.example
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── middleware.ts              # auth & role protection
│
├── public/
│   ├── images/
│   ├── icons/
│   └── banners/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx         # root layout
│   │   ├── globals.css
│   │   │
│   │   ├── (storefront)/      # PUBLIC PAGES
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx       # home
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx
│   │   │   ├── cart/
│   │   │   │   └── page.tsx
│   │   │   ├── checkout/
│   │   │   │   └── page.tsx
│   │   │   ├── wishlist/
│   │   │   │   └── page.tsx
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── register/
│   │   │   │       └── page.tsx
│   │   │   └── search/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (account)/         # LOGGED-IN USER AREA
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx       # dashboard
│   │   │   ├── orders/
│   │   │   │   └── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   ├── addresses/
│   │   │   │   └── page.tsx
│   │   │   └── wishlist/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (admin)/           # ADMIN PANEL
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx       # admin dashboard
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── orders/
│   │   │   │   └── page.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   ├── categories/
│   │   │   │   └── page.tsx
│   │   │   ├── reviews/
│   │   │   │   └── page.tsx
│   │   │   ├── shipping/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   │
│   │   └── api/               # OPTIONAL API ROUTES
│   │       ├── webhooks/
│   │       │   └── stripe/
│   │       │       └── route.ts
│   │       └── upload/
│   │           └── route.ts
│   │
│   ├── components/
│   │   ├── ui/                # shadcn components (auto-generated)
│   │   ├── common/            # shared components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ProductCard.tsx
│   │   ├── storefront/
│   │   ├── account/
│   │   └── admin/
│   │       ├── tables/
│   │       ├── forms/
│   │       └── charts/
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── auth/
│   │   │   └── permissions.ts
│   │   ├── validators/        # zod schemas
│   │   └── utils.ts
│   │
│   ├── services/              # BUSINESS LOGIC (important)
│   │   ├── products.service.ts
│   │   ├── orders.service.ts
│   │   ├── users.service.ts
│   │   ├── payments.service.ts
│   │   └── shipping.service.ts
│   │
│   ├── stores/                # zustand
│   │   ├── cart.store.ts
│   │   ├── wishlist.store.ts
│   │   └── ui.store.ts
│   │
│   ├── types/
│   │   ├── product.ts
│   │   ├── order.ts
│   │   └── user.ts
│   │
│   └── constants/
│       ├── roles.ts
│       ├── order-status.ts
│       └── routes.ts
│
└── README.md
```

---

## 🔑 Key Rules (DO NOT break these)

### 1️⃣ No Supabase calls in components

Supabase calls should **only** be made in:

- `services/`
- `lib/supabase/`

### 2️⃣ Admin logic ≠ Storefront logic

Keep them separated in:

- `components/admin`
- `components/storefront`

### 3️⃣ Authorization layers (3 levels)

| Layer | Responsibility |
|-------|---------------|
| `middleware.ts` | route protection |
| Supabase RLS | data protection |
| UI | hide buttons |

### 4️⃣ Tables always live here

- `components/admin/tables`

(backed by TanStack Table)

---

## 🧠 Mental Model (important)

| Directory | Purpose |
|-----------|---------|
| `app/` | routing & layouts |
| `components/` | UI |
| `services/` | business logic |
| `lib/` | infrastructure |
| `stores/` | client state |
| Supabase RLS | real security |
