import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConvexProvider } from "convex/react";
import { convex } from "./lib/convex";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { FamilyProvider, useFamily } from "./contexts/FamilyContext";
import { AppLayout } from "./components/layout/AppLayout";
import { PageLoader } from "./components/ui/LoadingSpinner";
import { ToastProvider } from "./components/ui/Toast";

// Pages
import { LoginPage } from "./pages/LoginPage";
import { FamilySetupPage } from "./pages/FamilySetupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GiftsPage } from "./pages/GiftsPage";
import { GiftEventDetailPage } from "./pages/GiftEventDetailPage";
import { CalendarPage } from "./pages/CalendarPage";
import { HealthPage } from "./pages/HealthPage";
import { HealthProfilePage } from "./pages/HealthProfilePage";
import { LibraryPage } from "./pages/LibraryPage";
import { VehiclesPage } from "./pages/VehiclesPage";
import { VehicleDetailPage } from "./pages/VehicleDetailPage";
import { MorePage } from "./pages/MorePage";
import { CalendarSettingsPage } from "./pages/CalendarSettingsPage";
import { FamilyPage } from "./pages/FamilyPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { RecipesPage } from "./pages/RecipesPage";
import { PlacesPage } from "./pages/PlacesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ContactsPage } from "./pages/ContactsPage";

function AppRoutes() {
  const { user, isLoading: authLoading } = useAuth();
  const { currentFamily, isLoading: familyLoading } = useFamily();

  if (authLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return <LoginPage />;
  }

  if (familyLoading) {
    return <PageLoader />;
  }

  if (!currentFamily) {
    return <FamilySetupPage />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/gifts" element={<GiftsPage />} />
        <Route path="/gifts/:eventId" element={<GiftEventDetailPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/settings/calendar" element={<CalendarSettingsPage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/health/:profileId" element={<HealthProfilePage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/vehicles/:vehicleId" element={<VehicleDetailPage />} />
        <Route path="/more" element={<MorePage />} />
        <Route path="/family" element={<FamilyPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/places" element={<PlacesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ConvexProvider client={convex}>
      <ThemeProvider>
        <AuthProvider>
          <FamilyProvider>
            <ToastProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </ToastProvider>
          </FamilyProvider>
        </AuthProvider>
      </ThemeProvider>
    </ConvexProvider>
  );
}

export default App;
