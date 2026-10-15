/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { sha256Hex } from "./lib/auth";

const modules = import.meta.glob("./**/*.ts");
const makeBackend = () => convexTest(schema, modules);
type Backend = ReturnType<typeof makeBackend>;
const DAY = 24 * 60 * 60 * 1000;

async function seedFamily(t: Backend, memberCount = 1) {
  return await t.run(async (ctx) => {
    const familyId = await ctx.db.insert("families", { name: "Fam" });
    const userIds: Id<"users">[] = [];
    for (let i = 0; i < memberCount; i++) {
      const userId = await ctx.db.insert("users", { name: `User${i}`, email: `u${i}@t.com` });
      await ctx.db.insert("familyMembers", {
        familyId, userId, role: i === 0 ? "owner" : "member", status: "active",
      });
      userIds.push(userId);
    }
    const sessionToken = `token-${familyId}`;
    await ctx.db.insert("sessions", {
      userId: userIds[0],
      tokenHash: await sha256Hex(sessionToken),
      createdAt: Date.now(),
      expiresAt: Date.now() + DAY,
    });
    return { familyId, userIds, sessionToken };
  });
}

type GiftStatus = "idea" | "to_buy" | "bought" | "wrapped" | "delivered";

async function seedGiftEvent(
  t: Backend,
  items: { title: string; status: GiftStatus; recipient?: number; priceEstimate?: number }[]
) {
  const { familyId, userIds, sessionToken } = await seedFamily(t);
  const { eventId, recipientIds } = await t.run(async (ctx) => {
    const eventId = await ctx.db.insert("giftEvents", {
      familyId, name: "Navidad", createdBy: userIds[0],
    });
    const recipientIds: Id<"giftRecipients">[] = [];
    for (const name of ["Ana", "Beto", "Coco"]) {
      recipientIds.push(await ctx.db.insert("giftRecipients", { giftEventId: eventId, name }));
    }
    for (const i of items) {
      await ctx.db.insert("giftItems", {
        giftEventId: eventId,
        giftRecipientId: i.recipient === undefined ? undefined : recipientIds[i.recipient],
        title: i.title,
        status: i.status,
        priceEstimate: i.priceEstimate,
      });
    }
    return { eventId, recipientIds };
  });
  return { eventId, recipientIds, sessionToken };
}

describe("household.getRecentLogs", () => {
  it("enriches logs with activity and user data", async () => {
    const t = makeBackend();
    const { familyId, userIds, sessionToken } = await seedFamily(t, 2);
    const [u0, u1] = userIds;
    await t.run(async (ctx) => {
      const base = { familyId, points: 5, category: "cleaning" as const, isActive: true, createdBy: u0 };
      const activityId = await ctx.db.insert("householdActivities", { ...base, name: "Lavar platos", emoji: "🍽️" });
      const goneId = await ctx.db.insert("householdActivities", { ...base, name: "Vieja", emoji: "🧹", points: 3 });
      const now = Date.now();
      // Same activity twice, one log registered by a different member.
      await ctx.db.insert("householdActivityLogs", { familyId, activityId, userId: u0, loggedBy: u0, points: 5, date: now - 2000 });
      await ctx.db.insert("householdActivityLogs", { familyId, activityId, userId: u1, loggedBy: u0, points: 5, date: now - 1000 });
      await ctx.db.insert("householdActivityLogs", { familyId, activityId: goneId, userId: u0, loggedBy: u0, points: 3, date: now });
      await ctx.db.delete(goneId);
    });

    const logs = await t.query(api.household.getRecentLogs, { sessionToken, familyId });

    // Newest first
    expect(logs.map((l) => l.activityName)).toEqual(["Actividad eliminada", "Lavar platos", "Lavar platos"]);
    expect(logs[0].activityEmoji).toBe("❓");
    expect(logs[1]).toMatchObject({ activityEmoji: "🍽️", userName: "User1", loggedByName: "User0" });
    expect(logs[2].loggedByName).toBeUndefined();
  });
});

describe("gifts.getAllGiftItemsForEvent", () => {
  it("groups event items by recipient and skips unassigned", async () => {
    const t = makeBackend();
    const { eventId, recipientIds, sessionToken } = await seedGiftEvent(t, [
      { title: "A1", status: "idea", recipient: 0 },
      { title: "A2", status: "bought", recipient: 0 },
      { title: "B1", status: "to_buy", recipient: 1 },
      { title: "Sin asignar", status: "idea" },
    ]);
    const [r1, r2] = recipientIds;

    const grouped = await t.query(api.gifts.getAllGiftItemsForEvent, { sessionToken, eventId });

    expect(grouped).toHaveLength(3);
    const titles = (id: Id<"giftRecipients">) =>
      grouped.find((g) => g.recipient._id === id)?.items.map((i) => i.title);
    expect(titles(r1)).toEqual(["A1", "A2"]);
    expect(titles(r2)).toEqual(["B1"]);
    // Unassigned items are not attached to any recipient group
    expect(grouped.flatMap((g) => g.items.map((i) => i.title))).not.toContain("Sin asignar");
  });
});

