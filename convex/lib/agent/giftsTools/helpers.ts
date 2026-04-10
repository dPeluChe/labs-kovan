import { api } from "../../../_generated/api";
import type { ToolContext } from "../tools.types";

export type GiftStatus = "idea" | "to_buy" | "bought" | "wrapped" | "delivered";

export async function findGiftEventByName(context: ToolContext, eventName: string) {
  const events = await context.ctx.runQuery(api.gifts.getGiftEvents, {
    sessionToken: context.sessionToken,
    familyId: context.familyId,
  });

  return events.find(
    (event: { name: string }) =>
      event.name.toLowerCase().includes(eventName.toLowerCase()) ||
      eventName.toLowerCase().includes(event.name.toLowerCase())
  );
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

  const recipient = recipients.find(
    (item: { name: string }) =>
      item.name.toLowerCase().includes(recipientName.toLowerCase()) ||
      recipientName.toLowerCase().includes(item.name.toLowerCase())
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

  for (const { items } of allItems) {
    const found = items.find(
      (item: { title: string }) =>
        item.title.toLowerCase().includes(giftTitle.toLowerCase()) ||
        giftTitle.toLowerCase().includes(item.title.toLowerCase())
    );
    if (found) return found as { _id: string; title: string };
  }

  return null;
}
