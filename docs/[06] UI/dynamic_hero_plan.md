# Dynamic Hero Carousel Implementation Plan

This document outlines the step-by-step implementation of the dynamic Hero carousel for the Lama Ecommerce project.

## 🛠️ Backend Changes (Database)
**Yes, I will be touching the backend.** I will create a new table in Supabase called `hero_carousel`. This is better than adding a column to an existing table because it allows for multiple slides and better management.

### New Table: `hero_carousel`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `title` | TEXT | Main heading of the slide |
| `subtitle` | TEXT | Sub-heading / description |
| `image_url` | TEXT | URL of the background image |
| `button_text` | TEXT | Text for the Call to Action button |
| `button_link` | TEXT | URL the button points to |
| `sort_order` | INTEGER | To control the sequence of slides |
| `is_active` | BOOLEAN | Toggle visibility |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

---

## 🚀 Step-by-Step Implementation

### Step 1: Database Migration
- Create a new migration file in `supabase/migrations/` to define the `hero_carousel` table.
- Set up Row Level Security (RLS) policies:
    - **Public**: Read access (to show on home page).
    - **Admin**: Full access (to manage from admin panel).

### Step 2: Backend Service (`hero.service.ts`)
- Create `services/hero.service.ts`.
- Implement `getActiveHeroItems()`: Fetches all active slides ordered by `sort_order`.
- Implement `updateHeroItem()`: Allows admins to modify slides.

### Step 3: Frontend Component (`Hero.tsx`)
- Implement the carousel in `components/Home/Hero.tsx`.
- It will fetch data on the server/client and display a sliding "carousel" effect.
- I will use standard CSS scroll-snap characteristics for a "scroll-like" feel as requested.

### Step 4: Admin Management Interface
- Create `app/(admin)/hero/page.tsx`.
- Build a management dashboard where the admin can:
    - Add new slides.
    - Edit existing slide text/images.
    - Toggle visibility or delete slides.

### Step 5: Integration
- Move `app/page.tsx` to `app/(storefront)/page.tsx` to maintain clean routing.
- Import and use the new `Hero` component in the home page.

---

## 📝 Summary of Work
1. **New Table**: `hero_carousel` (Backend).
2. **New Service**: `hero.service.ts` (Logic).
3. **New Component**: `Hero.tsx` (UI).
4. **New Page**: `/admin/hero` (Admin control).
