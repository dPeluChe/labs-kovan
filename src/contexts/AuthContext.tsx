import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface User {
  _id: Id<"users">;
  name: string;
  email: string;
  photoUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_KEY = "kovan_demo_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [demoEmail, setDemoEmail] = useState<string | null>(() => {
    return localStorage.getItem(DEMO_USER_KEY);
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const createDemoUser = useMutation(api.users.createDemoUser);
  const user = useQuery(
    api.users.getDemoUser,
    demoEmail ? { email: demoEmail } : "skip"
  );

  // Derive isLoading from state instead of using effect
  const isLoading = useMemo(() => {
    if (isLoggingIn) return true;
    if (demoEmail === null) return false;
    return user === undefined;
  }, [demoEmail, user, isLoggingIn]);

  const login = useCallback(async (email: string, name: string) => {
    setIsLoggingIn(true);
    try {
      await createDemoUser({ email, name });
      localStorage.setItem(DEMO_USER_KEY, email);
      setDemoEmail(email);
    } finally {
      setIsLoggingIn(false);
    }
  }, [createDemoUser]);

  const logout = useCallback(() => {
    localStorage.removeItem(DEMO_USER_KEY);
    setDemoEmail(null);
  }, []);

  const value = useMemo(() => ({
    user: user ?? null,
    isLoading,
    login,
    logout,
  }), [user, isLoading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
