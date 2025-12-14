import { action } from "./_generated/server";
import { v } from "convex/values";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, ToolMessage, AIMessage } from "@langchain/core/messages";
import { z } from "zod";
import { api } from "./_generated/api";
import { DynamicStructuredTool } from "@langchain/core/tools";

import type { Doc } from "./_generated/dataModel";

export const sendMessage = action({
    args: { messages: v.any() }, // Receive chat history (adapter needed usually, but we'll parse)
    handler: async (ctx, args: { messages: { role: string; content: string }[] }) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) {
            throw new Error("Unauthorized");
        }

        // --- CONTEXT LOADING ---
        const userRecord = (await ctx.runQuery(api.users.getCurrentUser, {})) as Doc<"users">;
        const families = (await ctx.runQuery(api.families.getUserFamilies, { userId: userRecord._id })) as Doc<"families">[];
        if (families.length === 0) throw new Error("No tienes familia asignada");
        const familyId = families[0]._id; // Default to first family

        // --- TOOLS DEFINITION ---
        const expenseTool = new DynamicStructuredTool({
            name: "registerExpense",
            description: "Registrar un nuevo gasto (expense).",
            schema: z.object({
                description: z.string().describe("Descripción del gasto"),
                amount: z.number().describe("Monto del gasto"),
                category: z.enum([
                    "food", "transport", "entertainment", "utilities", "health",
                    "shopping", "home", "education", "gifts", "other"
                ]).describe("Categoría del gasto."),
                date: z.string().optional().describe("Fecha en formato YYYY-MM-DD."),
            }),
            func: async ({ description, amount, category, date }) => {
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
        });

        const loanTool = new DynamicStructuredTool({
            name: "registerLoan",
            description: "Registrar un préstamo (alguien me debe o yo debo).",
            schema: z.object({
                type: z.enum(["lent", "borrowed"]).describe("lent: Presté dinero. borrowed: Me prestaron."),
                personName: z.string().describe("Nombre de la persona"),
                amount: z.number(),
            }),
            func: async ({ type, personName, amount }) => {
                await ctx.runMutation(api.loans.create, {
                    familyId,
                    type,
                    personName,
                    amount,
                    date: Date.now(),
                });
                return `Préstamo registrado: ${type === "lent" ? "Prestaste" : "Te prestaron"} $${amount} a/de ${personName}.`;
            },
        });

        const collectionTool = new DynamicStructuredTool({
            name: "addToCollection",
            description: "Agregar un item a una colección (libro, juego, etc).",
            schema: z.object({
                type: z.enum(["book", "manga", "board_game", "video_game", "other"]),
                title: z.string(),
                creator: z.string().optional(),
            }),
            func: async ({ type, title, creator }) => {
                await ctx.runMutation(api.collections.createItem, {
                    familyId,
                    type: type as "book" | "manga" | "comic" | "board_game" | "video_game" | "collectible" | "other",
                    title,
                    creator,
                    owned: true,
                    status: "wishlist"
                });
                return `Agregado a la colección: ${title} (${type})`;
            },
        });

        const tools = [expenseTool, loanTool, collectionTool];

        // --- LLM SETUP ---
        // --- LLM SETUP ---
        const model = new ChatGoogleGenerativeAI({
            model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
            apiKey: process.env.GEMINI_API_KEY,
            temperature: 0,
        }).bindTools(tools);

        // --- MESSAGE PARSING ---
        // Convert frontend messages to LangChain format
        const langChainMessages = args.messages.map(m => {
            if (m.role === 'user') return new HumanMessage(m.content);
            if (m.role === 'assistant') return new AIMessage(m.content);
            return new HumanMessage(m.content); // Default fallback
        });

        // Add System Message
        const systemMessage = new SystemMessage(`Eres un asistente de gestión familiar inteligente para la plataforma 'dPeluChe'.
        Tu objetivo es ayudar al usuario a registrar gastos, préstamos, actividades y colecciones mediante lenguaje natural.
        Actúa de forma amable y eficiente. Si falta información para una acción, pídela.
        El ID de familia a usar es: ${familyId}. Hoy es: ${new Date().toLocaleDateString()}.`);

        const messages = [systemMessage, ...langChainMessages];

        // --- EXECUTION LOOP ---
        // Basic manual tool calling loop for convex action context
        const response = await model.invoke(messages);

        // Check if there are tool calls
        if (response.tool_calls && response.tool_calls.length > 0) {
            // Execute tools
            const toolMessages = [];
            for (const toolCall of response.tool_calls) {
                const tool = tools.find(t => t.name === toolCall.name);
                if (tool) {
                    const result = await (tool as unknown as { func: (args: Record<string, unknown>) => Promise<string> }).func(toolCall.args);
                    toolMessages.push(new ToolMessage({
                        tool_call_id: toolCall.id || "", // Google might not send IDs same as OpenAI
                        content: result,
                        name: toolCall.name
                    }));
                }
            }

            // Get final response after tools
            if (toolMessages.length > 0) {
                const finalResponse = await model.invoke([...messages, response, ...toolMessages]);
                return finalResponse.content;
            }
        }

        return response.content;
    },
});
