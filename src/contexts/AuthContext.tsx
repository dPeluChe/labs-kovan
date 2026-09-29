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
  isSuperAdmin?: boolean;
  navOrder?: string[];
}

interface AuthContextType {
  user: User | null;
  sessionToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TOKEN_KEY = "kovan_session_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginUser = useMutation(api.users.loginUser);
  const registerUser = useMutation(api.users.registerUser);
  const logoutUser = useMutation(api.users.logoutUser);
  const user = useQuery(
    api.users.getSessionUser,
    sessionToken ? { sessionToken } : "skip"
  );

  const isLoading = useMemo(() => {
    if (isSubmitting) return true;
    if (sessionToken === null) return false;
    return user === undefined;
  }, [sessionToken, user, isSubmitting]);

  const login = useCallback(async (email: string, password: string) => {
    setIsSubmitting(true);
    try {
      const result = await loginUser({ email, password });
      localStorage.setItem(SESSION_TOKEN_KEY, result.sessionToken);
      setSessionToken(result.sessionToken);
    } finally {
      setIsSubmitting(false);
    }
  }, [loginUser]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setIsSubmitting(true);
    try {
      const result = await registerUser({ name, email, password });
      localStorage.setItem(SESSION_TOKEN_KEY, result.sessionToken);
      setSessionToken(result.sessionToken);
    } finally {
      setIsSubmitting(false);
    }
  }, [registerUser]);

  const logout = useCallback(async () => {
    if (sessionToken) {
      try {
        await logoutUser({ sessionToken });
      } catch (error) {
        console.error("Error during logout:", error);
      }
    }
    localStorage.removeItem(SESSION_TOKEN_KEY);
    setSessionToken(null);
  }, [logoutUser, sessionToken]);

  const value = useMemo(() => ({
    user: user ?? null,
    sessionToken,
    isLoading,
    login,
    register,
    logout,
  }), [user, sessionToken, isLoading, login, register, logout]);

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
