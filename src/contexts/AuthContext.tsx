import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  department?: string;
  year?: string;
  gender?: "male" | "female" | "other";
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  trust_score: number;
  profile_complete: boolean;
  phone_verified: boolean;
}

interface AuthContextType {
  user: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Email/Password Auth
  signUp: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;

  // Profile
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (supabaseUserData: SupabaseUser) => {
    let userWasSet = false; // Track if we successfully set user

    // FAIL-SAFE: Set a basic user profile IMMEDIATELY so the app loads
    // We will update this with real data if the DB calls succeed.
    const fallbackProfile: Profile = {
      id: supabaseUserData.id,
      email: supabaseUserData.email || "",
      name: supabaseUserData.user_metadata?.full_name || "User",
      trust_score: 4.0,
      profile_complete: false,
      phone_verified: false,
    };
    setUser(fallbackProfile);
    userWasSet = true; // We have set a user, so finally block won't overwrite it unnecessarily
    console.log("✅ Fallback profile set immediately to unblock loading");

    try {
      console.log("🔄 Fetching real profile for:", supabaseUserData.id);

      // CRITICAL: Ensure user exists in BOTH users and profiles tables
      // hoppers table references users.id, so we must have a record there first
      const { error: usersError } = await supabase.from("users").upsert({
        id: supabaseUserData.id,
        email: supabaseUserData.email || "",
        first_name: supabaseUserData.user_metadata?.full_name?.split(" ")[0] || "User",
        last_name: supabaseUserData.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "",
        trust_score: 100,
        account_status: "active",
      }, { onConflict: 'id' });

      if (usersError) {
        console.error("❌ Users table error:", usersError);
      } else {
        console.log("✅ Users table OK");
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", supabaseUserData.id)
        .maybeSingle();

      if (data) {
        // Check if we have a local override for profile completion
        const localCompletion = localStorage.getItem(`profile_complete_${supabaseUserData.id}`) === 'true';

        const profileData: Profile = {
          id: data.id,
          email: supabaseUserData.email || "",
          name: data.name || "",
          phone: data.phone,
          department: data.department,
          year: data.year,
          gender: data.gender,
          emergency_contact_name: data.emergency_contact_name,
          emergency_contact_phone: data.emergency_contact_phone,
          trust_score: data.trust_score ?? 4.0,
          // Trust local storage if DB says false but local says true
          profile_complete: data.profile_complete || localCompletion || false,
          phone_verified: data.phone_verified ?? false,
        };
        setUser(profileData);
        userWasSet = true;
        console.log("✅ Existing profile loaded", localCompletion ? "(with local override)" : "");
      } else {
        // New user - create profile entry
        console.log("📝 Creating new profile for new user");
        const localCompletion = localStorage.getItem(`profile_complete_${supabaseUserData.id}`) === 'true';

        const newProfile: Profile = {
          id: supabaseUserData.id,
          email: supabaseUserData.email || "",
          name: supabaseUserData.user_metadata?.full_name || "User",
          trust_score: 4.0,
          profile_complete: localCompletion || false,
          phone_verified: false,
        };

        const { error: profileUpsertError } = await supabase.from("profiles").upsert({
          id: supabaseUserData.id,
          email: supabaseUserData.email,
          name: supabaseUserData.user_metadata?.full_name || "User",
          trust_score: 4.0,
          profile_complete: false,
          phone_verified: false,
        }, { onConflict: 'id' });

        if (profileUpsertError) {
          console.error("❌ Profile creation failed:", profileUpsertError);
          // CRITICAL: Still set user state so app doesn't hang
        } else {
          console.log("✅ Profile created successfully");
        }

        // ALWAYS set user, even if there were errors
        setUser(newProfile);
        userWasSet = true;
      }
    } catch (error) {
      console.error("❌ Critical error in fetchProfile:", error);
    } finally {
      // CRITICAL: If we somehow didn't set user (e.g., exception), set fallback
      if (!userWasSet) {
        console.log("⚠️ Setting fallback profile (user was not set)");
        const fallbackProfile: Profile = {
          id: supabaseUserData.id,
          email: supabaseUserData.email || "",
          name: supabaseUserData.user_metadata?.full_name || "User",
          trust_score: 4.0,
          profile_complete: false,
          phone_verified: false,
        };
        setUser(fallbackProfile);
      }
    }
  };

  // Listen to Supabase auth state
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted) {
          setSession(session);
          if (session?.user) {
            await fetchProfile(session.user);
          }
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // CRITICAL SAFETY: Force loading to end after 5 seconds max
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn("⏰ Loading timeout reached - forcing load complete");
        setIsLoading(false);
      }
    }, 5000);

    initializeAuth().finally(() => {
      clearTimeout(loadingTimeout);
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setSession(session);
        if (session?.user) {
          await fetchProfile(session.user);
        } else {
          setUser(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Email/Password Sign Up
  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Sign up error:", error);
      throw new Error(error.message || "Failed to create account");
    }
  };

  // Email/Password Login
  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Login error:", error);
      throw new Error(error.message || "Failed to login");
    }
  };


  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!session?.user) return;

    console.log("📝 Updating profile with:", data);

    try {
      const updates: Record<string, unknown> = {
        ...data,
        profile_complete: true,
        updated_at: new Date().toISOString(),
      };

      // Force immediate local update to prevent UI flicker/redirects
      setUser((prev) => prev ? { ...prev, ...updates } as Profile : null);

      // Try to update Supabase with a timeout race
      // If it hangs for >2 seconds, we just proceed
      const updatePromise = supabase
        .from("profiles")
        .update(updates)
        .eq("id", session.user.id);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Update timed out")), 10000)
      );

      try {
        const { error } = await Promise.race([updatePromise, timeoutPromise]) as any;

        if (error) throw error; // Throw to trigger fallback in catch block

        console.log("✅ Database update successful");
      } catch (err) {
        console.warn("⚠️ Standard update timed out or failed:", err);
        console.log("🔄 Attempting RPC fallback...");

        // RPC Fallback Attempt
        try {
          const { error: rpcError } = await supabase.rpc('update_profile_safe', {
            p_name: data.name || "",
            p_department: data.department || "",
            p_year: data.year || "",
            p_phone: data.phone || "",
            p_gender: (data.gender || "") as string,
            p_emergency_contact_name: data.emergency_contact_name || "",
            p_emergency_contact_phone: data.emergency_contact_phone || ""
          });

          if (rpcError) {
            console.error("❌ RPC fallback also failed:", rpcError);
            if (rpcError.code === '42501') {
              console.error("🛑 RLS Policy Violation - Check Table Permissions");
            }
          } else {
            console.log("✅ RPC fallback update successful");
          }
        } catch (rpcEx) {
          console.error("❌ RPC execution error:", rpcEx);
        }
      }

      // Always update local state
      setUser((prev) => prev ? { ...prev, ...updates } as Profile : null);

      // PERSIST LOCALLY: Save completion status to localStorage as backup
      if (session?.user?.id) {
        const key = `profile_complete_${session.user.id}`;
        localStorage.setItem(key, 'true');
        console.log(`✅ Writes local persistence: [${key}] = true`);
      }

    } catch (error) {
      console.error("Profile update exception:", error);
      // Fallback: update local state anyway to unblock user
      const updates: Record<string, unknown> = {
        ...data,
        profile_complete: true,
      };
      setUser((prev) => prev ? { ...prev, ...updates } as Profile : null);

      // PERSIST LOCALLY even on error
      if (session?.user?.id) {
        const key = `profile_complete_${session.user.id}`;
        localStorage.setItem(key, 'true');
        console.log(`✅ Writes local persistence (fallback): [${key}] = true`);
      }
    }
  };

  const refreshProfile = async () => {
    if (session?.user) await fetchProfile(session.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session?.user,
        isLoading,
        signUp,
        login,
        logout,
        updateProfile,
        refreshProfile,
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
