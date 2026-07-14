"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { IdleSessionWatcher } from "@/components/auth/IdleSessionWatcher";
import { supabase } from "@/lib/supabase/client";
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

export function AuthProvider({ children, initialProfile }: AuthProviderProps) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile ?? null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Initial user check
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        // Invalid/expired refresh token - clear stale session
        if (error?.message?.includes("Refresh Token") || error?.message?.includes("refresh_token")) {
          await supabase.auth.signOut({ scope: "local" });
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
      } catch {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        fetchProfile();

        // On sign-in, try to merge any guest cart (idempotent – cookie cleared after first merge)
        if (event === "SIGNED_IN") {
          mergeGuestCartOnLoginAction().catch((err) =>
            console.error("Guest cart merge failed:", err),
          );
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

