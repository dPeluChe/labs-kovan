import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";
import { findBestMatch } from "./fuzzyMatch";

const DUPLICATE_THRESHOLD = 0.85;

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

    const recipes = await context.ctx.runQuery(api.recipes.getRecipes, {
        sessionToken: context.sessionToken,
        familyId: context.familyId
    });
    const duplicate = findBestMatch(title, recipes, (recipe) => recipe.title, DUPLICATE_THRESHOLD);
    if (duplicate) {
        return {
            success: false,
            message: `Ya existe la receta "${duplicate.title}". Confirma con el usuario si quiere actualizarla o si es una receta distinta (en ese caso usa un título más específico).`
        };
    }

    await context.ctx.runMutation(api.recipes.createRecipe, {
        sessionToken: context.sessionToken,
        familyId: context.familyId,
        title,
        category,
        description,
        notes
    });

    return { success: true, message: `Receta guardada: ${title}.` };
}
