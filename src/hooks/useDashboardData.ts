import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface UseDashboardDataParams {
  familyId?: Id<"families">;
  sessionToken?: string | null;
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

  const subTotalMonthly = subscriptions?.reduce((acc, sub) => {
    if (!sub.isActive || !sub.amount) return acc;
    let monthlyAmount = sub.amount;
    if (sub.billingCycle === "bimonthly") monthlyAmount /= 2;
    if (sub.billingCycle === "quarterly") monthlyAmount /= 3;
    if (sub.billingCycle === "annual") monthlyAmount /= 12;
    if (sub.billingCycle === "variable") return acc;
    return acc + monthlyAmount;
  }, 0) || 0;

  const subActiveCount = subscriptions?.filter((s) => s.isActive).length || 0;

  const now = new Date().getTime();
  const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;
  const expiringDocuments = documents?.filter((d) =>
    !d.isArchived && d.expiryDate && d.expiryDate <= thirtyDaysFromNow
  ).sort((a, b) => (a.expiryDate || 0) - (b.expiryDate || 0)) || [];

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

  const hasAnyData =
    hasGifts ||
    hasHealth ||
    hasLibrary ||
    hasVehicles ||
    hasCalendar ||
    hasExpenses ||
    hasRecipes ||
    hasPlaces ||
    hasSubscriptions ||
    hasDocuments;

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
  };
}
