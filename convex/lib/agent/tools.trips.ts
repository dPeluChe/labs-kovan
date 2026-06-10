import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";

const STATUS_LABEL: Record<string, string> = {
    planning: "en planeación",
    confirmed: "confirmado",
    active: "en curso",
    completed: "completado",
};

function formatTripDates(startDate?: number, endDate?: number): string {
    if (!startDate) return "";
    const opts = { day: "numeric", month: "short" } as const;
    const start = new Date(startDate).toLocaleDateString("es-MX", opts);
    if (!endDate) return ` (${start})`;
    const end = new Date(endDate).toLocaleDateString("es-MX", opts);
    return ` (${start} → ${end})`;
}

export const getTripsTool: ToolDefinition = {
    name: "getTrips",
    description: "Consultar los viajes de la familia (en planeación, confirmados, en curso o completados). Usa esto cuando pregunten por viajes próximos o pasados.",
    parameters: {
        type: "object" as const,
        properties: {
            includeCompleted: {
                type: "boolean" as const,
                description: "Incluir también viajes completados (default false)"
            }
        },
        required: []
    }
};

export async function handleGetTrips(context: ToolContext, args: Record<string, unknown>) {
    const { includeCompleted } = args as { includeCompleted?: boolean };

    const trips = await context.ctx.runQuery(api.trips.getTrips, {
        sessionToken: context.sessionToken,
        familyId: context.familyId
    });

    const filtered = includeCompleted ? trips : trips.filter((t) => t.status !== "completed");
    if (filtered.length === 0) {
        return { success: true, message: "No hay viajes registrados." };
    }

    const lines = filtered.map((trip) => {
        const destination = trip.destination ? ` a ${trip.destination}` : "";
        const budget = trip.budget ? `, presupuesto $${trip.budget}` : "";
        return `- ${trip.name}${destination}${formatTripDates(trip.startDate, trip.endDate)} — ${STATUS_LABEL[trip.status] ?? trip.status}${budget}`;
    });

    return {
        success: true,
        message: `Viajes (${filtered.length}):\n${lines.join("\n")}`
    };
}
