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
      const userId = await ctx.db.insert("users", {
        name: `User${i}`,
        email: `user${i}@test.com`,
      });
      await ctx.db.insert("familyMembers", {
        familyId,
        userId,
        role: i === 0 ? "owner" : "member",
        status: "active",
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

describe("household.getRecentLogs", () => {
  it("enriches logs with activity and user data", async () => {
    const t = makeBackend();
    const { familyId, userIds, sessionToken } = await seedFamily(t, 2);
    const [u0, u1] = userIds;

    const activityId = await t.run(async (ctx) =>
      ctx.db.insert("householdActivities", {
        familyId,
        name: "Lavar platos",
        emoji: "🍽️",
        points: 5,
        category: "cleaning",
        isActive: true,
        createdBy: u0,
      })
    );
    const deletedActivityId = await t.run(async (ctx) =>
      ctx.db.insert("householdActivities", {
        familyId,
        name: "Vieja",
        emoji: "🧹",
        points: 3,
        category: "cleaning",
        isActive: true,
        createdBy: u0,
      })
    );
    await t.run(async (ctx) => {
      const now = Date.now();
      // Same activity twice, one log registered by a different member.
      await ctx.db.insert("householdActivityLogs", {
        familyId, activityId, userId: u0, loggedBy: u0, points: 5, date: now - 2000,
      });
      await ctx.db.insert("householdActivityLogs", {
        familyId, activityId, userId: u1, loggedBy: u0, points: 5, date: now - 1000,
      });
      await ctx.db.insert("householdActivityLogs", {
        familyId, activityId: deletedActivityId, userId: u0, loggedBy: u0,
        points: 3, date: now,
      });
      await ctx.db.delete(deletedActivityId);
    });

    const logs = await t.query(api.household.getRecentLogs, {
      sessionToken,
      familyId,
    });

    expect(logs).toHaveLength(3);
    // Newest first
    expect(logs[0].activityName).toBe("Actividad eliminada");
    expect(logs[0].activityEmoji).toBe("❓");
    expect(logs[1].activityName).toBe("Lavar platos");
    expect(logs[1].activityEmoji).toBe("🍽️");
    expect(logs[1].userName).toBe("User1");
    expect(logs[1].loggedByName).toBe("User0");
    expect(logs[2].userName).toBe("User0");
    expect(logs[2].loggedByName).toBeUndefined();
  });
});

async function seedGiftEvent(
  t: Backend,
  items: Array<{
    title: string;
    status: "idea" | "to_buy" | "bought" | "wrapped" | "delivered";
    recipient?: number;
    priceEstimate?: number;
  }>
) {
  const { familyId, userIds, sessionToken } = await seedFamily(t);
  const { eventId, recipientIds } = await t.run(async (ctx) => {
    const eventId = await ctx.db.insert("giftEvents", {
      familyId, name: "Navidad", createdBy: userIds[0],
    });
    const recipientIds: Id<"giftRecipients">[] = [];
    for (const name of ["Ana", "Beto", "Coco"]) {
      recipientIds.push(
        await ctx.db.insert("giftRecipients", { giftEventId: eventId, name })
      );
    }
    for (const item of items) {
      await ctx.db.insert("giftItems", {
        giftEventId: eventId,
        giftRecipientId:
          item.recipient === undefined ? undefined : recipientIds[item.recipient],
        title: item.title,
        status: item.status,
        priceEstimate: item.priceEstimate,
      });
    }
    return { eventId, recipientIds };
  });
  return { eventId, recipientIds, sessionToken };
}

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

    const grouped = await t.query(api.gifts.getAllGiftItemsForEvent, {
      sessionToken,
      eventId,
    });

    expect(grouped).toHaveLength(3);
    const forR1 = grouped.find((g) => g.recipient._id === r1);
    const forR2 = grouped.find((g) => g.recipient._id === r2);
    expect(forR1?.items.map((i) => i.title)).toEqual(["A1", "A2"]);
    expect(forR2?.items.map((i) => i.title)).toEqual(["B1"]);
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

    const summary = await t.query(api.gifts.getGiftEventSummary, {
      sessionToken,
      eventId,
    });

    expect(summary.recipientCount).toBe(3);
    expect(summary.totalItems).toBe(3);
    expect(summary.byStatus).toEqual({
      idea: 1,
      to_buy: 1,
      bought: 1,
      wrapped: 0,
      delivered: 0,
    });
    expect(summary.totalEstimate).toBe(30);
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

    const result = await t.query(api.gifts.getRecipientsWithStatus, {
      sessionToken,
      eventId,
    });

    expect(result).toHaveLength(3);
    const ana = result.find((r) => r._id === r1);
    const beto = result.find((r) => r._id === r2);
    const coco = result.find((r) => r._id === r3);
    expect(ana).toMatchObject({ totalItems: 2, pending: 1, bought: 1, allBought: false, hasNoGifts: false });
    expect(beto).toMatchObject({ totalItems: 0, pending: 0, bought: 0, allBought: false, hasNoGifts: true });
    expect(coco).toMatchObject({ totalItems: 1, pending: 0, bought: 1, allBought: true, hasNoGifts: false });
  });
});

