import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getBooks = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("books")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();
  },
});

export const getBooksByCollection = query({
  args: {
    familyId: v.id("families"),
    collectionName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("books")
      .withIndex("by_collection", (q) =>
        q.eq("familyId", args.familyId).eq("collectionName", args.collectionName)
      )
      .collect();
  },
});

export const getCollections = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    const books = await ctx.db
      .query("books")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    const collections = new Map<
      string,
      { name: string; count: number; ownedCount: number; type: string }
    >();

    for (const book of books) {
      if (book.collectionName) {
        const existing = collections.get(book.collectionName);
        if (existing) {
          existing.count++;
          if (book.owned) existing.ownedCount++;
        } else {
          collections.set(book.collectionName, {
            name: book.collectionName,
            count: 1,
            ownedCount: book.owned ? 1 : 0,
            type: book.type,
          });
        }
      }
    }

    return Array.from(collections.values());
  },
});

export const createBook = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("books", args);
  },
});

export const updateBook = mutation({
  args: {
    bookId: v.id("books"),
    title: v.optional(v.string()),
    author: v.optional(v.string()),
    volumeNumber: v.optional(v.number()),
    collectionName: v.optional(v.string()),
    owned: v.optional(v.boolean()),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("reading"),
        v.literal("finished")
      )
    ),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { bookId, ...updates } = args;
    await ctx.db.patch(bookId, updates);
    return bookId;
  },
});

export const deleteBook = mutation({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.bookId);
  },
});

export const getLibrarySummary = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    const books = await ctx.db
      .query("books")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    const byType: Record<string, number> = { book: 0, manga: 0, comic: 0 };
    const byStatus: Record<string, number> = {
      pending: 0,
      reading: 0,
      finished: 0,
    };
    let owned = 0;
    let wishlist = 0;

    for (const book of books) {
      byType[book.type]++;
      byStatus[book.status]++;
      if (book.owned) owned++;
      else wishlist++;
    }

    // Find incomplete collections (manga/comics with missing volumes)
    const collections = new Map<string, number[]>();
    for (const book of books) {
      if (book.collectionName && book.volumeNumber && book.owned) {
        const volumes = collections.get(book.collectionName) || [];
        volumes.push(book.volumeNumber);
        collections.set(book.collectionName, volumes);
      }
    }

    const incompleteCollections: Array<{ name: string; missing: number[] }> = [];
    for (const [name, volumes] of collections) {
      volumes.sort((a, b) => a - b);
      const max = volumes[volumes.length - 1];
      const missing: number[] = [];
      for (let i = 1; i <= max; i++) {
        if (!volumes.includes(i)) {
          missing.push(i);
        }
      }
      if (missing.length > 0) {
        incompleteCollections.push({ name, missing });
      }
    }

    return {
      total: books.length,
      byType,
      byStatus,
      owned,
      wishlist,
      incompleteCollections: incompleteCollections.slice(0, 5),
    };
  },
});
