
import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";

// ==================== READ TOOLS ====================

export const getCollectionsTool: ToolDefinition = {
    name: "getCollections",
    description: "Consultar la colección de libros, juegos, mangas, etc. Usa esto cuando pregunten qué tienen en su colección.",
    parameters: {
        type: "object" as const,
        properties: {},
        required: []
    }
};

export async function handleGetCollections(context: ToolContext) {
    const collections = await context.ctx.runQuery(api.collections.getCollections, {
        familyId: context.familyId
    });

    if (collections.length === 0) {
        return { success: true, message: "No tienes items en tu colección aún." };
    }

    const byType: Record<string, number> = {};
    collections.forEach(item => {
        byType[item.type] = (byType[item.type] || 0) + 1;
    });

    const summary = Object.entries(byType)
        .map(([type, count]) => `${count} ${type}`)
        .join(', ');

    return {
        success: true,
        message: `Tienes ${collections.length} items en total: ${summary}.`
    };
}

// ==================== WRITE TOOLS ====================

export const addToCollectionTool: ToolDefinition = {
    name: "addToCollection",
    description: "Agregar un item a la colección (libro, manga, juego de mesa, videojuego, etc).",
    parameters: {
        type: "object" as const,
        properties: {
            type: {
                type: "string" as const,
                description: "Tipo de item",
                enum: ["book", "manga", "board_game", "video_game", "other"]
            },
            title: {
                type: "string" as const,
                description: "Título del item"
            },
            creator: {
                type: "string" as const,
                description: "Autor, diseñador o creador (opcional)"
            }
        },
        required: ["type", "title"]
    }
};

export async function handleAddToCollection(context: ToolContext, args: Record<string, unknown>) {
    const { type, title, creator } = args as { type: string; title: string; creator?: string };

    await context.ctx.runMutation(api.collections.createItem, {
        familyId: context.familyId,
        type: type as "book" | "manga" | "comic" | "board_game" | "video_game" | "collectible" | "other",
        title,
        creator,
        owned: true,
        status: "wishlist",
        addedBy: context.userId
    });

    return { success: true, message: `Agregado a la colección: ${title}` };
}
