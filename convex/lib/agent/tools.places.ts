import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";

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
            }
        },
        required: ["name", "category"]
    }
};

export async function handleAddPlace(context: ToolContext, args: Record<string, unknown>) {
    const { name, category, address, highlight, notes } = args as { name: string; category: string; address?: string; highlight?: string; notes?: string };

    await context.ctx.runMutation(api.places.createPlace, {
        familyId: context.familyId,
        name,
        category: category as "restaurant" | "cafe" | "travel" | "activity" | "other",
        address,
        highlight,
        notes,
    });

    return { success: true, message: `Lugar guardado: ${name} en ${category}.` };
}
