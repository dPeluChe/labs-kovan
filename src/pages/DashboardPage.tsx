import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { SkeletonText } from "../components/ui/Skeleton";
import { useAuth } from "../contexts/AuthContext";
import {
  Book, Calendar,
  DollarSign, ChefHat, MapPin, Star, AlertTriangle, X, CreditCard
} from "lucide-react";
import { DashboardCard } from "../components/dashboard/DashboardCard";
import { QuickAddSection } from "../components/dashboard/QuickAddSection";
import { GiftEventsCard } from "../components/dashboard/GiftEventsCard";
import { HealthSummaryCard } from "../components/dashboard/HealthSummaryCard";
import { ExpiringDocumentsCard } from "../components/dashboard/ExpiringDocumentsCard";
import { VehiclesCard } from "../components/dashboard/VehiclesCard";
import { useDashboardData } from "../hooks/useDashboardData";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function DashboardPage() {
  const { currentFamily, inviteError, clearInviteError } = useFamily();
  const { user, sessionToken } = useAuth();

  const greeting = getGreeting();

  const {
    now,
    giftEvents,
    healthSummary,
    librarySummary,
    vehiclesSummary,
    upcomingEvents,
    expensesSummary,
    recipesSummary,
    placesSummary,
    subscriptions,
    subTotalMonthly,
    subActiveCount,
    expiringDocuments,
    hasGifts,
    hasHealth,
    hasLibrary,
    hasVehicles,
    hasCalendar,
    hasExpenses,
    hasRecipes,
    hasPlaces,
    hasSubscriptions,
    hasDocuments,
    isLoading,
    hasAnyData,
  } = useDashboardData({ familyId: currentFamily?._id, sessionToken });

  if (!currentFamily) {
    return <PageLoader />;
  }

  return (
    <div className="pb-4">
      <PageHeader
        title={`${greeting}, ${user?.name?.split(' ')[0] || "Usuario"}`}
      />

      {/* Invite Error Banner */}
      {inviteError && (
        <div className="px-4 mb-4">
          <div className="alert alert-error shadow-lg">
            <AlertTriangle className="w-5 h-5" />
            <div className="flex-1">
              <p className="font-medium">Error al unirse a la familia</p>
              <p className="text-sm opacity-80">{inviteError}</p>
            </div>
            <button onClick={clearInviteError} className="btn btn-ghost btn-sm btn-circle" aria-label="Cerrar aviso">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
                    <span className="text-muted text-xs">
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

        {/* Expiring Documents - High Priority */}
        <ExpiringDocumentsCard documents={expiringDocuments} now={now} />


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
                <span className="text-2xl font-bold">{expensesSummary.totalThisMonth.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}</span>
                <span className="text-sm text-muted">
                  en {expensesSummary.countThisMonth} {expensesSummary.countThisMonth === 1 ? "gasto" : "gastos"}
                </span>
              </div>
            )}
          </DashboardCard>
        )}

        {/* Subscriptions - only if has data */}
        {(hasSubscriptions || subscriptions === undefined) && (
          <DashboardCard
            icon={CreditCard}
            title="Suscripciones"
            to="/subscriptions"
            color="bg-indigo-500/10 text-indigo-600"
          >
            {subscriptions === undefined ? (
              <div className="py-1"><SkeletonText lines={1} /></div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold">{subTotalMonthly.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}</span>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-faint">Mensual Fijo</span>
                  <span className="text-xs text-muted">{subActiveCount} activos</span>
                </div>
              </div>
            )}
          </DashboardCard>
        )}

        {/* Gift Events */}
        <GiftEventsCard events={giftEvents} />

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
                  <span className="text-muted ml-1">por visitar</span>
                </div>
                <div>
                  <span className="font-semibold">{placesSummary.visited}</span>
                  <span className="text-muted ml-1">visitados</span>
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
                <span className="text-sm text-muted">recetas</span>
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
        <HealthSummaryCard summary={healthSummary} />

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
                  <span className="text-muted ml-1">propios</span>
                </div>
                <div>
                  <span className="font-semibold">{librarySummary.byStatus.reading}</span>
                  <span className="text-muted ml-1">leyendo</span>
                </div>
                <div>
                  <span className="font-semibold">{librarySummary.wishlist}</span>
                  <span className="text-muted ml-1">deseados</span>
                </div>
              </div>
            )}
          </DashboardCard>
        )}

        {/* Vehicles Summary */}
        <VehiclesCard summary={vehiclesSummary} />

        {/* Empty state - only when loaded and no data */}
        {!isLoading && !hasAnyData && (
          <div className="card bg-base-100 shadow-sm border border-base-300 p-8 text-center animate-fade-in">
            <div className="text-4xl mb-2">🏠</div>
            <h3 className="font-semibold mb-1">¡Bienvenido a Kovan!</h3>
            <p className="text-sm text-muted">
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
            hasVehicles={hasVehicles}
            hasSubscriptions={hasSubscriptions}
            hasDocuments={hasDocuments}
          />
        )}
      </div>
    </div>
  );
}
