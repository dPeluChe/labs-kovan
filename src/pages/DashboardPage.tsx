import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { SkeletonText } from "../components/ui/Skeleton";
import { 
  Gift, Heart, Book, Car, Calendar, 
  DollarSign, ChefHat, MapPin, Star, Plus
} from "lucide-react";
import { Link } from "react-router-dom";

export function DashboardPage() {
  const { currentFamily } = useFamily();

  // Existing queries
  const giftEvents = useQuery(
    api.gifts.getGiftEvents,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const healthSummary = useQuery(
    api.health.getHealthSummary,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const librarySummary = useQuery(
    api.library.getLibrarySummary,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const servicesSummary = useQuery(
    api.services.getServicesSummary,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const upcomingEvents = useQuery(
    api.calendar.getUpcomingEvents,
    currentFamily ? { familyId: currentFamily._id, limit: 3 } : "skip"
  );

  // New queries
  const expensesSummary = useQuery(
    api.expenses.getExpenseSummary,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const recipesSummary = useQuery(
    api.recipes.getRecipeSummary,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const placesSummary = useQuery(
    api.places.getPlaceSummary,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  if (!currentFamily) {
    return <PageLoader />;
  }

  // Helper to check if section has data
  const hasGifts = giftEvents && giftEvents.length > 0;
  const hasHealth = healthSummary && healthSummary.profileCount > 0;
  const hasLibrary = librarySummary && (librarySummary.owned > 0 || librarySummary.wishlist > 0);
  const hasServices = servicesSummary && (servicesSummary.serviceCount > 0 || servicesSummary.vehicleCount > 0);
  const hasCalendar = upcomingEvents && upcomingEvents.length > 0;
  const hasExpenses = expensesSummary && expensesSummary.countThisMonth > 0;
  const hasRecipes = recipesSummary && recipesSummary.total > 0;
  const hasPlaces = placesSummary && placesSummary.total > 0;

  const isLoading = 
    giftEvents === undefined || 
    healthSummary === undefined ||
    expensesSummary === undefined ||
    recipesSummary === undefined ||
    placesSummary === undefined;

  const hasAnyData = hasGifts || hasHealth || hasLibrary || hasServices || hasCalendar || hasExpenses || hasRecipes || hasPlaces;

  return (
    <div className="pb-4">
      <PageHeader
        title={`¡Hola! ${currentFamily.emoji || "🏠"}`}
        subtitle={currentFamily.name}
      />

      <div className="px-4 space-y-4 stagger-children">
        {/* Calendar Events - always show */}
        {(hasCalendar || upcomingEvents === undefined) && (
          <DashboardCard
            icon={Calendar}
            title="Próximos eventos"
            to="/calendar"
            color="bg-purple-500/10 text-purple-600"
          >
            {upcomingEvents === undefined ? (
              <div className="py-1"><SkeletonText lines={2} /></div>
            ) : (
              <ul className="space-y-1">
                {upcomingEvents.map((event) => (
                  <li key={event._id} className="text-sm flex justify-between">
                    <span className="truncate">{event.title}</span>
                    <span className="text-base-content/60 text-xs">
                      {new Date(event.startDateTime).toLocaleDateString("es-MX", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>
        )}

        {/* Expenses - only if has data */}
        {(hasExpenses || expensesSummary === undefined) && (
          <DashboardCard
            icon={DollarSign}
            title="Gastos del mes"
            to="/expenses"
            color="bg-emerald-500/10 text-emerald-600"
          >
            {expensesSummary === undefined ? (
              <div className="py-1"><SkeletonText lines={1} /></div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">${expensesSummary.totalThisMonth.toLocaleString()}</span>
                <span className="text-sm text-base-content/60">
                  en {expensesSummary.countThisMonth} {expensesSummary.countThisMonth === 1 ? "gasto" : "gastos"}
                </span>
              </div>
            )}
          </DashboardCard>
        )}

        {/* Gift Events */}
        {(hasGifts || giftEvents === undefined) && (
          <DashboardCard
            icon={Gift}
            title="Eventos de regalos"
            to="/gifts"
            color="bg-red-500/10 text-red-600"
          >
            {giftEvents === undefined ? (
              <div className="py-1"><SkeletonText lines={1} /></div>
            ) : (
              <ul className="space-y-1">
                {giftEvents.slice(0, 3).map((event) => (
                  <li key={event._id} className="text-sm flex justify-between items-center">
                    <span className="truncate font-medium">{event.name}</span>
                    {event.date && (
                      <span className="text-xs text-base-content/60 ml-2">
                        {new Date(event.date).toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </li>
                ))}
                {giftEvents.length > 3 && (
                  <li className="text-xs text-base-content/50">+{giftEvents.length - 3} más</li>
                )}
              </ul>
            )}
          </DashboardCard>
        )}

        {/* Places */}
        {(hasPlaces || placesSummary === undefined) && (
          <DashboardCard
            icon={MapPin}
            title="Lugares"
            to="/places"
            color="bg-rose-500/10 text-rose-600"
          >
            {placesSummary === undefined ? (
              <div className="py-1"><SkeletonText lines={1} /></div>
            ) : (
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="font-semibold">{placesSummary.pending}</span>
                  <span className="text-base-content/60 ml-1">por visitar</span>
                </div>
                <div>
                  <span className="font-semibold">{placesSummary.visited}</span>
                  <span className="text-base-content/60 ml-1">visitados</span>
                </div>
              </div>
            )}
          </DashboardCard>
        )}

        {/* Recipes */}
        {(hasRecipes || recipesSummary === undefined) && (
          <DashboardCard
            icon={ChefHat}
            title="Recetas"
            to="/recipes"
            color="bg-amber-500/10 text-amber-600"
          >
            {recipesSummary === undefined ? (
              <div className="py-1"><SkeletonText lines={1} /></div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold">{recipesSummary.total}</span>
                <span className="text-sm text-base-content/60">recetas</span>
                {recipesSummary.favorites > 0 && (
                  <span className="flex items-center gap-1 text-amber-500 text-sm">
                    <Star className="w-3 h-3 fill-current" />
                    {recipesSummary.favorites}
                  </span>
                )}
              </div>
            )}
          </DashboardCard>
        )}

        {/* Health Summary */}
        {(hasHealth || healthSummary === undefined) && (
          <DashboardCard
            icon={Heart}
            title="Salud"
            to="/health"
            color="bg-pink-500/10 text-pink-600"
          >
            {healthSummary === undefined ? (
              <div className="py-1"><SkeletonText lines={2} /></div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {healthSummary.profiles.slice(0, 4).map((profile) => (
                    <span key={profile._id} className="badge badge-sm badge-ghost">
                      {profile.name}
                    </span>
                  ))}
                  {healthSummary.profileCount > 4 && (
                    <span className="badge badge-sm badge-ghost">+{healthSummary.profileCount - 4}</span>
                  )}
                </div>
                {healthSummary.activeMedications.length > 0 && (
                  <div className="text-xs space-y-0.5">
                    <span className="text-warning font-medium">💊 Medicaciones activas:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {healthSummary.activeMedications.slice(0, 3).map((med, i) => (
                        <span key={i} className="text-base-content/70">
                          {med.medication.name} ({med.personName})
                          {i < Math.min(2, healthSummary.activeMedications.length - 1) && ","}
                        </span>
                      ))}
                      {healthSummary.activeMedications.length > 3 && (
                        <span className="text-base-content/50">+{healthSummary.activeMedications.length - 3} más</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DashboardCard>
        )}

        {/* Library Summary */}
        {(hasLibrary || librarySummary === undefined) && (
          <DashboardCard
            icon={Book}
            title="Librería"
            to="/library"
            color="bg-blue-500/10 text-blue-600"
          >
            {librarySummary === undefined ? (
              <div className="py-1"><SkeletonText lines={1} /></div>
            ) : (
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="font-semibold">{librarySummary.owned}</span>
                  <span className="text-base-content/60 ml-1">propios</span>
                </div>
                <div>
                  <span className="font-semibold">{librarySummary.byStatus.reading}</span>
                  <span className="text-base-content/60 ml-1">leyendo</span>
                </div>
                <div>
                  <span className="font-semibold">{librarySummary.wishlist}</span>
                  <span className="text-base-content/60 ml-1">deseados</span>
                </div>
              </div>
            )}
          </DashboardCard>
        )}

        {/* Services Summary */}
        {(hasServices || servicesSummary === undefined) && (
          <DashboardCard
            icon={Car}
            title="Servicios y autos"
            to="/services"
            color="bg-green-500/10 text-green-600"
          >
            {servicesSummary === undefined ? (
              <div className="py-1"><SkeletonText lines={2} /></div>
            ) : (
              <div className="space-y-1">
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="font-semibold">{servicesSummary.serviceCount}</span>
                    <span className="text-base-content/60 ml-1">servicios</span>
                  </div>
                  <div>
                    <span className="font-semibold">{servicesSummary.vehicleCount}</span>
                    <span className="text-base-content/60 ml-1">vehículos</span>
                  </div>
                </div>
                {servicesSummary.upcomingVehicleEvents.length > 0 && (
                  <p className="text-xs text-warning">
                    {servicesSummary.upcomingVehicleEvents.length} evento(s) próximo(s)
                  </p>
                )}
              </div>
            )}
          </DashboardCard>
        )}

        {/* Empty state - only when loaded and no data */}
        {!isLoading && !hasAnyData && (
          <div className="card bg-base-100 shadow-sm border border-base-300 p-8 text-center animate-fade-in">
            <div className="text-4xl mb-2">🏠</div>
            <h3 className="font-semibold mb-1">¡Bienvenido a Kovan!</h3>
            <p className="text-sm text-base-content/60">
              Comienza agregando datos en cualquier sección
            </p>
          </div>
        )}

        {/* Quick add section for empty modules */}
        {!isLoading && (
          <QuickAddSection
            hasExpenses={hasExpenses}
            hasGifts={hasGifts}
            hasPlaces={hasPlaces}
            hasRecipes={hasRecipes}
            hasHealth={hasHealth}
            hasLibrary={hasLibrary}
            hasServices={hasServices}
          />
        )}
      </div>
    </div>
  );
}

function QuickAddSection({
  hasExpenses,
  hasGifts,
  hasPlaces,
  hasRecipes,
  hasHealth,
  hasLibrary,
  hasServices,
}: {
  hasExpenses: boolean | undefined;
  hasGifts: boolean | undefined;
  hasPlaces: boolean | undefined;
  hasRecipes: boolean | undefined;
  hasHealth: boolean | undefined;
  hasLibrary: boolean | undefined;
  hasServices: boolean | undefined;
}) {
  const emptyModules = [
    { show: !hasExpenses, to: "/expenses", icon: DollarSign, label: "Gastos", color: "text-emerald-600" },
    { show: !hasGifts, to: "/gifts", icon: Gift, label: "Regalos", color: "text-red-600" },
    { show: !hasPlaces, to: "/places", icon: MapPin, label: "Lugares", color: "text-rose-600" },
    { show: !hasRecipes, to: "/recipes", icon: ChefHat, label: "Recetas", color: "text-amber-600" },
    { show: !hasHealth, to: "/health", icon: Heart, label: "Salud", color: "text-pink-600" },
    { show: !hasLibrary, to: "/library", icon: Book, label: "Librería", color: "text-blue-600" },
    { show: !hasServices, to: "/services", icon: Car, label: "Servicios", color: "text-green-600" },
  ].filter((m) => m.show);

  if (emptyModules.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-3">
        Agregar más
      </h3>
      <div className="flex flex-wrap gap-2">
        {emptyModules.map(({ to, icon: Icon, label, color }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-base-300 hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <div className={`${color} opacity-60 group-hover:opacity-100`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-sm text-base-content/60 group-hover:text-base-content">{label}</span>
            <Plus className="w-3 h-3 text-base-content/40 group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function DashboardCard({
  icon: Icon,
  title,
  to,
  color,
  children,
}: {
  icon: typeof Gift;
  title: string;
  to: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <Link to={to} className="card bg-base-100 shadow-sm border border-base-300 card-interactive">
      <div className="card-body p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${color} transition-transform group-hover:scale-110`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">{title}</h3>
            {children}
          </div>
        </div>
      </div>
    </Link>
  );
}