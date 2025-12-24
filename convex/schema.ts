
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ==================== USERS & FAMILIES ====================
  users: defineTable({
    name: v.string(),
    email: v.string(),
    photoUrl: v.optional(v.string()),
    photoStorageId: v.optional(v.id("_storage")),
    // Using Convex's built-in auth token subject
    tokenIdentifier: v.optional(v.string()),
    // Navigation preferences
    navOrder: v.optional(v.array(v.string())),
  })
    .index("by_email", ["email"])
    .index("by_token", ["tokenIdentifier"]),

  families: defineTable({
    name: v.string(),
    emoji: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
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

  // ==================== AGENT CONVERSATIONS ====================
  agentConversations: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_timestamp", ["userId", "timestamp"]),

  // ==================== GIFT LISTS ====================
  giftEvents: defineTable({
    familyId: v.id("families"),
    name: v.string(),
    date: v.optional(v.number()), // Unix timestamp
    description: v.optional(v.string()),
    isCompleted: v.optional(v.boolean()), // Mark event as finished/archived
    createdBy: v.id("users"),
  }).index("by_family", ["familyId"]),

  giftRecipients: defineTable({
    giftEventId: v.id("giftEvents"),
    name: v.string(),
    relatedPersonId: v.optional(v.id("personProfiles")),
    notes: v.optional(v.string()),
  }).index("by_event", ["giftEventId"]),

  giftItems: defineTable({
    giftEventId: v.optional(v.id("giftEvents")), // Direct link to event for unassigned items (optional for legacy data)
    giftRecipientId: v.optional(v.id("giftRecipients")), // Optional - null means unassigned
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
  })
    .index("by_recipient", ["giftRecipientId"])
    .index("by_event", ["giftEventId"]),

  // ==================== CALENDAR ====================
  calendarIntegrations: defineTable({
    familyId: v.id("families"),
    provider: v.literal("google"),
    calendarId: v.string(), // Primary calendar ID (usually 'primary' or Kovan) - Used for writing
    syncedCalendarIds: v.optional(v.array(v.string())), // List of calendar IDs to sync events from
    displayName: v.string(),
    connectedBy: v.id("users"),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    tokenExpiry: v.optional(v.number()),
    scope: v.optional(v.string()),
    lastSync: v.optional(v.number()), // Timestamp of last successful sync
  }).index("by_family", ["familyId"]),

  cachedCalendarEvents: defineTable({
    familyId: v.id("families"),
    externalId: v.string(),
    calendarId: v.optional(v.string()), // Which Google Calendar this event belongs to
    title: v.string(),
    description: v.optional(v.string()), // Added description
    startDateTime: v.number(),
    endDateTime: v.number(),
    location: v.optional(v.string()),
    allDay: v.boolean(),
    colorId: v.optional(v.string()), // For color coding based on source calendar
  })
    .index("by_family", ["familyId"])
    .index("by_family_start", ["familyId", "startDateTime"]),

  // ==================== HEALTH ====================
  personProfiles: defineTable({
    familyId: v.id("families"),
    type: v.union(v.literal("human"), v.literal("pet")),
    name: v.string(),
    relation: v.string(),
    nickname: v.optional(v.string()), // Apodo (opcional)
    birthDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
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
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
    imageUrl: v.optional(v.string()),
  }).index("by_person", ["personId"]),

  medications: defineTable({
    personId: v.id("personProfiles"),
    name: v.string(),
    dosage: v.string(),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"), v.literal("paused"))),
    notes: v.optional(v.string()),
  }).index("by_person", ["personId"]),

  petNutrition: defineTable({
    personId: v.id("personProfiles"),
    brand: v.string(),
    productName: v.optional(v.string()), // e.g., "Puppy Large Breed"
    type: v.union(v.literal("food"), v.literal("treats"), v.literal("supplement"), v.literal("other")),
    amount: v.optional(v.number()), // Cost
    weight: v.optional(v.string()), // e.g., "15kg"
    purchaseDate: v.number(),
    store: v.optional(v.string()), // Where it was bought
    notes: v.optional(v.string()),
    addedBy: v.optional(v.id("users")),
  }).index("by_person", ["personId"])
    .index("by_person_date", ["personId", "purchaseDate"]),

  // ==================== LIBRARY ====================
  // ==================== COLLECTIONS (Old Library) ====================
  collections: defineTable({
    familyId: v.id("families"),
    type: v.union(
      v.literal("book"),
      v.literal("manga"),
      v.literal("comic"),
      v.literal("board_game"),
      v.literal("video_game"),
      v.literal("collectible"),
      v.literal("other")
    ),
    title: v.string(),
    creator: v.optional(v.string()), // Author, Designer, Developer
    series: v.optional(v.string()), // Collection name, Saga
    volumeOrVersion: v.optional(v.string()), // Vol 1, 2nd Edition, etc.
    owned: v.boolean(),
    status: v.union(
      v.literal("wishlist"),
      v.literal("owned_unread"), // Or unplayed
      v.literal("in_progress"),
      v.literal("finished"), // Read / Played
      v.literal("abandoned")
    ),
    location: v.optional(v.string()),
    rating: v.optional(v.number()),
    notes: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    addedBy: v.id("users"),
  })
    .index("by_family", ["familyId"])
    .index("by_family_type", ["familyId", "type"])
    .index("by_series", ["familyId", "series"]),

  // ==================== VEHICLES (AUTOS) ====================
  vehicles: defineTable({
    familyId: v.id("families"),
    name: v.string(),
    plate: v.optional(v.string()),
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    year: v.optional(v.number()),
    color: v.optional(v.string()),
    notes: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).index("by_family", ["familyId"]),

  vehicleEvents: defineTable({
    vehicleId: v.id("vehicles"),
    type: v.union(
      v.literal("verification"),
      v.literal("service"),
      v.literal("insurance"),
      v.literal("fuel"),
      v.literal("repair"),
      v.literal("other")
    ),
    title: v.string(),
    date: v.number(),
    nextDate: v.optional(v.number()), // Para recordatorios (próxima verificación, etc.)
    odometer: v.optional(v.number()), // Kilometraje
    amount: v.optional(v.number()), // Monto del gasto (también se registra en expenses)
    notes: v.optional(v.string()),
  }).index("by_vehicle", ["vehicleId"]),

  // ==================== SUBSCRIPTIONS (SUSCRIPCIONES) ====================
  subscriptions: defineTable({
    familyId: v.id("families"),
    name: v.string(), // "Netflix", "Luz CFE", "Spotify"
    type: v.union(
      v.literal("streaming"),   // Netflix, Spotify, Disney+
      v.literal("utility"),     // Luz, Agua, Gas
      v.literal("internet"),    // Internet, Teléfono
      v.literal("insurance"),   // Seguros
      v.literal("membership"),  // Gimnasio, Costco
      v.literal("software"),    // Apps, servicios digitales
      v.literal("other")
    ),
    amount: v.optional(v.number()),      // Monto estimado/fijo
    billingCycle: v.union(
      v.literal("monthly"),
      v.literal("bimonthly"),
      v.literal("quarterly"),
      v.literal("annual"),
      v.literal("variable")     // Para servicios como luz/agua
    ),
    dueDay: v.optional(v.number()),      // Día del mes
    isActive: v.optional(v.boolean()),

    // Payment info
    referenceNumber: v.optional(v.string()), // Contrato
    barcodeType: v.optional(v.union(v.literal("code128"), v.literal("qr"))),
    barcodeValue: v.optional(v.string()),

    notes: v.optional(v.string()),
  }).index("by_family", ["familyId"]),

  // ==================== EXPENSES (GASTOS UNIFICADO) ====================
  expenses: defineTable({
    familyId: v.id("families"),

    // Tipo principal del gasto
    type: v.union(
      v.literal("general"),      // Gasto puntual normal
      v.literal("subscription"), // Pago de suscripción
      v.literal("vehicle"),      // Gasto de auto
      v.literal("gift"),          // Gasto de regalo
      v.literal("trip")           // Gasto de viaje
    ),

    // Categoría secundaria (para reportes y filtros)
    category: v.union(
      v.literal("food"),
      v.literal("transport"),
      v.literal("entertainment"),
      v.literal("utilities"),
      v.literal("health"),
      v.literal("shopping"),
      v.literal("home"),
      v.literal("education"),
      v.literal("gifts"),
      v.literal("vehicle"),
      v.literal("subscription"),
      v.literal("trip"),
      v.literal("other")
    ),

    // Relaciones opcionales (para conectar con otros módulos)
    tripId: v.optional(v.id("trips")),
    vehicleId: v.optional(v.id("vehicles")),
    vehicleEventId: v.optional(v.id("vehicleEvents")),
    subscriptionId: v.optional(v.id("subscriptions")),
    giftItemId: v.optional(v.id("giftItems")),
    giftEventId: v.optional(v.id("giftEvents")),

    // Datos del gasto
    description: v.string(),
    amount: v.number(),
    date: v.number(),
    paidBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  })
    .index("by_family", ["familyId"])
    .index("by_family_date", ["familyId", "date"])
    .index("by_family_type", ["familyId", "type"])
    .index("by_trip", ["tripId"])
    .index("by_vehicle", ["vehicleId"])
    .index("by_subscription", ["subscriptionId"])
    .index("by_gift_event", ["giftEventId"]),

  // ==================== LOANS (PRÉSTAMOS) ====================
  loans: defineTable({
    familyId: v.id("families"),
    type: v.union(v.literal("lent"), v.literal("borrowed")), // lent=Presté (Asset), borrowed=Me prestaron (Liability)
    personName: v.string(), // Quién (Externo o texto libre)
    amount: v.number(), // Monto original
    balance: v.number(), // Saldo pendiente
    currency: v.optional(v.string()),
    date: v.number(), // Fecha del préstamo
    dueDate: v.optional(v.number()), // Fecha límite
    status: v.union(v.literal("active"), v.literal("settled"), v.literal("defaulted")),
    notes: v.optional(v.string()),
    relatedExpenseId: v.optional(v.id("expenses")),
    createdBy: v.id("users"),
  }).index("by_family", ["familyId"]),

  loanPayments: defineTable({
    loanId: v.id("loans"),
    amount: v.number(),
    date: v.number(),
    notes: v.optional(v.string()),
    registeredBy: v.id("users"),
  }).index("by_loan", ["loanId"]),

  // ==================== RECIPES (RECETAS) ====================
  recipes: defineTable({
    familyId: v.id("families"),
    title: v.string(),
    url: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    description: v.optional(v.string()),
    category: v.optional(v.string()), // Desayuno, Comida, Cena, Postre, etc.
    isFavorite: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    addedBy: v.id("users"),
  }).index("by_family", ["familyId"]),

  // ==================== PLACES (LUGARES) ====================
  placeLists: defineTable({
    familyId: v.id("families"),
    name: v.string(), // e.g. "GDL", "Japón 2025", "Fin de semana"
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
  }).index("by_family", ["familyId"]),

  places: defineTable({
    familyId: v.id("families"),
    listId: v.optional(v.id("placeLists")), // Link to a group/list
    name: v.string(),
    url: v.optional(v.string()), // Post/red social/recomendación
    mapsUrl: v.optional(v.string()), // Google Maps URL
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    address: v.optional(v.string()),
    highlight: v.optional(v.string()), // "Qué te gustó / Qué venden"
    category: v.union(
      v.literal("restaurant"),
      v.literal("cafe"),
      v.literal("travel"),
      v.literal("activity"),
      v.literal("other")
    ),
    // Cached status for quick access, but detailed history is in placeVisits
    visited: v.optional(v.boolean()),
    rating: v.optional(v.number()), // 1-5 (Current/Latest rating)
    notes: v.optional(v.string()), // General notes
    addedBy: v.optional(v.id("users")),
  })
    .index("by_family", ["familyId"])
    .index("by_list", ["listId"]),

  placeVisits: defineTable({
    placeId: v.id("places"),
    familyId: v.id("families"),
    visitDate: v.number(),
    rating: v.optional(v.number()),
    notes: v.optional(v.string()), // Review/Bitácora
    images: v.optional(v.array(v.string())),
    visitType: v.optional(v.string()), // e.g., "Casual", "Date", "Celebration"
    visitedBy: v.optional(v.id("users")),
  })
    .index("by_place", ["placeId"])
    .index("by_family", ["familyId"]),

  // ==================== TRIPS (VIAJES) ====================
  trips: defineTable({
    familyId: v.id("families"),
    name: v.string(), // "Japón 2025"
    destination: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.union(v.literal("planning"), v.literal("confirmed"), v.literal("active"), v.literal("completed")),
    budget: v.optional(v.number()),
    coverImage: v.optional(v.string()),
    description: v.optional(v.string()),
    members: v.optional(v.array(v.id("users"))), // Who is going?
    placeListId: v.optional(v.union(v.id("placeLists"), v.null())), // Link to specific category/list of places
  }).index("by_family", ["familyId"]),

  tripBookings: defineTable({
    tripId: v.id("trips"),
    type: v.union(
      v.literal("flight"),
      v.literal("hotel"),
      v.literal("transport"), // Train, Bus
      v.literal("rental"), // Car
      v.literal("activity"), // Tours
      v.literal("other")
    ),
    provider: v.string(), // "Aeromexico", "Marriott"
    confirmationCode: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    location: v.optional(v.string()), // Airport, Address
    cost: v.optional(v.number()),
    currency: v.optional(v.string()),
    notes: v.optional(v.string()),
    files: v.optional(v.array(v.string())),
  }).index("by_trip", ["tripId"]),

  tripPlans: defineTable({
    tripId: v.id("trips"),
    // If dayDate is null/undefined, it's in the "general ideas" bucket
    dayDate: v.optional(v.number()),
    time: v.optional(v.string()), // "14:00"
    order: v.number(), // Order within the day
    placeId: v.optional(v.id("places")), // Optional link to a saved spot
    activity: v.string(), // "Breakfast at...", "Visit Museum"
    notes: v.optional(v.string()),
    isCompleted: v.boolean(),
    cost: v.optional(v.number()),
  })
    .index("by_trip", ["tripId"])
    .index("by_trip_date", ["tripId", "dayDate"]),

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

  // ==================== CONTACTS DIRECTORY ====================
  contacts: defineTable({
    familyId: v.id("families"),
    name: v.string(),
    category: v.union(
      v.literal("doctor"),
      v.literal("veterinarian"),
      v.literal("mechanic"),
      v.literal("plumber"),
      v.literal("electrician"),
      v.literal("dentist"),
      v.literal("emergency"),
      v.literal("other")
    ),
    specialty: v.optional(v.string()), // e.g., "Cardiólogo", "Pediatra"
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
    isFavorite: v.optional(v.boolean()),
    addedBy: v.id("users"),
  }).index("by_family", ["familyId"]),

  // ==================== MEDICAL STUDIES ====================
  medicalStudies: defineTable({
    personId: v.id("personProfiles"),
    title: v.string(), // e.g., "Biometría hemática"
    date: v.number(),
    laboratory: v.optional(v.string()),
    doctorName: v.optional(v.string()),
    results: v.array(v.object({
      parameter: v.string(), // e.g., "Glucosa"
      value: v.string(),     // e.g., "95"
      unit: v.optional(v.string()), // e.g., "mg/dL"
      reference: v.optional(v.string()), // e.g., "70-100"
      status: v.optional(v.union(v.literal("normal"), v.literal("high"), v.literal("low"))),
    })),
    notes: v.optional(v.string()),
    fileUrl: v.optional(v.string()), // For storing PDF/image
    fileStorageId: v.optional(v.id("_storage")),
  }).index("by_person", ["personId"]),

  // ==================== FEATURE REQUESTS ====================
  featureRequests: defineTable({
    title: v.string(),
    description: v.string(),
    email: v.optional(v.string()), // Optional contact email
    category: v.optional(v.string()),
    status: v.union(
      v.literal("new"),
      v.literal("reviewed"),
      v.literal("planned"),
      v.literal("completed"),
      v.literal("rejected")
    ),
    createdAt: v.number(),
  }).index("by_status", ["status"]),

  // ==================== DOCUMENTS (VAULT) ====================
  documents: defineTable({
    familyId: v.id("families"),
    personId: v.optional(v.id("personProfiles")),
    title: v.string(),
    type: v.union(
      v.literal("identity"),
      v.literal("travel"),
      v.literal("financial"),
      v.literal("insurance"),
      v.literal("education"),
      v.literal("health"),
      v.literal("other")
    ),
    documentNumber: v.optional(v.string()),
    issuingAuthority: v.optional(v.string()),
    expiryDate: v.optional(v.number()),
    issueDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    files: v.optional(v.array(v.string())),
    storageIds: v.optional(v.array(v.id("_storage"))),
    isArchived: v.optional(v.boolean()),
    addedBy: v.id("users"),
  })
    .index("by_family", ["familyId"])
    .index("by_person", ["personId"])
    .index("by_expiry", ["familyId", "expiryDate"]),

  // ==================== TASKS ====================
  tasks: defineTable({
    familyId: v.id("families"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("completed")),
    type: v.union(
      v.literal("general"), // Pendientes generales
      v.literal("shopping"), // Lista de super
      v.literal("chore") // Tareas domésticas / recurrentes
    ),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    dueDate: v.optional(v.number()), // Para tareas con fecha límite
    recurrence: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))), // Para tareas recurrentes
    assignedTo: v.optional(v.id("users")),
    createdBy: v.id("users"),
    tags: v.optional(v.array(v.string())), // Útil para categorías de super (Lácteos, Frutas, etc.) o contextos
  })
    .index("by_family", ["familyId"])
    .index("by_family_status", ["familyId", "status"])
    .index("by_family_type", ["familyId", "type"])
    .index("by_assignee", ["assignedTo"]),

  // ==================== GAMES / ACTIVITIES ====================
  gamePresets: defineTable({
    familyId: v.id("families"),
    gameType: v.union(v.literal("roulette"), v.literal("headsup")),
    name: v.string(),
    items: v.array(v.string()),
    isDefault: v.optional(v.boolean()),
    createdBy: v.id("users"),
  })
    .index("by_family_game", ["familyId", "gameType"])
    .index("by_family", ["familyId"]),

  gameSessions: defineTable({
    familyId: v.id("families"),
    gameType: v.union(v.literal("roulette"), v.literal("headsup")),
    presetId: v.optional(v.id("gamePresets")),
    winner: v.optional(v.string()),
    participants: v.array(v.string()),
    result: v.optional(v.string()), // For headsup: score, for roulette: winner
    playedAt: v.number(),
    playedBy: v.id("users"),
  })
    .index("by_family", ["familyId"])
    .index("by_family_type", ["familyId", "gameType"])
    .index("by_preset", ["presetId"]),

  // ==================== NUTRITION ====================
  nutritionPlans: defineTable({
    familyId: v.id("families"),
    name: v.string(),
    description: v.optional(v.string()),
    targets: v.object({
      calories: v.optional(v.number()),
      protein: v.optional(v.number()),
      carbs: v.optional(v.number()),
      fat: v.optional(v.number()),
      veggies: v.optional(v.number()),
      fruits: v.optional(v.number()),
      dairy: v.optional(v.number()),
      legumes: v.optional(v.number()),
    }),
    createdBy: v.id("users"),
  }).index("by_family", ["familyId"]),

  nutritionAssignments: defineTable({
    familyId: v.id("families"),
    planId: v.id("nutritionPlans"),
    personId: v.id("personProfiles"),
    startDate: v.number(),
    endDate: v.number(),
    isActive: v.boolean(),
  })
    .index("by_family", ["familyId"])
    .index("by_person", ["personId"])
    .index("by_person_active", ["personId", "isActive"]),

  nutritionMeals: defineTable({
    familyId: v.id("families"),
    personId: v.id("personProfiles"),
    date: v.string(), // YYYY-MM-DD
    name: v.string(), // e.g. "Desayuno", "Pollo con arroz"
    content: v.object({
      protein: v.optional(v.number()),
      carbs: v.optional(v.number()),
      fat: v.optional(v.number()),
      veggies: v.optional(v.number()),
      fruits: v.optional(v.number()),
      dairy: v.optional(v.number()),
      legumes: v.optional(v.number()),
      water: v.optional(v.number()),
      other: v.optional(v.number()),
    }),
    timestamp: v.number(),
    addedBy: v.optional(v.id("users")),
  })
    .index("by_person_date", ["personId", "date"]),

  nutritionLogs: defineTable({
    familyId: v.id("families"),
    personId: v.id("personProfiles"),
    date: v.string(), // YYYY-MM-DD
    consumed: v.object({
      protein: v.optional(v.number()),
      carbs: v.optional(v.number()),
      fat: v.optional(v.number()),
      veggies: v.optional(v.number()),
      fruits: v.optional(v.number()),
      dairy: v.optional(v.number()),
      water: v.optional(v.number()),
      calories: v.optional(v.number()),
      legumes: v.optional(v.number()),
      other: v.optional(v.number()),
    }),
  })
    .index("by_person_date", ["personId", "date"]),
});