describe("gifts.getGiftEventSummary", () => {
  it("aggregates only items assigned to the event's recipients", async () => {
    const t = makeBackend();
    const { eventId, sessionToken } = await seedGiftEvent(t, [
      { title: "A1", status: "idea", recipient: 0, priceEstimate: 10 },
      { title: "A2", status: "bought", recipient: 0, priceEstimate: 20 },
      { title: "A3", status: "to_buy", recipient: 0 },
      { title: "Sin asignar", status: "bought", priceEstimate: 999 },
    ]);

    const summary = await t.query(api.gifts.getGiftEventSummary, { sessionToken, eventId });

    expect(summary).toMatchObject({ recipientCount: 3, totalItems: 3, totalEstimate: 30 });
    expect(summary.byStatus).toEqual({ idea: 1, to_buy: 1, bought: 1, wrapped: 0, delivered: 0 });
  });
});

describe("gifts.getRecipientsWithStatus", () => {
  it("computes per-recipient item counts", async () => {
    const t = makeBackend();
    const { eventId, recipientIds, sessionToken } = await seedGiftEvent(t, [
      { title: "A1", status: "idea", recipient: 0 },
      { title: "A2", status: "delivered", recipient: 0 },
      { title: "C1", status: "wrapped", recipient: 2 },
    ]);
    const [r1, r2, r3] = recipientIds;

    const result = await t.query(api.gifts.getRecipientsWithStatus, { sessionToken, eventId });

    expect(result).toHaveLength(3);
    const byId = (id: Id<"giftRecipients">) => result.find((r) => r._id === id);
    expect(byId(r1)).toMatchObject({ totalItems: 2, pending: 1, bought: 1, allBought: false, hasNoGifts: false });
    expect(byId(r2)).toMatchObject({ totalItems: 0, pending: 0, bought: 0, allBought: false, hasNoGifts: true });
    expect(byId(r3)).toMatchObject({ totalItems: 1, pending: 0, bought: 1, allBought: true, hasNoGifts: false });
  });
});

describe("gifts.updateGiftItem", () => {
  it("creates the expense once when marking an item as bought", async () => {
    const t = makeBackend();
    const { familyId, userIds, sessionToken } = await seedFamily(t);
    const itemId = await t.run(async (ctx) =>
      ctx.db.insert("giftItems", {
        giftEventId: await ctx.db.insert("giftEvents", { familyId, name: "Navidad", createdBy: userIds[0] }),
        title: "A1",
        status: "to_buy",
        priceEstimate: 50,
      })
    );
    const linkedExpenses = () =>
      t.run(async (ctx) =>
        (await ctx.db.query("expenses").collect()).filter((e) => e.giftItemId === itemId)
      );

    await t.mutation(api.gifts.updateGiftItem, { sessionToken, itemId, status: "bought" });
    expect(await linkedExpenses()).toHaveLength(1);

    // Back to pending and bought again: the existing expense is found by
    // the by_gift_item index, so no duplicate is inserted.
    await t.mutation(api.gifts.updateGiftItem, { sessionToken, itemId, status: "to_buy" });
    await t.mutation(api.gifts.updateGiftItem, { sessionToken, itemId, status: "bought" });
    const expenses = await linkedExpenses();
    expect(expenses).toHaveLength(1);
    expect(expenses[0]).toMatchObject({ amount: 50, type: "gift" });
  });
});

describe("vehicles.deleteVehicleEvent", () => {
  it("deletes only the expenses linked to the event", async () => {
    const t = makeBackend();
    const { familyId, sessionToken } = await seedFamily(t);
    const { eventId, otherExpenseId } = await t.run(async (ctx) => {
      const vehicleId = await ctx.db.insert("vehicles", { familyId, name: "Tsuru" });
      const eventId = await ctx.db.insert("vehicleEvents", { vehicleId, type: "service", title: "Afinación", date: Date.now() });
      await ctx.db.insert("expenses", {
        familyId, type: "vehicle", category: "vehicle", description: "Afinación",
        amount: 100, date: Date.now(), vehicleId, vehicleEventId: eventId,
      });
      const otherExpenseId = await ctx.db.insert("expenses", {
        familyId, type: "general", category: "other", description: "Otro", amount: 10, date: Date.now(),
      });
      return { eventId, otherExpenseId };
    });

    await t.mutation(api.vehicles.deleteVehicleEvent, { sessionToken, eventId });

    const remaining = await t.run((ctx) => ctx.db.query("expenses").collect());
    expect(remaining.map((e) => e._id)).toEqual([otherExpenseId]);
    expect(await t.run((ctx) => ctx.db.get(eventId))).toBeNull();
  });
});

