import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  email: string;
  name: string;
  department?: string;
  year?: string;
  phone?: string;
  gender?: "male" | "female" | "other";
  trust_score: number;
  profile_complete: boolean;
}

interface AuthContextType {
  user: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (supabaseUser: SupabaseUser) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", supabaseUser.id)
      .maybeSingle();

    if (data) {
      setUser({
        id: data.id,
        email: data.email || supabaseUser.email || "",
        name: data.name || "",
        department: data.department,
        year: data.year,
        phone: data.phone,
        gender: data.gender,
        trust_score: data.trust_score ?? 4.0,
        profile_complete: data.profile_complete ?? false,
      });
    } else {
      // Profile not yet created (trigger should handle this, but fallback)
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || "",
        name: "",
        trust_score: 4.0,
        profile_complete: false,
      });
    }
  };

  useEffect(() => {
    // Listen for auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          // Use setTimeout to avoid potential deadlocks with Supabase
          setTimeout(() => fetchProfile(session.user), 0);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const validateEmail = (email: string) => {
    if (!email.endsWith("@srmist.edu.in")) {
      throw new Error("Only @srmist.edu.in emails are allowed");
    }
  };

  const login = async (email: string, password: string) => {
    validateEmail(email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signup = async (email: string, password: string) => {
    validateEmail(email);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!session?.user) return;
    const updates = {
      ...data,
      profile_complete: true,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", session.user.id);
    if (error) throw error;

    setUser((prev) => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
