import { api } from "../../../_generated/api";
import type { ToolDefinition, ToolContext } from "../tools.types";
import { findGiftEventByName } from "./helpers";

export const getGiftsForEventTool: ToolDefinition = {
  name: "getGiftsForEvent",
  description:
    "Consultar todos los regalos de un evento. Usa esto cuando el usuario pregunte qué regalos hay en un evento.",
  parameters: {
    type: "object" as const,
    properties: {
      eventName: {
        type: "string" as const,
        description: "Nombre del evento a consultar",
      },
    },
    required: ["eventName"],
  },
};

export async function handleGetGiftsForEvent(context: ToolContext, args: Record<string, unknown>) {
  const { eventName } = args as { eventName: string };
  const event = await findGiftEventByName(context, eventName);

  if (!event) return { error: `No se encontró el evento "${eventName}".` };

  const allItems = await context.ctx.runQuery(api.gifts.getAllGiftItemsForEvent, {
    sessionToken: context.sessionToken,
    eventId: event._id,
  });

  if (allItems.length === 0) {
    return { success: true, message: `El evento "${event.name}" no tiene regalos todavía.` };
  }

  let summary = `Regalos en "${event.name}":\n`;
  for (const { recipient, items } of allItems) {
    summary += `\n${recipient.name} (${items.length} regalos):\n`;
    items.forEach((item: { title: string; status: string; priceEstimate?: number }) => {
      const price = item.priceEstimate ? ` $${item.priceEstimate}` : "";
      summary += `  - ${item.title} [${item.status}]${price}\n`;
    });
  }

  return { success: true, message: summary };
}

export const getGiftsForPersonTool: ToolDefinition = {
  name: "getGiftsForPerson",
  description:
    "Consultar los regalos asignados a una persona específica en un evento. Usa esto para ver qué le vas a regalar a alguien.",
  parameters: {
    type: "object" as const,
    properties: {
      eventName: {
        type: "string" as const,
        description: "Nombre del evento",
      },
      personName: {
        type: "string" as const,
        description: "Nombre de la persona destinataria",
      },
    },
    required: ["eventName", "personName"],
  },
};

export async function handleGetGiftsForPerson(context: ToolContext, args: Record<string, unknown>) {
  const { eventName, personName } = args as { eventName: string; personName: string };
  const event = await findGiftEventByName(context, eventName);

  if (!event) return { error: `No se encontró el evento "${eventName}".` };

  const recipients = await context.ctx.runQuery(api.gifts.getGiftRecipients, {
    sessionToken: context.sessionToken,
    eventId: event._id,
  });

  const recipient = recipients.find(
    (item: { name: string }) =>
      item.name.toLowerCase().includes(personName.toLowerCase()) ||
      personName.toLowerCase().includes(item.name.toLowerCase())
  );

  if (!recipient) {
    return { error: `No se encontró a "${personName}" en el evento "${event.name}".` };
  }

  const items = await context.ctx.runQuery(api.gifts.getGiftItems, {
    sessionToken: context.sessionToken,
    recipientId: recipient._id,
  });

  if (items.length === 0) {
    return { success: true, message: `${recipient.name} no tiene regalos asignados todavía.` };
  }

  let summary = `Regalos para ${recipient.name} en "${event.name}":\n`;
  items.forEach((item: { title: string; status: string; priceEstimate?: number; notes?: string }) => {
    const price = item.priceEstimate ? ` ($${item.priceEstimate})` : "";
    const notes = item.notes ? ` - ${item.notes}` : "";
    summary += `  - ${item.title} [${item.status}]${price}${notes}\n`;
  });

  return { success: true, message: summary };
}