describe("gifts.updateGiftItem", () => {
  it("creates the expense once when marking an item as bought", async () => {
    const t = makeBackend();
    const { familyId, userIds, sessionToken } = await seedFamily(t);

    const itemId = await t.run(async (ctx) => {
      const eventId = await ctx.db.insert("giftEvents", {
        familyId, name: "Navidad", createdBy: userIds[0],
      });
      return await ctx.db.insert("giftItems", {
        giftEventId: eventId, title: "A1", status: "to_buy", priceEstimate: 50,
      });
    });
    const countExpenses = () =>
      t.run(async (ctx) =>
        (await ctx.db.query("expenses").collect()).filter((e) => e.giftItemId === itemId)
      );

    await t.mutation(api.gifts.updateGiftItem, {
      sessionToken, itemId, status: "bought",
    });
    expect(await countExpenses()).toHaveLength(1);

    // Back to pending and bought again: the existing expense is found by
    // the by_gift_item index, so no duplicate is inserted.
    await t.mutation(api.gifts.updateGiftItem, {
      sessionToken, itemId, status: "to_buy",
    });
    await t.mutation(api.gifts.updateGiftItem, {
      sessionToken, itemId, status: "bought",
    });
    const expenses = await countExpenses();
    expect(expenses).toHaveLength(1);
    expect(expenses[0].amount).toBe(50);
    expect(expenses[0].type).toBe("gift");
  });
});

describe("vehicles.deleteVehicleEvent", () => {
  it("deletes only the expenses linked to the event", async () => {
    const t = makeBackend();
    const { familyId, sessionToken } = await seedFamily(t);

    const { eventId, otherExpenseId } = await t.run(async (ctx) => {
      const vehicleId = await ctx.db.insert("vehicles", { familyId, name: "Tsuru" });
      const eventId = await ctx.db.insert("vehicleEvents", {
        vehicleId, type: "service", title: "Afinación", date: Date.now(),
      });
      await ctx.db.insert("expenses", {
        familyId, type: "vehicle", category: "vehicle",
        description: "Afinación", amount: 100, date: Date.now(),
        vehicleId, vehicleEventId: eventId,
      });
      const otherExpenseId = await ctx.db.insert("expenses", {
        familyId, type: "general", category: "other",
        description: "Otro", amount: 10, date: Date.now(),
      });
      return { eventId, otherExpenseId };
    });

    await t.mutation(api.vehicles.deleteVehicleEvent, { sessionToken, eventId });

    const remaining = await t.run(async (ctx) => ctx.db.query("expenses").collect());
    expect(remaining.map((e) => e._id)).toEqual([otherExpenseId]);
    expect(
      await t.run(async (ctx) => ctx.db.get(eventId))
    ).toBeNull();
  });
});

