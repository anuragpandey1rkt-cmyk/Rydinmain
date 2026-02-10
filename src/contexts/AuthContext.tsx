import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { firebaseAuth } from "@/integrations/firebase/config";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
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
  firebaseUser: FirebaseUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPhoneVerified: boolean;
  
  // Google OAuth
  loginWithGoogle: () => Promise<void>;
  
  // Phone Auth
  sendPhoneOTP: (phoneNumber: string) => Promise<ConfirmationResult | null>;
  verifyPhoneOTP: (confirmationResult: ConfirmationResult | null, otp: string) => Promise<void>;
  
  // Profile
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  // Initialize reCAPTCHA verifier
  const initRecaptcha = () => {
    try {
      const verifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
        size: 'normal',
        callback: () => console.log('reCAPTCHA verified'),
        'expired-callback': () => console.log('reCAPTCHA expired'),
      });
      setRecaptchaVerifier(verifier);
      return verifier;
    } catch (error) {
      console.error('Error initializing reCAPTCHA:', error);
      return null;
    }
  };

  const fetchProfile = async (firebaseUserData: FirebaseUser) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", firebaseUserData.uid)
        .maybeSingle();

      if (data) {
        const profileData: Profile = {
          id: data.id,
          email: firebaseUserData.email || "",
          name: data.name || "",
          phone: data.phone,
          department: data.department,
          year: data.year,
          gender: data.gender,
          emergency_contact_name: data.emergency_contact_name,
          emergency_contact_phone: data.emergency_contact_phone,
          trust_score: data.trust_score ?? 4.0,
          profile_complete: data.profile_complete ?? false,
          phone_verified: data.phone_verified ?? false,
        };
        setUser(profileData);
        setIsPhoneVerified(profileData.phone_verified);
      } else {
        // New user - create profile entry
        const newProfile: Profile = {
          id: firebaseUserData.uid,
          email: firebaseUserData.email || "",
          name: firebaseUserData.displayName || "",
          trust_score: 4.0,
          profile_complete: false,
          phone_verified: false,
        };
        
        await supabase.from("profiles").insert({
          id: firebaseUserData.uid,
          email: firebaseUserData.email,
          name: firebaseUserData.displayName,
          trust_score: 4.0,
          profile_complete: false,
          phone_verified: false,
        });
        
        setUser(newProfile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUserData) => {
      if (firebaseUserData) {
        setFirebaseUser(firebaseUserData);
        await fetchProfile(firebaseUserData);
      } else {
        setFirebaseUser(null);
        setUser(null);
        setIsPhoneVerified(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Google OAuth Login
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(firebaseAuth, provider);
      await fetchProfile(result.user);
    } catch (error: any) {
      console.error("Google login error:", error);
      throw new Error(error.message || "Failed to login with Google");
    }
  };

  // Send Phone OTP
  const sendPhoneOTP = async (phoneNumber: string): Promise<ConfirmationResult | null> => {
    try {
      if (!firebaseUser) {
        throw new Error("User must be authenticated to verify phone");
      }

      // Ensure phone number is in E.164 format
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

      let verifier = recaptchaVerifier;
      if (!verifier) {
        verifier = initRecaptcha();
      }

      if (!verifier) {
        throw new Error("reCAPTCHA not initialized");
      }

      const confirmationResult = await signInWithPhoneNumber(
        firebaseAuth,
        formattedPhone,
        verifier
      );

      return confirmationResult;
    } catch (error: any) {
      console.error("Phone OTP error:", error);
      throw new Error(error.message || "Failed to send OTP");
    }
  };

  // Verify Phone OTP
  const verifyPhoneOTP = async (confirmationResult: ConfirmationResult | null, otp: string) => {
    try {
      if (!confirmationResult) {
        throw new Error("No confirmation result available");
      }

      if (!firebaseUser) {
        throw new Error("User not authenticated");
      }

      await confirmationResult.confirm(otp);

      // Update profile in Supabase to mark phone as verified
      await supabase
        .from("profiles")
        .update({
          phone_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", firebaseUser.uid);

      setIsPhoneVerified(true);
      await fetchProfile(firebaseUser);
    } catch (error: any) {
      console.error("OTP verification error:", error);
      throw new Error(error.message || "Failed to verify OTP");
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(firebaseAuth);
      setFirebaseUser(null);
      setUser(null);
      setIsPhoneVerified(false);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!firebaseUser) return;
    
    try {
      const updates: Record<string, unknown> = {
        ...data,
        profile_complete: true,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", firebaseUser.uid);

      if (error) throw error;

      setUser((prev) => prev ? { ...prev, ...updates } as Profile : null);
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (firebaseUser) await fetchProfile(firebaseUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        session: null,
        isAuthenticated: !!firebaseUser,
        isLoading,
        isPhoneVerified,
        loginWithGoogle,
        sendPhoneOTP,
        verifyPhoneOTP,
        logout,
        updateProfile,
        refreshProfile,
      }}
    >
      <div id="recaptcha-container" />
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
