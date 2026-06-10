import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";
import { findBestMatch } from "./fuzzyMatch";

const DUPLICATE_THRESHOLD = 0.85;

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
