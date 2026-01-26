# AvioraWear - Phased Execution Roadmap

## 🗺️ High-Level System Map

```
┌─────────────────────────────────────────────────────────────┐
│                    PUBLIC STOREFRONT                         │
│  (Browse, Search, Cart, Checkout, Product Details)          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                      │
│  (Supabase Auth, Middleware, RLS, Role Management)          │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌──────────────────┐        ┌──────────────────┐
│  USER ACCOUNT    │        │   ADMIN PANEL    │
│  (Orders,        │        │  (Products,      │
│   Profile,       │        │   Orders,        │
│   Wishlist)      │        │   Analytics)     │
└──────────────────┘        └──────────────────┘
        │                             │
        └──────────────┬──────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                            │
│  (Business Logic: Products, Orders, Users, Payments)        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                        │
│  (PostgreSQL + RLS + Storage + Auth)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Execution Phases

### Phase 0: Foundation & Infrastructure Setup

**Purpose:** Establish the project foundation, development environment, and core infrastructure components.

**Prerequisites:** None (starting point)

**What Must Exist:**
- Next.js project initialized
- Dependencies installed
- Basic folder structure created

**Features Included:**
- [ ] Project structure setup (`src/` directory organization)
- [ ] Environment configuration (`.env.local`, `.env.example`)
- [ ] Supabase project creation and connection
- [ ] TypeScript configuration and path aliases
- [ ] Tailwind CSS configuration
- [ ] Basic root layout (`app/layout.tsx`)
- [ ] Global styles (`app/globals.css`)
- [ ] Utility functions (`lib/utils.ts`)
- [ ] Constants setup (`constants/roles.ts`, `constants/order-status.ts`, `constants/routes.ts`)
- [ ] Type definitions foundation (`types/` directory structure)
- [ ] Supabase client setup (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
- [ ] Git configuration (`.gitignore`)

**Backend Tasks:**
- Create Supabase project
- Configure Supabase environment variables
- Set up Supabase client and server utilities
- Initialize database connection

**Frontend Tasks:**
- Set up Next.js App Router structure
- Configure TypeScript paths
- Set up Tailwind CSS
- Create base layout components
- Initialize shadcn/ui configuration

**Security Considerations:**
- Environment variables properly configured
- Supabase keys stored securely
- `.gitignore` excludes sensitive files

**Unlocks:** Phase 1 (Database Schema)

---

### Phase 1: Database Schema & Core Types

**Purpose:** Design and implement the complete database schema with proper relationships, constraints, and initial RLS policies.

**Prerequisites:** Phase 0 complete (Supabase connected)

**What Must Exist:**
- Supabase project active
- Database access configured
- TypeScript types directory structure

**Features Included:**
- [ ] User profiles table (`profiles`)
- [ ] Products table (`products`)
- [ ] Categories table (`categories`)
- [ ] Product categories junction table (`product_categories`)
- [ ] Product images table (`product_images`)
- [ ] Product variants table (`product_variants`) - sizes, colors, etc.
- [ ] Inventory table (`inventory`)
- [ ] Orders table (`orders`)
- [ ] Order items table (`order_items`)
- [ ] Addresses table (`addresses`)
- [ ] Cart items table (`cart_items`) - optional, can use client state
- [ ] Wishlist table (`wishlist`)
- [ ] Reviews table (`reviews`)
- [ ] Shipping zones table (`shipping_zones`)
- [ ] Shipping rates table (`shipping_rates`)
- [ ] TypeScript type definitions for all tables
- [ ] Database indexes for performance
- [ ] Foreign key constraints
- [ ] Basic RLS policies (enable RLS on all tables)

**Backend Tasks:**
- Create all database tables via Supabase SQL migrations
- Define column types, constraints, defaults
- Set up foreign key relationships
- Create database indexes (product search, user orders, etc.)
- Enable Row Level Security on all tables
- Create initial RLS policies (basic: users can read their own data)
- Set up database functions/triggers if needed (e.g., updated_at timestamps)

**Frontend Tasks:**
- Create TypeScript type definitions (`types/product.ts`, `types/order.ts`, `types/user.ts`)
- Define Zod schemas for validation (`lib/validators/`)
- Create type utilities and helpers

**Security Considerations:**
- RLS enabled on all tables from the start
- Initial policies: deny all by default, then grant specific access
- No sensitive data exposure in types

**Unlocks:** Phase 2 (Authentication), Phase 3 (Storefront)

---

### Phase 2: Authentication & Authorization System

**Purpose:** Implement complete authentication flows and role-based access control with middleware protection.

**Prerequisites:** Phase 1 complete (database schema with profiles table)

**What Must Exist:**
- `profiles` table with role column
- Supabase Auth configured
- Database RLS enabled

**Features Included:**
- [ ] User registration flow (`app/(storefront)/auth/register/page.tsx`)
- [ ] User login flow (`app/(storefront)/auth/login/page.tsx`)
- [ ] Email verification handling
- [ ] Password reset flow
- [ ] Session management
- [ ] Role management system (Super Admin, Admin, User)
- [ ] Middleware route protection (`middleware.ts`)
- [ ] Permission utilities (`lib/auth/permissions.ts`)
- [ ] Supabase middleware helper (`lib/supabase/middleware.ts`)
- [ ] Protected route groups: `(account)`, `(admin)`
- [ ] Auth context/provider setup
- [ ] Logout functionality
- [ ] Profile creation on signup (trigger/function)

**Backend Tasks:**
- Configure Supabase Auth settings
- Create database trigger/function to auto-create profile on user signup
- Update RLS policies for profiles table:
  - Users can read/update their own profile
  - Admins can read all profiles
  - Super Admins can update any profile
- Create role enum/constants
- Set up email templates (if custom)
- Configure OAuth providers (if needed)

**Frontend Tasks:**
- Build registration page with form validation
- Build login page with form validation
- Create auth service (`services/auth.service.ts` - if needed, or use Supabase directly)
- Implement middleware for route protection:
  - Public routes: `(storefront)/**`
  - Protected user routes: `(account)/**` (requires auth)
  - Protected admin routes: `(admin)/**` (requires admin role)
- Create permission checking utilities
- Build auth layout components
- Handle auth state in client components

**Security Considerations:**
- Middleware validates JWT tokens
- RLS policies enforce data access at database level
- Role checks in middleware before route access
- Password requirements enforced
- Session timeout handling
- CSRF protection (handled by Next.js)

**Unlocks:** Phase 3 (Storefront), Phase 5 (User Account), Phase 7 (Admin Panel)

---

### Phase 3: Storefront Foundation

**Purpose:** Build the public-facing storefront with product browsing, search, and basic navigation.

**Prerequisites:** Phase 1 complete (products schema), Phase 2 complete (auth for optional features)

**What Must Exist:**
- Products table populated (or seed data)
- Categories table populated
- RLS policies allow public read access to products
- Basic auth working (for wishlist features)

**Features Included:**
- [ ] Home page (`app/(storefront)/page.tsx`)
  - Hero section
  - Featured products
  - Category showcase
  - Promotional banners
- [ ] Products listing page (`app/(storefront)/products/page.tsx`)
  - Product grid/list view
  - Category filtering
  - Sorting (price, name, date)
  - Pagination
- [ ] Product detail page (`app/(storefront)/products/[slug]/page.tsx`)
  - Product images gallery
  - Variant selection (size, color)
  - Add to cart button
  - Add to wishlist button
  - Product description
  - Related products
- [ ] Search page (`app/(storefront)/search/page.tsx`)
  - Search input and results
  - Search filters
  - Search result pagination
- [ ] Header component (`components/common/Header.tsx`)
  - Logo
  - Navigation menu
  - Search bar
  - Cart icon with count
  - User menu (if logged in)
  - Mobile menu
- [ ] Footer component (`components/common/Footer.tsx`)
- [ ] Product card component (`components/common/ProductCard.tsx`)
- [ ] Storefront layout (`app/(storefront)/layout.tsx`)
- [ ] Product service (`services/products.service.ts`)
- [ ] Category service (`services/categories.service.ts`)

**Backend Tasks:**
- Update RLS policies:
  - Public read access to products (published only)
  - Public read access to categories
  - Public read access to product images
- Create database functions for product search (full-text search)
- Optimize queries with proper indexes
- Set up product image storage buckets in Supabase Storage
- Create storage policies for public product images

**Frontend Tasks:**
- Build storefront layout with Header/Footer
- Create product listing page with filters
- Create product detail page
- Implement product search functionality
- Create reusable product card component
- Build category navigation
- Implement responsive design (mobile-first)
- Set up React Query for data fetching
- Create product service layer
- Handle loading and error states
- Implement image optimization (Next.js Image)

**Security Considerations:**
- RLS ensures only published products are visible
- No sensitive product data exposed (prices visible, but inventory hidden)
- Image URLs are public but validated

**Unlocks:** Phase 4 (Cart & Wishlist), Phase 6 (Checkout)

---

### Phase 4: Shopping Cart & Wishlist

**Purpose:** Implement client-side cart management and server-side wishlist functionality.

**Prerequisites:** Phase 3 complete (product pages exist), Phase 2 complete (auth for wishlist)

**What Must Exist:**
- Product pages functional
- User authentication working
- Wishlist table in database

**Features Included:**
- [ ] Cart store (`stores/cart.store.ts`)
  - Add to cart
  - Remove from cart
  - Update quantities
  - Calculate totals
  - Persist to localStorage
  - Sync with server (optional)
- [ ] Cart page (`app/(storefront)/cart/page.tsx`)
  - Display cart items
  - Quantity controls
  - Remove items
  - Price calculations
  - Proceed to checkout button
  - Empty cart state
- [ ] Cart icon badge (shows item count)
- [ ] Wishlist store (`stores/wishlist.store.ts`)
- [ ] Wishlist service (`services/wishlist.service.ts`)
- [ ] Public wishlist page (`app/(storefront)/wishlist/page.tsx`)
- [ ] User account wishlist page (`app/(account)/wishlist/page.tsx`)
- [ ] Add/remove wishlist functionality on product pages
- [ ] UI store for global UI state (`stores/ui.store.ts`)

**Backend Tasks:**
- Update RLS policies for wishlist table:
  - Users can CRUD their own wishlist items
  - Users can read their own wishlist
- Create wishlist service functions
- Optional: Create cart_items table if server-side cart needed

**Frontend Tasks:**
- Implement Zustand cart store with persistence
- Build cart page UI
- Create wishlist service layer
- Build wishlist pages (public and account)
- Add cart/wishlist buttons to product cards
- Implement cart icon with real-time count
- Handle cart validation (check stock availability)
- Create empty states for cart/wishlist

**Security Considerations:**
- Cart is client-side only (no sensitive data)
- Wishlist RLS ensures users only see their own items
- Validate product availability before checkout

**Unlocks:** Phase 6 (Checkout)

---

### Phase 5: User Account Area

**Purpose:** Build the logged-in user dashboard and account management features.

**Prerequisites:** Phase 2 complete (authentication), Phase 1 complete (addresses, orders tables)

**What Must Exist:**
- User authentication working
- Profiles, addresses, orders tables exist
- RLS policies for user data

**Features Included:**
- [ ] Account layout (`app/(account)/layout.tsx`)
  - Sidebar navigation
  - User info display
- [ ] Account dashboard (`app/(account)/page.tsx`)
  - Recent orders summary
  - Account stats
  - Quick actions
- [ ] Orders page (`app/(account)/orders/page.tsx`)
  - Order history list
  - Order details view
  - Order status tracking
  - Re-order functionality
- [ ] Profile page (`app/(account)/profile/page.tsx`)
  - Edit personal information
  - Change password
  - Email preferences
- [ ] Addresses page (`app/(account)/addresses/page.tsx`)
  - List saved addresses
  - Add new address
  - Edit address
  - Delete address
  - Set default address
- [ ] Account wishlist page (`app/(account)/wishlist/page.tsx`)
- [ ] Account components (`components/account/`)
- [ ] User service (`services/users.service.ts`)
- [ ] Address service (`services/addresses.service.ts`)

**Backend Tasks:**
- Update RLS policies:
  - Users can CRUD their own addresses
  - Users can read their own orders
  - Users can update their own profile
- Create user service functions
- Create address service functions
- Create order service functions (read-only for users)

**Frontend Tasks:**
- Build account layout with navigation
- Create dashboard page
- Build orders listing and detail pages
- Create profile edit form
- Build address management UI
- Implement form validation (Zod + react-hook-form)
- Create account-specific components
- Handle loading and error states

**Security Considerations:**
- Middleware ensures only authenticated users access routes
- RLS policies enforce users can only access their own data
- Password changes require current password verification
- Email changes require verification

**Unlocks:** Phase 6 (Checkout - needs addresses)

---

### Phase 6: Checkout & Order Processing

**Purpose:** Implement the complete checkout flow and order creation system.

**Prerequisites:** Phase 4 complete (cart), Phase 5 complete (addresses), Phase 1 complete (orders schema)

**What Must Exist:**
- Cart functionality working
- Address management working
- Orders and order_items tables exist
- Product inventory tracking

**Features Included:**
- [ ] Checkout page (`app/(storefront)/checkout/page.tsx`)
  - Cart summary
  - Shipping address selection
  - Billing address (optional, can use shipping)
  - Shipping method selection
  - Payment method selection
  - Order summary with totals
  - Place order button
- [ ] Order confirmation page
- [ ] Order service (`services/orders.service.ts`)
- [ ] Payment service (`services/payments.service.ts`)
- [ ] Shipping service (`services/shipping.service.ts`)
- [ ] Order creation logic
- [ ] Inventory deduction on order creation
- [ ] Email notification (order confirmation)
- [ ] Order status management

**Backend Tasks:**
- Update RLS policies for orders:
  - Users can create orders
  - Users can read their own orders
  - Admins can read/update all orders
- Create order creation function (transaction)
- Implement inventory deduction logic
- Create shipping calculation functions
- Set up payment webhook handler (`app/api/webhooks/stripe/route.ts`)
- Create database functions for order totals calculation
- Set up order status workflow
- Create email templates (or integration)

**Frontend Tasks:**
- Build checkout page with multi-step form
- Implement address selection/creation
- Create shipping method selection
- Build order summary component
- Integrate payment provider (Stripe or similar)
- Handle order submission
- Create order confirmation page
- Implement order status tracking
- Handle payment processing
- Create error handling for failed orders

**Security Considerations:**
- Payment processing via secure provider (Stripe)
- Order creation is transactional (all-or-nothing)
- Inventory checked and locked during checkout
- Webhook signature verification
- RLS ensures users only see their orders
- Payment data never stored (use payment provider tokens)

**Unlocks:** Phase 8 (Admin - Order Management)

---

### Phase 7: Admin Panel - Products Management

**Purpose:** Build the admin interface for managing products, categories, and inventory.

**Prerequisites:** Phase 2 complete (admin auth), Phase 1 complete (products schema), Phase 3 complete (product service exists)

**What Must Exist:**
- Admin authentication working
- Products, categories tables exist
- Product service layer exists
- Supabase Storage configured

**Features Included:**
- [ ] Admin layout (`app/(admin)/layout.tsx`)
  - Admin sidebar navigation
  - Admin header
  - Role-based menu items
- [ ] Admin dashboard (`app/(admin)/page.tsx`)
  - Key metrics (orders, revenue, products)
  - Recent orders
  - Low stock alerts
  - Quick stats
- [ ] Products list page (`app/(admin)/products/page.tsx`)
  - Products table (TanStack Table)
  - Search and filters
  - Bulk actions
  - Pagination
- [ ] Product form page (`app/(admin)/products/new/page.tsx`)
  - Create new product
  - Edit existing product
  - Image upload (multiple)
  - Variant management (sizes, colors)
  - Category assignment
  - Inventory management
  - SEO fields
- [ ] Categories management (`app/(admin)/categories/page.tsx`)
  - Categories table
  - Create/edit/delete categories
  - Category hierarchy
- [ ] Admin product table component (`components/admin/tables/ProductsTable.tsx`)
- [ ] Admin product form component (`components/admin/forms/ProductForm.tsx`)
- [ ] Image upload component
- [ ] Admin product service updates

**Backend Tasks:**
- Update RLS policies:
  - Admins can CRUD all products
  - Admins can CRUD categories
  - Admins can manage inventory
- Create product image upload handler (`app/api/upload/route.ts`)
- Set up Supabase Storage bucket for product images
- Create storage policies (admin write, public read)
- Create admin-specific service functions
- Add product validation logic

**Frontend Tasks:**
- Build admin layout with navigation
- Create admin dashboard with metrics
- Build products table using TanStack Table
- Create product form with all fields
- Implement image upload functionality
- Build variant management UI
- Create categories management interface
- Implement form validation
- Add bulk operations (delete, publish, unpublish)
- Create admin-specific components
- Handle loading and error states

**Security Considerations:**
- Middleware verifies admin role
- RLS policies enforce admin-only access
- Image uploads validated (type, size)
- Product data validated before save
- Admin actions logged (optional: audit trail)

**Unlocks:** Phase 8 (Admin - Orders & Users)

---

### Phase 8: Admin Panel - Orders & Users Management

**Purpose:** Build admin interfaces for managing orders and users.

**Prerequisites:** Phase 7 complete (admin panel foundation), Phase 6 complete (orders exist), Phase 2 complete (users exist)

**What Must Exist:**
- Admin panel layout working
- Orders being created
- User profiles exist

**Features Included:**
- [ ] Orders management page (`app/(admin)/orders/page.tsx`)
  - Orders table (TanStack Table)
  - Order status management
  - Order details view
  - Filter by status, date, customer
  - Export orders (CSV)
- [ ] Users management page (`app/(admin)/users/page.tsx`)
  - Users table
  - User details view
  - Role management
  - User search and filters
  - Activate/deactivate users
- [ ] Admin orders table (`components/admin/tables/OrdersTable.tsx`)
- [ ] Admin users table (`components/admin/tables/UsersTable.tsx`)
- [ ] Order status update component
- [ ] User role management component
- [ ] Order service updates (admin functions)
- [ ] User service updates (admin functions)

**Backend Tasks:**
- Update RLS policies:
  - Admins can read/update all orders
  - Admins can read/update all user profiles
  - Admins can change user roles (with restrictions)
- Create admin order service functions
- Create admin user service functions
- Create order status update logic
- Add order status change notifications
- Create user role change validation

**Frontend Tasks:**
- Build orders table with filters
- Create order details modal/page
- Implement order status update UI
- Build users table
- Create user details view
- Implement role management UI
- Add bulk actions for orders
- Create export functionality
- Build admin-specific components
- Handle permissions (Super Admin vs Admin)

**Security Considerations:**
- Only Super Admins can change roles
- Order status changes are logged
- User deactivation prevents login
- RLS ensures admin access only
- Sensitive user data protected

**Unlocks:** Phase 9 (Admin - Analytics & Settings)

---

### Phase 9: Admin Panel - Analytics, Shipping & Settings

**Purpose:** Complete the admin panel with analytics, shipping management, and system settings.

**Prerequisites:** Phase 8 complete (orders management), Phase 1 complete (shipping tables)

**What Must Exist:**
- Orders data available
- Shipping zones/rates tables exist
- Admin panel functional

**Features Included:**
- [ ] Shipping management (`app/(admin)/shipping/page.tsx`)
  - Shipping zones configuration
  - Shipping rates management
  - Zone-based pricing
  - Free shipping thresholds
- [ ] Reviews management (`app/(admin)/reviews/page.tsx`)
  - Reviews table
  - Approve/reject reviews
  - Moderate reviews
- [ ] Settings page (`app/(admin)/settings/page.tsx`)
  - General settings
  - Store information
  - Email settings
  - Payment settings
  - Tax settings
- [ ] Analytics dashboard enhancements
  - Sales charts (Recharts)
  - Revenue trends
  - Product performance
  - Customer analytics
  - Order status distribution
- [ ] Admin charts components (`components/admin/charts/`)
- [ ] Shipping service (`services/shipping.service.ts`)
- [ ] Settings service

**Backend Tasks:**
- Update RLS policies for shipping:
  - Admins can CRUD shipping zones and rates
  - Public can read active shipping rates
- Create shipping calculation functions
- Create analytics queries (aggregations)
- Create settings storage (database table or config)
- Create review moderation functions
- Set up database views for analytics (optional)

**Frontend Tasks:**
- Build shipping management UI
- Create shipping zone/rate forms
- Build reviews moderation interface
- Create settings forms
- Build analytics charts using Recharts
- Create dashboard widgets
- Implement data export features
- Build admin-specific chart components

**Security Considerations:**
- Only admins can modify shipping settings
- Settings changes are validated
- Analytics data respects RLS (admins see all)
- Review moderation prevents spam

**Unlocks:** Phase 10 (Reviews & Recommendations)

---

### Phase 10: Reviews & Recommendations

**Purpose:** Implement product reviews system and basic recommendation engine.

**Prerequisites:** Phase 3 complete (product pages), Phase 6 complete (orders - for verified purchases), Phase 1 complete (reviews table)

**What Must Exist:**
- Product detail pages exist
- Orders system working
- Reviews table exists

**Features Included:**
- [ ] Product reviews display (`app/(storefront)/products/[slug]/page.tsx`)
  - Reviews list
  - Review ratings
  - Review pagination
  - Review filters (rating, verified purchase)
- [ ] Review submission form
  - Rating input
  - Review text
  - Image upload (optional)
  - Verified purchase badge
- [ ] Reviews service (`services/reviews.service.ts`)
- [ ] Basic recommendations
  - Related products (same category)
  - Recently viewed products
  - Similar products (basic algorithm)
- [ ] Recommendation service
- [ ] Review moderation (admin - Phase 9)

**Backend Tasks:**
- Update RLS policies for reviews:
  - Public can read approved reviews
  - Users can create reviews (for purchased products)
  - Users can update/delete their own reviews
  - Admins can moderate all reviews
- Create review validation (prevent duplicate reviews per product)
- Create verified purchase check function
- Create recommendation queries:
  - Related products by category
  - Popular products
  - Recently viewed (client-side or server-side)
- Create review aggregation functions (average rating)

**Frontend Tasks:**
- Build reviews display component
- Create review submission form
- Implement rating input UI
- Build related products component
- Create recommendation components
- Add review images support
- Implement review pagination
- Handle review moderation flow

**Security Considerations:**
- Reviews require verified purchase (optional but recommended)
- Users can only review products they purchased
- Review spam prevention (rate limiting)
- Image uploads validated
- RLS ensures only approved reviews visible

**Unlocks:** Phase 11 (Polish & Optimization)

---

### Phase 11: Polish, Optimization & Deployment Prep

**Purpose:** Optimize performance, improve UX, add SEO, and prepare for production deployment.

**Prerequisites:** All previous phases complete

**What Must Exist:**
- Complete application functional
- All features implemented

**Features Included:**
- [ ] Performance optimization
  - Image optimization
  - Code splitting
  - Lazy loading
  - Query optimization
  - Caching strategies
- [ ] SEO implementation
  - Meta tags
  - Open Graph tags
  - Structured data (JSON-LD)
  - Sitemap generation
  - Robots.txt
- [ ] Error handling
  - Error boundaries
  - 404 pages
  - 500 pages
  - User-friendly error messages
- [ ] Loading states
  - Skeleton loaders
  - Loading indicators
  - Optimistic updates
- [ ] Accessibility (a11y)
  - Keyboard navigation
  - Screen reader support
  - ARIA labels
  - Color contrast
- [ ] Mobile optimization
  - Touch interactions
  - Mobile menu improvements
  - Responsive images
- [ ] Testing
  - Component testing setup
  - E2E testing setup (optional)
- [ ] Documentation
  - API documentation
  - Deployment guide
  - Environment setup guide
- [ ] Production configuration
  - Environment variables
  - Build optimization
  - Security headers
  - Rate limiting

**Backend Tasks:**
- Optimize database queries
- Add database indexes where needed
- Set up database backups
- Configure Supabase production settings
- Set up monitoring (optional)
- Review and tighten RLS policies
- Performance testing

**Frontend Tasks:**
- Implement SEO meta tags
- Add structured data
- Optimize images
- Implement error boundaries
- Add loading states everywhere
- Improve accessibility
- Mobile UX improvements
- Code cleanup and refactoring
- Remove console.logs
- Add proper TypeScript types everywhere

**Security Considerations:**
- Security headers configured
- Rate limiting implemented
- Input validation everywhere
- XSS prevention
- CSRF protection
- SQL injection prevention (via Supabase)
- Environment variables secured
- Production secrets management

**Unlocks:** Production deployment

---

## 🔄 Phase Dependencies Graph

```
Phase 0 (Foundation)
    ↓
Phase 1 (Database Schema)
    ↓
Phase 2 (Auth) ──────────┐
    ↓                     │
    ├─→ Phase 3 (Storefront)
    ├─→ Phase 5 (Account) │
    └─→ Phase 7 (Admin)   │
        ↓                 │
    Phase 8 (Admin Orders)│
        ↓                 │
    Phase 9 (Admin Analytics)
        ↓                 │
    Phase 10 (Reviews) ←──┘
        ↓
    Phase 11 (Polish)
```

**Critical Path:** Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 6 → Phase 11

**Parallel Work Opportunities:**
- Phase 5 (Account) and Phase 7 (Admin) can be developed in parallel after Phase 2
- Phase 9 (Analytics) can start while Phase 10 (Reviews) is in progress
- Phase 11 (Polish) can begin incremental work during later phases

---

## 📊 Estimated Phase Completion Order

1. **Phase 0** - Foundation (Week 1)
2. **Phase 1** - Database Schema (Week 1-2)
3. **Phase 2** - Authentication (Week 2)
4. **Phase 3** - Storefront Foundation (Week 3-4)
5. **Phase 4** - Cart & Wishlist (Week 4)
6. **Phase 5** - User Account (Week 5) ║ **Phase 7** - Admin Products (Week 5-6) *[parallel]*
7. **Phase 6** - Checkout (Week 6)
8. **Phase 8** - Admin Orders & Users (Week 7)
9. **Phase 9** - Admin Analytics (Week 8)
10. **Phase 10** - Reviews & Recommendations (Week 8-9)
11. **Phase 11** - Polish & Optimization (Week 9-10)

**Total Estimated Timeline:** 10 weeks (with 1-2 developers)

---

## 🎯 Success Criteria Per Phase

Each phase is considered complete when:
- ✅ All features listed are implemented
- ✅ Backend tasks completed and tested
- ✅ Frontend tasks completed and tested
- ✅ Security considerations addressed
- ✅ Code follows project structure rules
- ✅ No blocking issues for next phase
- ✅ Basic error handling in place

---

## 🚨 Critical Rules to Maintain

1. **No Supabase calls in components** - Only in `services/` and `lib/supabase/`
2. **Admin logic ≠ Storefront logic** - Keep separated in `components/admin` and `components/storefront`
3. **Three-layer authorization** - Middleware → RLS → UI
4. **Business logic in services** - Never in UI components
5. **Tables in admin/tables** - All admin tables use TanStack Table

---

## 📝 Notes

- This roadmap assumes a single-vendor model initially (can be extended to multi-vendor later)
- Payment integration assumes Stripe (can be swapped)
- Email notifications can use Supabase Edge Functions or external service
- Analytics can be enhanced with external tools (Google Analytics, etc.) in Phase 11
- Multi-language support is out of scope for Phase 1
- Advanced recommendation algorithms can be added post-launch
