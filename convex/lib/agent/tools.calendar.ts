import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";

function formatEventDate(timestamp: number, allDay: boolean): string {
    const date = new Date(timestamp);
    const day = date.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
    if (allDay) return day;
    const time = date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    return `${day} ${time}`;
}

export const getUpcomingEventsTool: ToolDefinition = {
    name: "getUpcomingEvents",
    description: "Consultar los próximos eventos del calendario familiar (sincronizado con Google Calendar). Usa esto cuando pregunten qué hay en la agenda, qué eventos vienen, o si están libres.",
    parameters: {
        type: "object" as const,
        properties: {
            limit: {
                type: "number" as const,
                description: "Cantidad máxima de eventos a traer (default 10)"
            }
        },
        required: []
    }
};

export async function handleGetUpcomingEvents(context: ToolContext, args: Record<string, unknown>) {
    const { limit } = args as { limit?: number };

    const events = await context.ctx.runQuery(api.calendar.getUpcomingEvents, {
        sessionToken: context.sessionToken,
        familyId: context.familyId,
        limit
    });

    if (events.length === 0) {
        return {
            success: true,
            message: "No hay eventos próximos en el calendario. Si la familia usa Google Calendar, puede que falte sincronizar desde la app."
        };
    }

    const lines = events.map((event) => {
        const location = event.location ? ` @ ${event.location}` : "";
        return `- ${formatEventDate(event.startDateTime, event.allDay)}: ${event.title}${location}`;
    });

    return {
        success: true,
        message: `Próximos eventos (${events.length}):\n${lines.join("\n")}`
    };
}
