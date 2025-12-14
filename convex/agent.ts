import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Id, Doc } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { allToolDefinitions, toolHandlers } from "./lib/agent";

// Helper function to get family ID
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getFamilyIdForUser(ctx: any, userId: Id<"users">): Promise<Id<"families">> {
    const families = (await ctx.runQuery(api.families.getUserFamilies, { userId })) as Doc<"families">[];
    if (families.length === 0) throw new Error("No tienes familia asignada");
    return families[0]._id;
}

// Define ToolContext type for clarity in tool handlers
type ToolContext = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctx: any;
    userId: Id<"users">;
    familyId: Id<"families">;
};

export const sendMessage = action({
    args: {
        messages: v.any(),
        userId: v.id("users")
    },
    handler: async (ctx, args: { messages: { role: string; content: string }[]; userId: Id<"users"> }) => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

        const primaryModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        // Use lite variant - should have separate quota from flash/preview variants
        const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash-lite";

        // Try with primary model first, then fallback
        const modelsToTry = [primaryModel, fallbackModel];
        let lastError: Error | null = null;

        for (const modelName of modelsToTry) {
            try {
                console.log(`🤖 Attempting with model: ${modelName}`);

                const genAI = new GoogleGenerativeAI(apiKey);
                const familyId = await getFamilyIdForUser(ctx, args.userId);

                const model = genAI.getGenerativeModel({
                    model: modelName,
                    tools: [{ functionDeclarations: allToolDefinitions as unknown as never[] }],
                    systemInstruction: {
                        parts: [{
                            text: `Eres Kovan, un asistente IA integrado en la app de gestión familiar "Kovan".

**Personalidad:**
- Respuestas cortas, directas y amigables (máximo 2-3 líneas)
- Tono casual y cercano, como un amigo que ayuda
- Usa emojis ocasionalmente para ser más expresivo

**Funciones:**
Ayudas a las familias a gestionar:
- 💰 Gastos y préstamos
- 📚 Colecciones (libros, juegos, etc)
- 📍 Lugares recomendados
- 🍳 Recetas de cocina
- 🚗 Mantenimiento de vehículos
- 🎁 Listas de regalos

**Limitaciones:**
- SOLO ayudas con funciones de la app Kovan
- NO respondas preguntas generales, blogs, noticias, ni temas fuera de la app
- Si piden algo fuera del alcance: "Solo puedo ayudarte con Kovan. ¿Qué quieres registrar o consultar?"

Hoy es: ${new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`
                        }],
                        role: "system"
                    }
                });

                // Build chat history excluding the last user message for the initial sendMessage call
                const history = args.messages.slice(0, -1).map(msg => ({
                    role: msg.role === 'user' ? 'user' as const : 'model' as const,
                    parts: [{ text: msg.content }]
                }));

                const chat = model.startChat({ history });

                // Get the last user message
                const lastUserMessage = args.messages[args.messages.length - 1]?.content || "";
                let result = await chat.sendMessage(lastUserMessage);
                let response = result.response;

                // Enhanced error tracking
                const executedTools: string[] = [];

                // Handle function calls with detailed error logging
                while (response.candidates?.[0]?.content?.parts?.some(part => 'functionCall' in part)) {
                    const functionCalls = response.candidates[0].content.parts
                        .filter((part): part is { functionCall: { name: string; args: Record<string, unknown> } } =>
                            'functionCall' in part && typeof part.functionCall === 'object'
                        )
                        .map(part => part.functionCall); // Extract functionCall directly

                    const functionResponses = await Promise.all(
                        functionCalls.map(async (fc) => {
                            const toolName = fc.name;
                            executedTools.push(toolName);

                            try {
                                const handler = toolHandlers[toolName]; // Access handler directly from object
                                if (!handler) {
                                    throw new Error(`Tool handler not found: ${toolName}`);
                                }

                                const context: ToolContext = {
                                    ctx,
                                    userId: args.userId,
                                    familyId
                                };
                                const toolArgs = fc.args as Record<string, unknown>;
                                const toolResult = await handler(context, toolArgs); // Call the handler

                                return {
                                    functionResponse: {
                                        name: toolName,
                                        response: toolResult
                                    }
                                };
                            } catch (error) {
                                const errorMsg = error instanceof Error ? error.message : String(error);
                                console.error(`❌ Tool execution error [${toolName}]:`, errorMsg);

                                return {
                                    functionResponse: {
                                        name: toolName,
                                        response: {
                                            error: errorMsg,
                                            executedTools
                                        }
                                    }
                                };
                            }
                        })
                    );

                    result = await chat.sendMessage(functionResponses as unknown as never[]);
                    response = result.response;
                }

                const finalText = response.candidates?.[0]?.content?.parts
                    ?.map(part => ('text' in part ? part.text : ''))
                    .join('') || "Lo siento, no pude generar una respuesta.";

                console.log(`✅ Success with model: ${modelName}`);

                // Add model indicator if using fallback and it's different from primary
                if (modelName === fallbackModel && modelName !== primaryModel) {
                    return `${finalText}\n\n_[Usando modelo alternativo]_`;
                }

                return finalText;

            } catch (error) {
                lastError = error as Error;
                const errorStr = String(error);

                // Check if it's a quota error (429)
                const isQuotaError = errorStr.includes('429') ||
                    errorStr.includes('Too Many Requests') ||
                    errorStr.includes('quota');

                console.error(`⚠️ Model ${modelName} failed:`, isQuotaError ? 'QUOTA_EXCEEDED' : 'ERROR');

                // If it's a quota error and we have more models to try, continue
                if (isQuotaError && modelName !== modelsToTry[modelsToTry.length - 1]) {
                    console.log(`🔄 Trying fallback model...`);
                    continue;
                }

                // If it's not a quota error or it's the last model, throw
                if (!isQuotaError || modelName === modelsToTry[modelsToTry.length - 1]) {
                    throw error;
                }
            }
        }

        // If we got here, all models failed
        throw lastError || new Error("All models failed");
    },
});
