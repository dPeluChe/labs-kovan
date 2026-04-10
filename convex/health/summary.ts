import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireFamilyAccessFromSession } from "../lib/auth";

export const getHealthSummary = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const profiles = await ctx.db
      .query("personProfiles")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const recentRecords: Array<{
      personName: string;
      record: {
        _id: string;
        type: string;
        title: string;
        date: number;
      };
    }> = [];
    const activeMedications: Array<{
      personName: string;
      medication: {
        _id: string;
        name: string;
        dosage: string;
        startDate: number;
        endDate?: number;
      };
    }> = [];

    for (const profile of profiles) {
      const records = await ctx.db
        .query("medicalRecords")
        .withIndex("by_person", (q) => q.eq("personId", profile._id))
        .collect();

      for (const record of records) {
        if (record.date > thirtyDaysAgo) {
          recentRecords.push({ personName: profile.name, record });
        }
      }

      const meds = await ctx.db
        .query("medications")
        .withIndex("by_person", (q) => q.eq("personId", profile._id))
        .collect();

      for (const med of meds) {
        const isActiveStatus = med.status === "active" || !med.status;
        const dateValid = !med.endDate || med.endDate > now;

        if (isActiveStatus && dateValid) {
          activeMedications.push({ personName: profile.name, medication: med });
        }
      }
    }

    recentRecords.sort((a, b) => b.record.date - a.record.date);

    return {
      profileCount: profiles.length,
      profiles: profiles.map((p) => ({ _id: p._id, name: p.name, relation: p.relation })),
      recentRecords: recentRecords.slice(0, 5),
      activeMedications,
    };
  },
});
