// @vitest-environment node
import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
import { sha256Hex } from "../../convex/lib/auth";
import type { Id } from "../../convex/_generated/dataModel";

const modules = import.meta.glob("../../convex/**/*.ts");

const DAY = 24 * 60 * 60 * 1000;

async function seed() {
  const t = convexTest(schema, modules);
  const sessionToken = "token-de-prueba";
  const base = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { name: "Ana", email: "ana@test.mx" });
    const familyId = await ctx.db.insert("families", { name: "Familia" });
    const otherFamilyId = await ctx.db.insert("families", { name: "Otra" });
    await ctx.db.insert("familyMembers", {
      familyId,
      userId,
      role: "owner",
      status: "active",
    });
    await ctx.db.insert("sessions", {
      userId,
      tokenHash: await sha256Hex(sessionToken),
      createdAt: Date.now(),
      expiresAt: Date.now() + DAY,
    });
    return { userId, familyId, otherFamilyId };
  });
  return { t, sessionToken, ...base };
}

function expense(
  familyId: Id<"families">,
  date: number,
  extra: { type?: "vehicle"; description?: string; amount?: number } = {}
) {
  return {
    familyId,
    type: extra.type ?? ("general" as const),
    category: "food" as const,
    description: extra.description ?? "gasto",
    amount: extra.amount ?? 100,
    date,
  };
}

describe("expenses.getExpensesByMonth", () => {
  it("solo devuelve gastos del mes y familia pedidos", async () => {
    const { t, sessionToken, familyId, otherFamilyId } = await seed();
    const jun10 = new Date(2026, 5, 10).getTime();
    await t.run(async (ctx) => {
      await ctx.db.insert("expenses", expense(familyId, jun10, { description: "junio" }));
      await ctx.db.insert(
        "expenses",
        expense(familyId, new Date(2026, 4, 31, 23, 59).getTime(), { description: "mayo" })
      );
      await ctx.db.insert("expenses", expense(otherFamilyId, jun10, { description: "otra" }));
    });
    const res = await t.query(api.expenses.getExpensesByMonth, {
      sessionToken,
      familyId,
      year: 2026,
      month: 6,
    });
    expect(res.map((e) => e.description)).toEqual(["junio"]);
  });
});

describe("expenses.getExpenseSummary y agentGetExpenseSummary", () => {
  it("suman solo el mes en curso", async () => {
    const { t, sessionToken, familyId } = await seed();
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15).getTime();
    await t.run(async (ctx) => {
      await ctx.db.insert("expenses", expense(familyId, now.getTime(), { amount: 150 }));
      await ctx.db.insert("expenses", expense(familyId, now.getTime(), { amount: 50 }));
      await ctx.db.insert("expenses", expense(familyId, lastMonth, { amount: 999 }));
    });
    const args = { sessionToken, familyId };
    const summary = await t.query(api.expenses.getExpenseSummary, args);
    const agentSummary = await t.query(internal.expenses.agentGetExpenseSummary, args);
    for (const s of [summary, agentSummary]) {
      expect(s.totalThisMonth).toBe(200);
      expect(s.countThisMonth).toBe(2);
    }
  });
});

describe("calendar.getCachedEvents / getUpcomingEvents", () => {
  const event = (familyId: Id<"families">, start: number, title: string) => ({
    familyId,
    externalId: title,
    title,
    startDateTime: start,
    endDateTime: start + DAY,
    allDay: false,
  });

  it("getCachedEvents filtra por rango sobre el índice", async () => {
    const { t, sessionToken, familyId } = await seed();
    await t.run(async (ctx) => {
      await ctx.db.insert("cachedCalendarEvents", event(familyId, 1000, "viejo"));
      await ctx.db.insert("cachedCalendarEvents", event(familyId, 5000, "en rango"));
      await ctx.db.insert("cachedCalendarEvents", event(familyId, 9000, "futuro"));
    });
    const res = await t.query(api.calendar.getCachedEvents, {
      sessionToken,
      familyId,
      startDate: 2000,
      endDate: 7000,
    });
    expect(res.map((e) => e.title)).toEqual(["en rango"]);
    const all = await t.query(api.calendar.getCachedEvents, { sessionToken, familyId });
    expect(all).toHaveLength(3);
  });

  it("getUpcomingEvents devuelve futuros en orden y con límite", async () => {
    const { t, sessionToken, familyId } = await seed();
    const now = Date.now();
    await t.run(async (ctx) => {
      await ctx.db.insert("cachedCalendarEvents", event(familyId, now + 3 * DAY, "lejos"));
      await ctx.db.insert("cachedCalendarEvents", event(familyId, now + DAY, "cerca"));
      await ctx.db.insert("cachedCalendarEvents", event(familyId, now - DAY, "pasado"));
      await ctx.db.insert("cachedCalendarEvents", event(familyId, now + 2 * DAY, "medio"));
    });
    const res = await t.query(api.calendar.getUpcomingEvents, {
      sessionToken,
      familyId,
      limit: 2,
    });
    expect(res.map((e) => e.title)).toEqual(["cerca", "medio"]);
  });
});

