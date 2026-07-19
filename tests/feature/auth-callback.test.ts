import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ROUTES } from "@/lib/constants/routes";
import { ROLES } from "@/lib/constants/roles";

const {
  exchangeCodeForSession,
  getUser,
  getProfileByUserIdAdmin,
  mergeGuestCartOnLoginAction,
  capturedSetAllRef,
} = vi.hoisted(() => {
  const exchangeCodeForSession = vi.fn();
  const getUser = vi.fn();
  const getProfileByUserIdAdmin = vi.fn();
  const mergeGuestCartOnLoginAction = vi.fn();
  const capturedSetAllRef: {
    current: ((cookies: { name: string; value: string; options?: object }[]) => void) | null;
  } = { current: null };

  return {
    exchangeCodeForSession,
    getUser,
    getProfileByUserIdAdmin,
    mergeGuestCartOnLoginAction,
    capturedSetAllRef,
  };
});

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: {
      cookies: {
        setAll: (cookies: { name: string; value: string; options?: object }[]) => void;
      };
    },
  ) => {
    capturedSetAllRef.current = options.cookies.setAll;
    return {
      auth: {
        exchangeCodeForSession: (...args: unknown[]) =>
          exchangeCodeForSession(...args),
        getUser: (...args: unknown[]) => getUser(...args),
      },
    };
  },
}));

vi.mock("@/repositories/profile.repository", () => ({
  getProfileByUserIdAdmin: (...args: unknown[]) =>
    getProfileByUserIdAdmin(...args),
}));

vi.mock("@/actions/cart", () => ({
  mergeGuestCartOnLoginAction: (...args: unknown[]) =>
    mergeGuestCartOnLoginAction(...args),
}));

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedSetAllRef.current = null;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    exchangeCodeForSession.mockImplementation(async () => {
      capturedSetAllRef.current?.([
        {
          name: "sb-access-token",
          value: "access-token",
          options: { path: "/", httpOnly: true },
        },
        {
          name: "sb-refresh-token",
          value: "refresh-token",
          options: { path: "/", httpOnly: true },
        },
      ]);
      return { error: null };
    });
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    getProfileByUserIdAdmin.mockResolvedValue({
      user_id: "user-1",
      role: ROLES.USER,
    });
    mergeGuestCartOnLoginAction.mockResolvedValue({ success: true });
  });

  it("redirects admins to /admin and preserves session cookies", async () => {
    getProfileByUserIdAdmin.mockResolvedValue({
      user_id: "user-1",
      role: ROLES.ADMIN,
    });

    const { GET } = await import("@/app/(public)/auth/callback/route");
    const request = new NextRequest("http://localhost/auth/callback?code=abc");
    const response = await GET(request);

    expect(getProfileByUserIdAdmin).toHaveBeenCalledWith("user-1");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `http://localhost${ROUTES.ADMIN}`,
    );
    expect(response.cookies.get("sb-access-token")?.value).toBe("access-token");
    expect(response.cookies.get("sb-refresh-token")?.value).toBe(
      "refresh-token",
    );
  });

  it("redirects non-admins to next and preserves session cookies", async () => {
    const { GET } = await import("@/app/(public)/auth/callback/route");
    const request = new NextRequest(
      "http://localhost/auth/callback?code=abc&next=/cart",
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/cart");
    expect(response.cookies.get("sb-access-token")?.value).toBe("access-token");
  });

  it("honors explicit next for admins (no admin override)", async () => {
    getProfileByUserIdAdmin.mockResolvedValue({
      user_id: "user-1",
      role: ROLES.ADMIN,
    });

    const { GET } = await import("@/app/(public)/auth/callback/route");
    const request = new NextRequest(
      "http://localhost/auth/callback?code=abc&next=/auth/reset-password/confirm",
    );
    const response = await GET(request);

    expect(getProfileByUserIdAdmin).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "http://localhost/auth/reset-password/confirm",
    );
    expect(response.cookies.get("sb-access-token")?.value).toBe("access-token");
  });

  it("redirects to login with auth_callback_error when exchange fails", async () => {
    exchangeCodeForSession.mockResolvedValue({
      error: { message: "invalid" },
    });

    const { GET } = await import("@/app/(public)/auth/callback/route");
    const request = new NextRequest(
      "http://localhost/auth/callback?code=bad",
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location") ?? "";
    expect(location).toContain(ROUTES.LOGIN);
    expect(location).toContain("error=auth_callback_error");
  });
});
