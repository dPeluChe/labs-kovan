import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Id, Doc } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { allToolDefinitions, toolHandlers } from "./lib/agent";

export const sendMessage = action({
    args: {
        messages: v.any(),
        userId: v.id("users")
    },
    handler: async (ctx, args: { messages: { role: string; content: string }[]; userId: Id<"users"> }) => {
        // --- CONTEXT LOADING ---
        const families = (await ctx.runQuery(api.families.getUserFamilies, { userId: args.userId })) as Doc<"families">[];
        if (families.length === 0) throw new Error("No tienes familia asignada");
        const familyId = families[0]._id;

        // --- GEMINI SDK SETUP ---
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

        const model = genAI.getGenerativeModel({
            model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
            tools: [{ functionDeclarations: allToolDefinitions as unknown as never[] }],
            systemInstruction: {
                parts: [{
                    text: `Eres un asistente de gestión familiar inteligente para la plataforma 'dPeluChe'.
Tu objetivo es ayudar al usuario a registrar gastos, préstamos, actividades, colecciones, lugares, recetas, eventos de vehículos y gestionar listas de regalos mediante lenguaje natural.
También puedes consultar información como resumen de gastos, préstamos activos, y colecciones.

**Regalos:** Puedes crear eventos de regalos (cumpleaños, navidad, etc), agregar regalos a esos eventos (asignados o sin asignar), y actualizar su estado.

Actúa de forma amable y eficiente. Si falta información para una acción, pídela de manera conversacional.
Siempre responde en español. Hoy es: ${new Date().toLocaleDateString('es-MX')}.`
                }],
                role: "system"
            }
        });

        // --- BUILD CHAT HISTORY ---
        const history = args.messages.map(msg => ({
            role: msg.role === 'user' ? 'user' as const : 'model' as const,
            parts: [{ text: msg.content }]
        }));

        // --- START CHAT ---
        const chat = model.startChat({ history });

        // Get the last user message
        const lastUserMessage = args.messages.filter(m => m.role === 'user').pop()?.content || "";

        // --- SEND MESSAGE ---
        let result = await chat.sendMessage(lastUserMessage);
        let response = result.response;

        // --- HANDLE FUNCTION CALLS ---
        while (response.candidates?.[0]?.content?.parts?.some(part => 'functionCall' in part)) {
            const functionCalls = response.candidates[0].content.parts
                .filter(part => 'functionCall' in part)
                .map(part => part.functionCall!);

            const functionResponses = [];

            for (const fc of functionCalls) {
                let functionResult: { success: boolean; message: string } | { error: string } = { error: "Unknown function" };

                try {
                    const handler = toolHandlers[fc.name];
                    if (handler) {
                        const toolContext = {
                            ctx,
                            familyId,
                            userId: args.userId
                        };
                        functionResult = await handler(toolContext, (fc.args || {}) as Record<string, unknown>);
                    }
                } catch (error: unknown) {
                    functionResult = { error: error instanceof Error ? error.message : String(error) };
                }

                functionResponses.push({
                    functionResponse: {
                        name: fc.name,
                        response: functionResult
                    }
                });
            }

            // Send function responses back to model
            result = await chat.sendMessage(functionResponses);
            response = result.response;
        }

        // --- EXTRACT FINAL TEXT RESPONSE ---
        const finalText = response.candidates?.[0]?.content?.parts
            ?.filter(part => 'text' in part)
            .map(part => part.text)
            .join('') || "Lo siento, no pude procesar la respuesta.";

        return finalText;
    },
});
