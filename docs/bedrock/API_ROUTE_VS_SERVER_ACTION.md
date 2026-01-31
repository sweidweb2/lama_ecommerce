# API Route vs Server Action for Profile Fetching

## The Problem

**Client Components CANNOT call server-side functions directly** because:

1. `getCurrentUserProfile()` uses `cookies()` from `next/headers`
2. `cookies()` is a **server-only API** (runs on Node.js, not in browser)
3. Client Components run in the **browser** (JavaScript runtime)
4. Browser cannot access Node.js APIs

## Two Solutions

### Solution 1: API Route (Current Implementation)

**File:** `app/api/auth/profile/route.ts`

```tsx
// Client Component
"use client";
async function fetchProfile() {
  const res = await fetch("/api/auth/profile");
  const data = await res.json();
  setProfile(data.profile);
}
```

**Pros:**
- ✅ Standard REST API pattern
- ✅ Can be called from anywhere (browser, mobile app, external services)
- ✅ Works with standard HTTP tools (Postman, curl, etc.)
- ✅ Can add caching headers, CORS, etc.

**Cons:**
- ❌ Extra HTTP request overhead
- ❌ More code (route handler + fetch call)
- ❌ Manual error handling

---

### Solution 2: Server Action (Alternative)

**File:** `actions/profile.ts`

```tsx
// Client Component
"use client";
import { getProfile } from "@/actions/profile";

async function fetchProfile() {
  const profile = await getProfile(); // Direct call!
  setProfile(profile);
}
```

**Pros:**
- ✅ Simpler code (no fetch, no JSON parsing)
- ✅ Type-safe (TypeScript types flow through)
- ✅ Automatic error handling
- ✅ Less overhead (no HTTP request)

**Cons:**
- ❌ Next.js specific (not standard REST)
- ❌ Can't be called from external services
- ❌ Requires "use server" directive

---

## Recommendation

**Use Server Action** for internal client-to-server communication (like this case).

**Use API Route** when you need:
- External API access
- Mobile app integration
- Standard REST endpoints
- CORS configuration

---

## Migration: API Route → Server Action

If you want to switch to Server Action:

1. **Create the action** (already done: `actions/profile.ts`)
2. **Update AuthProvider:**

```tsx
// providers/AuthProvider.tsx
"use client";
import { getProfile } from "@/actions/profile";

async function fetchProfile() {
  try {
    setLoading(true);
    const profile = await getProfile(); // Direct call!
    setProfile(profile);
  } catch (error) {
    setProfile(null);
  } finally {
    setLoading(false);
  }
}
```

3. **Delete API route** (optional): `app/api/auth/profile/route.ts`

---

## Why Not Direct Service Call?

```tsx
// ❌ THIS WON'T WORK
"use client";
import { getCurrentUserProfile } from "@/services/profile.service";

const profile = await getCurrentUserProfile(); // ERROR!
// Error: cookies() can only be called in Server Components, Server Actions, or Route Handlers
```

**Reason:** The service uses `cookies()` which is server-only.
