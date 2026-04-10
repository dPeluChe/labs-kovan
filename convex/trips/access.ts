import { requireFamilyAccessFromSession } from "../lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTripWithAccessOrThrow(ctx: any, sessionToken: string, tripId: any) {
  const trip = await ctx.db.get(tripId);
  if (!trip) throw new Error("Viaje no encontrado");
  await requireFamilyAccessFromSession(ctx, sessionToken, trip.familyId);
  return trip;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTripPlanWithAccessOrThrow(ctx: any, sessionToken: string, planId: any) {
  const plan = await ctx.db.get(planId);
  if (!plan) throw new Error("Plan no encontrado");
  await getTripWithAccessOrThrow(ctx, sessionToken, plan.tripId);
  return plan;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTripBookingWithAccessOrThrow(ctx: any, sessionToken: string, bookingId: any) {
  const booking = await ctx.db.get(bookingId);
  if (!booking) throw new Error("Reserva no encontrada");
  await getTripWithAccessOrThrow(ctx, sessionToken, booking.tripId);
  return booking;
}

export { getTripWithAccessOrThrow, getTripPlanWithAccessOrThrow, getTripBookingWithAccessOrThrow };
