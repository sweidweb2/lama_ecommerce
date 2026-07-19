# UI Architecture Guide

> **Frontend architecture for scalable e-commerce applications using Next.js App Router**

This guide provides a clear, opinionated structure for organizing UI components, sections, and pages in a Next.js e-commerce application.

---

## 📋 Table of Contents

1. [Core Principles](#core-principles)
2. [File Structure](#file-structure)
3. [Component Types](#component-types)
4. [Page Composition](#page-composition)
5. [Decision Table](#decision-table)
6. [Common Mistakes](#common-mistakes)
7. [Best Practices](#best-practices)

---

## 🧠 Core Principles

### The Golden Rule

> **Pages compose sections. Sections compose components. Components do ONE job.**

### Key Guidelines

- ❌ **Pages should NOT** contain JSX soup or business logic
- ✅ **Pages =** layout + composition
- ✅ **Sections =** page-level blocks
- ✅ **Components =** reusable UI atoms

---

## 🏗️ File Structure

### App Directory (`app/`)

```
app/
├─ (public)/
│  └─ page.tsx                # Home page entry
│
├─ (shop)/
│  └─ product/
│     └─ [slug]/
│        └─ page.tsx
│
├─ (auth)/
│  └─ login/
│     └─ page.tsx
│
├─ layout.tsx                  # Root layout
└─ globals.css
```

### Components Directory (`components/`)

```
components/
├─ sections/                  # PAGE SECTIONS (BIG BLOCKS)
│  ├─ home/
│  │  ├─ hero-section.tsx
│  │  ├─ categories-section.tsx
│  │  ├─ trending-section.tsx
│  │  └─ testimonials-section.tsx
│  │
│  ├─ product/
│  │  ├─ product-gallery-section.tsx
│  │  ├─ product-info-section.tsx
│  │  └─ product-reviews-section.tsx
│  │
│  └─ checkout/
│     └─ checkout-summary-section.tsx
│
├─ ui/                        # REUSABLE UI (DESIGN SYSTEM)
│  ├─ button.tsx
│  ├─ badge.tsx
│  ├─ input.tsx
│  ├─ modal.tsx
│  ├─ carousel.tsx
│  ├─ rating-stars.tsx
│  └─ skeleton.tsx
│
├─ shared/                    # CROSS-SECTION COMPONENTS
│  ├─ product-card.tsx
│  ├─ price.tsx
│  ├─ image-gallery.tsx
│  ├─ pagination.tsx
│  └─ empty-state.tsx
│
├─ layout/                    # SITE CHROME
│  ├─ header.tsx
│  ├─ footer.tsx
│  ├─ mobile-nav.tsx
│  └─ search-drawer.tsx
│
└─ icons/
   └─ index.ts
```

---

## 🧩 Component Types

### 1. UI Components (`components/ui/`)

**Purpose:** Pure, reusable design system components

**Characteristics:**
- ✅ Pure and reusable
- ✅ No business logic
- ❌ Never fetch data
- ❌ No domain-specific knowledge

**Examples:**
- `Button`, `Input`, `Badge`, `Modal`, `Carousel`, `Skeleton`

---

### 2. Shared Components (`components/shared/`)

**Purpose:** Domain-aware components reusable across pages

**Characteristics:**
- ✅ Domain-aware (e.g., product-related)
- ✅ Reusable across pages
- ✅ Can accept data as props
- ❌ Still no fetching

**Examples:**
- `ProductCard`, `Price`, `RatingStars`, `Pagination`, `EmptyState`

---

### 3. Sections (`components/sections/`)

**Purpose:** Page-specific blocks that compose components

**Characteristics:**
- ✅ Page-specific
- ✅ Can fetch data
- ✅ Compose UI + shared components
- ✅ Business rules allowed

**Examples:**
- `TrendingSection`, `ProductReviewsSection`, `HeroSection`

**Rules:**
- ✅ May fetch data
- ✅ May compose many components
- ❌ Should NOT be reusable across unrelated pages
- ❌ Should NOT contain low-level UI styling logic

---

### 4. Layout Components (`components/layout/`)

**Purpose:** Structural, persistent UI elements

**Characteristics:**
- ✅ Structural elements
- ✅ Persistent across pages
- ✅ Site-wide navigation/chrome

**Examples:**
- `Header`, `Footer`, `MobileNav`, `SearchDrawer`

---

## 📄 Page Composition

### Home Page Example

**File:** `app/(public)/page.tsx`

```tsx
import { HeroSection } from "@/components/sections/home/hero-section";
import { CategoriesSection } from "@/components/sections/home/categories-section";
import { TrendingSection } from "@/components/sections/home/trending-section";
import { TestimonialsSection } from "@/components/sections/home/testimonials-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <TrendingSection />
      <TestimonialsSection />
    </>
  );
}
```

Storefront email list signup is **not** a home section. It lives in the site footer (`components/common/Footer.tsx` → `createLeadAction`).

### Section Example

**File:** `components/sections/home/hero-section.tsx`

```tsx
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative">
      <h1>New Season, New Style</h1>
      <p>Discover trending fashion at AvioraWear</p>
      <Button>Shop Now</Button>
    </section>
  );
}
```

### Why External Sections?

✅ **Easier to maintain**  
✅ **Easier to test**  
✅ **Easier to reorder**  
✅ **Easier to reuse**  
✅ **Cleaner diffs in Git**

---

## 🧩 Component Relationships

### Section Composition Flow

```
Section
├─ uses shared components
├─ uses ui components
└─ may have tiny private helpers
```

### Reusability Decision

- **Used in more than one section** → `components/shared/`
- **Used only inside one section** → Keep it INSIDE the section file

---

## 📊 Decision Table

| If it is…                | Put it in             | Example                    |
| ------------------------ | --------------------- | -------------------------- |
| Page entry               | `app/**/page.tsx`     | `app/(public)/page.tsx`    |
| Big page block           | `components/sections` | `hero-section.tsx`         |
| Reusable UI              | `components/ui`       | `button.tsx`               |
| Product-related reusable | `components/shared`   | `product-card.tsx`         |
| Header/Footer/Nav        | `components/layout`   | `header.tsx`               |
| Used once only           | Keep near its section | Inside section file        |

---

## 🚫 Common Mistakes

### ❌ Don't Do This

1. **Huge JSX inside `page.tsx`**
   - Pages should only compose sections

2. **Putting ProductCard inside `ui/`**
   - Domain-specific components belong in `shared/`

3. **Fetching data inside Button**
   - UI components should be pure

4. **Mixing layout + business logic**
   - Keep layout components structural only

5. **Flat `components/` folder with 100 files**
   - Organize by type and purpose

---

## ✅ Best Practices

### Page Structure

- ✅ Pages = **composition only**
- ✅ Sections = **external files**
- ✅ Sections call components
- ✅ Components are layered by responsibility
- ✅ Reusability decides location

### Component Design

- ✅ One component = one job
- ✅ Keep components small and focused
- ✅ Use props for configuration
- ✅ Separate data fetching from presentation
- ✅ Prefer composition over inheritance

### File Organization

- ✅ Group related components together
- ✅ Use clear, descriptive names
- ✅ Follow consistent naming conventions
- ✅ Keep file structure shallow when possible
- ✅ Document complex components

---

## 🎯 Summary

**Pages** compose sections, **sections** compose components, and **components** do one job. This layered approach ensures:

- 🧼 **Clean code** - Easy to read and understand
- 🧠 **Maintainable** - Changes are isolated
- 📦 **Scalable** - Structure grows with your app
- 🔄 **Reusable** - Components can be shared
- 🧪 **Testable** - Each layer can be tested independently

---

## 📚 Next Steps

- Design **Home Page sections list** for your e-commerce app
- Create **Product Page architecture**
- Understand **Server vs Client component boundaries**
- Implement **Component composition patterns**

---

**Last Updated:** 2024  
**Framework:** Next.js App Router  
**Pattern:** Component-based architecture with clear separation of concerns
