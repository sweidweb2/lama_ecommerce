## Fragment 2.3 Plan — Frontend Auth Flows (UI + Forms)

This plan gives **step‑by‑step instructions** to complete Fragment 2.3.  
Follow the sections in order.

---

## 1. Auth Route Structure

Create the following folder structure under `app/(storefront)/auth/`. Each should have a `page.tsx`.

### 1.1 Create Folders and Files

1. `app/(storefront)/auth/login/page.tsx`
2. `app/(storefront)/auth/register/page.tsx`
3. `app/(storefront)/auth/reset-password/page.tsx`

### 1.2 Auth Layout (Optional but Recommended)

1. Create `app/(storefront)/auth/layout.tsx`.
2. Use a minimal design:
   - Full height (`min-h-screen`).
   - Centered container for forms.
   - **No** main navbar (reduce distractions).
   - A link back to the home page or a simple logo.

---

## 2. Registration Flow

### 2.1 Registration Form & Schema

1. **Zod Schema:** Define in a separate file (e.g., `lib/validations/auth.ts`) or within the component.
   - `name`: string, min 2 chars.
   - `email`: string, email format.
   - `password`: string, min 8 chars.
2. **UI Component:** Build the form using Shadcn UI (Form, Input, Button).
3. **State Management:** Use `react-hook-form` with the Zod resolver.

### 2.2 Integration with Supabase

1. Implement the submission handler:
   ```ts
   const { data, error } = await supabase.auth.signUp({
     email,
     password,
     options: {
       data: {
         full_name: name,
       },
     },
   });
   ```
2. **Handle States:**
   - **Loading:** Disable button during request.
   - **Error:** Show toast or inline error message.
   - **Success:** Show a "Check your email" message or redirect.

**Done when:**
- [ ] A user can sign up via the form.
- [ ] Profile is created in the DB (via the trigger from Fragment 2.1).

---

## 3. Login Flow

### 3.1 Login Form & Schema

1. **Zod Schema:**
   - `email`: string, email format.
   - `password`: string.
2. **UI Component:** Email and Password fields + "Forgot Password?" link.

### 3.2 Integration with Supabase

1. Implement the submission handler:
   ```ts
   const { error } = await supabase.auth.signInWithPassword({
     email,
     password,
   });
   ```
2. **Post-Login:**
   - Redirect to `/` (Home) or `/account`.
   - Ensure the session is persisted (handled by Supabase client automatically).

**Done when:**
- [ ] Existing users can log in.
- [ ] Redirect happens correctly on success.

---

## 4. Password Reset Flow

### 4.1 Request Reset Email

1. **Route:** Part of `auth/reset-password` (perhaps a toggle or a separate step in the same page).
2. **Action:** `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'http://localhost:3000/auth/reset-password/confirm' })`.

### 4.2 New Password Form

1. **Route:** Create `app/(storefront)/auth/reset-password/confirm/page.tsx` (or similar).
2. **Action:** After user clicks link in email:
   - Show a "New Password" and "Confirm New Password" form.
   - Update password using `supabase.auth.updateUser({ password: new_password })`.

**Done when:**
- [ ] User receives reset email.
- [ ] User can successfully change their password via the link.

---

## 5. Logout Flow

### 5.1 Logout Implementation

1. **Component:** Add a "Logout" button in the Profile menu or Sidebar.
2. **Action:**
   ```ts
   await supabase.auth.signOut();
   router.push('/');
   router.refresh(); // Clear server-side state
   ```

**Done when:**
- [ ] Session is cleared.
- [ ] User is redirected to a public page.

---

## 6. Final Verification for Fragment 2.3

- [ ] Routes `auth/login`, `auth/register`, and `auth/reset-password` exist and load.
- [ ] Registration sends confirmation email and saves name to profile.
- [ ] Login redirects to the correct page.
- [ ] Password reset loop works end-to-end.
- [ ] Logout fully clears the session and redirects.
- [ ] Form validation (Zod) provides clear feedback for invalid inputs.
