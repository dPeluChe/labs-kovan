import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";

// ==================== WRITE TOOLS ====================

export const createGiftEventTool: ToolDefinition = {
    name: "createGiftEvent",
    description: "Crear un evento de regalos (cumpleaños, navidad, graduación, etc). Usa esto para organizar una lista de regalos para una ocasión especial.",
    parameters: {
        type: "object" as const,
        properties: {
            name: {
                type: "string" as const,
                description: "Nombre del evento (ej: 'Cumpleaños de María', 'Navidad 2024')"
            },
            date: {
                type: "string" as const,
                description: "Fecha del evento en formato YYYY-MM-DD (opcional)"
            },
            description: {
                type: "string" as const,
                description: "Descripción o detalles del evento (opcional)"
            }
        },
        required: ["name"]
    }
};

export async function handleCreateGiftEvent(context: ToolContext, args: Record<string, unknown>) {
    const { name, date, description } = args as { name: string; date?: string; description?: string };

    await context.ctx.runMutation(api.gifts.createGiftEvent, {
        familyId: context.familyId,
        name,
        date: date ? new Date(date).getTime() : undefined,
        description,
        createdBy: context.userId
    });

    return { success: true, message: `Evento de regalos creado: ${name}` };
}

export const addGiftToEventTool: ToolDefinition = {
    name: "addGiftToEvent",
    description: "Agregar un regalo a un evento existente. El regalo puede estar asignado a un destinatario específico o quedar en un 'pool' general.",
    parameters: {
        type: "object" as const,
        properties: {
            eventName: {
                type: "string" as const,
                description: "Nombre del evento al que agregar el regalo (debe existir)"
            },
            recipientName: {
                type: "string" as const,
                description: "Nombre de la persona que recibirá el regalo (opcional, si no se especifica queda sin asignar)"
            },
            title: {
                type: "string" as const,
                description: "Nombre o descripción del regalo"
            },
            priceEstimate: {
                type: "number" as const,
                description: "Precio estimado del regalo en pesos (opcional)"
            },
            status: {
                type: "string" as const,
                description: "Estado del regalo",
                enum: ["idea", "to_buy", "bought", "wrapped", "delivered"]
            },
            url: {
                type: "string" as const,
                description: "URL de referencia donde encontrar el regalo (opcional)"
            },
            notes: {
                type: "string" as const,
                description: "Notas adicionales sobre el regalo (opcional)"
            }
        },
        required: ["eventName", "title"]
    }
};

export async function handleAddGiftToEvent(context: ToolContext, args: Record<string, unknown>) {
    const { eventName, recipientName, title, priceEstimate, status, url, notes } = args as {
        eventName: string;
        recipientName?: string;
        title: string;
        priceEstimate?: number;
        status?: string;
        url?: string;
        notes?: string;
    };

    // Find the event by name
    const events = await context.ctx.runQuery(api.gifts.getGiftEvents, {
        familyId: context.familyId
    });

    const event = events.find(e =>
        e.name.toLowerCase().includes(eventName.toLowerCase()) ||
        eventName.toLowerCase().includes(e.name.toLowerCase())
    );

    if (!event) {
        return { error: `No se encontró el evento "${eventName}". Crea el evento primero con createGiftEvent.` };
    }

    let recipientId: string | undefined = undefined;

    // If recipient name is provided, find or create the recipient
    if (recipientName) {
        const recipients = await context.ctx.runQuery(api.gifts.getGiftRecipients, {
            eventId: event._id
        });

        const recipient = recipients.find(r =>
            r.name.toLowerCase().includes(recipientName.toLowerCase()) ||
            recipientName.toLowerCase().includes(r.name.toLowerCase())
        );

        if (!recipient) {
            // Create new recipient
            recipientId = await context.ctx.runMutation(api.gifts.createGiftRecipient, {
                giftEventId: event._id,
                name: recipientName
            });
        } else {
            recipientId = recipient._id;
        }
    }

    // Create the gift item
    await context.ctx.runMutation(api.gifts.createGiftItem, {
        giftEventId: event._id,
        giftRecipientId: recipientId as unknown as never,
        title,
        priceEstimate,
        status: (status || "idea") as "idea" | "to_buy" | "bought" | "wrapped" | "delivered",
        url,
        notes
    });

    const recipientMsg = recipientName ? ` para ${recipientName}` : ' (sin asignar)';
    return {
        success: true,
        message: `Regalo agregado al evento "${event.name}": ${title}${recipientMsg}`
    };
}

