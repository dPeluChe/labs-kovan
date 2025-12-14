import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";

export const addVehicleEventTool: ToolDefinition = {
    name: "addVehicleEvent",
    description: "Registrar un evento de vehículo (verificación, servicio, seguro, combustible, reparación). Usa esto cuando el usuario quiera anotar mantenimiento de su auto.",
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
            }
        },
        required: ["vehicleName", "type", "title"]
    }
};

export async function handleAddVehicleEvent(context: ToolContext, args: Record<string, unknown>) {
    const { vehicleName, type, title, date, nextDate, amount, notes } = args as {
        vehicleName: string;
        type: string;
        title: string;
        date?: string;
        nextDate?: string;
        amount?: number;
        notes?: string;
    };

    // Find or create vehicle
    const vehicles = await context.ctx.runQuery(api.vehicles.getVehicles, {
        familyId: context.familyId
    });

    let vehicle = vehicles.find(v =>
        v.name.toLowerCase().includes(vehicleName.toLowerCase()) ||
        vehicleName.toLowerCase().includes(v.name.toLowerCase())
    );

    if (!vehicle) {
        // Create new vehicle
        const vehicleId = await context.ctx.runMutation(api.vehicles.createVehicle, {
            familyId: context.familyId,
            name: vehicleName
        });
        const fetchedVehicle = await context.ctx.runQuery(api.vehicles.getVehicle, { vehicleId });
        if (!fetchedVehicle) throw new Error("Vehicle not found after creation");
        vehicle = fetchedVehicle;
    }

    // Create event
    await context.ctx.runMutation(api.vehicles.createVehicleEvent, {
        vehicleId: vehicle._id,
        familyId: context.familyId,
        type: type as "verification" | "service" | "insurance" | "fuel" | "repair" | "other",
        title,
        date: date ? new Date(date).getTime() : Date.now(),
        nextDate: nextDate ? new Date(nextDate).getTime() : undefined,
        amount,
        notes,
        paidBy: context.userId
    });

    return {
        success: true,
        message: `Evento registrado para ${vehicle.name}: ${title}${amount ? ` ($${amount})` : ''}.`
    };
}
