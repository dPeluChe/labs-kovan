import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";
import { findAllMatches, findBestMatch } from "./fuzzyMatch";

const DUPLICATE_THRESHOLD = 0.85;
const SEARCH_THRESHOLD = 0.5;

export const listRecipesTool: ToolDefinition = {
    name: "listRecipes",
    description: "Consultar las recetas guardadas de la familia, con búsqueda opcional por título o filtro por categoría (desayuno, comida, cena, postre…). Usa esto cuando pregunten qué cocinar o si tienen cierta receta.",
    parameters: {
        type: "object" as const,
        properties: {
            query: {
                type: "string" as const,
                description: "Título o parte del título a buscar (opcional, fuzzy match)"
            },
            category: {
                type: "string" as const,
                description: "Filtrar por categoría exacta, ej: 'Desayuno', 'Postre' (opcional)"
            }
        },
        required: []
    }
};

export async function handleListRecipes(context: ToolContext, args: Record<string, unknown>) {
    const { query, category } = args as { query?: string; category?: string };

    const recipes = await context.ctx.runQuery(api.recipes.getRecipes, {
        sessionToken: context.sessionToken,
        familyId: context.familyId
    });

    let results = category
        ? recipes.filter((r) => r.category?.toLowerCase() === category.toLowerCase())
        : recipes;

    if (query) {
        results = findAllMatches(query, results, (r) => r.title, SEARCH_THRESHOLD, 10)
            .map((m) => m.item);
    }

    if (results.length === 0) {
        const scope = [query && `"${query}"`, category && `categoría ${category}`].filter(Boolean).join(", ");
        return {
            success: true,
            message: scope
                ? `No encontré recetas para ${scope}. Hay ${recipes.length} recetas guardadas en total.`
                : "No hay recetas guardadas aún."
        };
    }

    const lines = results.map((recipe) => {
        const cat = recipe.category ? ` (${recipe.category})` : "";
        const fav = recipe.isFavorite ? " ⭐" : "";
        const desc = recipe.description ? ` — ${recipe.description}` : "";
        return `- ${recipe.title}${cat}${fav}${desc}`;
    });

    return {
        success: true,
        message: `Recetas (${results.length}):\n${lines.join("\n")}`
    };
}

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
