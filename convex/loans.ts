import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireFamilyAccessFromSession, requireUserFromSessionToken } from "./lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getLoanWithAccessOrThrow(ctx: any, sessionToken: string, loanId: any) {
    const loan = await ctx.db.get(loanId);
    if (!loan) throw new Error("Préstamo no encontrado");
    await requireFamilyAccessFromSession(ctx, sessionToken, loan.familyId);
    return loan;
}

// ==================== QUERIES ====================

export const list = query({
    args: { sessionToken: v.string(), familyId: v.id("families") },
    handler: async (ctx, args) => {
        await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);
        return await ctx.db
            .query("loans")
            .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
            .order("desc")
            .collect();
    },
});

export const getPayments = query({
    args: { sessionToken: v.string(), loanId: v.id("loans") },
    handler: async (ctx, args) => {
        await getLoanWithAccessOrThrow(ctx, args.sessionToken, args.loanId);
        return await ctx.db
            .query("loanPayments")
            .withIndex("by_loan", (q) => q.eq("loanId", args.loanId))
            .order("desc") // Most recent payments first
            .collect();
    },
});

// ==================== MUTATIONS ====================

export const create = mutation({
    args: {
        sessionToken: v.string(),
        familyId: v.id("families"),
        type: v.union(v.literal("lent"), v.literal("borrowed")),
        personName: v.string(),
        amount: v.number(),
        currency: v.optional(v.string()),
        date: v.number(),
        dueDate: v.optional(v.number()),
        notes: v.optional(v.string()),
        relatedExpenseId: v.optional(v.id("expenses")),
    },
    handler: async (ctx, args) => {
        const user = await requireUserFromSessionToken(ctx, args.sessionToken);
        await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);

        const loanId = await ctx.db.insert("loans", {
            familyId: args.familyId,
            type: args.type,
            personName: args.personName,
            amount: args.amount,
            balance: args.amount, // Initially balance = amount
            currency: args.currency,
            date: args.date,
            dueDate: args.dueDate,
            status: "active",
            notes: args.notes,
            relatedExpenseId: args.relatedExpenseId,
            createdBy: user._id,
        });

        return loanId;
    },
});

export const addPayment = mutation({
    args: {
        sessionToken: v.string(),
        loanId: v.id("loans"),
        amount: v.number(),
        date: v.number(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await requireUserFromSessionToken(ctx, args.sessionToken);
        const loan = await getLoanWithAccessOrThrow(ctx, args.sessionToken, args.loanId);

        // Add payment record
        await ctx.db.insert("loanPayments", {
            loanId: args.loanId,
            amount: args.amount,
            date: args.date,
            notes: args.notes,
            registeredBy: user._id,
        });

        // Update loan balance
        const newBalance = loan.balance - args.amount;
        const newStatus = newBalance <= 0.01 ? "settled" : "active"; // Tolerance for float math

        await ctx.db.patch(args.loanId, {
            balance: newBalance,
            status: newStatus,
        });
    },
});

export const update = mutation({
    args: {
        sessionToken: v.string(),
        loanId: v.id("loans"),
        personName: v.optional(v.string()),
        dueDate: v.optional(v.number()),
        notes: v.optional(v.string()),
        status: v.optional(
            v.union(v.literal("active"), v.literal("settled"), v.literal("defaulted"))
        ),
    },
    handler: async (ctx, args) => {
        await getLoanWithAccessOrThrow(ctx, args.sessionToken, args.loanId);
        const { loanId, sessionToken: _sessionToken, ...updates } = args;
        await ctx.db.patch(loanId, updates);
    },
});

export const deleteLoan = mutation({
    args: { sessionToken: v.string(), loanId: v.id("loans") },
    handler: async (ctx, args) => {
        await getLoanWithAccessOrThrow(ctx, args.sessionToken, args.loanId);
        // Delete payments first? Or cascade? Convex doesn't cascade automatically.
        // For now, let's just delete the loan. Orphaned payments might be an issue technically,
        // but we can clean them up.

        // Better: delete payments
        const payments = await ctx.db
            .query("loanPayments")
            .withIndex("by_loan", (q) => q.eq("loanId", args.loanId))
            .collect();

        for (const payment of payments) {
            await ctx.db.delete(payment._id);
        }

        await ctx.db.delete(args.loanId);
    },
});
