import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";
import { findBestMatch } from "./fuzzyMatch";
import { parseLocalDate } from "./dates";

type TaskType = "general" | "shopping" | "chore";
type TaskPriority = "low" | "medium" | "high";

const TASK_MATCH_THRESHOLD = 0.6;

function formatDueDate(timestamp?: number): string {
    if (!timestamp) return "";
    return ` (vence ${new Date(timestamp).toLocaleDateString("es-MX", { day: "numeric", month: "short" })})`;
}

export const listTasksTool: ToolDefinition = {
    name: "listTasks",
    description: "Consultar las tareas pendientes de la familia (pendientes generales, lista del super, rutinas del hogar). Usa esto cuando pregunten qué hay por hacer o qué falta comprar.",
    parameters: {
        type: "object" as const,
        properties: {
            type: {
                type: "string" as const,
                description: "Filtrar por tipo de tarea (opcional): general, shopping (lista del super), chore (rutina)",
                enum: ["general", "shopping", "chore"]
            },
            includeCompleted: {
                type: "boolean" as const,
                description: "Incluir también las tareas completadas (default false)"
            }
        },
        required: []
    }
};

export async function handleListTasks(context: ToolContext, args: Record<string, unknown>) {
    const { type, includeCompleted } = args as { type?: TaskType; includeCompleted?: boolean };

    const tasks = await context.ctx.runQuery(api.tasks.list, {
        sessionToken: context.sessionToken,
        familyId: context.familyId,
        type,
        status: includeCompleted ? undefined : "pending"
    });

    if (tasks.length === 0) {
        return { success: true, message: type ? `No hay tareas de tipo ${type}.` : "No hay tareas pendientes. 🎉" };
    }

    const lines = tasks.map((task) => {
        const priority = task.priority === "high" ? " ⚠️" : "";
        const status = task.status === "completed" ? " [completada]" : "";
        return `- ${task.title}${priority}${formatDueDate(task.dueDate)}${status}`;
    });

    return {
        success: true,
        message: `Tareas (${tasks.length}):\n${lines.join("\n")}`
    };
}

export const addTaskTool: ToolDefinition = {
    name: "addTask",
    description: "Crear una tarea pendiente. Usa type=shopping para items de la lista del super, chore para rutinas del hogar, general para todo lo demás.",
    parameters: {
        type: "object" as const,
        properties: {
            title: {
                type: "string" as const,
                description: "Título de la tarea (ej: 'Comprar leche', 'Pagar la luz')"
            },
            type: {
                type: "string" as const,
                description: "Tipo de tarea",
                enum: ["general", "shopping", "chore"]
            },
            description: {
                type: "string" as const,
                description: "Detalles adicionales (opcional)"
            },
            priority: {
                type: "string" as const,
                description: "Prioridad (opcional)",
                enum: ["low", "medium", "high"]
            },
            dueDate: {
                type: "string" as const,
                description: "Fecha límite en formato YYYY-MM-DD (opcional)"
            }
        },
        required: ["title", "type"]
    }
};

export async function handleAddTask(context: ToolContext, args: Record<string, unknown>) {
    const { title, type, description, priority, dueDate } = args as {
        title: string;
        type: TaskType;
        description?: string;
        priority?: TaskPriority;
        dueDate?: string;
    };

    let dueTimestamp: number | undefined;
    if (dueDate) {
        const parsed = parseLocalDate(dueDate);
        if (parsed === null) {
            return { success: false, message: `La fecha "${dueDate}" no es válida. Usa el formato YYYY-MM-DD.` };
        }
        dueTimestamp = parsed;
    }

    await context.ctx.runMutation(api.tasks.create, {
        sessionToken: context.sessionToken,
        familyId: context.familyId,
        title,
        type,
        description,
        priority,
        dueDate: dueTimestamp
    });

    return { success: true, message: `Tarea creada: ${title}${formatDueDate(dueTimestamp)}.` };
}

export const completeTaskTool: ToolDefinition = {
    name: "completeTask",
    description: "Marcar una tarea pendiente como completada, buscándola por su título.",
    parameters: {
        type: "object" as const,
        properties: {
            title: {
                type: "string" as const,
                description: "Título (o parte del título) de la tarea a completar"
            }
        },
        required: ["title"]
    }
};

export async function handleCompleteTask(context: ToolContext, args: Record<string, unknown>) {
    const { title } = args as { title: string };

    const pending = await context.ctx.runQuery(api.tasks.list, {
        sessionToken: context.sessionToken,
        familyId: context.familyId,
        status: "pending"
    });

    const task = findBestMatch(title, pending, (t) => t.title, TASK_MATCH_THRESHOLD);
    if (!task) {
        const available = pending.length > 0
            ? ` Tareas pendientes: ${pending.map((t) => t.title).join(", ")}.`
            : " No hay tareas pendientes.";
        return {
            success: false,
            message: `No encontré una tarea pendiente que coincida con "${title}".${available}`
        };
    }

    await context.ctx.runMutation(api.tasks.toggleStatus, {
        sessionToken: context.sessionToken,
        familyId: context.familyId,
        taskId: task._id
    });

    return { success: true, message: `Tarea completada: ${task.title} ✅` };
}
