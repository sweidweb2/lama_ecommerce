"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { IdleSessionWatcher } from "@/components/auth/IdleSessionWatcher";
import { supabase } from "@/lib/supabase/client";
import { isInvalidRefreshTokenError } from "@/lib/auth/refresh-token";
import { mergeGuestCartOnLoginAction } from "@/actions/cart";
import type { GuestHandoffResult } from "@/actions/cart";
import type { Profile, ProfileRole } from "@/types/user";

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  role: ProfileRole | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const GENERIC_HANDOFF_TOAST = {
  title: "Couldn't transfer your cart, orders, or wishlist",
  description:
    "Refresh the page or sign in again to retry. Your guest session is still saved.",
} as const;

const HANDOFF_AUTH_RETRY_DELAYS_MS = [0, 150, 400] as const;

function guestHandoffFailureToast(result: GuestHandoffResult): {
  title: string;
  description: string;
} {
  switch (result.failedStep) {
    case "orders":
      return {
        title: "Couldn't link your guest orders",
        description:
          "Refresh the page or sign in again to retry. Your guest session is still saved.",
      };
    case "cart":
      return {
        title: "Your guest orders were linked, but we couldn't move your cart",
        description:
          "Refresh the page to retry the cart. Your guest session is still saved.",
      };
    case "wishlist":
      return {
        title: "Orders and cart transferred, but wishlist didn't",
        description:
          "Refresh the page to retry the wishlist. Your guest session is still saved.",
      };
    case "auth":
      return {
        title: "Couldn't transfer your guest session",
        description: "Please sign in again to retry.",
      };
    default:
      return GENERIC_HANDOFF_TOAST;
  }
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

interface AuthProviderProps {
  children: React.ReactNode;
  initialProfile?: Profile | null;
}

async function clearStaleLocalSession() {
  await supabase.auth.signOut({ scope: "local" });
}

export function AuthProvider({ children, initialProfile }: AuthProviderProps) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile ?? null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Initial user check
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        // Invalid/expired refresh token - clear stale session
        if (isInvalidRefreshTokenError(error)) {
          await clearStaleLocalSession();
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        setUser(session?.user ?? null);
        if (!initialProfile && session?.user) {
          fetchProfile();
        } else {
          setLoading(false);
        }
      } catch (err) {
        if (isInvalidRefreshTokenError(err as { message?: string })) {
          await clearStaleLocalSession();
        }
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    const runGuestHandoff = async (event: "SIGNED_IN" | "INITIAL_SESSION") => {
      // onAuthStateChange can fire before @supabase/ssr finishes writing cookies,
      // so the server action briefly sees no session. Retry with short backoff.
      let result: GuestHandoffResult | null = null;

      for (let attempt = 0; attempt < HANDOFF_AUTH_RETRY_DELAYS_MS.length; attempt++) {
        const waitMs = HANDOFF_AUTH_RETRY_DELAYS_MS[attempt];
        if (waitMs > 0) await delay(waitMs);

        try {
          result = await mergeGuestCartOnLoginAction();
        } catch (err) {
          console.error("Guest session handoff failed:", err);
          toast.error(GENERIC_HANDOFF_TOAST.title, {
            description: GENERIC_HANDOFF_TOAST.description,
          });
          return;
        }

        if (result.success) return;
        if (result.failedStep !== "auth") break;
      }

      if (!result || result.success) return;

      // INITIAL_SESSION often races cookies on hard refresh; don't alarm the user.
      // SIGNED_IN after retries still warrants a toast (guest cart may be stuck).
      if (result.failedStep === "auth" && event === "INITIAL_SESSION") {
        return;
      }

      const { title, description } = guestHandoffFailureToast(result);
      toast.error(title, { description });
      console.error("Guest session handoff failed:", result.error);
    };

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        fetchProfile();

        // Claim orders + merge cart + claim wishlist; cookie cleared only on full success
        if (event === "SIGNED_IN") {
          void runGuestHandoff("SIGNED_IN");
        }
      } else if (event === "INITIAL_SESSION") {
        // Email-confirm / hard refresh: often INITIAL_SESSION instead of SIGNED_IN.
        // No-ops when there is no guest cookie.
        if (session?.user) {
          void runGuestHandoff("INITIAL_SESSION");
        }
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
        setLoading(false);
      }
    });

    async function fetchProfile() {
      try {
        setLoading(true);
        const res = await fetch("/api/auth/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth: Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    }

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [initialProfile]);

  // Derive role from profile
  const role = profile?.role ?? null;

  const value: AuthContextValue = {
    user,
    profile,
    role,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      <IdleSessionWatcher enabled={Boolean(user)} />
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
