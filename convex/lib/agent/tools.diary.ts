import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";

export const addDiaryEntryTool: ToolDefinition = {
    name: "addDiaryEntry",
    description: "Crear una entrada de diario personal con mood opcional. Por default la entrada es privada (solo la ve el usuario); usa visibility=family solo si el usuario pide compartirla con la familia.",
    parameters: {
        type: "object" as const,
        properties: {
            content: {
                type: "string" as const,
                description: "Contenido de la entrada del diario"
            },
            moodEmoji: {
                type: "string" as const,
                description: "Emoji que representa el estado de ánimo (opcional, ej: 😊 😔 😤)"
            },
            moodLabel: {
                type: "string" as const,
                description: "Etiqueta del estado de ánimo (opcional, ej: 'feliz', 'cansado')"
            },
            visibility: {
                type: "string" as const,
                description: "Visibilidad de la entrada (default: private)",
                enum: ["private", "family"]
            }
        },
        required: ["content"]
    }
};

export async function handleAddDiaryEntry(context: ToolContext, args: Record<string, unknown>) {
    const { content, moodEmoji, moodLabel, visibility } = args as {
        content: string;
        moodEmoji?: string;
        moodLabel?: string;
        visibility?: "private" | "family";
    };

    if (!content.trim()) {
        return { success: false, message: "La entrada del diario no puede estar vacía." };
    }

    await context.ctx.runMutation(api.diary.createEntry, {
        sessionToken: context.sessionToken,
        familyId: context.familyId,
        content: content.trim(),
        moodEmoji,
        moodLabel,
        visibility: visibility ?? "private"
    });

    const moodMsg = moodEmoji || moodLabel ? ` con mood ${[moodEmoji, moodLabel].filter(Boolean).join(" ")}` : "";
    return {
        success: true,
        message: `Entrada de diario guardada${moodMsg} (${visibility === "family" ? "visible para la familia" : "privada"}).`
    };
}
