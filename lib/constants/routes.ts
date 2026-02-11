export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",
  RESET_PASSWORD: "/auth/reset-password",
  RESET_PASSWORD_CONFIRM: "/auth/reset-password/confirm",
  CALLBACK: "/auth/callback",
  CART: "/cart",
  ADMIN: "/admin",
} as const;

// Type export for TypeScript
export type Route = (typeof ROUTES)[keyof typeof ROUTES];