export const updateGiftStatusTool: ToolDefinition = {
    name: "updateGiftStatus",
    description: "Actualizar el estado de un regalo (idea → to_buy → bought → wrapped → delivered). Usa esto para marcar progreso en la compra o entrega de regalos.",
    parameters: {
        type: "object" as const,
        properties: {
            eventName: {
                type: "string" as const,
                description: "Nombre del evento que contiene el regalo"
            },
            giftTitle: {
                type: "string" as const,
                description: "Título o nombre del regalo a actualizar"
            },
            newStatus: {
                type: "string" as const,
                description: "Nuevo estado del regalo",
                enum: ["idea", "to_buy", "bought", "wrapped", "delivered"]
            }
        },
        required: ["eventName", "giftTitle", "newStatus"]
    }
};

export async function handleUpdateGiftStatus(context: ToolContext, args: Record<string, unknown>) {
    const { eventName, giftTitle, newStatus } = args as {
        eventName: string;
        giftTitle: string;
        newStatus: string;
    };

    // Find the event
    const events = await context.ctx.runQuery(api.gifts.getGiftEvents, {
        familyId: context.familyId
    });

    const event = events.find(e =>
        e.name.toLowerCase().includes(eventName.toLowerCase()) ||
        eventName.toLowerCase().includes(e.name.toLowerCase())
    );

    if (!event) {
        return { error: `No se encontró el evento "${eventName}".` };
    }

    // Get all items for the event
    const allItems = await context.ctx.runQuery(api.gifts.getAllGiftItemsForEvent, {
        eventId: event._id
    });

    // Flatten items from all recipients
    let targetItem: { _id: string; title: string } | null = null;
    for (const { items } of allItems) {
        const found = items.find((item: { title: string }) =>
            item.title.toLowerCase().includes(giftTitle.toLowerCase()) ||
            giftTitle.toLowerCase().includes(item.title.toLowerCase())
        );
        if (found) {
            targetItem = found as { _id: string; title: string };
            break;
        }
    }

    if (!targetItem) {
        return { error: `No se encontró el regalo "${giftTitle}" en el evento "${event.name}".` };
    }

    // Update the gift status
    await context.ctx.runMutation(api.gifts.updateGiftItem, {
        itemId: targetItem._id as unknown as never,
        status: newStatus as "idea" | "to_buy" | "bought" | "wrapped" | "delivered",
        familyId: context.familyId,
        paidBy: context.userId
    });

    return {
        success: true,
        message: `Regalo "${targetItem.title}" actualizado a: ${newStatus}`
    };
}

// ==================== READ TOOLS ====================

export const getGiftsForEventTool: ToolDefinition = {
    name: "getGiftsForEvent",
    description: "Consultar todos los regalos de un evento. Usa esto cuando el usuario pregunte qué regalos hay en un evento.",
    parameters: {
        type: "object" as const,
        properties: {
            eventName: {
                type: "string" as const,
                description: "Nombre del evento a consultar"
            }
        },
        required: ["eventName"]
    }
};

export async function handleGetGiftsForEvent(context: ToolContext, args: Record<string, unknown>) {
    const { eventName } = args as { eventName: string };

    const events = await context.ctx.runQuery(api.gifts.getGiftEvents, {
        familyId: context.familyId
    });

    const event = events.find(e =>
        e.name.toLowerCase().includes(eventName.toLowerCase()) ||
        eventName.toLowerCase().includes(e.name.toLowerCase())
    );

    if (!event) {
        return { error: `No se encontró el evento "${eventName}".` };
    }

    const allItems = await context.ctx.runQuery(api.gifts.getAllGiftItemsForEvent, {
        eventId: event._id
    });

    if (allItems.length === 0) {
        return { success: true, message: `El evento "${event.name}" no tiene regalos todavía.` };
    }

    let summary = `Regalos en "${event.name}":\n`;
    for (const { recipient, items } of allItems) {
        summary += `\n${recipient.name} (${items.length} regalos):\n`;
        items.forEach((item: { title: string; status: string; priceEstimate?: number }) => {
            const price = item.priceEstimate ? ` $${item.priceEstimate}` : '';
            summary += `  - ${item.title} [${item.status}]${price}\n`;
        });
    }

    return { success: true, message: summary };
}

export const getGiftsForPersonTool: ToolDefinition = {
    name: "getGiftsForPerson",
    description: "Consultar los regalos asignados a una persona específica en un evento. Usa esto para ver qué le vas a regalar a alguien.",
    parameters: {
        type: "object" as const,
        properties: {
            eventName: {
                type: "string" as const,
                description: "Nombre del evento"
            },
            personName: {
                type: "string" as const,
                description: "Nombre de la persona destinataria"
            }
        },
        required: ["eventName", "personName"]
    }
};

