import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { SkeletonText } from "../components/ui/Skeleton";
import {
  Gift, Heart, Book, Car, Calendar,
  DollarSign, ChefHat, MapPin, Star, AlertTriangle, X, CreditCard, FileText
} from "lucide-react";
import { DashboardCard } from "../components/dashboard/DashboardCard";
import { QuickAddSection } from "../components/dashboard/QuickAddSection";

export function DashboardPage() {
  const { currentFamily, inviteError, clearInviteError } = useFamily();

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
    api.collections.getCollectionSummary,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const vehiclesSummary = useQuery(
    api.vehicles.getVehiclesSummary,
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

  const subscriptions = useQuery(
    api.subscriptions.list,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const documents = useQuery(
    api.documents.list,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  if (!currentFamily) {
    return <PageLoader />;
  }

  // Calculate Subscriptions totals (Monthly approx)
  const subTotalMonthly = subscriptions?.reduce((acc, sub) => {
    if (!sub.isActive || !sub.amount) return acc;
    let monthlyAmount = sub.amount;
    if (sub.billingCycle === "bimonthly") monthlyAmount /= 2;
    if (sub.billingCycle === "quarterly") monthlyAmount /= 3;
    if (sub.billingCycle === "annual") monthlyAmount /= 12;
    if (sub.billingCycle === "variable") return acc;
    return acc + monthlyAmount;
  }, 0) || 0;
  const subActiveCount = subscriptions?.filter(s => s.isActive).length || 0;

  // Calculate Expiring Documents (Next 30 days)
  const now = new Date().getTime();
  const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;
  const expiringDocuments = documents?.filter(d =>
    !d.isArchived && d.expiryDate && d.expiryDate <= thirtyDaysFromNow
  ).sort((a, b) => (a.expiryDate || 0) - (b.expiryDate || 0)) || [];


  // Helper to check if section has data
  const hasGifts = giftEvents && giftEvents.length > 0;
  const hasHealth = healthSummary && healthSummary.profileCount > 0;
  const hasLibrary = librarySummary && (librarySummary.owned > 0 || librarySummary.wishlist > 0);
  const hasVehicles = vehiclesSummary && vehiclesSummary.vehicleCount > 0;
  const hasCalendar = upcomingEvents && upcomingEvents.length > 0;
  const hasExpenses = expensesSummary && expensesSummary.countThisMonth > 0;
  const hasRecipes = recipesSummary && recipesSummary.total > 0;
  const hasPlaces = placesSummary && placesSummary.total > 0;
  const hasSubscriptions = subscriptions && subscriptions.length > 0;
  const hasDocuments = documents && documents.length > 0;

  const isLoading =
    giftEvents === undefined ||
    healthSummary === undefined ||
    expensesSummary === undefined ||
    recipesSummary === undefined ||
    placesSummary === undefined ||
    subscriptions === undefined ||
    documents === undefined;

  const hasAnyData = hasGifts || hasHealth || hasLibrary || hasVehicles || hasCalendar || hasExpenses || hasRecipes || hasPlaces || hasSubscriptions || hasDocuments;

  return (
    <div className="pb-4">
      <PageHeader
        title={`¡Hola! ${currentFamily.emoji || "🏠"}`}
        subtitle={currentFamily.name}
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
            <button onClick={clearInviteError} className="btn btn-ghost btn-sm btn-circle">
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

        {/* Expiring Documents - High Priority */}
        {(expiringDocuments.length > 0) && (
          <DashboardCard
            icon={FileText}
            title="Documentos por vencer"
            to="/documents"
            color="bg-orange-500/10 text-orange-600"
          >
            <ul className="space-y-1">
              {expiringDocuments.slice(0, 3).map((doc) => {
                const daysLeft = Math.ceil(((doc.expiryDate || 0) - now) / (1000 * 60 * 60 * 24));
                const isExpired = daysLeft < 0;
                return (
                  <li key={doc._id} className="text-sm flex justify-between items-center">
                    <span className="truncate font-medium">{doc.title}</span>
                    <span className={`text-xs font-bold ${isExpired ? "text-error" : "text-warning"}`}>
                      {isExpired ? "Vencido" : `${daysLeft} días`}
                    </span>
                  </li>
                );
              })}
            </ul>
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
                <span className="text-2xl font-bold">${subTotalMonthly.toFixed(2)}</span>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-base-content/40">Mensual Fijo</span>
                  <span className="text-xs text-base-content/60">{subActiveCount} activos</span>
                </div>
              </div>
            )}
          </DashboardCard>
        )}

        {/* Gift Events */}
        {(hasGifts || giftEvents === undefined) && (
          <DashboardCard
            icon={Gift}
            title="Regalos e Intercambios"
            to="/gifts"
            color="bg-red-500/10 text-red-600"
          >
            {giftEvents === undefined ? (
              <div className="py-1"><SkeletonText lines={1} /></div>
            ) : (
              <ul className="space-y-2">
                {giftEvents.slice(0, 3).map((event) => {
                  const eventDate = new Date(event.date || 0);
                  const diffTime = eventDate.getTime() - now;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  let timeText = "";
                  let timeClass = "text-primary";

                  if (diffDays === 0) {
                    timeText = "¡¡ES HOY!!";
                    timeClass = "text-error font-bold animate-pulse";
                  } else if (diffDays === 1) {
                    timeText = "¡¡ES MAÑANA!!";
                    timeClass = "text-warning font-bold";
                  } else if (diffDays > 1) {
                    timeText = `en ${diffDays} días`;
                  }

                  return (
                    <li key={event._id} className="text-sm flex justify-between items-center">
                      <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                        <span className="truncate font-medium">{event.name}</span>
                        {timeText && (
                          <span className={`text-[10px] uppercase shrink-0 ${timeClass}`}>
                            {timeText}
                          </span>
                        )}
                      </div>
                      {event.date && (
                        <span className="text-xs text-base-content/60 ml-2 whitespace-nowrap">
                          {eventDate.toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </li>
                  );
                })}
                {giftEvents.length > 3 && (
                  <li className="text-xs text-base-content/50 pt-1">+{giftEvents.length - 3} más</li>
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

        {/* Vehicles Summary */}
        {(hasVehicles || vehiclesSummary === undefined) && (
          <DashboardCard
            icon={Car}
            title="Autos"
            to="/vehicles"
            color="bg-green-500/10 text-green-600"
          >
            {vehiclesSummary === undefined ? (
              <div className="py-1"><SkeletonText lines={2} /></div>
            ) : (
              <div className="space-y-1">
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="font-semibold">{vehiclesSummary.vehicleCount}</span>
                    <span className="text-base-content/60 ml-1">vehículos</span>
                  </div>
                  <div>
                    <span className="font-semibold">${vehiclesSummary.totalSpentThisMonth.toLocaleString()}</span>
                    <span className="text-base-content/60 ml-1">este mes</span>
                  </div>
                </div>
                {vehiclesSummary.upcomingEvents.length > 0 && (
                  <p className="text-xs text-warning">
                    {vehiclesSummary.upcomingEvents.length} evento(s) próximo(s)
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
            hasVehicles={hasVehicles}
            hasSubscriptions={hasSubscriptions}
            hasDocuments={hasDocuments}
          />
        )}
      </div>
    </div>
  );
}