describe("tasks.list", () => {
  const task = (
    familyId: Id<"families">,
    userId: Id<"users">,
    status: "pending" | "completed",
    type: "general" | "shopping" | "chore",
    title: string
  ) => ({ familyId, title, status, type, createdBy: userId });

  it("filtra por status y type con los índices compuestos", async () => {
    const { t, sessionToken, familyId, userId } = await seed();
    await t.run(async (ctx) => {
      await ctx.db.insert("tasks", task(familyId, userId, "pending", "general", "p-g"));
      await ctx.db.insert("tasks", task(familyId, userId, "pending", "shopping", "p-s"));
      await ctx.db.insert("tasks", task(familyId, userId, "completed", "general", "c-g"));
    });
    const args = { sessionToken, familyId };
    const pending = await t.query(api.tasks.list, { ...args, status: "pending" });
    expect(pending.map((x) => x.title).sort()).toEqual(["p-g", "p-s"]);
    const shopping = await t.query(api.tasks.list, { ...args, type: "shopping" });
    expect(shopping.map((x) => x.title)).toEqual(["p-s"]);
    const both = await t.query(api.tasks.list, { ...args, status: "pending", type: "general" });
    expect(both.map((x) => x.title)).toEqual(["p-g"]);
  });
});

describe("documents.list", () => {
  it("filtra por personId sin salirse de la familia", async () => {
    const { t, sessionToken, familyId, otherFamilyId, userId } = await seed();
    const { personId, otherPersonId } = await t.run(async (ctx) => {
      const personId = await ctx.db.insert("personProfiles", {
        familyId,
        type: "human",
        name: "Sofia",
        relation: "hija",
      });
      const otherPersonId = await ctx.db.insert("personProfiles", {
        familyId: otherFamilyId,
        type: "human",
        name: "Ajena",
        relation: "hija",
      });
      const doc = (p: Id<"personProfiles"> | undefined, f: Id<"families">, title: string) =>
        ctx.db.insert("documents", { familyId: f, personId: p, title, type: "identity", addedBy: userId });
      await doc(personId, familyId, "pasaporte sofia");
      await doc(undefined, familyId, "escritura");
      await doc(otherPersonId, otherFamilyId, "doc ajeno");
      return { personId, otherPersonId };
    });
    const args = { sessionToken, familyId };
    const byPerson = await t.query(api.documents.list, { ...args, personId });
    expect(byPerson.map((d) => d.title)).toEqual(["pasaporte sofia"]);
    const all = await t.query(api.documents.list, args);
    expect(all.map((d) => d.title).sort()).toEqual(["escritura", "pasaporte sofia"]);
    const ajena = await t.query(api.documents.list, { ...args, personId: otherPersonId });
    expect(ajena).toEqual([]);
  });
});

describe("household.getUserWeeklyStats", () => {
  it("cuenta solo logs de la semana del usuario pedido", async () => {
    const { t, sessionToken, familyId, userId } = await seed();
    const now = new Date();
    const diffToMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const weekStart = monday.getTime();

    await t.run(async (ctx) => {
      const otherUserId = await ctx.db.insert("users", { name: "Beto", email: "beto@test.mx" });
      const activityId = await ctx.db.insert("householdActivities", {
        familyId,
        name: "Lavar platos",
        emoji: "🍽️",
        points: 5,
        category: "cleaning",
        isActive: true,
        createdBy: userId,
      });
      const log = (u: Id<"users">, date: number) =>
        ctx.db.insert("householdActivityLogs", {
          familyId,
          activityId,
          userId: u,
          loggedBy: userId,
          points: 5,
          date,
        });
      await log(userId, now.getTime());
      await log(userId, weekStart - DAY); // semana pasada: no cuenta
      await log(otherUserId, now.getTime()); // otro usuario: no cuenta
    });

    const stats = await t.query(api.household.getUserWeeklyStats, {
      sessionToken,
      familyId,
      userId,
    });
    expect(stats.totalActivities).toBe(1);
    expect(stats.totalPoints).toBe(5);
  });
});

describe("vehicles.getVehiclesSummary", () => {
  it("totalSpentThisMonth solo suma gastos vehicle del mes", async () => {
    const { t, sessionToken, familyId } = await seed();
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15).getTime();
    await t.run(async (ctx) => {
      await ctx.db.insert("vehicles", { familyId, name: "Civic" });
      await ctx.db.insert("expenses", expense(familyId, now.getTime(), { type: "vehicle", amount: 300 }));
      await ctx.db.insert("expenses", expense(familyId, lastMonth, { type: "vehicle", amount: 500 }));
      await ctx.db.insert("expenses", expense(familyId, now.getTime(), { amount: 80 }));
    });
    const res = await t.query(api.vehicles.getVehiclesSummary, { sessionToken, familyId });
    expect(res.totalSpentThisMonth).toBe(300);
    expect(res.vehicleCount).toBe(1);
  });
});
