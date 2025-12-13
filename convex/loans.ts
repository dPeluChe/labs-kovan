import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==================== QUERIES ====================

export const list = query({
    args: { familyId: v.id("families") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("loans")
            .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
            .order("desc")
            .collect();
    },
});

export const getPayments = query({
    args: { loanId: v.id("loans") },
    handler: async (ctx, args) => {
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
        const userId = (await ctx.auth.getUserIdentity())?.subject;
        if (!userId) {
            // Logic for user ID retrieval can be improved if we look up the internal user ID
            // But for now, we rely on the client passing the internal ID or we fetch it.
            // However, typical pattern uses the internal ID in the schema.
            throw new Error("Unauthorized");
        }

        // Since schema requires createdBy as internal ID, we must find the user first.
        // For now we assume the frontend ensures context or we fetch user.
        // Optimization: define a helper or assume user is already authenticated and mapped.

        // Let's look up the user by token
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", userId))
            .unique();

        if (!user) throw new Error("User not found");

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
        loanId: v.id("loans"),
        amount: v.number(),
        date: v.number(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = (await ctx.auth.getUserIdentity())?.subject;
        if (!userId) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", userId))
            .unique();

        if (!user) throw new Error("User not found");

        const loan = await ctx.db.get(args.loanId);
        if (!loan) throw new Error("Loan not found");

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
        loanId: v.id("loans"),
        personName: v.optional(v.string()),
        dueDate: v.optional(v.number()),
        notes: v.optional(v.string()),
        status: v.optional(
            v.union(v.literal("active"), v.literal("settled"), v.literal("defaulted"))
        ),
    },
    handler: async (ctx, args) => {
        const { loanId, ...updates } = args;
        await ctx.db.patch(loanId, updates);
    },
});

export const deleteLoan = mutation({
    args: { loanId: v.id("loans") },
    handler: async (ctx, args) => {
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