describe("places.getAllVisits", () => {
  it("joins visit place data and tolerates deleted places", async () => {
    const t = makeBackend();
    const { familyId, sessionToken } = await seedFamily(t);
    await t.run(async (ctx) => {
      const p1 = await ctx.db.insert("places", { familyId, name: "Café X", category: "cafe", imageUrl: "img1" });
      const p2 = await ctx.db.insert("places", { familyId, name: "Ramen Y", category: "restaurant" });
      const now = Date.now();
      // Two visits share p1 (dedupe path) and one visit points to a
      // place that is deleted afterwards.
      for (const [placeId, visitDate] of [[p1, now - 2000], [p1, now - 1000], [p2, now]] as const) {
        await ctx.db.insert("placeVisits", { placeId, familyId, visitDate });
      }
      await ctx.db.delete(p2);
    });

    const visits = await t.query(api.places.getAllVisits, { sessionToken, familyId });

    expect(visits.map((v) => v.placeName)).toEqual(["Lugar eliminado", "Café X", "Café X"]);
    expect(visits[0].placeImage).toBeUndefined();
    expect(visits[1].placeImage).toBe("img1");
  });
});

describe("health.getHealthSummary", () => {
  it("bounds records to the last 30 days and lists active meds", async () => {
    const t = makeBackend();
    const { familyId, sessionToken } = await seedFamily(t);
    await t.run(async (ctx) => {
      const personId = await ctx.db.insert("personProfiles", { familyId, type: "human", name: "Ana", relation: "Hija" });
      const now = Date.now();
      await ctx.db.insert("medicalRecords", { personId, type: "consultation", title: "Reciente", date: now - DAY });
      await ctx.db.insert("medicalRecords", { personId, type: "note", title: "Viejo", date: now - 40 * DAY });
      await ctx.db.insert("medications", { personId, name: "Vitamina D", dosage: "1", startDate: now - 10 * DAY, status: "active" });
      await ctx.db.insert("medications", { personId, name: "Antibiótico", dosage: "2", startDate: now - 60 * DAY, status: "completed" });
    });

    const summary = await t.query(api.health.getHealthSummary, { sessionToken, familyId });

    expect(summary.profileCount).toBe(1);
    expect(summary.recentRecords.map((r) => r.record.title)).toEqual(["Reciente"]);
    expect(summary.activeMedications.map((m) => m.medication.name)).toEqual(["Vitamina D"]);
  });
});

describe("nutrition.getAssignments", () => {
  it("enriches each assignment with its plan, null when deleted", async () => {
    const t = makeBackend();
    const { familyId, userIds, sessionToken } = await seedFamily(t);
    const { personId, planId } = await t.run(async (ctx) => {
      const personId = await ctx.db.insert("personProfiles", { familyId, type: "human", name: "Ana", relation: "Hija" });
      const plan = { familyId, targets: {}, createdBy: userIds[0] };
      const planId = await ctx.db.insert("nutritionPlans", { ...plan, name: "Plan A" });
      const goneId = await ctx.db.insert("nutritionPlans", { ...plan, name: "Borrado" });
      // Two assignments share the same plan (dedupe path); one points to a
      // deleted plan.
      for (const [pId, startDate, endDate, isActive] of [
        [planId, 1, 10, false],
        [planId, 11, 20, true],
        [goneId, 21, 30, false],
      ] as const) {
        await ctx.db.insert("nutritionAssignments", { familyId, planId: pId, personId, startDate, endDate, isActive });
      }
      await ctx.db.delete(goneId);
      return { personId, planId };
    });

    const assignments = await t.query(api.nutrition.getAssignments, { sessionToken, personId });

    // by_person index, desc → reverse insertion order
    expect(assignments.map((a) => a.plan?._id ?? null)).toEqual([null, planId, planId]);
  });
});

describe("diary.getEntries", () => {
  it("returns newest visible entries; limit bounds raw reads (hidden ones count)", async () => {
    const t = makeBackend();
    const { familyId, userIds, sessionToken } = await seedFamily(t, 2);
    const [u0, u1] = userIds;
    const now = Date.now();
    await t.run(async (ctx) => {
      const entry = (userId: Id<"users">, visibility: "private" | "family", date: number, content: string) =>
        ctx.db.insert("diaryEntries", { familyId, userId, visibility, date, content });
      await entry(u1, "family", now - 3000, "familia vieja");
      await entry(u1, "private", now - 1000, "privada ajena");
      await entry(u0, "private", now - 2000, "privada mía");
      await entry(u0, "family", now, "familia nueva");
    });

    const all = await t.query(api.diary.getEntries, { sessionToken, familyId });
    // Newest first; the other member's private entry never leaks.
    expect(all.map((e) => e.content)).toEqual(["familia nueva", "privada mía", "familia vieja"]);

    // take() applies before the visibility filter.
    const capped = await t.query(api.diary.getEntries, { sessionToken, familyId, limit: 3 });
    expect(capped.map((e) => e.content)).toEqual(["familia nueva", "privada mía"]);
  });
});

