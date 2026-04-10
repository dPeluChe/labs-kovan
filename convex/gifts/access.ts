import { requireFamilyAccessFromSession } from "../lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getEventWithAccessOrThrow(ctx: any, sessionToken: string, eventId: any) {
  const event = await ctx.db.get(eventId);
  if (!event) throw new Error("Evento no encontrado");
  await requireFamilyAccessFromSession(ctx, sessionToken, event.familyId);
  return event;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRecipientWithAccessOrThrow(ctx: any, sessionToken: string, recipientId: any) {
  const recipient = await ctx.db.get(recipientId);
  if (!recipient) throw new Error("Destinatario no encontrado");
  const event = await getEventWithAccessOrThrow(ctx, sessionToken, recipient.giftEventId);
  return { recipient, event };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getItemWithAccessOrThrow(ctx: any, sessionToken: string, itemId: any) {
  const item = await ctx.db.get(itemId);
  if (!item) throw new Error("Regalo no encontrado");
  const event = await getEventWithAccessOrThrow(ctx, sessionToken, item.giftEventId);
  return { item, event };
}

export { getEventWithAccessOrThrow, getRecipientWithAccessOrThrow, getItemWithAccessOrThrow };
