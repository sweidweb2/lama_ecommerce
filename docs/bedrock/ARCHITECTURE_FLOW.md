# Application Architecture Flow Guide

## 📊 Data Flow Pattern

Your application follows this **layered architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                    COMPONENT LAYER                       │
│  (UI - React Components, Forms, Pages)                 │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                    ACTION LAYER                         │
│  (Server Actions - Next.js "use server")                │
│  - Authorization checks                                 │
│  - Input validation                                     │
│  - Error handling                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                         │
│  (Business Logic - lib/services/)                       │
│  - Business rules                                       │
│  - Data transformation                                  │
│  - Complex operations                                   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                  REPOSITORY LAYER                        │
│  (Data Access - lib/repositories/)                      │
│  - Database queries                                     │
│  - Supabase calls                                       │
│  - Data mapping                                         │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                  SUPABASE CLIENT                         │
│  (lib/supabase/)                                        │
│  - Database connection                                  │
│  - Auth operations                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Flow Example

### Example: Updating User Profile

**1. Component (UI Layer)**
```tsx
// components/account/EditProfileForm.tsx
"use client";

import { updateProfile } from "@/actions/profile";
import { useForm } from "react-hook-form";

export function EditProfileForm() {
  const form = useForm();
  
  const onSubmit = async (data) => {
    // Call Server Action
    await updateProfile(profileId, data);
  };
  
  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

**2. Action (Server Action Layer)**
```tsx
// actions/profile.ts
"use server";

import { getCurrentUserProfile } from "@/lib/services/profile.service";
import { canEditProfile } from "@/lib/auth/permissions";
import { updateProfileService } from "@/lib/services/profile.service";

export async function updateProfile(profileId: string, data: UpdateData) {
  // 1. Authorization check
  const profile = await getCurrentUserProfile();
  if (!profile) {
    throw new Error("Unauthorized: Must be logged in");
  }
  
  // 2. Permission check
  if (!canEditProfile(profileId, profile.user_id)) {
    throw new Error("Unauthorized: You can only edit your own profile");
  }
  
  // 3. Call Service (business logic)
  return await updateProfileService(profileId, data);
}
```

**3. Service (Business Logic Layer)**
```tsx
// lib/services/profile.service.ts

import { updateProfileRepository } from "@/lib/repositories/profile.repository";
import { profileUpdateSchema } from "@/lib/validators/user/profile.update";

export async function updateProfileService(
  profileId: string,
  data: UpdateData
) {
  // 1. Validate input
  const validated = profileUpdateSchema.parse(data);
  
  // 2. Business logic (e.g., normalize data)
  const normalized = {
    ...validated,
    full_name: validated.full_name?.trim(),
  };
  
  // 3. Call Repository (data access)
  return await updateProfileRepository(profileId, normalized);
}
```

**4. Repository (Data Access Layer)**
```tsx
// lib/repositories/profile.repository.ts

import { createSupabaseServerActionClient } from "@/lib/supabase/server";

export async function updateProfileRepository(
  profileId: string,
  data: UpdateData
) {
  const supabase = await createSupabaseServerActionClient();
  
  // Direct Supabase call
  const { data: profile, error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", profileId)
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }
  
  return profile;
}
```

---

## 📁 File Organization

### Component Layer
**Location:** `components/`
- **Purpose:** UI rendering, user interaction
- **Can call:** Server Actions, Client-side hooks
- **Cannot call:** Services, Repositories, Supabase directly

**Example:**
```tsx
// components/account/ProfileForm.tsx
"use client";
import { updateProfile } from "@/actions/profile"; // ✅ OK
// import { updateProfileService } from "@/lib/services/profile.service"; // ❌ NO
```

---

### Action Layer
**Location:** `actions/`
- **Purpose:** Server-side entry point, authorization, validation
- **Can call:** Services, Permission helpers
- **Cannot call:** Repositories directly (go through Service)

**Example:**
```tsx
// actions/profile.ts
"use server";
import { getCurrentUserProfile } from "@/lib/services/profile.service"; // ✅ OK
import { updateProfileService } from "@/lib/services/profile.service"; // ✅ OK
// import { updateProfileRepository } from "@/lib/repositories/..."; // ❌ NO (skip service layer)
```

---

### Service Layer
**Location:** `lib/services/`
- **Purpose:** Business logic, data transformation, complex operations
- **Can call:** Repositories, Validators, Other services
- **Cannot call:** Components, Actions (only called by them)

**Example:**
```tsx
// lib/services/profile.service.ts
import { getProfileByUserId } from "@/lib/repositories/profile.repository"; // ✅ OK
import { profileUpdateSchema } from "@/lib/validators/user/profile.update"; // ✅ OK
```

---

### Repository Layer
**Location:** `lib/repositories/`
- **Purpose:** Database access, Supabase queries
- **Can call:** Supabase clients only
- **Cannot call:** Services, Components, Actions

**Example:**
```tsx
// lib/repositories/profile.repository.ts
import { createSupabaseServerActionClient } from "@/lib/supabase/server"; // ✅ OK
// import { updateProfileService } from "@/lib/services/..."; // ❌ NO (circular)
```

---

## 🎯 When to Use Each Layer

### Use **Component** when:
- ✅ Rendering UI
- ✅ Handling user input
- ✅ Client-side interactions
- ✅ Form submissions (calls Action)

### Use **Action** when:
- ✅ Need server-side execution
- ✅ Authorization checks required
- ✅ Input validation needed
- ✅ Called from Client Components

### Use **Service** when:
- ✅ Business logic needed
- ✅ Data transformation required
- ✅ Complex operations
- ✅ Reusable across multiple Actions

### Use **Repository** when:
- ✅ Direct database access needed
- ✅ Simple CRUD operations
- ✅ Query building
- ✅ Data mapping

---

## ⚠️ Important Rules

### ❌ NEVER Do This:

1. **Components calling Services directly:**
```tsx
// ❌ WRONG
"use client";
import { updateProfileService } from "@/lib/services/profile.service";
```

2. **Actions calling Repositories directly (skip Service):**
```tsx
// ❌ WRONG (unless it's a simple operation)
"use server";
import { updateProfileRepository } from "@/lib/repositories/...";
```

3. **Components calling Supabase directly:**
```tsx
// ❌ WRONG
"use client";
import { supabase } from "@/lib/supabase/client";
await supabase.from("profiles").update(...);
```

4. **Repositories calling Services:**
```tsx
// ❌ WRONG (circular dependency)
import { someService } from "@/lib/services/...";
```

---

### ✅ ALWAYS Do This:

1. **Components → Actions → Services → Repositories**
   - Follow the full chain for complex operations

2. **Simple operations can skip Service:**
   - If it's just a direct database call with no business logic
   - Action → Repository is acceptable for simple CRUD

3. **Authorization in Actions:**
   - Always check permissions in Actions, not in Services

4. **Validation in Services:**
   - Use Zod schemas in Services for data validation

---

## 🔀 Alternative Flows

### Flow 1: Server Component → Service → Repository
**When:** Reading data in Server Components (no user interaction)

```tsx
// app/account/page.tsx (Server Component)
import { getCurrentUserProfile } from "@/lib/services/profile.service";

