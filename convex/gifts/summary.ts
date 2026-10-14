import { v } from "convex/values";
import { query } from "../_generated/server";
import { getEventWithAccessOrThrow } from "./access";

export const getGiftEventSummary = query({
  args: { sessionToken: v.string(), eventId: v.id("giftEvents") },
  handler: async (ctx, args) => {
    await getEventWithAccessOrThrow(ctx, args.sessionToken, args.eventId);
    const [recipients, eventItems] = await Promise.all([
      ctx.db
        .query("giftRecipients")
        .withIndex("by_event", (q) => q.eq("giftEventId", args.eventId))
        .collect(),
      ctx.db
        .query("giftItems")
        .withIndex("by_event", (q) => q.eq("giftEventId", args.eventId))
        .collect(),
    ]);

    let totalItems = 0;
    const byStatus: Record<string, number> = {
      idea: 0,
      to_buy: 0,
      bought: 0,
      wrapped: 0,
      delivered: 0,
    };
    let totalEstimate = 0;

    const recipientIds = new Set<string>(recipients.map((r) => r._id));
    for (const item of eventItems) {
      if (!item.giftRecipientId || !recipientIds.has(item.giftRecipientId)) {
        continue;
      }
      totalItems++;
      byStatus[item.status]++;
      if (item.priceEstimate) {
        totalEstimate += item.priceEstimate;
      }
    }

    return {
      recipientCount: recipients.length,
      totalItems,
      byStatus,
      totalEstimate,
    };
  },
});

export const getRecipientsWithStatus = query({
  args: { sessionToken: v.string(), eventId: v.id("giftEvents") },
  handler: async (ctx, args) => {
    await getEventWithAccessOrThrow(ctx, args.sessionToken, args.eventId);
    const [recipients, eventItems] = await Promise.all([
      ctx.db
        .query("giftRecipients")
        .withIndex("by_event", (q) => q.eq("giftEventId", args.eventId))
        .collect(),
      ctx.db
        .query("giftItems")
        .withIndex("by_event", (q) => q.eq("giftEventId", args.eventId))
        .collect(),
    ]);

    const itemsByRecipient = new Map<string, typeof eventItems>();
    for (const item of eventItems) {
      if (!item.giftRecipientId) continue;
      const list = itemsByRecipient.get(item.giftRecipientId) ?? [];
      list.push(item);
      itemsByRecipient.set(item.giftRecipientId, list);
    }

    return recipients.map((recipient) => {
      const items = itemsByRecipient.get(recipient._id) ?? [];

      const pending = items.filter((i) => i.status === "idea" || i.status === "to_buy").length;
      const bought = items.filter((i) => i.status === "bought" || i.status === "wrapped" || i.status === "delivered").length;

      return {
        ...recipient,
        totalItems: items.length,
        pending,
        bought,
        allBought: items.length > 0 && pending === 0,
        hasNoGifts: items.length === 0,
      };
    });
  },
});
