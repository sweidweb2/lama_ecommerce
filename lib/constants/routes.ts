export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",
  RESET_PASSWORD: "/auth/reset-password",
  RESET_PASSWORD_CONFIRM: "/auth/reset-password/confirm",
  CALLBACK: "/auth/callback",
  PRODUCTS: "/products",
  SEARCH: "/search",
  CART: "/cart",
  ORDERS: "/orders",
  ORDERS_FIND: "/orders/find",
  UNSUBSCRIBE: "/unsubscribe",
  ADMIN: "/admin",
  ADMIN_HOME: "/admin/analytics",
  ADMIN_ACCOUNT: "/admin/account",
  ACCOUNT: "/account",
} as const;

/** Build a login URL that returns the user to `redirectPath` after auth. */
export function loginRedirect(redirectPath: string): string {
  return `${ROUTES.LOGIN}?redirect=${encodeURIComponent(redirectPath)}`;
}

// Type export for TypeScript
export type Route = (typeof ROUTES)[keyof typeof ROUTES];