export default async function AccountPage() {
  // Direct service call (no Action needed)
  const profile = await getCurrentUserProfile();
  return <div>...</div>;
}
```

**Flow:** `Server Component → Service → Repository → Supabase`

---

### Flow 2: Component → Action → Repository (Simple CRUD)
**When:** Simple operations with no business logic

```tsx
// actions/simple.ts
"use server";
import { deleteItemRepository } from "@/lib/repositories/...";

export async function deleteItem(id: string) {
  // Authorization check
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error("Unauthorized");
  
  // Direct repository call (no service needed)
  return await deleteItemRepository(id);
}
```

**Flow:** `Component → Action → Repository → Supabase`

---

### Flow 3: Component → Action → Service → Repository (Complex)
**When:** Business logic, validation, transformation needed

**Flow:** `Component → Action → Service → Repository → Supabase`

---

## 📋 Quick Reference

| From | Can Call | Cannot Call |
|------|----------|-------------|
| **Component** | Actions, Hooks | Services, Repositories, Supabase |
| **Action** | Services, Permissions | Repositories (usually), Components |
| **Service** | Repositories, Validators, Other Services | Components, Actions |
| **Repository** | Supabase Clients | Services, Components, Actions |

---

## 🎓 Best Practices

1. **Start with the full chain:**
   - Component → Action → Service → Repository
   - Simplify only if truly simple

2. **Authorization in Actions:**
   - Always check permissions before business logic

3. **Business logic in Services:**
   - Keep Services focused on business rules
   - Keep Repositories focused on data access

4. **Validation:**
   - Actions: Check permissions
   - Services: Validate data (Zod)
   - Repositories: Handle database errors

5. **Error handling:**
   - Actions: User-friendly errors
   - Services: Business logic errors
   - Repositories: Database errors

---

## 🚀 Example: Creating a New Feature

Let's say you want to add "Add to Wishlist" functionality:

**Step 1: Create Repository**
```tsx
// lib/repositories/wishlist.repository.ts
export async function addToWishlistRepository(userId: string, productId: string) {
  const supabase = await createSupabaseServerActionClient();
  // Supabase query...
}
```

**Step 2: Create Service**
```tsx
// lib/services/wishlist.service.ts
export async function addToWishlistService(userId: string, productId: string) {
  // Validate product exists
  // Check if already in wishlist
  // Business logic...
  return await addToWishlistRepository(userId, productId);
}
```

**Step 3: Create Action**
```tsx
// actions/wishlist.ts
"use server";
export async function addToWishlist(productId: string) {
  const profile = await getCurrentUserProfile();
  if (!profile) throw new Error("Unauthorized");
  
  return await addToWishlistService(profile.user_id, productId);
}
```

**Step 4: Create Component**
```tsx
// components/storefront/AddToWishlistButton.tsx
"use client";
import { addToWishlist } from "@/actions/wishlist";

export function AddToWishlistButton({ productId }) {
  const handleClick = async () => {
    await addToWishlist(productId);
  };
  return <button onClick={handleClick}>Add to Wishlist</button>;
}
```

---

## ✅ Summary

**Standard Flow:**
```
Component → Action → Service → Repository → Supabase
```

**Simple Flow (when appropriate):**
```
Component → Action → Repository → Supabase
```

**Server Component Flow:**
```
Server Component → Service → Repository → Supabase
```

**Key Rule:** Never skip layers unless you have a good reason, and never call Supabase directly from Components!
