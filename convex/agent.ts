import { action } from "./_generated/server";
import { v } from "convex/values";
import { generateText, tool } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { api } from "./_generated/api";
import type { CoreMessage } from "ai";

import type { Doc } from "./_generated/dataModel";

export const sendMessage = action({
    args: { messages: v.any() }, // Recibe el historial de chat (Vercel AI SDK format)
    handler: async (ctx, args: { messages: CoreMessage[] }) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) {
            throw new Error("Unauthorized");
        }

        // Buscar familia del usuario (asumimos la primera activa para simplificar por ahora, 
        // idealmente el contexto deberia pasarse)
        const userRecord = (await ctx.runQuery(api.users.getCurrentUser, {})) as Doc<"users">;
        // Necesitamos el familyId para las operaciones. 
        // Como las acciones no pueden llamar a queries privadas facil sin pasar args, 
        // vamos a obtener las familias aqui o pedir que el frontend envie el familyId.
        // Para ser robusto el frontend deberia enviar el familyId en el mensaje o como arg separado.
        // Voy a asumir que el frontend lo manda en el ultimo mensaje o buscaremos la familia por defecto.


        const families = (await ctx.runQuery(api.families.getUserFamilies, { userId: userRecord._id })) as Doc<"families">[];
        if (families.length === 0) throw new Error("No tienes familia asignada");
        const familyId = families[0]._id; // Default to first family

        const expenseSchema = z.object({
            description: z.string().describe("Descripción del gasto"),
            amount: z.number().describe("Monto del gasto"),
            category: z.enum([
                "food", "transport", "entertainment", "utilities", "health",
                "shopping", "home", "education", "gifts", "other"
            ]).describe("Categoría del gasto. Infiere la mejor opción."),
            date: z.string().optional().describe("Fecha en formato YYYY-MM-DD. Si no se especifica, usa hoy."),
        });

        const loanSchema = z.object({
            type: z.enum(["lent", "borrowed"]).describe("lent: Presté dinero (me deben). borrowed: Me prestaron (debo)."),
            personName: z.string().describe("Nombre de la persona"),
            amount: z.number(),
        });

        const collectionSchema = z.object({
            type: z.enum(["book", "manga", "board_game", "video_game", "other"]),
            title: z.string(),
            creator: z.string().optional(),
        });

        const google = createGoogleGenerativeAI({
            apiKey: process.env.GEMINI_API_KEY,
        });

        const result = await generateText({
            model: google("gemini-1.5-flash"),
            system: `Eres un asistente de gestión familiar inteligente para la plataforma 'dPeluChe'.
      Tu objetivo es ayudar al usuario a registrar gastos, préstamos, actividades y colecciones mediante lenguaje natural.
      Actúa de forma amable y eficiente. Si falta información para una acción, pídela.
      El ID de familia a usar es: ${familyId} (No se lo menciones al usuario, úsalo internamente).
      Hoy es: ${new Date().toLocaleDateString()}`,
            messages: args.messages,
            // maxSteps: 5, // Not supported in current types
            tools: {
                registerExpense: tool({
                    description: "Registrar un nuevo gasto (expense).",
                    inputSchema: expenseSchema,
                    execute: async ({ description, amount, category, date }: {
                        description: string;
                        amount: number;
                        category: "food" | "transport" | "entertainment" | "utilities" | "health" | "shopping" | "home" | "education" | "gifts" | "other";
                        date?: string;
                    }) => {
                        await ctx.runMutation(api.expenses.createExpense, {
                            familyId,
                            description,
                            amount,
                            category,
                            type: "general",
                            date: date ? new Date(date).getTime() : Date.now(),
                            paidBy: userRecord._id,
                        });
                        return `Gasto de $${amount} (${description}) registrado en ${category}.`;
                    },
                }),
                registerLoan: tool({
                    description: "Registrar un préstamo (alguien me debe o yo debo).",
                    inputSchema: loanSchema,
                    execute: async ({ type, personName, amount }: {
                        type: "lent" | "borrowed";
                        personName: string;
                        amount: number;
                    }) => {
                        await ctx.runMutation(api.loans.create, {
                            familyId,
                            type,
                            personName,
                            amount,
                            date: Date.now(),
                        });
                        return `Préstamo registrado: ${type === "lent" ? "Prestaste" : "Te prestaron"} $${amount} a/de ${personName}.`;
                    },
                }),
                addToCollection: tool({
                    description: "Agregar un item a una colección (libro, juego, etc).",
                    inputSchema: collectionSchema,
                    execute: async ({ type, title, creator }: {
                        type: "book" | "manga" | "board_game" | "video_game" | "other";
                        title: string;
                        creator?: string;
                    }) => {
                        await ctx.runMutation(api.collections.createItem, {
                            familyId,
                            type: type as "book" | "manga" | "comic" | "board_game" | "video_game" | "collectible" | "other",
                            title,
                            creator,
                            owned: true,
                            status: "wishlist"
                        });
                        return `Agregado a la colección: ${title} (${type})`;
                    }
                })
            },
        });

        return result.text;
    },
});
