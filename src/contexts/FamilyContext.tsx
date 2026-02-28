import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
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
  inviteError: string | null;
  clearInviteError: () => void;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

const CURRENT_FAMILY_KEY = "kovan_current_family";
const PENDING_INVITE_KEY = "kovan_pending_invite_token";

export function FamilyProvider({ children }: { children: ReactNode }) {
  const { user, sessionToken } = useAuth();
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(() => {
    return localStorage.getItem(CURRENT_FAMILY_KEY);
  });
  const [processingInvite, setProcessingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const joinFamilyByToken = useMutation(api.families.joinFamilyByToken);

  const familiesData = useQuery(
    api.families.getUserFamilies,
    sessionToken ? { sessionToken } : "skip"
  );

  const families = useMemo(() => (familiesData ?? []) as Family[], [familiesData]);
  const isLoading = familiesData === undefined && sessionToken !== null;

  const clearInviteError = useCallback(() => setInviteError(null), []);

  useEffect(() => {
    const processPendingInvite = async () => {
      if (!user || processingInvite) return;

      const pendingInvite = localStorage.getItem(PENDING_INVITE_KEY);
      if (!pendingInvite) return;

      setProcessingInvite(true);
      setInviteError(null);
      try {
        if (!sessionToken) throw new Error("Sesión inválida");
        const result = await joinFamilyByToken({
          sessionToken,
          inviteToken: pendingInvite,
          email: user.email,
        });

        if (result.familyId) {
          localStorage.setItem(CURRENT_FAMILY_KEY, result.familyId);
          setSelectedFamilyId(result.familyId);
        }
      } catch (error) {
        console.error("Error joining family:", error);
        const message = error instanceof Error ? error.message : "Error al unirse a la familia";
        setInviteError(message);
      } finally {
        localStorage.removeItem(PENDING_INVITE_KEY);
        setProcessingInvite(false);
      }
    };

    processPendingInvite();
  }, [user, sessionToken, joinFamilyByToken, processingInvite]);

  const currentFamily = useMemo(() => {
    const selected = families.find((f) => f._id === selectedFamilyId);
    if (selected) return selected;
    const first = families[0] ?? null;
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
    inviteError,
    clearInviteError,
  }), [families, currentFamily, setCurrentFamily, isLoading, inviteError, clearInviteError]);

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error("useFamily must be used within a FamilyProvider");
  }
  return context;
}
