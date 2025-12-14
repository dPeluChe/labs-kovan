import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";

export const addRecipeTool: ToolDefinition = {
    name: "addRecipe",
    description: "Guardar una receta de cocina. Usa esto cuando el usuario quiera recordar una receta.",
    parameters: {
        type: "object" as const,
        properties: {
            title: {
                type: "string" as const,
                description: "Nombre del platillo o receta"
            },
            category: {
                type: "string" as const,
                description: "Categoría (desayuno, comida, cena, postre, etc.) - opcional"
            },
            description: {
                type: "string" as const,
                description: "Breve descripción de la receta (opcional)"
            },
            notes: {
                type: "string" as const,
                description: "Ingredientes, pasos de preparación, o notas adicionales (opcional)"
            }
        },
        required: ["title"]
    }
};

export async function handleAddRecipe(context: ToolContext, args: Record<string, unknown>) {
    const { title, category, description, notes } = args as { title: string; category?: string; description?: string; notes?: string };

    await context.ctx.runMutation(api.recipes.createRecipe, {
        familyId: context.familyId,
        title,
        category,
        description,
        notes,
        addedBy: context.userId
    });

    return { success: true, message: `Receta guardada: ${title}.` };
}
