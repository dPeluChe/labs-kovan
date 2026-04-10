import type { ReactNode } from "react";
import { ConvexProvider } from "convex/react";
import { BrowserRouter } from "react-router-dom";
import { convex } from "../lib/convex";
import { ThemeProvider } from "../contexts/ThemeContext";
import { AuthProvider } from "../contexts/AuthContext";
import { FamilyProvider } from "../contexts/FamilyContext";
import { ToastProvider } from "../components/ui/Toast";

/**
 * Composes all top-level providers in a single component to keep App.tsx clean.
 * Order matters: outer providers must not depend on inner ones.
 *
 * Hierarchy:
 *   ConvexProvider (data layer)
 *     └── ThemeProvider (UI theme, no data deps)
 *           └── AuthProvider (needs Convex)
 *                 └── FamilyProvider (needs Auth user)
 *                       └── ToastProvider (UI only)
 *                             └── BrowserRouter (routing)
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <ThemeProvider>
        <AuthProvider>
          <FamilyProvider>
            <ToastProvider>
              <BrowserRouter>{children}</BrowserRouter>
            </ToastProvider>
          </FamilyProvider>
        </AuthProvider>
      </ThemeProvider>
    </ConvexProvider>
  );
}
