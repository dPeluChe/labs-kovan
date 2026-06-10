
import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";
import { findBestMatch } from "./fuzzyMatch";

// Umbral alto: solo frena cuando el título es casi idéntico
const DUPLICATE_THRESHOLD = 0.85;

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
        sessionToken: context.sessionToken,
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
    description: "Agregar un item a la colección (libro, manga, cómic, juego de mesa, videojuego, coleccionable). Usa owned=false si el usuario lo quiere como deseo/wishlist (aún no lo tiene).",
    parameters: {
        type: "object" as const,
        properties: {
            type: {
                type: "string" as const,
                description: "Tipo de item",
                enum: ["book", "manga", "comic", "board_game", "video_game", "collectible", "other"]
            },
            title: {
                type: "string" as const,
                description: "Título del item"
            },
            creator: {
                type: "string" as const,
                description: "Autor, diseñador o creador (opcional)"
            },
            owned: {
                type: "boolean" as const,
                description: "true si el usuario ya lo tiene (default), false si es un deseo/wishlist"
            },
            allowDuplicate: {
                type: "boolean" as const,
                description: "Permitir agregar aunque exista un item con título muy similar. SOLO usar true cuando el usuario confirme que es un item distinto (otro volumen, edición, copia)."
            }
        },
        required: ["type", "title"]
    }
};

export async function handleAddToCollection(context: ToolContext, args: Record<string, unknown>) {
    const { type, title, creator, owned, allowDuplicate } = args as {
        type: string;
        title: string;
        creator?: string;
        owned?: boolean;
        allowDuplicate?: boolean;
    };

    const itemType = type as "book" | "manga" | "comic" | "board_game" | "video_game" | "collectible" | "other";
    const isOwned = owned !== false;

    if (!allowDuplicate) {
        const collections = await context.ctx.runQuery(api.collections.getCollections, {
            sessionToken: context.sessionToken,
            familyId: context.familyId
        });
        const sameType = collections.filter(item => item.type === itemType);
        const duplicate = findBestMatch(title, sameType, (item) => item.title, DUPLICATE_THRESHOLD);
        if (duplicate) {
            return {
                success: false,
                message: `Ya existe "${duplicate.title}" (${duplicate.type}) en la colección. Confirma con el usuario si es el mismo item; si es uno distinto (otro volumen/edición), vuelve a llamar con allowDuplicate=true.`
            };
        }
    }

    await context.ctx.runMutation(api.collections.createItem, {
        sessionToken: context.sessionToken,
        familyId: context.familyId,
        type: itemType,
        title,
        creator,
        owned: isOwned,
        status: isOwned ? "owned_unread" : "wishlist"
    });

    return {
        success: true,
        message: `Agregado a la colección: ${title}${isOwned ? "" : " (wishlist)"}`
    };
}
