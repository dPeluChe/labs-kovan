import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface UseDashboardDataParams {
  familyId?: Id<"families">;
  sessionToken?: string | null;
}

type Subscription = { isActive?: boolean; amount?: number | null; billingCycle?: string };
type DashboardDoc = { isArchived?: boolean; expiryDate?: number };

function toMonthlyAmount(sub: Subscription) {
  if (!sub.isActive || !sub.amount) return 0;
  if (sub.billingCycle === "bimonthly") return sub.amount / 2;
  if (sub.billingCycle === "quarterly") return sub.amount / 3;
  if (sub.billingCycle === "annual") return sub.amount / 12;
  if (sub.billingCycle === "variable") return 0;
  return sub.amount;
}

interface DerivedInput<TDoc extends DashboardDoc> {
  giftEvents?: unknown[] | null;
  healthSummary?: { profileCount: number } | null;
  librarySummary?: { owned: number; wishlist: number } | null;
  vehiclesSummary?: { vehicleCount: number } | null;
  upcomingEvents?: unknown[] | null;
  expensesSummary?: { countThisMonth: number } | null;
  recipesSummary?: { total: number } | null;
  placesSummary?: { total: number } | null;
  subscriptions?: Subscription[] | null;
  documents?: TDoc[] | null;
}

function deriveDashboardData<TDoc extends DashboardDoc>(q: DerivedInput<TDoc>, now: number) {
  const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;
  const subTotalMonthly = q.subscriptions?.reduce((acc, sub) => acc + toMonthlyAmount(sub), 0) || 0;
  const subActiveCount = q.subscriptions?.filter((s) => s.isActive).length || 0;
  const expiringDocuments =
    q.documents
      ?.filter((d) => !d.isArchived && d.expiryDate && d.expiryDate <= thirtyDaysFromNow)
      .sort((a, b) => (a.expiryDate || 0) - (b.expiryDate || 0)) || [];

  const flags = {
    hasGifts: (q.giftEvents?.length ?? 0) > 0,
    hasHealth: (q.healthSummary?.profileCount ?? 0) > 0,
    hasLibrary: (q.librarySummary?.owned ?? 0) > 0 || (q.librarySummary?.wishlist ?? 0) > 0,
    hasVehicles: (q.vehiclesSummary?.vehicleCount ?? 0) > 0,
    hasCalendar: (q.upcomingEvents?.length ?? 0) > 0,
    hasExpenses: (q.expensesSummary?.countThisMonth ?? 0) > 0,
    hasRecipes: (q.recipesSummary?.total ?? 0) > 0,
    hasPlaces: (q.placesSummary?.total ?? 0) > 0,
    hasSubscriptions: (q.subscriptions?.length ?? 0) > 0,
    hasDocuments: (q.documents?.length ?? 0) > 0,
  };

  const isLoading =
    q.giftEvents === undefined ||
    q.healthSummary === undefined ||
    q.expensesSummary === undefined ||
    q.recipesSummary === undefined ||
    q.placesSummary === undefined ||
    q.subscriptions === undefined ||
    q.documents === undefined;

  const hasAnyData = Object.values(flags).some(Boolean);

  return { subTotalMonthly, subActiveCount, expiringDocuments, ...flags, isLoading, hasAnyData };
}

export function useDashboardData({ familyId, sessionToken }: UseDashboardDataParams) {
  const queryArgs = familyId && sessionToken ? { sessionToken, familyId } : "skip";

  const giftEvents = useQuery(api.gifts.getGiftEvents, queryArgs);
  const healthSummary = useQuery(api.health.getHealthSummary, queryArgs);
  const librarySummary = useQuery(api.collections.getCollectionSummary, queryArgs);
  const vehiclesSummary = useQuery(api.vehicles.getVehiclesSummary, queryArgs);
  const expensesSummary = useQuery(api.expenses.getExpenseSummary, queryArgs);
  const recipesSummary = useQuery(api.recipes.getRecipeSummary, queryArgs);
  const placesSummary = useQuery(api.places.getPlaceSummary, queryArgs);
  const subscriptions = useQuery(api.subscriptions.list, queryArgs);
  const documents = useQuery(api.documents.list, queryArgs);

  const upcomingEvents = useQuery(
    api.calendar.getUpcomingEvents,
    familyId && sessionToken ? { sessionToken, familyId, limit: 3 } : "skip"
  );

  const now = new Date().getTime();
  const derived = deriveDashboardData(
    {
      giftEvents,
      healthSummary,
      librarySummary,
      vehiclesSummary,
      upcomingEvents,
      expensesSummary,
      recipesSummary,
      placesSummary,
      subscriptions,
      documents,
    },
    now
  );

  return {
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
    documents,
    ...derived,
  };
}
