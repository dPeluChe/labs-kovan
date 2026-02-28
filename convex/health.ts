
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireFamilyAccessFromSession } from "./lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPersonWithAccessOrThrow(ctx: any, sessionToken: string, personId: any) {
  const person = await ctx.db.get(personId);
  if (!person) throw new Error("Perfil no encontrado");
  await requireFamilyAccessFromSession(ctx, sessionToken, person.familyId);
  return person;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRecordWithAccessOrThrow(ctx: any, sessionToken: string, recordId: any) {
  const record = await ctx.db.get(recordId);
  if (!record) throw new Error("Registro no encontrado");
  await getPersonWithAccessOrThrow(ctx, sessionToken, record.personId);
  return record;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getMedicationWithAccessOrThrow(ctx: any, sessionToken: string, medicationId: any) {
  const medication = await ctx.db.get(medicationId);
  if (!medication) throw new Error("Medicamento no encontrado");
  await getPersonWithAccessOrThrow(ctx, sessionToken, medication.personId);
  return medication;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getStudyWithAccessOrThrow(ctx: any, sessionToken: string, studyId: any) {
  const study = await ctx.db.get(studyId);
  if (!study) throw new Error("Estudio no encontrado");
  await getPersonWithAccessOrThrow(ctx, sessionToken, study.personId);
  return study;
}

// ==================== PERSON PROFILES ====================
export const getPersonProfiles = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    return await ctx.db
      .query("personProfiles")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();
  },
});

export const getPersonProfile = query({
  args: { sessionToken: v.string(), personId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    return await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
  },
});

export const createPersonProfile = mutation({
  args: {
    sessionToken: v.string(),
    familyId: v.id("families"),
    type: v.union(v.literal("human"), v.literal("pet")),
    name: v.string(),
    relation: v.string(),
    nickname: v.optional(v.string()), // Apodo (opcional)
    birthDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
    const { sessionToken: _sessionToken, ...payload } = args;
    return await ctx.db.insert("personProfiles", payload);
  },
});

export const updatePersonProfile = mutation({
  args: {
    sessionToken: v.string(),
    personId: v.id("personProfiles"),
    name: v.optional(v.string()),
    relation: v.optional(v.string()),
    nickname: v.optional(v.string()), // Apodo (opcional)
    birthDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
    const { personId, sessionToken: _sessionToken, ...updates } = args;
    await ctx.db.patch(personId, updates);
    return personId;
  },
});

export const deletePersonProfile = mutation({
  args: { sessionToken: v.string(), personId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
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
  args: { sessionToken: v.string(), personId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
    return await ctx.db
      .query("medicalRecords")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .collect();
  },
});

export const createMedicalRecord = mutation({
  args: {
    sessionToken: v.string(),
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
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
    const { sessionToken: _sessionToken, ...payload } = args;
    return await ctx.db.insert("medicalRecords", payload);
  },
});

export const updateMedicalRecord = mutation({
  args: {
    sessionToken: v.string(),
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
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getRecordWithAccessOrThrow(ctx, args.sessionToken, args.recordId);
    const { recordId, sessionToken: _sessionToken, ...updates } = args;
    await ctx.db.patch(recordId, updates);
    return recordId;
  },
});

export const deleteMedicalRecord = mutation({
  args: { sessionToken: v.string(), recordId: v.id("medicalRecords") },
  handler: async (ctx, args) => {
    await getRecordWithAccessOrThrow(ctx, args.sessionToken, args.recordId);
    await ctx.db.delete(args.recordId);
  },
});

// ==================== MEDICATIONS ====================
export const getMedications = query({
  args: { sessionToken: v.string(), personId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
    return await ctx.db
      .query("medications")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .collect();
  },
});

export const getActiveMedications = query({
  args: { sessionToken: v.string(), personId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
    const now = Date.now();
    const meds = await ctx.db
      .query("medications")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .collect();

    return meds.filter((med) => {
      const isActiveStatus = med.status === "active" || !med.status;
      const dateValid = !med.endDate || med.endDate > now;
      return isActiveStatus && dateValid;
    });
  },
});

export const createMedication = mutation({
  args: {
    sessionToken: v.string(),
    personId: v.id("personProfiles"),
    name: v.string(),
    dosage: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"), v.literal("paused"))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
    const { sessionToken: _sessionToken, ...payload } = args;
    return await ctx.db.insert("medications", {
      ...payload,
      status: payload.status || "active",
    });
  },
});

export const updateMedication = mutation({
  args: {
    sessionToken: v.string(),
    medicationId: v.id("medications"),
    name: v.optional(v.string()),
    dosage: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"), v.literal("paused"))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getMedicationWithAccessOrThrow(ctx, args.sessionToken, args.medicationId);
    const { medicationId, sessionToken: _sessionToken, ...updates } = args;
    await ctx.db.patch(medicationId, updates);
    return medicationId;
  },
});

export const deleteMedication = mutation({
  args: { sessionToken: v.string(), medicationId: v.id("medications") },
  handler: async (ctx, args) => {
    await getMedicationWithAccessOrThrow(ctx, args.sessionToken, args.medicationId);
    await ctx.db.delete(args.medicationId);
  },
});

// Get all medications for a person (active and inactive)
export const getAllMedications = query({
  args: { sessionToken: v.string(), personId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
    const meds = await ctx.db
      .query("medications")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .collect();

    const now = Date.now();
    return meds.map((med) => {
      const isActiveStatus = med.status === "active" || !med.status; // Default to active if undefined
      const dateValid = !med.endDate || med.endDate > now;
      return {
        ...med,
        status: med.status || (dateValid ? "active" : "completed"), // Backfill for UI
        isActive: isActiveStatus && dateValid,
      };
    });
  },
});

// ==================== MEDICAL STUDIES ====================
export const getStudies = query({
  args: { sessionToken: v.string(), personId: v.id("personProfiles") },
  handler: async (ctx, args) => {
    await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
    return await ctx.db
      .query("medicalStudies")
      .withIndex("by_person", (q) => q.eq("personId", args.personId))
      .collect();
  },
});

export const createStudy = mutation({
  args: {
    sessionToken: v.string(),
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
    await getPersonWithAccessOrThrow(ctx, args.sessionToken, args.personId);
    const { sessionToken: _sessionToken, ...payload } = args;
    return await ctx.db.insert("medicalStudies", payload);
  },
});

export const deleteStudy = mutation({
  args: { sessionToken: v.string(), studyId: v.id("medicalStudies") },
  handler: async (ctx, args) => {
    await getStudyWithAccessOrThrow(ctx, args.sessionToken, args.studyId);
    return await ctx.db.delete(args.studyId);
  },
});

// ==================== SUMMARY ====================
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
        // Updated logic for summary: check status if exists, else date
        const isActiveStatus = med.status === "active" || !med.status;
        const dateValid = !med.endDate || med.endDate > now;

        if (isActiveStatus && dateValid) {
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
