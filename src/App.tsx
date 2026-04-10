import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { useFamily } from "./contexts/FamilyContext";
import { AppLayout } from "./components/layout/AppLayout";
import { PageLoader } from "./components/ui/LoadingSpinner";
import { AppProviders } from "./app/AppProviders";

// Eagerly loaded: critical paths (auth + first paint)
import { LoginPage } from "./pages/LoginPage";
import { LandingPage } from "./pages/LandingPage";
import { FamilySetupPage } from "./pages/FamilySetupPage";
import { DashboardPage } from "./pages/DashboardPage";

// Lazy-loaded: rest of the app split into per-page chunks
const GiftsPage = lazy(() => import("./pages/GiftsPage").then((m) => ({ default: m.GiftsPage })));
const GiftEventDetailPage = lazy(() =>
  import("./pages/GiftEventDetailPage").then((m) => ({ default: m.GiftEventDetailPage }))
);
const CalendarPage = lazy(() => import("./pages/CalendarPage").then((m) => ({ default: m.CalendarPage })));
const CalendarSettingsPage = lazy(() =>
  import("./pages/CalendarSettingsPage").then((m) => ({ default: m.CalendarSettingsPage }))
);
const HealthPage = lazy(() => import("./pages/HealthPage").then((m) => ({ default: m.HealthPage })));
const HealthProfilePage = lazy(() =>
  import("./pages/HealthProfilePage").then((m) => ({ default: m.HealthProfilePage }))
);
const PetsPage = lazy(() => import("./pages/PetsPage").then((m) => ({ default: m.PetsPage })));
const PetProfilePage = lazy(() => import("./pages/PetProfilePage").then((m) => ({ default: m.PetProfilePage })));
const CollectionsPage = lazy(() =>
  import("./pages/CollectionsPage").then((m) => ({ default: m.CollectionsPage }))
);
const VehiclesPage = lazy(() => import("./pages/VehiclesPage").then((m) => ({ default: m.VehiclesPage })));
const VehicleDetailPage = lazy(() =>
  import("./pages/VehicleDetailPage").then((m) => ({ default: m.VehicleDetailPage }))
);
const MorePage = lazy(() => import("./pages/MorePage").then((m) => ({ default: m.MorePage })));
const FamilyPage = lazy(() => import("./pages/FamilyPage").then((m) => ({ default: m.FamilyPage })));
const TasksPage = lazy(() => import("./pages/TasksPage").then((m) => ({ default: m.TasksPage })));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage").then((m) => ({ default: m.DocumentsPage })));
const SubscriptionsPage = lazy(() =>
  import("./pages/SubscriptionsPage").then((m) => ({ default: m.SubscriptionsPage }))
);
const FinancesPage = lazy(() => import("./pages/FinancesPage").then((m) => ({ default: m.FinancesPage })));
const RecipesPage = lazy(() => import("./pages/RecipesPage").then((m) => ({ default: m.RecipesPage })));
const NutritionPage = lazy(() => import("./pages/NutritionPage").then((m) => ({ default: m.NutritionPage })));
const PlacesPage = lazy(() => import("./pages/PlacesPage").then((m) => ({ default: m.PlacesPage })));
const PlaceVisitsPage = lazy(() =>
  import("./pages/PlaceVisitsPage").then((m) => ({ default: m.PlaceVisitsPage }))
);
const TripsPage = lazy(() => import("./pages/TripsPage").then((m) => ({ default: m.TripsPage })));
const TripDetailPage = lazy(() => import("./pages/TripDetailPage").then((m) => ({ default: m.TripDetailPage })));
const ActivitiesPage = lazy(() =>
  import("./pages/ActivitiesPage").then((m) => ({ default: m.ActivitiesPage }))
);
const AgentPage = lazy(() => import("./pages/AgentPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const ContactsPage = lazy(() => import("./pages/ContactsPage").then((m) => ({ default: m.ContactsPage })));
const DiaryPage = lazy(() => import("./pages/DiaryPage").then((m) => ({ default: m.DiaryPage })));
const HouseholdPage = lazy(() => import("./pages/HouseholdPage").then((m) => ({ default: m.HouseholdPage })));

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
    <Suspense fallback={<PageLoader />}>
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
          <Route path="/nutrition" element={<NutritionPage />} />
          <Route path="/places/visits" element={<PlaceVisitsPage />} />
          <Route path="/places" element={<PlacesPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/trips/:tripId" element={<TripDetailPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/agent" element={<AgentPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/household" element={<HouseholdPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}

export default App;
