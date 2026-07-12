# Auth UI Redesign Strategy

This plan outlines which files should be "locked" (preserved for logic) and which can be safely modified for UI changes in the authentication flow.

## Proposed Categorization

### 🔒 Locked Files (Logic & Functionality)
These files contain core authentication logic, validation schemas, and configurations. Modify these only if you need to change *how* authentication works, rather than how it *looks*.

| File Path | Description |
| :--- | :--- |
| [auth.service.ts](file:///d:/lama_ecomerce/lama_ecommerce/services/auth.service.ts) | Core Supabase client-side logic (login/signup functions). |
| [auth.ts](file:///d:/lama_ecomerce/lama_ecommerce/actions/auth.ts) | Server actions (e.g., logout). |
| [auth.ts](file:///d:/lama_ecomerce/lama_ecommerce/lib/validators/auth/auth.ts) | Zod schemas (email/password rules). |
| [middleware.ts](file:///d:/lama_ecomerce/lama_ecommerce/middleware.ts) | Route protection and session handling. |
| [client.ts](file:///d:/lama_ecomerce/lama_ecommerce/lib/supabase/client.ts) | Supabase configuration. |
| [routes.ts](file:///d:/lama_ecomerce/lama_ecommerce/lib/constants/routes.ts) | Centralized route definitions. |

> [!IMPORTANT]
> Within [LoginForm.tsx](file:///d:/lama_ecomerce/lama_ecommerce/components/auth/LoginForm.tsx) and [SignupForm.tsx](file:///d:/lama_ecomerce/lama_ecommerce/components/auth/SignupForm.tsx), avoid modifying the [onSubmit](file:///d:/lama_ecomerce/lama_ecommerce/components/auth/LoginForm.tsx#39-73) handler and the `useForm` initialization (the top half of the file) unless you are changing input names.

---

### 🎨 Mutable Files (UI & Layout)
These files define the visual structure and styling. You can freely redesign these to achieve the desired look.

| File Path | Description |
| :--- | :--- |
| [layout.tsx](file:///d:/lama_ecomerce/lama_ecommerce/app/(public)/auth/layout.tsx) | The wrapper for all auth pages (backgrounds, centering, etc.). |
| [page.tsx](file:///d:/lama_ecomerce/lama_ecommerce/app/(public)/auth/login/page.tsx) | Entry point for the login route. |
| [LoginForm.tsx](file:///d:/lama_ecomerce/lama_ecommerce/components/auth/LoginForm.tsx) | The visual layout of the login form (JSX/CSS). |
| [SignupForm.tsx](file:///d:/lama_ecomerce/lama_ecommerce/components/auth/SignupForm.tsx) | The visual layout of the signup form (JSX/CSS). |

## Verification Plan
Since you are only changing UI:
1. **Visual Regression**: Ensure the forms look correct in different screen sizes.
2. **Functional Smoke Test**:
   - Try to log in with valid/invalid credentials.
   - Try to sign up with a new user.
   - Verify that validation errors (e.g., "Invalid email") still appear in the UI.
