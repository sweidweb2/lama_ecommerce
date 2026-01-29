"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
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
  const [user] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(!initialProfile);

  // On the client, optionally refresh the profile once after mount.
  // This is useful after login to ensure we have the latest profile/role.
  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      try {
        setLoading(true);

        const res = await fetch("/api/auth/profile", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          // If unauthorized or error, just clear profile
          if (!isMounted) return;
          setProfile(null);
          return;
        }

        const data: { profile: Profile | null } = await res.json();
        if (!isMounted) return;

        setProfile(data.profile ?? null);
      } catch (error) {
        console.error("Failed to fetch profile on client:", error);
        if (isMounted) {
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    // If we don't have an initial profile from the server, try to fetch it.
    if (!initialProfile) {
      fetchProfile();
    }

    return () => {
      isMounted = false;
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

