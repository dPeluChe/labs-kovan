import { api } from "../../../_generated/api";
import type { ToolContext } from "../tools.types";
import { findBestMatch } from "../fuzzyMatch";

export type GiftStatus = "idea" | "to_buy" | "bought" | "wrapped" | "delivered";

const EVENT_MATCH_THRESHOLD = 0.55;
const ITEM_MATCH_THRESHOLD = 0.55;
// Más estricto para personas: asignar un regalo al destinatario equivocado
// es peor que crear uno nuevo.
const RECIPIENT_MATCH_THRESHOLD = 0.75;

export async function findGiftEventByName(context: ToolContext, eventName: string) {
  const events = await context.ctx.runQuery(api.gifts.getGiftEvents, {
    sessionToken: context.sessionToken,
    familyId: context.familyId,
  });

  return findBestMatch(eventName, events, (event: { name: string }) => event.name, EVENT_MATCH_THRESHOLD);
}

export async function listGiftEventNames(context: ToolContext): Promise<string[]> {
  const events = await context.ctx.runQuery(api.gifts.getGiftEvents, {
    sessionToken: context.sessionToken,
    familyId: context.familyId,
  });
  return events.map((event: { name: string }) => event.name);
}

export async function findOrCreateRecipientId(
  context: ToolContext,
  eventId: string,
  recipientName: string
) {
  const recipients = await context.ctx.runQuery(api.gifts.getGiftRecipients, {
    sessionToken: context.sessionToken,
    eventId: eventId as unknown as never,
  });

  const recipient = findBestMatch(
    recipientName,
    recipients,
    (item: { name: string }) => item.name,
    RECIPIENT_MATCH_THRESHOLD
  );

  if (recipient) return recipient._id;

  return await context.ctx.runMutation(api.gifts.createGiftRecipient, {
    sessionToken: context.sessionToken,
    giftEventId: eventId as unknown as never,
    name: recipientName,
  });
}

export async function findGiftItemByTitle(context: ToolContext, eventId: string, giftTitle: string) {
  const allItems = await context.ctx.runQuery(api.gifts.getAllGiftItemsForEvent, {
    sessionToken: context.sessionToken,
    eventId: eventId as unknown as never,
  });

  const flattened = allItems.flatMap(({ items }: { items: { _id: string; title: string }[] }) => items);
  return findBestMatch(giftTitle, flattened, (item) => item.title, ITEM_MATCH_THRESHOLD);
}
