import React, { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  department?: string;
  year?: string;
  phone?: string;
  gender?: "male" | "female" | "other";
  trustScore: number;
  profileComplete: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    if (!email.endsWith("@srmist.edu.in")) {
      throw new Error("Only @srmist.edu.in emails are allowed");
    }
  };

  const login = async (email: string, _password: string) => {
    setIsLoading(true);
    validateEmail(email);
    // Mock login — will be replaced with Supabase
    await new Promise((r) => setTimeout(r, 800));
    setUser({
      id: "mock-user-1",
      email,
      name: email.split("@")[0],
      trustScore: 4.5,
      profileComplete: false,
    });
    setIsLoading(false);
  };

  const signup = async (email: string, _password: string) => {
    setIsLoading(true);
    validateEmail(email);
    await new Promise((r) => setTimeout(r, 800));
    setUser({
      id: "mock-user-" + Date.now(),
      email,
      name: "",
      trustScore: 4.0,
      profileComplete: false,
    });
    setIsLoading(false);
  };

  const logout = () => setUser(null);

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data, profileComplete: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, updateProfile }}
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
