import { api } from "../../_generated/api";
import type { Doc } from "../../_generated/dataModel";
import type { ToolDefinition, ToolContext } from "./tools.types";
import { findBestMatch } from "./fuzzyMatch";

const VEHICLE_MATCH_THRESHOLD = 0.6;

export const listVehiclesTool: ToolDefinition = {
    name: "listVehicles",
    description: "Listar los vehículos registrados de la familia. Usa esto para saber qué vehículos existen antes de registrar un evento, o cuando el usuario pregunte por sus autos.",
    parameters: {
        type: "object" as const,
        properties: {},
        required: []
    }
};

export const addVehicleEventTool: ToolDefinition = {
    name: "addVehicleEvent",
    description: "Registrar un evento de vehículo (verificación, servicio, seguro, combustible, reparación) en un vehículo EXISTENTE. Si el vehículo mencionado no existe, la tool responde con la lista de vehículos disponibles; nunca asumas que hay que crear uno nuevo sin confirmación explícita del usuario (en ese caso usa createIfMissing=true).",
    parameters: {
        type: "object" as const,
        properties: {
            vehicleName: {
                type: "string" as const,
                description: "Nombre o identificador del vehículo (ej: 'Mi auto', 'Carro rojo', 'Civic')"
            },
            type: {
                type: "string" as const,
                description: "Tipo de evento",
                enum: ["verification", "service", "insurance", "fuel", "repair", "other"]
            },
            title: {
                type: "string" as const,
                description: "Descripción breve del evento (ej: 'Verificación vehicular', 'Cambio de aceite')"
            },
            date: {
                type: "string" as const,
                description: "Fecha del evento en formato YYYY-MM-DD (opcional, default: hoy)"
            },
            nextDate: {
                type: "string" as const,
                description: "Próxima fecha de recordatorio en formato YYYY-MM-DD (opcional)"
            },
            amount: {
                type: "number" as const,
                description: "Costo del servicio en pesos (opcional)"
            },
            notes: {
                type: "string" as const,
                description: "Notas adicionales (opcional)"
            },
            createIfMissing: {
                type: "boolean" as const,
                description: "Crear el vehículo si no existe. SOLO usar true cuando el usuario haya confirmado explícitamente que quiere dar de alta un vehículo nuevo con ese nombre."
            }
        },
        required: ["vehicleName", "type", "title"]
    }
};

function describeVehicle(vehicle: Doc<"vehicles">): string {
    const details = [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(" ");
    return details ? `${vehicle.name} (${details})` : vehicle.name;
}

/**
 * Busca un vehículo por nombre con fuzzy matching, probando también
 * contra marca/modelo (ej: "Civic" debe encontrar "Mi auto" Honda Civic).
 */
function matchVehicle(searchTerm: string, vehicles: Doc<"vehicles">[]): Doc<"vehicles"> | null {
    const candidates = vehicles.flatMap((vehicle) => {
        const keys = [
            vehicle.name,
            [vehicle.brand, vehicle.model].filter(Boolean).join(" "),
            vehicle.model ?? "",
        ].filter((key) => key.trim().length > 0);
        return keys.map((key) => ({ vehicle, key }));
    });

    const match = findBestMatch(searchTerm, candidates, (c) => c.key, VEHICLE_MATCH_THRESHOLD);
    return match ? match.vehicle : null;
}

function parseDateArg(value: string | undefined, fallback: number): number | null {
    if (!value) return fallback;
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
}

export async function handleListVehicles(context: ToolContext) {
    const vehicles = await context.ctx.runQuery(api.vehicles.getVehicles, {
        sessionToken: context.sessionToken,
        familyId: context.familyId
    });

    if (vehicles.length === 0) {
        return { success: true, message: "No hay vehículos registrados en la familia." };
    }

    return {
        success: true,
        message: `Vehículos registrados (${vehicles.length}): ${vehicles.map(describeVehicle).join(", ")}.`
    };
}

export async function handleAddVehicleEvent(context: ToolContext, args: Record<string, unknown>) {
    const { vehicleName, type, title, date, nextDate, amount, notes, createIfMissing } = args as {
        vehicleName: string;
        type: string;
        title: string;
        date?: string;
        nextDate?: string;
        amount?: number;
        notes?: string;
        createIfMissing?: boolean;
    };

    const eventDate = parseDateArg(date, Date.now());
    if (eventDate === null) {
        return { success: false, message: `La fecha "${date}" no es válida. Usa el formato YYYY-MM-DD.` };
    }
    const reminderDate = parseDateArg(nextDate, 0);
    if (reminderDate === null) {
        return { success: false, message: `La fecha de recordatorio "${nextDate}" no es válida. Usa el formato YYYY-MM-DD.` };
    }

    const vehicles = await context.ctx.runQuery(api.vehicles.getVehicles, {
        sessionToken: context.sessionToken,
        familyId: context.familyId
    });

    const matched = matchVehicle(vehicleName, vehicles);
    let vehicle: Doc<"vehicles">;

    if (matched) {
        vehicle = matched;
    } else {
        if (!createIfMissing) {
            const available = vehicles.length > 0
                ? `Vehículos disponibles: ${vehicles.map(describeVehicle).join(", ")}.`
                : "No hay vehículos registrados en la familia.";
            return {
                success: false,
                message: `No encontré un vehículo que coincida con "${vehicleName}". ${available} Pregunta al usuario a cuál se refiere, o si confirma que quiere dar de alta "${vehicleName}" como vehículo nuevo, vuelve a llamar con createIfMissing=true.`
            };
        }

        const vehicleId = await context.ctx.runMutation(api.vehicles.createVehicle, {
            sessionToken: context.sessionToken,
            familyId: context.familyId,
            name: vehicleName
        });
        const created = await context.ctx.runQuery(api.vehicles.getVehicle, {
            sessionToken: context.sessionToken,
            vehicleId
        });
        if (!created) {
            return { success: false, message: "No se pudo crear el vehículo. Intenta de nuevo." };
        }
        vehicle = created;
    }

    await context.ctx.runMutation(api.vehicles.createVehicleEvent, {
        sessionToken: context.sessionToken,
        vehicleId: vehicle._id,
        type: type as "verification" | "service" | "insurance" | "fuel" | "repair" | "other",
        title,
        date: eventDate,
        nextDate: nextDate ? reminderDate : undefined,
        amount,
        notes
    });

    return {
        success: true,
        message: `Evento registrado para ${vehicle.name}: ${title}${amount ? ` ($${amount})` : ''}.`
    };
}