export async function handleGetGiftsForPerson(context: ToolContext, args: Record<string, unknown>) {
    const { eventName, personName } = args as { eventName: string; personName: string };

    const events = await context.ctx.runQuery(api.gifts.getGiftEvents, {
        familyId: context.familyId
    });

    const event = events.find(e =>
        e.name.toLowerCase().includes(eventName.toLowerCase()) ||
        eventName.toLowerCase().includes(e.name.toLowerCase())
    );

    if (!event) {
        return { error: `No se encontró el evento "${eventName}".` };
    }

    const recipients = await context.ctx.runQuery(api.gifts.getGiftRecipients, {
        eventId: event._id
    });

    const recipient = recipients.find(r =>
        r.name.toLowerCase().includes(personName.toLowerCase()) ||
        personName.toLowerCase().includes(r.name.toLowerCase())
    );

    if (!recipient) {
        return { error: `No se encontró a "${personName}" en el evento "${event.name}".` };
    }

    const items = await context.ctx.runQuery(api.gifts.getGiftItems, {
        recipientId: recipient._id
    });

    if (items.length === 0) {
        return { success: true, message: `${recipient.name} no tiene regalos asignados todavía.` };
    }

    let summary = `Regalos para ${recipient.name} en "${event.name}":\n`;
    items.forEach((item: { title: string; status: string; priceEstimate?: number; notes?: string }) => {
        const price = item.priceEstimate ? ` ($${item.priceEstimate})` : '';
        const notes = item.notes ? ` - ${item.notes}` : '';
        summary += `  - ${item.title} [${item.status}]${price}${notes}\n`;
    });

    return { success: true, message: summary };
}

export const updateGiftItemTool: ToolDefinition = {
    name: "updateGiftItem",
    description: "Actualizar cualquier información de un regalo (título, precio, notas, URL, etc). Más completo que updateGiftStatus.",
    parameters: {
        type: "object" as const,
        properties: {
            eventName: {
                type: "string" as const,
                description: "Nombre del evento que contiene el regalo"
            },
            giftTitle: {
                type: "string" as const,
                description: "Título actual del regalo a actualizar"
            },
            newTitle: {
                type: "string" as const,
                description: "Nuevo título (opcional)"
            },
            newPrice: {
                type: "number" as const,
                description: "Nuevo precio estimado (opcional)"
            },
            newNotes: {
                type: "string" as const,
                description: "Nuevas notas (opcional)"
            },
            newUrl: {
                type: "string" as const,
                description: "Nueva URL de referencia (opcional)"
            },
            newStatus: {
                type: "string" as const,
                description: "Nuevo estado (opcional)",
                enum: ["idea", "to_buy", "bought", "wrapped", "delivered"]
            }
        },
        required: ["eventName", "giftTitle"]
    }
};

export async function handleUpdateGiftItem(context: ToolContext, args: Record<string, unknown>) {
    const { eventName, giftTitle, newTitle, newPrice, newNotes, newUrl, newStatus } = args as {
        eventName: string;
        giftTitle: string;
        newTitle?: string;
        newPrice?: number;
        newNotes?: string;
        newUrl?: string;
        newStatus?: string;
    };

    // Find the event
    const events = await context.ctx.runQuery(api.gifts.getGiftEvents, {
        familyId: context.familyId
    });

    const event = events.find(e =>
        e.name.toLowerCase().includes(eventName.toLowerCase()) ||
        eventName.toLowerCase().includes(e.name.toLowerCase())
    );

    if (!event) {
        return { error: `No se encontró el evento "${eventName}".` };
    }

    // Get all items for the event
    const allItems = await context.ctx.runQuery(api.gifts.getAllGiftItemsForEvent, {
        eventId: event._id
    });

    // Find the gift
    let targetItem: { _id: string; title: string } | null = null;
    for (const { items } of allItems) {
        const found = items.find((item: { title: string }) =>
            item.title.toLowerCase().includes(giftTitle.toLowerCase()) ||
            giftTitle.toLowerCase().includes(item.title.toLowerCase())
        );
        if (found) {
            targetItem = found as { _id: string; title: string };
            break;
        }
    }

    if (!targetItem) {
        return { error: `No se encontró el regalo "${giftTitle}" en el evento "${event.name}".` };
    }

    // Build updates object
    const updates: Record<string, unknown> = {
        itemId: targetItem._id as unknown as never,
        familyId: context.familyId,
        paidBy: context.userId
    };

    if (newTitle) updates.title = newTitle;
    if (newPrice !== undefined) updates.priceEstimate = newPrice;
    if (newNotes) updates.notes = newNotes;
    if (newUrl) updates.url = newUrl;
    if (newStatus) updates.status = newStatus as "idea" | "to_buy" | "bought" | "wrapped" | "delivered";

    // Update the gift
    await context.ctx.runMutation(api.gifts.updateGiftItem, updates as unknown as never);

    const changes = [];
    if (newTitle) changes.push(`título: ${newTitle}`);
    if (newPrice !== undefined) changes.push(`precio: $${newPrice}`);
    if (newStatus) changes.push(`estado: ${newStatus}`);
    if (newNotes) changes.push('notas actualizadas');
    if (newUrl) changes.push('URL agregada');

    return {
        success: true,
        message: `Regalo "${targetItem.title}" actualizado: ${changes.join(', ')}`
    };
}
