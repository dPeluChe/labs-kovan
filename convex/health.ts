import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==================== PERSON PROFILES ====================
export const getPersonProfiles = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("personProfiles")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();
  },
});

export const getPersonProfile = query({
  args: { personId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.personId);
  },
});

export const createPersonProfile = mutation({
  args: {
    familyId: v.id("families"),
    type: v.union(v.literal("human"), v.literal("pet")),
    name: v.string(),
    relation: v.string(),
    birthDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("personProfiles", args);
  },
});

export const updatePersonProfile = mutation({
  args: {
    personId: v.id("personProfiles"),
    name: v.optional(v.string()),
    relation: v.optional(v.string()),
    birthDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { personId, ...updates } = args;
    await ctx.db.patch(personId, updates);
    return personId;
  },
});

export const deletePersonProfile = mutation({
  args: { personId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    // Delete all medical records
    const records = await ctx.db
      .query("medicalRecords")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .collect();
    for (const record of records) {
      await ctx.db.delete(record._id);
    }

    // Delete all medications
    const meds = await ctx.db
      .query("medications")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .collect();
    for (const med of meds) {
      await ctx.db.delete(med._id);
    }

    await ctx.db.delete(args.personId);
  },
});

// ==================== MEDICAL RECORDS ====================
export const getMedicalRecords = query({
  args: { personId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("medicalRecords")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .collect();
  },
});

export const createMedicalRecord = mutation({
  args: {
    personId: v.id("personProfiles"),
    type: v.union(
      v.literal("consultation"),
      v.literal("study"),
      v.literal("note")
    ),
    title: v.string(),
    description: v.optional(v.string()),
    date: v.number(),
    doctorName: v.optional(v.string()),
    clinicName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("medicalRecords", args);
  },
});

export const updateMedicalRecord = mutation({
  args: {
    recordId: v.id("medicalRecords"),
    type: v.optional(
      v.union(
        v.literal("consultation"),
        v.literal("study"),
        v.literal("note")
      )
    ),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    doctorName: v.optional(v.string()),
    clinicName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { recordId, ...updates } = args;
    await ctx.db.patch(recordId, updates);
    return recordId;
  },
});

export const deleteMedicalRecord = mutation({
  args: { recordId: v.id("medicalRecords") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.recordId);
  },
});

// ==================== MEDICATIONS ====================
export const getMedications = query({
  args: { personId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("medications")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .collect();
  },
});

export const getActiveMedications = query({
  args: { personId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const meds = await ctx.db
      .query("medications")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .collect();

    return meds.filter((med) => !med.endDate || med.endDate > now);
  },
});

export const createMedication = mutation({
  args: {
    personId: v.id("personProfiles"),
    name: v.string(),
    dosage: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("medications", args);
  },
});

export const updateMedication = mutation({
  args: {
    medicationId: v.id("medications"),
    name: v.optional(v.string()),
    dosage: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { medicationId, ...updates } = args;
    await ctx.db.patch(medicationId, updates);
    return medicationId;
  },
});

export const deleteMedication = mutation({
  args: { medicationId: v.id("medications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.medicationId);
  },
});

// Get all medications for a person (active and inactive)
export const getAllMedications = query({
  args: { personId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    const meds = await ctx.db
      .query("medications")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .collect();

    const now = Date.now();
    return meds.map((med) => ({
      ...med,
      isActive: !med.endDate || med.endDate > now,
    }));
  },
});

// ==================== MEDICAL STUDIES ====================
export const getStudies = query({
  args: { personId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("medicalStudies")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .collect();
  },
});

export const createStudy = mutation({
  args: {
    personId: v.id("personProfiles"),
    title: v.string(),
    date: v.number(),
    laboratory: v.optional(v.string()),
    doctorName: v.optional(v.string()),
    results: v.array(v.object({
      parameter: v.string(),
      value: v.string(),
      unit: v.optional(v.string()),
      reference: v.optional(v.string()),
      status: v.optional(v.union(v.literal("normal"), v.literal("high"), v.literal("low"))),
    })),
    notes: v.optional(v.string()),
    fileStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("medicalStudies", args);
  },
});

export const deleteStudy = mutation({
  args: { studyId: v.id("medicalStudies") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.studyId);
  },
});

// ==================== SUMMARY ====================
export const getHealthSummary = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
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
        if (!med.endDate || med.endDate > now) {
          activeMedications.push({ personName: profile.name, medication: med });
        }
      }
    }

    // Sort by date descending
    recentRecords.sort((a, b) => b.record.date - a.record.date);

    return {
      profileCount: profiles.length,
      profiles: profiles.map((p) => ({ _id: p._id, name: p.name, relation: p.relation })),
      recentRecords: recentRecords.slice(0, 5),
      activeMedications,
    };
  },
});
