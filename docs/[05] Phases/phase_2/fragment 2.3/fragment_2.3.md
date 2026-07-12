## Fragment 2.3 — Frontend Auth Flows (UI + Forms)

**Goal:** Users can **register, log in, reset password, and log out** safely.

---

### 2.3.1 Auth Route Structure

Create the following route structure:

```text
app/(public)/auth/
  login/
  register/
  reset-password/
```

Each route should have:
- `page.tsx`
- Simple layout (no main navbar, minimal distractions)

---

### 2.3.2 Registration Flow

**Parts:**
- Registration form: `email`, `password`, `name`
- Zod schema for validation
- `supabase.auth.signUp()` call
- Handle:
  - Email verification state
  - Error messages
  - Success messaging

**✅ Output**

- User can register
- Profile auto‑created via backend trigger

---

### 2.3.3 Login Flow

**Parts:**
- Login form (`email`, `password`)
- Zod validation
- `supabase.auth.signInWithPassword()`
- Redirect after login (e.g. to `/` or `/account`)

**✅ Output**

- User session created
- Session persisted across refreshes

---

### 2.3.4 Password Reset

**Parts:**
- Request reset email form (enter email)
- Reset confirmation page (link from email)
- New password form

**✅ Output**

- Full password recovery loop working end‑to‑end

---

### 2.3.5 Logout

**Parts:**
- Call `supabase.auth.signOut()`
- Clear any client‑side auth state (contexts, stores)
- Redirect to a safe public page (e.g. home)

**✅ Output**

- User is fully logged out (client + server)