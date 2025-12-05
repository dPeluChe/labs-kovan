import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ==================== USERS & FAMILIES ====================
  users: defineTable({
    name: v.string(),
    email: v.string(),
    photoUrl: v.optional(v.string()),
    // Using Convex's built-in auth token subject
    tokenIdentifier: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_token", ["tokenIdentifier"]),

  families: defineTable({
    name: v.string(),
    emoji: v.optional(v.string()),
  }),

  familyMembers: defineTable({
    familyId: v.id("families"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    status: v.union(v.literal("active"), v.literal("invited")),
  })
    .index("by_family", ["familyId"])
    .index("by_user", ["userId"])
    .index("by_family_user", ["familyId", "userId"]),

  // ==================== GIFT LISTS ====================
  giftEvents: defineTable({
    familyId: v.id("families"),
    name: v.string(),
    date: v.optional(v.number()), // Unix timestamp
    description: v.optional(v.string()),
    createdBy: v.id("users"),
  }).index("by_family", ["familyId"]),

  giftRecipients: defineTable({
    giftEventId: v.id("giftEvents"),
    name: v.string(),
    relatedPersonId: v.optional(v.id("personProfiles")),
    notes: v.optional(v.string()),
  }).index("by_event", ["giftEventId"]),

  giftItems: defineTable({
    giftRecipientId: v.id("giftRecipients"),
    title: v.string(),
    url: v.optional(v.string()),
    priceEstimate: v.optional(v.number()),
    currency: v.optional(v.string()),
    status: v.union(
      v.literal("idea"),
      v.literal("to_buy"),
      v.literal("bought"),
      v.literal("wrapped"),
      v.literal("delivered")
    ),
    assignedTo: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  }).index("by_recipient", ["giftRecipientId"]),

  // ==================== CALENDAR ====================
  calendarIntegrations: defineTable({
    familyId: v.id("families"),
    provider: v.literal("google"),
    calendarId: v.string(),
    displayName: v.string(),
    connectedBy: v.id("users"),
  }).index("by_family", ["familyId"]),

  cachedCalendarEvents: defineTable({
    familyId: v.id("families"),
    externalId: v.string(),
    title: v.string(),
    startDateTime: v.number(),
    endDateTime: v.number(),
    location: v.optional(v.string()),
    allDay: v.boolean(),
  })
    .index("by_family", ["familyId"])
    .index("by_family_start", ["familyId", "startDateTime"]),

  // ==================== HEALTH ====================
  personProfiles: defineTable({
    familyId: v.id("families"),
    type: v.union(v.literal("human"), v.literal("pet")),
    name: v.string(),
    relation: v.string(),
    birthDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  }).index("by_family", ["familyId"]),

  medicalRecords: defineTable({
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
    attachments: v.optional(v.array(v.string())),
  }).index("by_person", ["personId"]),

  medications: defineTable({
    personId: v.id("personProfiles"),
    name: v.string(),
    dosage: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  }).index("by_person", ["personId"]),

  // ==================== LIBRARY ====================
  books: defineTable({
    familyId: v.id("families"),
    type: v.union(v.literal("book"), v.literal("manga"), v.literal("comic")),
    title: v.string(),
    author: v.optional(v.string()),
    volumeNumber: v.optional(v.number()),
    collectionName: v.optional(v.string()),
    owned: v.boolean(),
    status: v.union(
      v.literal("pending"),
      v.literal("reading"),
      v.literal("finished")
    ),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_family", ["familyId"])
    .index("by_collection", ["familyId", "collectionName"]),

  // ==================== SERVICES & VEHICLES ====================
  services: defineTable({
    familyId: v.id("families"),
    type: v.union(
      v.literal("electricity"),
      v.literal("water"),
      v.literal("internet"),
      v.literal("rent"),
      v.literal("gas"),
      v.literal("other")
    ),
    name: v.string(),
    billingCycle: v.union(
      v.literal("monthly"),
      v.literal("bimonthly"),
      v.literal("annual"),
      v.literal("other")
    ),
    dueDay: v.optional(v.string()),
    notes: v.optional(v.string()),
  }).index("by_family", ["familyId"]),

  servicePayments: defineTable({
    serviceId: v.id("services"),
    periodLabel: v.string(),
    amount: v.number(),
    paidDate: v.number(),
    paymentMethod: v.optional(v.string()),
  }).index("by_service", ["serviceId"]),

  vehicles: defineTable({
    familyId: v.id("families"),
    name: v.string(),
    plate: v.optional(v.string()),
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    year: v.optional(v.number()),
    notes: v.optional(v.string()),
  }).index("by_family", ["familyId"]),

  vehicleEvents: defineTable({
    vehicleId: v.id("vehicles"),
    type: v.union(
      v.literal("verification"),
      v.literal("service"),
      v.literal("insurance"),
      v.literal("other")
    ),
    title: v.string(),
    date: v.number(),
    amount: v.optional(v.number()),
    notes: v.optional(v.string()),
  }).index("by_vehicle", ["vehicleId"]),

  // ==================== EXPENSES (GASTOS) ====================
  expenses: defineTable({
    familyId: v.id("families"),
    category: v.union(
      v.literal("food"),
      v.literal("transport"),
      v.literal("entertainment"),
      v.literal("utilities"),
      v.literal("health"),
      v.literal("shopping"),
      v.literal("other")
    ),
    description: v.string(),
    amount: v.number(),
    date: v.number(),
    paidBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  })
    .index("by_family", ["familyId"])
    .index("by_family_date", ["familyId", "date"]),

  // ==================== RECIPES (RECETAS) ====================
  recipes: defineTable({
    familyId: v.id("families"),
    title: v.string(),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()), // Desayuno, Comida, Cena, Postre, etc.
    isFavorite: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    addedBy: v.id("users"),
  }).index("by_family", ["familyId"]),

  // ==================== PLACES (LUGARES) ====================
  places: defineTable({
    familyId: v.id("families"),
    name: v.string(),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    address: v.optional(v.string()),
    category: v.union(
      v.literal("restaurant"),
      v.literal("cafe"),
      v.literal("travel"),
      v.literal("activity"),
      v.literal("other")
    ),
    visited: v.optional(v.boolean()),
    rating: v.optional(v.number()), // 1-5
    notes: v.optional(v.string()),
    addedBy: v.id("users"),
  }).index("by_family", ["familyId"]),

  // ==================== FAMILY INVITES ====================
  familyInvites: defineTable({
    familyId: v.id("families"),
    email: v.string(),
    invitedBy: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined")),
    createdAt: v.number(),
  })
    .index("by_family", ["familyId"])
    .index("by_email", ["email"]),
});
