"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { IdleSessionWatcher } from "@/components/auth/IdleSessionWatcher";
import { supabase } from "@/lib/supabase/client";
import { isInvalidRefreshTokenError } from "@/lib/auth/refresh-token";
import { mergeGuestCartOnLoginAction } from "@/actions/cart";
import type { Profile, ProfileRole } from "@/types/user";

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  role: ProfileRole | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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

    const runGuestHandoff = () => {
      mergeGuestCartOnLoginAction()
        .then((result) => {
          if (!result.success) {
            toast.error("Couldn't transfer your cart, orders, or wishlist", {
              description:
                "Refresh the page or sign in again to retry. Your guest session is still saved.",
            });
            console.error("Guest session handoff failed:", result.error);
          }
        })
        .catch((err) => {
          toast.error("Couldn't transfer your cart, orders, or wishlist", {
            description:
              "Refresh the page or sign in again to retry. Your guest session is still saved.",
          });
          console.error("Guest session handoff failed:", err);
        });
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
          runGuestHandoff();
        }
      } else if (event === "INITIAL_SESSION") {
        // Email-confirm / hard refresh: often INITIAL_SESSION instead of SIGNED_IN.
        // No-ops when there is no guest cookie.
        if (session?.user) {
          runGuestHandoff();
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