describe("places.getAllVisits", () => {
  it("joins visit place data and tolerates deleted places", async () => {
    const t = makeBackend();
    const { familyId, sessionToken } = await seedFamily(t);

    await t.run(async (ctx) => {
      const p1 = await ctx.db.insert("places", {
        familyId, name: "Café X", category: "cafe", imageUrl: "img1",
      });
      const p2 = await ctx.db.insert("places", {
        familyId, name: "Ramen Y", category: "restaurant",
      });
      const now = Date.now();
      // Two visits share p1 (dedupe path) and one visit points to a
      // place that is deleted afterwards.
      await ctx.db.insert("placeVisits", { placeId: p1, familyId, visitDate: now - 2000 });
      await ctx.db.insert("placeVisits", { placeId: p1, familyId, visitDate: now - 1000 });
      await ctx.db.insert("placeVisits", { placeId: p2, familyId, visitDate: now });
      await ctx.db.delete(p2);
    });

    const visits = await t.query(api.places.getAllVisits, { sessionToken, familyId });

    expect(visits).toHaveLength(3);
    expect(visits[0].placeName).toBe("Lugar eliminado");
    expect(visits[0].placeImage).toBeUndefined();
    expect(visits[1].placeName).toBe("Café X");
    expect(visits[1].placeImage).toBe("img1");
    expect(visits[2].placeName).toBe("Café X");
  });
});

describe("health.getHealthSummary", () => {
  it("bounds records to the last 30 days and lists active meds", async () => {
    const t = makeBackend();
    const { familyId, sessionToken } = await seedFamily(t);

    await t.run(async (ctx) => {
      const personId = await ctx.db.insert("personProfiles", {
        familyId, type: "human", name: "Ana", relation: "Hija",
      });
      const now = Date.now();
      await ctx.db.insert("medicalRecords", {
        personId, type: "consultation", title: "Reciente", date: now - DAY,
      });
      await ctx.db.insert("medicalRecords", {
        personId, type: "note", title: "Viejo", date: now - 40 * DAY,
      });
      await ctx.db.insert("medications", {
        personId, name: "Vitamina D", dosage: "1", startDate: now - 10 * DAY,
        status: "active",
      });
      await ctx.db.insert("medications", {
        personId, name: "Antibiótico", dosage: "2", startDate: now - 60 * DAY,
        status: "completed",
      });
    });

    const summary = await t.query(api.health.getHealthSummary, {
      sessionToken,
      familyId,
    });

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
      const personId = await ctx.db.insert("personProfiles", {
        familyId, type: "human", name: "Ana", relation: "Hija",
      });
      const planId = await ctx.db.insert("nutritionPlans", {
        familyId, name: "Plan A", targets: {}, createdBy: userIds[0],
      });
      const gonePlanId = await ctx.db.insert("nutritionPlans", {
        familyId, name: "Plan borrado", targets: {}, createdBy: userIds[0],
      });
      // Two assignments share the same plan (dedupe path); one points to a
      // deleted plan.
      await ctx.db.insert("nutritionAssignments", {
        familyId, planId, personId, startDate: 1, endDate: 10, isActive: false,
      });
      await ctx.db.insert("nutritionAssignments", {
        familyId, planId, personId, startDate: 11, endDate: 20, isActive: true,
      });
      await ctx.db.insert("nutritionAssignments", {
        familyId, planId: gonePlanId, personId, startDate: 21, endDate: 30, isActive: false,
      });
      await ctx.db.delete(gonePlanId);
      return { personId, planId };
    });

    const assignments = await t.query(api.nutrition.getAssignments, {
      sessionToken,
      personId,
    });

    expect(assignments).toHaveLength(3);
    // by_person index, desc → reverse insertion order
    expect(assignments[0].plan).toBeNull();
    expect(assignments[1].plan?._id).toBe(planId);
    expect(assignments[2].plan?._id).toBe(planId);
  });
});

describe("families.getFamilyMembers", () => {
  it("returns member user data joined with membership fields", async () => {
    const t = makeBackend();
    const { familyId, userIds, sessionToken } = await seedFamily(t, 2);

    const members = await t.query(api.families.getFamilyMembers, {
      sessionToken,
      familyId,
    });

    expect(members).toHaveLength(2);
    const owner = members.find((m) => m?._id === userIds[0]);
    const member = members.find((m) => m?._id === userIds[1]);
    expect(owner).toMatchObject({
      name: "User0", email: "user0@test.com", role: "owner", status: "active",
    });
    expect(owner?.membershipId).toBeDefined();
    expect(member).toMatchObject({
      name: "User1", email: "user1@test.com", role: "member", status: "active",
    });
  });
});
