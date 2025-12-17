
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
import { PetsPage } from "./pages/PetsPage";
import { PetProfilePage } from "./pages/PetProfilePage";
import { CollectionsPage } from "./pages/CollectionsPage";
import { VehiclesPage } from "./pages/VehiclesPage";
import { VehicleDetailPage } from "./pages/VehicleDetailPage";
import { MorePage } from "./pages/MorePage";
import { CalendarSettingsPage } from "./pages/CalendarSettingsPage";
import { FamilyPage } from "./pages/FamilyPage";
import { TasksPage } from "./pages/TasksPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { SubscriptionsPage } from "./pages/SubscriptionsPage";
import { FinancesPage } from "./pages/FinancesPage";
import { RecipesPage } from "./pages/RecipesPage";
import { PlacesPage } from "./pages/PlacesPage";
import { PlaceVisitsPage } from "./pages/PlaceVisitsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ContactsPage } from "./pages/ContactsPage";
import { ActivitiesPage } from "./pages/ActivitiesPage";
import AgentPage from "./pages/AgentPage";
import { LandingPage } from "./pages/LandingPage";
import { TripsPage } from "./pages/TripsPage";
import { TripDetailPage } from "./pages/TripDetailPage";

function AppRoutes() {
  const { user, isLoading: authLoading } = useAuth();
  const { currentFamily, isLoading: familyLoading } = useFamily();

  if (authLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
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
        <Route path="/pets" element={<PetsPage />} />
        <Route path="/pets/:profileId" element={<PetProfilePage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/vehicles/:vehicleId" element={<VehicleDetailPage />} />
        <Route path="/more" element={<MorePage />} />
        <Route path="/family" element={<FamilyPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/finances" element={<FinancesPage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/places/visits" element={<PlaceVisitsPage />} />
        <Route path="/places" element={<PlacesPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trips/:tripId" element={<TripDetailPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/agent" element={<AgentPage />} />
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