describe("calendar.syncCalendarEvents", () => {
  it("diffs by externalId: patches changed, deletes stale, keeps stable ids", async () => {
    const t = makeBackend();
    const { familyId, sessionToken } = await seedFamily(t);
    const now = Date.now();
    const keptId = await t.run(async (ctx) => {
      const keptId = await ctx.db.insert("cachedCalendarEvents", {
        familyId, externalId: "a", title: "viejo", startDateTime: now, endDateTime: now + 1, allDay: false,
      });
      await ctx.db.insert("cachedCalendarEvents", {
        familyId, externalId: "b", title: "stale", startDateTime: now, endDateTime: now + 1, allDay: false,
      });
      return keptId;
    });

    const synced = [
      { externalId: "a", title: "nuevo título", startDateTime: now, endDateTime: now + 1, allDay: false },
      { externalId: "c", title: "nuevo", startDateTime: now + 2, endDateTime: now + 3, allDay: true },
    ];
    const count = await t.mutation(api.calendar.syncCalendarEvents, { sessionToken, familyId, events: synced });
    expect(count).toBe(2);

    const events = await t.query(api.calendar.getCachedEvents, { sessionToken, familyId });
    expect(events.map((e) => e.externalId).sort()).toEqual(["a", "c"]);
    const a = events.find((e) => e.externalId === "a")!;
    // Updated in place instead of delete+insert
    expect(a._id).toBe(keptId);
    expect(a.title).toBe("nuevo título");

    // A repeat sync of the same payload leaves the rows untouched.
    await t.mutation(api.calendar.syncCalendarEvents, { sessionToken, familyId, events: synced });
    const after = await t.query(api.calendar.getCachedEvents, { sessionToken, familyId });
    expect(after.map((e) => e._id).sort()).toEqual(events.map((e) => e._id).sort());
  });
});

describe("límites en listas acotadas (OPT-006)", () => {
  it("loans.list y contacts.getContacts respetan limit", async () => {
    const t = makeBackend();
    const { familyId, userIds, sessionToken } = await seedFamily(t);
    await t.run(async (ctx) => {
      const loan = (personName: string, i: number) =>
        ctx.db.insert("loans", {
          familyId, type: "lent", personName, amount: 10, balance: 10,
          date: i, status: "active", createdBy: userIds[0],
        });
      await loan("a", 1);
      await loan("b", 2);
      await loan("c", 3);
      for (const name of ["Ana", "Beto", "Coco"]) {
        await ctx.db.insert("contacts", { familyId, name, category: "other", addedBy: userIds[0] });
      }
    });

    const loans = await t.query(api.loans.list, { sessionToken, familyId, limit: 2 });
    expect(loans.map((l) => l.personName)).toEqual(["c", "b"]); // order desc + take
    const contacts = await t.query(api.contacts.getContacts, { sessionToken, familyId, limit: 2 });
    expect(contacts).toHaveLength(2);
  });

  it("health.getMedicalRecords acota por persona", async () => {
    const t = makeBackend();
    const { familyId, sessionToken } = await seedFamily(t);
    const personId = await t.run(async (ctx) => {
      const personId = await ctx.db.insert("personProfiles", { familyId, type: "human", name: "Ana", relation: "Hija" });
      for (const title of ["r1", "r2", "r3"]) {
        await ctx.db.insert("medicalRecords", { personId, type: "note", title, date: Date.now() });
      }
      return personId;
    });

    const records = await t.query(api.health.getMedicalRecords, { sessionToken, personId, limit: 2 });
    expect(records).toHaveLength(2);
    const all = await t.query(api.health.getMedicalRecords, { sessionToken, personId });
    expect(all).toHaveLength(3);
  });
});

describe("families.getFamilyMembers", () => {
  it("returns member user data joined with membership fields", async () => {
    const t = makeBackend();
    const { familyId, userIds, sessionToken } = await seedFamily(t, 2);

    const members = await t.query(api.families.getFamilyMembers, { sessionToken, familyId });

    expect(members).toHaveLength(2);
    const byId = (id: Id<"users">) => members.find((m) => m?._id === id);
    expect(byId(userIds[0])).toMatchObject({ name: "User0", email: "u0@t.com", role: "owner", status: "active" });
    expect(byId(userIds[1])).toMatchObject({ name: "User1", email: "u1@t.com", role: "member", status: "active" });
    expect(byId(userIds[0])?.membershipId).toBeDefined();
  });
});
