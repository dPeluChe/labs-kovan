import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "./AuthContext";

interface Family {
  _id: Id<"families">;
  name: string;
  emoji?: string;
  role: "owner" | "admin" | "member";
}

interface FamilyContextType {
  families: Family[];
  currentFamily: Family | null;
  setCurrentFamily: (family: Family | null) => void;
  isLoading: boolean;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

const CURRENT_FAMILY_KEY = "kovan_current_family";

export function FamilyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(() => {
    return localStorage.getItem(CURRENT_FAMILY_KEY);
  });

  const familiesData = useQuery(
    api.families.getUserFamilies,
    user ? { userId: user._id } : "skip"
  );

  const families = useMemo(() => (familiesData ?? []) as Family[], [familiesData]);
  const isLoading = familiesData === undefined && user !== null;

  // Derive current family - prefer selected, fall back to first
  const currentFamily = useMemo(() => {
    const selected = families.find((f) => f._id === selectedFamilyId);
    if (selected) return selected;
    const first = families[0] ?? null;
    // Sync to localStorage if we're using default
    if (first && first._id !== selectedFamilyId) {
      localStorage.setItem(CURRENT_FAMILY_KEY, first._id);
    }
    return first;
  }, [families, selectedFamilyId]);

  const setCurrentFamily = useCallback((family: Family | null) => {
    if (family) {
      setSelectedFamilyId(family._id);
      localStorage.setItem(CURRENT_FAMILY_KEY, family._id);
    } else {
      setSelectedFamilyId(null);
      localStorage.removeItem(CURRENT_FAMILY_KEY);
    }
  }, []);

  const value = useMemo(() => ({
    families,
    currentFamily,
    setCurrentFamily,
    isLoading,
  }), [families, currentFamily, setCurrentFamily, isLoading]);

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error("useFamily must be used within a FamilyProvider");
  }
  return context;
}
