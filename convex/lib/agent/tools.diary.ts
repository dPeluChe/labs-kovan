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

const DEFAULT_ENTRIES_LIMIT = 5;

export const getDiaryEntriesTool: ToolDefinition = {
    name: "getDiaryEntries",
    description: "Leer las entradas recientes del diario: las propias (privadas) y las compartidas con la familia. La privacidad se respeta automáticamente (nunca se ven entradas privadas de otros).",
    parameters: {
        type: "object" as const,
        properties: {
            limit: {
                type: "number" as const,
                description: `Cantidad de entradas a traer (default ${DEFAULT_ENTRIES_LIMIT})`
            }
        },
        required: []
    }
};

export async function handleGetDiaryEntries(context: ToolContext, args: Record<string, unknown>) {
    const { limit } = args as { limit?: number };
    const max = typeof limit === "number" && Number.isFinite(limit) && limit > 0
        ? Math.min(Math.floor(limit), 20)
        : DEFAULT_ENTRIES_LIMIT;

    // diary.getEntries ya filtra privacidad: familiares + propias privadas.
    const entries = await context.ctx.runQuery(api.diary.getEntries, {
        sessionToken: context.sessionToken,
        familyId: context.familyId
    });

    if (entries.length === 0) {
        return { success: true, message: "No hay entradas de diario visibles para ti." };
    }

    const lines = entries.slice(0, max).map((entry) => {
        const date = new Date(entry.date).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
        const mood = entry.moodEmoji || entry.moodLabel
            ? ` ${[entry.moodEmoji, entry.moodLabel].filter(Boolean).join(" ")}`
            : "";
        const visibility = entry.visibility === "family" ? " [familiar]" : "";
        const isMine = entry.userId === context.userId ? "" : " (de otro miembro)";
        const content = (entry.content ?? "").trim();
        const preview = content.length > 140 ? `${content.slice(0, 140)}…` : content;
        return `- ${date}${mood}${visibility}${isMine}: ${preview || "(sin texto)"}`;
    });

    return {
        success: true,
        message: `Entradas del diario (${Math.min(entries.length, max)} de ${entries.length}):\n${lines.join("\n")}`
    };
}
