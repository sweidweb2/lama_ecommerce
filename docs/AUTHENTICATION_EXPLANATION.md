# Complete Authentication System Explanation

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [File Structure & Responsibilities](#file-structure--responsibilities)
3. [Authentication Flow Diagrams](#authentication-flow-diagrams)
4. [How Supabase Integration Works](#how-supabase-integration-works)
5. [Step-by-Step Authentication Process](#step-by-step-authentication-process)

---

## 🏗️ Architecture Overview

The authentication system uses **Supabase Auth** with **Next.js App Router** and follows a **three-layer architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  (Browser - React Components, Forms, UI)              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                  SUPABASE AUTH                          │
│  (Authentication Service - Handles Login/Signup)       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                  DATABASE LAYER                         │
│  (PostgreSQL - Stores Users & Profiles)                │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure & Responsibilities

### **1. Supabase Client Configuration**

#### `lib/supabase/client.ts`
**Purpose:** Browser-side Supabase client for client components

**What it does:**
- Creates a Supabase client that works in the browser
- Uses `@supabase/auth-helpers-nextjs` package
- Automatically handles cookie management for authentication
- Used in client components (forms, buttons, etc.)

**Key Code:**
```typescript
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**When it's used:**
- ✅ Login form submission
- ✅ Signup form submission
- ✅ Any client-side auth operations
- ❌ NOT used in Server Components or Server Actions

---

#### `lib/supabase/server.ts`
**Purpose:** Server-side Supabase clients for different Next.js contexts

**Two Functions:**

**A. `createSupabaseServerComponentClient()`**
- For **Server Components** (layouts, pages)
- Can **READ** cookies but **CANNOT modify** them
- Used in: `app/layout.tsx` to get initial profile

**B. `createSupabaseServerActionClient()`**
- For **Server Actions** and **Route Handlers**
- Can **READ and MODIFY** cookies
- Used in: API routes, server actions that need to update auth state

**Key Difference:**
```typescript
// Server Component - Read only
setAll() {
  // No-op: Server Components cannot modify cookies
}

// Server Action - Can modify
setAll(cookiesToSet) {
  cookiesToSet.forEach(({ name, value, options }) => {
    cookieStore.set(name, value, options);
  });
}
```

---

#### `lib/supabase/middleware.ts`
**Purpose:** Supabase client for Next.js middleware (edge runtime)

**What it does:**
- Creates Supabase client that works in the edge runtime
- Used in `middleware.ts` to protect routes
- Can read/write cookies for route protection

**Key Code:**
```typescript
export function createSupabaseMiddlewareClient(request: NextRequest) {
  // Creates client that works in edge runtime
  // Returns both supabase client and response object
}
```

---

### **2. Authentication Forms (UI Components)**

#### `components/auth/LoginForm.tsx`
**Purpose:** Login form UI and authentication logic

**Responsibilities:**
1. **Form Management:**
   - Uses `react-hook-form` for form state
   - Uses `zod` schema (`loginSchema`) for validation
   - Manages loading states

2. **Authentication:**
   - Calls `supabase.auth.signInWithPassword()`
   - Handles errors and shows user-friendly messages
   - Redirects user after successful login

3. **UI Features:**
   - Password visibility toggle
   - Icons for email/password fields
   - Loading spinner during submission
   - Error display

**Key Authentication Code:**
```typescript
const { error } = await supabase.auth.signInWithPassword({
  email: data.email.trim().toLowerCase(),
  password: data.password,
});
```

**What happens:**
1. User enters email/password
2. Form validates input (Zod)
3. Calls Supabase Auth API
4. Supabase validates credentials
5. If valid: Creates session, sets cookies
6. Redirects to home or specified redirect URL

---

#### `components/auth/SignupForm.tsx`
**Purpose:** Registration form UI and signup logic

**Responsibilities:**
1. **Form Management:**
   - Name, email, password fields
   - Password strength indicator
   - Real-time validation feedback

2. **Registration:**
   - Calls `supabase.auth.signUp()`
   - Sends user metadata (full_name)
   - Handles email verification flow

3. **UI Features:**
   - Password strength meter (weak/medium/strong)
   - Email verification confirmation screen
   - All the same enhancements as LoginForm

**Key Authentication Code:**
```typescript
const { data: authData, error } = await supabase.auth.signUp({
  email: data.email.trim().toLowerCase(),
  password: data.password,
  options: {
    data: {
      full_name: data.name.trim(),
    },
    emailRedirectTo: `${window.location.origin}${ROUTES.CALLBACK}`,
  },
});
```

**What happens:**
1. User fills form (name, email, password)
2. Form validates input
3. Calls Supabase Auth API
4. Supabase creates user in `auth.users` table
5. Database trigger creates profile in `public.profiles` table
6. If email confirmation enabled: Sends verification email
7. Shows "Check your email" message

---

### **3. Page Wrappers**

#### `app/(storefront)/auth/login/page.tsx`
**Purpose:** Next.js page that renders LoginForm

**Code:**
```typescript
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return <LoginForm />;
}
```

**Why separate?**
- Follows Next.js routing structure
- Can add page-specific metadata, SEO
- Keeps UI components reusable

---

#### `app/(storefront)/auth/signup/page.tsx`
**Purpose:** Next.js page that renders SignupForm

**Same pattern as login page**

---

#### `app/(storefront)/auth/layout.tsx`
**Purpose:** Layout wrapper for all auth pages

**What it does:**
- Wraps all auth pages with `AuthLayout` component
- Provides consistent styling across login/signup/reset pages

---

#### `components/auth/AuthLayout.tsx`
**Purpose:** Reusable layout component for auth pages

**Features:**
- Centered container
- Logo/branding
- Card container for forms
- "Back to home" link
- No navbar (minimal distractions)

---

### **4. Root Layout & Global Setup**

#### `app/layout.tsx`
**Purpose:** Root layout for entire application

**Key Responsibilities:**
1. **Auth Provider:**
   - Wraps app with `AuthProvider`
   - Gets initial profile from server
   - Makes auth state available to all components

2. **Toaster:**
   - Adds toast notification system
   - Enables success/error messages throughout app

**Key Code:**
```typescript
const profile = await getCurrentUserProfile(); // Server Component

return (
  <html>
    <body>
      <AuthProvider initialProfile={profile}>
        {children}
      </AuthProvider>
      <Toaster /> {/* Toast notifications */}
    </body>
  </html>
);
```

---

### **5. Route Protection**

#### `middleware.ts`
**Purpose:** Protects routes based on authentication status

**What it does:**
1. Runs on every request (before page loads)
2. Checks if user is authenticated
3. Checks user's role (admin/user)
4. Redirects unauthorized users

**Protected Routes:**
- `/account/*` - Requires authentication
- `/admin/*` - Requires admin role

**Key Code:**
```typescript
// Check authentication
const { profile, user } = await getProfileFromSession(request);

if (!user || !profile) {
  // Redirect to login
  return NextResponse.redirect(loginUrl);
}

// Check admin role
if (profile.role !== ROLES.ADMIN) {
  // Redirect to home
  return NextResponse.redirect(new URL("/", request.url));
}
```

---

### **6. Validation & Constants**

#### `lib/validators/auth/auth.ts`
**Purpose:** Zod schemas for form validation

**Schemas:**
- `loginSchema` - Email + password validation
- `signupSchema` - Name + email + password validation

**Example:**
```typescript
export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
});
```

---

#### `lib/constants/routes.ts`
**Purpose:** Centralized route constants

**Why?**
- Single source of truth for all routes
- Easy to update URLs in one place
- Type-safe route references

**Routes:**
```typescript
export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",
  RESET_PASSWORD: "/auth/reset-password",
  // ... etc
} as const;
```

---

## 🔄 Authentication Flow Diagrams

### **Login Flow**

```
User visits /auth/login
    │
    ▼
LoginPage renders
    │
    ▼
LoginForm component
    │
    ▼
User enters email/password
    │
    ▼
Form validates (Zod)
    │
    ▼
Submit → supabase.auth.signInWithPassword()
    │
    ├─ Error? → Show error toast
    │
    └─ Success? → Supabase sets cookies
                    │
                    ▼
                Router.push(redirect)
                    │
                    ▼
                Router.refresh() (updates server state)
                    │
                    ▼
                User is logged in
```

### **Signup Flow**

```
User visits /auth/signup
    │
    ▼
SignupPage renders
    │
    ▼
SignupForm component
    │
    ▼
User enters name/email/password
    │
    ▼
Form validates (Zod + password strength)
    │
    ▼
Submit → supabase.auth.signUp()
    │
    ├─ Error? → Show error toast
    │
    └─ Success? → Supabase creates user in auth.users
                    │
                    ▼
                Database trigger creates profile
                    │
                    ├─ Email confirmation enabled?
                    │   │
                    │   ├─ Yes → Send email, show "Check email" screen
                    │   │
                    │   └─ No → Create session, redirect to home
                    │
                    └─ Profile auto-created via trigger
```

---

## 🔐 How Supabase Integration Works

### **1. Client-Side Authentication (Browser)**

**File:** `lib/supabase/client.ts`

**How it works:**
1. Creates a Supabase client using your project URL and anon key
2. The client automatically:
   - Stores auth tokens in cookies
   - Refreshes tokens when needed
   - Manages session state

**When you call:**
```typescript
await supabase.auth.signInWithPassword({ email, password })
```

**What happens:**
1. Request sent to Supabase Auth API
2. Supabase validates credentials
3. If valid: Returns JWT tokens
4. Client stores tokens in cookies automatically
5. Session is now active

---

### **2. Server-Side Authentication (Next.js Server)**

**Files:** `lib/supabase/server.ts`

**How it works:**
1. Server reads cookies from request
2. Creates Supabase client with cookie access
3. Can read user session from cookies
4. Can modify cookies (in Server Actions only)

**Example in Server Component:**
```typescript
// app/layout.tsx
const profile = await getCurrentUserProfile();
// ↑ Uses createSupabaseServerComponentClient()
// ↑ Reads cookies to get current user
// ↑ Fetches profile from database
```

---

### **3. Cookie Management**

**Why cookies?**
- HTTP-only cookies are secure
- Automatically sent with every request
- Works across page refreshes
- Supabase manages token refresh automatically

**Cookie Structure:**
```
sb-<project-ref>-auth-token    → Access token
sb-<project-ref>-auth-token.0   → Refresh token (if split)
```

**How cookies are set:**
- **Client:** Automatically by Supabase client
- **Server:** Via `setAll()` function in server clients

---

### **4. Session Persistence**

**How sessions persist:**
1. User logs in → Cookies set in browser
2. User refreshes page → Cookies sent to server
3. Server reads cookies → Gets user session
4. User navigates → Cookies sent with each request
5. Session stays active until:
   - User logs out
   - Token expires (auto-refreshed)
   - Cookies cleared

---

## 📊 Step-by-Step Authentication Process

### **Login Process (Detailed)**

**Step 1: User Interaction**
- File: `components/auth/LoginForm.tsx`
- User types email/password
- Form validates in real-time (Zod)

**Step 2: Form Submission**
- File: `components/auth/LoginForm.tsx` (line 39-66)
- `onSubmit` handler called
- Sets loading state

**Step 3: Supabase API Call**
- File: `lib/supabase/client.ts` (used by LoginForm)
- `supabase.auth.signInWithPassword()` called
- Request sent to: `https://<project>.supabase.co/auth/v1/token`

**Step 4: Supabase Validates**
- Supabase checks:
  - Email exists?
  - Password correct?
  - Email verified? (if required)
  - Account active?

**Step 5: Response Handling**
- **If error:**
  - Error message shown in toast
  - Form shows error state
  - User can retry

- **If success:**
  - Supabase returns JWT tokens
  - Client stores tokens in cookies
  - Session created

**Step 6: Redirect**
- File: `components/auth/LoginForm.tsx` (line 70-72)
- `router.push(redirectTo)` - Navigate to destination
- `router.refresh()` - Update server-side state

**Step 7: Server State Update**
- File: `app/layout.tsx`
- `getCurrentUserProfile()` runs again
- Gets fresh profile data
- Updates `AuthProvider` with new profile

---

### **Signup Process (Detailed)**

**Step 1: User Interaction**
- File: `components/auth/SignupForm.tsx`
- User enters name, email, password
- Password strength shown in real-time

**Step 2: Form Submission**
- File: `components/auth/SignupForm.tsx` (line 83-113)
- `onSubmit` handler called
- Validates all fields

**Step 3: Supabase API Call**
- File: `lib/supabase/client.ts` (used by SignupForm)
- `supabase.auth.signUp()` called
- Includes user metadata (full_name)

**Step 4: Supabase Creates User**
- Supabase creates entry in `auth.users` table
- Generates user ID (UUID)
- Stores email, password hash

**Step 5: Database Trigger**
- File: `supabase/migrations/` (trigger created in Fragment 2.1)
- Trigger fires on `auth.users` INSERT
- Automatically creates row in `public.profiles` table
- Sets default role to 'user'

**Step 6: Email Verification (if enabled)**
- Supabase sends verification email
- Email contains link to `/auth/callback?code=...`
- User sees "Check your email" screen

**Step 7: User Clicks Email Link**
- File: `app/(storefront)/auth/callback/route.ts` (to be created)
- Exchanges code for session
- Sets cookies
- Redirects to home

---

## 🔑 Key Concepts

### **1. Three Supabase Clients**

| Client Type | File | Used In | Can Modify Cookies? |
|------------|------|---------|---------------------|
| Browser Client | `lib/supabase/client.ts` | Client Components | ✅ Yes (automatic) |
| Server Component | `lib/supabase/server.ts` | Server Components | ❌ No (read-only) |
| Server Action | `lib/supabase/server.ts` | Server Actions | ✅ Yes |
| Middleware | `lib/supabase/middleware.ts` | Middleware | ✅ Yes |

### **2. Cookie Management**

**Why different clients?**
- Next.js has restrictions on when cookies can be modified
- Server Components: Can only read (prevents errors)
- Server Actions: Can read and write (needed for auth)
- Client: Automatic management by Supabase

### **3. Session Flow**

```
Login → Cookies Set → Every Request → Server Reads Cookies → User Authenticated
```

### **4. Profile vs User**

- **`auth.users`**: Supabase Auth table (managed by Supabase)
- **`public.profiles`**: Your app's user table (custom data)
- **Trigger**: Automatically creates profile when user signs up
- **Why separate?** Your app logic uses `profiles` with roles, not `auth.users`

---

## 🎯 Summary: File Responsibilities

| File | Responsibility | When It Runs |
|------|---------------|--------------|
| `lib/supabase/client.ts` | Browser auth client | Client components |
| `lib/supabase/server.ts` | Server auth clients | Server components/actions |
| `lib/supabase/middleware.ts` | Edge runtime client | Middleware |
| `components/auth/LoginForm.tsx` | Login UI + logic | User visits /auth/login |
| `components/auth/SignupForm.tsx` | Signup UI + logic | User visits /auth/signup |
| `app/(storefront)/auth/login/page.tsx` | Login page wrapper | Route: /auth/login |
| `app/(storefront)/auth/signup/page.tsx` | Signup page wrapper | Route: /auth/signup |
| `app/(storefront)/auth/layout.tsx` | Auth pages layout | All /auth/* routes |
| `components/auth/AuthLayout.tsx` | Auth UI layout | Wraps auth forms |
| `app/layout.tsx` | Root layout | Every page |
| `middleware.ts` | Route protection | Every request |
| `lib/validators/auth/auth.ts` | Form validation | Form submission |
| `lib/constants/routes.ts` | Route constants | Throughout app |

---

## 🚀 Next Steps

To complete Fragment 2.3, you still need:

1. **Auth Callback Route** (`app/(storefront)/auth/callback/route.ts`)
   - Handles email verification
   - Exchanges code for session

2. **Password Reset Pages**
   - Request reset page
   - Confirm reset page

3. **Logout Functionality**
   - Logout button/action
   - Clear session

---

This architecture ensures:
- ✅ Secure authentication
- ✅ Session persistence
- ✅ Server/client state sync
- ✅ Route protection
- ✅ Reusable components
- ✅ Type safety
