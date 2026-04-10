import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireFamilyAccessFromSession } from "../lib/auth";

export const getVehiclesSummary = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const vehicles = await ctx.db
      .query("vehicles")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    const now = Date.now();
    const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;

    const upcomingEvents: Array<{
      vehicleId: string;
      vehicleName: string;
      event: { type: string; title: string; date: number };
    }> = [];

    for (const vehicle of vehicles) {
      const events = await ctx.db
        .query("vehicleEvents")
        .withIndex("by_vehicle", (q) => q.eq("vehicleId", vehicle._id))
        .collect();

      for (const event of events) {
        if (event.nextDate && event.nextDate >= now && event.nextDate <= thirtyDaysFromNow) {
          upcomingEvents.push({
            vehicleId: vehicle._id,
            vehicleName: vehicle.name,
            event: { type: event.type, title: event.title, date: event.nextDate },
          });
        }
      }
    }

    upcomingEvents.sort((a, b) => a.event.date - b.event.date);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const vehicleExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_family_type", (q) =>
        q.eq("familyId", args.familyId).eq("type", "vehicle")
      )
      .collect();

    const thisMonthExpenses = vehicleExpenses.filter((e) => e.date >= startOfMonth.getTime());
    const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      vehicleCount: vehicles.length,
      upcomingEvents: upcomingEvents.slice(0, 5),
      totalSpentThisMonth: totalThisMonth,
    };
  },
});
