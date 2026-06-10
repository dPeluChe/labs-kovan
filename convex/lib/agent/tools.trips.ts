import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";
import { findBestMatch } from "./fuzzyMatch";
import { parseLocalDate } from "./dates";

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

const TRIP_MATCH_THRESHOLD = 0.6;
const DUPLICATE_THRESHOLD = 0.85;

const BOOKING_LABEL: Record<string, string> = {
    flight: "vuelo",
    hotel: "hotel",
    transport: "transporte",
    rental: "renta",
    activity: "actividad",
    other: "otro",
};

export const getTripDetailTool: ToolDefinition = {
    name: "getTripDetail",
    description: "Consultar el detalle de un viaje: reservas (vuelos, hoteles) e itinerario por día. Busca el viaje por nombre o destino (fuzzy match).",
    parameters: {
        type: "object" as const,
        properties: {
            tripName: {
                type: "string" as const,
                description: "Nombre o destino del viaje"
            }
        },
        required: ["tripName"]
    }
};

export async function handleGetTripDetail(context: ToolContext, args: Record<string, unknown>) {
    const { tripName } = args as { tripName: string };

    const trips = await context.ctx.runQuery(api.trips.getTrips, {
        sessionToken: context.sessionToken,
        familyId: context.familyId
    });

    const trip = findBestMatch(
        tripName,
        trips,
        (t) => [t.name, t.destination].filter(Boolean).join(" "),
        TRIP_MATCH_THRESHOLD
    );
    if (!trip) {
        const available = trips.length > 0
            ? ` Viajes registrados: ${trips.map((t) => t.name).join(", ")}.`
            : " No hay viajes registrados.";
        return { success: false, message: `No encontré un viaje que coincida con "${tripName}".${available}` };
    }

    const [bookings, plans] = await Promise.all([
        context.ctx.runQuery(api.trips.getTripBookings, {
            sessionToken: context.sessionToken,
            tripId: trip._id
        }),
        context.ctx.runQuery(api.trips.getTripPlans, {
            sessionToken: context.sessionToken,
            tripId: trip._id
        }),
    ]);

    const parts: string[] = [
        `${trip.name}${trip.destination ? ` — ${trip.destination}` : ""}${formatTripDates(trip.startDate, trip.endDate)} (${STATUS_LABEL[trip.status] ?? trip.status})${trip.budget ? `, presupuesto $${trip.budget}` : ""}.`
    ];

    if (bookings.length > 0) {
        const lines = bookings.map((b) => {
            const date = new Date(b.startDate).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
            const code = b.confirmationCode ? ` [${b.confirmationCode}]` : "";
            const cost = b.cost ? ` $${b.cost}` : "";
            return `  - ${BOOKING_LABEL[b.type] ?? b.type}: ${b.provider} (${date})${code}${cost}`;
        });
        parts.push(`Reservas (${bookings.length}):\n${lines.join("\n")}`);
    } else {
        parts.push("Sin reservas registradas.");
    }

    if (plans.length > 0) {
        const lines = plans.map((p) => {
            const day = p.dayDate
                ? new Date(p.dayDate).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })
                : "ideas";
            const time = p.time ? ` ${p.time}` : "";
            const done = p.isCompleted ? " ✓" : "";
            return `  - [${day}${time}] ${p.activity}${done}`;
        });
        parts.push(`Itinerario (${plans.length}):\n${lines.join("\n")}`);
    } else {
        parts.push("Sin itinerario aún.");
    }

    return { success: true, message: parts.join("\n") };
}

export const createTripTool: ToolDefinition = {
    name: "createTrip",
    description: "Crear un viaje nuevo en planeación. Usa esto cuando la familia empiece a planear un viaje.",
    parameters: {
        type: "object" as const,
        properties: {
            name: {
                type: "string" as const,
                description: "Nombre del viaje (ej: 'Japón 2026')"
            },
            destination: {
                type: "string" as const,
                description: "Destino (opcional)"
            },
            startDate: {
                type: "string" as const,
                description: "Fecha de inicio YYYY-MM-DD (opcional)"
            },
            endDate: {
                type: "string" as const,
                description: "Fecha de regreso YYYY-MM-DD (opcional)"
            },
            budget: {
                type: "number" as const,
                description: "Presupuesto estimado (opcional)"
            },
            description: {
                type: "string" as const,
                description: "Notas o descripción (opcional)"
            },
            allowDuplicate: {
                type: "boolean" as const,
                description: "Permitir crear aunque exista un viaje con nombre muy similar. SOLO usar true cuando el usuario confirme que es un viaje distinto."
            }
        },
        required: ["name"]
    }
};

export async function handleCreateTrip(context: ToolContext, args: Record<string, unknown>) {
    const { name, destination, startDate, endDate, budget, description, allowDuplicate } = args as {
        name: string;
        destination?: string;
        startDate?: string;
        endDate?: string;
        budget?: number;
        description?: string;
        allowDuplicate?: boolean;
    };

    if (budget !== undefined && (!Number.isFinite(budget) || budget <= 0)) {
        return { success: false, message: `El presupuesto "${budget}" no es válido. Debe ser un número mayor a 0.` };
    }

    let start: number | undefined;
    if (startDate) {
        const parsed = parseLocalDate(startDate);
        if (parsed === null) {
            return { success: false, message: `La fecha de inicio "${startDate}" no es válida. Usa el formato YYYY-MM-DD.` };
        }
        start = parsed;
    }
    let end: number | undefined;
    if (endDate) {
        const parsed = parseLocalDate(endDate);
        if (parsed === null) {
            return { success: false, message: `La fecha de regreso "${endDate}" no es válida. Usa el formato YYYY-MM-DD.` };
        }
        end = parsed;
    }
    if (start !== undefined && end !== undefined && end < start) {
        return { success: false, message: "La fecha de regreso no puede ser antes que la de inicio." };
    }

    if (!allowDuplicate) {
        const trips = await context.ctx.runQuery(api.trips.getTrips, {
            sessionToken: context.sessionToken,
            familyId: context.familyId
        });
        const duplicate = findBestMatch(name, trips, (t) => t.name, DUPLICATE_THRESHOLD);
        if (duplicate) {
            return {
                success: false,
                message: `Ya existe el viaje "${duplicate.name}" (${STATUS_LABEL[duplicate.status] ?? duplicate.status}). Confirma con el usuario si es el mismo; si es otro viaje, vuelve a llamar con allowDuplicate=true.`
            };
        }
    }

    await context.ctx.runMutation(api.trips.createTrip, {
        sessionToken: context.sessionToken,
        familyId: context.familyId,
        name,
        destination,
        startDate: start,
        endDate: end,
        budget,
        description
    });

    return { success: true, message: `Viaje creado: ${name}${destination ? ` a ${destination}` : ""}. ✈️` };
}
