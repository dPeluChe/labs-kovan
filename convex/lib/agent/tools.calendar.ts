import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";
import { parseLocalDate } from "./dates";

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

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;
const DEFAULT_DURATION_MINUTES = 60;
const MINUTE_MS = 60 * 1000;

export const createCalendarEventTool: ToolDefinition = {
    name: "createCalendarEvent",
    description: "Crear un evento en el calendario familiar (se sincroniza con Google Calendar). Requiere que la familia tenga el calendario conectado en la app.",
    parameters: {
        type: "object" as const,
        properties: {
            title: {
                type: "string" as const,
                description: "Título del evento"
            },
            date: {
                type: "string" as const,
                description: "Fecha del evento YYYY-MM-DD"
            },
            startTime: {
                type: "string" as const,
                description: "Hora de inicio en formato 24h HH:MM (ej: '14:30')"
            },
            durationMinutes: {
                type: "number" as const,
                description: `Duración en minutos (opcional, default ${DEFAULT_DURATION_MINUTES})`
            },
            location: {
                type: "string" as const,
                description: "Lugar del evento (opcional)"
            },
            description: {
                type: "string" as const,
                description: "Descripción o detalles (opcional)"
            }
        },
        required: ["title", "date", "startTime"]
    }
};

export async function handleCreateCalendarEvent(context: ToolContext, args: Record<string, unknown>) {
    const { title, date, startTime, durationMinutes, location, description } = args as {
        title: string;
        date: string;
        startTime: string;
        durationMinutes?: number;
        location?: string;
        description?: string;
    };

    const day = parseLocalDate(date);
    if (day === null) {
        return { success: false, message: `La fecha "${date}" no es válida. Usa el formato YYYY-MM-DD.` };
    }

    const timeMatch = TIME_RE.exec(startTime.trim());
    if (!timeMatch) {
        return { success: false, message: `La hora "${startTime}" no es válida. Usa el formato 24h HH:MM (ej: "09:00", "14:30").` };
    }

    const duration = durationMinutes ?? DEFAULT_DURATION_MINUTES;
    if (!Number.isFinite(duration) || duration <= 0) {
        return { success: false, message: `La duración "${durationMinutes}" no es válida. Usa minutos mayores a 0.` };
    }

    const start = day + (Number(timeMatch[1]) * 60 + Number(timeMatch[2])) * MINUTE_MS;
    const end = start + duration * MINUTE_MS;

    try {
        await context.ctx.runAction(api.calendar.createEvent, {
            sessionToken: context.sessionToken,
            familyId: context.familyId,
            title,
            description,
            startTime: start,
            endTime: end,
            location
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("Calendar not connected")) {
            return {
                success: false,
                message: "La familia no tiene Google Calendar conectado. Pide al usuario conectarlo desde la sección de Calendario en la app."
            };
        }
        throw error;
    }

    const when = new Date(start).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
    return { success: true, message: `Evento creado: ${title} el ${when} a las ${startTime}. 📅` };
}
