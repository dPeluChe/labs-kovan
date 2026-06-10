import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";
import { findBestMatch } from "./fuzzyMatch";
import { parseLocalDate } from "./dates";

const DUPLICATE_THRESHOLD = 0.85;
const PLACE_MATCH_THRESHOLD = 0.6;

type PlaceCategory = "restaurant" | "cafe" | "travel" | "activity" | "other";

const PLACE_CATEGORY_LABEL: Record<PlaceCategory, string> = {
    restaurant: "restaurante",
    cafe: "café",
    travel: "viaje",
    activity: "actividad",
    other: "otro",
};

export const getPlacesTool: ToolDefinition = {
    name: "getPlaces",
    description: "Consultar los lugares guardados de la familia (restaurantes, cafés, destinos, actividades), con filtro opcional por categoría o por visitados/pendientes. Usa esto cuando pregunten a dónde ir o qué lugares tienen guardados.",
    parameters: {
        type: "object" as const,
        properties: {
            category: {
                type: "string" as const,
                description: "Filtrar por categoría (opcional)",
                enum: ["restaurant", "cafe", "travel", "activity", "other"]
            },
            visited: {
                type: "boolean" as const,
                description: "true = solo visitados, false = solo pendientes por visitar (opcional)"
            }
        },
        required: []
    }
};

export async function handleGetPlaces(context: ToolContext, args: Record<string, unknown>) {
    const { category, visited } = args as { category?: PlaceCategory; visited?: boolean };

    const places = await context.ctx.runQuery(api.places.getPlaces, {
        sessionToken: context.sessionToken,
        familyId: context.familyId
    });

    let results = places;
    if (category) {
        results = results.filter((place) => place.category === category);
    }
    if (visited !== undefined) {
        results = results.filter((place) => (place.visited ?? false) === visited);
    }

    if (results.length === 0) {
        const scope = [
            category && `categoría ${PLACE_CATEGORY_LABEL[category] ?? category}`,
            visited !== undefined && (visited ? "visitados" : "pendientes"),
        ].filter(Boolean).join(", ");
        return {
            success: true,
            message: scope
                ? `No hay lugares para ${scope}. Hay ${places.length} lugares guardados en total.`
                : "No hay lugares guardados aún."
        };
    }

    const lines = results.map((place) => {
        const status = place.visited ? "✓ visitado" : "pendiente";
        const rating = place.rating ? ` ${"⭐".repeat(Math.round(place.rating))}` : "";
        const highlight = place.highlight ? ` — ${place.highlight}` : "";
        return `- ${place.name} (${PLACE_CATEGORY_LABEL[place.category as PlaceCategory] ?? place.category}, ${status}${rating})${highlight}`;
    });

    return {
        success: true,
        message: `Lugares (${results.length}):\n${lines.join("\n")}`
    };
}

export const registerPlaceVisitTool: ToolDefinition = {
    name: "registerPlaceVisit",
    description: "Registrar que la familia visitó un lugar guardado, con calificación opcional. Busca el lugar por nombre (fuzzy match).",
    parameters: {
        type: "object" as const,
        properties: {
            placeName: {
                type: "string" as const,
                description: "Nombre del lugar visitado (debe existir en lugares guardados)"
            },
            date: {
                type: "string" as const,
                description: "Fecha de la visita en formato YYYY-MM-DD (opcional, default hoy)"
            },
            rating: {
                type: "number" as const,
                description: "Calificación de 1 a 5 (opcional)"
            },
            notes: {
                type: "string" as const,
                description: "Notas de la visita (opcional)"
            }
        },
        required: ["placeName"]
    }
};

export async function handleRegisterPlaceVisit(context: ToolContext, args: Record<string, unknown>) {
    const { placeName, date, rating, notes } = args as {
        placeName: string;
        date?: string;
        rating?: number;
        notes?: string;
    };

    if (rating !== undefined && (!Number.isFinite(rating) || rating < 1 || rating > 5)) {
        return { success: false, message: `La calificación "${rating}" no es válida. Usa un número de 1 a 5.` };
    }

    const visitDate = date ? parseLocalDate(date) : Date.now();
    if (visitDate === null) {
        return { success: false, message: `La fecha "${date}" no es válida. Usa el formato YYYY-MM-DD.` };
    }

    const places = await context.ctx.runQuery(api.places.getPlaces, {
        sessionToken: context.sessionToken,
        familyId: context.familyId
    });

    const place = findBestMatch(placeName, places, (p) => p.name, PLACE_MATCH_THRESHOLD);
    if (!place) {
        const available = places.length > 0
            ? ` Lugares guardados: ${places.map((p) => p.name).join(", ")}.`
            : " No hay lugares guardados; primero agrégalo con addPlace.";
        return {
            success: false,
            message: `No encontré un lugar que coincida con "${placeName}".${available}`
        };
    }

    await context.ctx.runMutation(api.places.recordVisit, {
        sessionToken: context.sessionToken,
        familyId: context.familyId,
        placeId: place._id,
        visitDate,
        rating,
        notes,
    });

    const ratingMsg = rating ? ` con ${rating}/5` : "";
    return { success: true, message: `Visita registrada: ${place.name}${ratingMsg} ✓` };
}

export const addPlaceTool: ToolDefinition = {
    name: "addPlace",
    description: "Guardar un lugar recomendado (restaurante, café, destino de viaje, actividad). Usa esto cuando el usuario quiera guardar un lugar para visitar.",
    parameters: {
        type: "object" as const,
        properties: {
            name: {
                type: "string" as const,
                description: "Nombre del lugar"
            },
            category: {
                type: "string" as const,
                description: "Categoría del lugar",
                enum: ["restaurant", "cafe", "travel", "activity", "other"]
            },
            address: {
                type: "string" as const,
                description: "Dirección o ubicación (opcional)"
            },
            highlight: {
                type: "string" as const,
                description: "Qué destacar del lugar, qué venden, por qué es especial (opcional)"
            },
            notes: {
                type: "string" as const,
                description: "Notas adicionales (opcional)"
            },
            allowDuplicate: {
                type: "boolean" as const,
                description: "Permitir guardar aunque exista un lugar con nombre muy similar. SOLO usar true cuando el usuario confirme que es un lugar distinto (otra sucursal, otra ciudad)."
            }
        },
        required: ["name", "category"]
    }
};

export async function handleAddPlace(context: ToolContext, args: Record<string, unknown>) {
    const { name, category, address, highlight, notes, allowDuplicate } = args as {
        name: string;
        category: string;
        address?: string;
        highlight?: string;
        notes?: string;
        allowDuplicate?: boolean;
    };

    if (!allowDuplicate) {
        const places = await context.ctx.runQuery(api.places.getPlaces, {
            sessionToken: context.sessionToken,
            familyId: context.familyId
        });
        const duplicate = findBestMatch(name, places, (place) => place.name, DUPLICATE_THRESHOLD);
        if (duplicate) {
            return {
                success: false,
                message: `Ya existe el lugar "${duplicate.name}" (${duplicate.category}). Confirma con el usuario si es el mismo; si es uno distinto (otra sucursal/ciudad), vuelve a llamar con allowDuplicate=true.`
            };
        }
    }

    await context.ctx.runMutation(api.places.createPlace, {
        sessionToken: context.sessionToken,
        familyId: context.familyId,
        name,
        category: category as "restaurant" | "cafe" | "travel" | "activity" | "other",
        address,
        highlight,
        notes,
    });

    return { success: true, message: `Lugar guardado: ${name} en ${category}.` };
}
