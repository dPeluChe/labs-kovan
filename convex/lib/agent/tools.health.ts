import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";
import { findBestMatch } from "./fuzzyMatch";
import { parseLocalDate } from "./dates";

const PROFILE_MATCH_THRESHOLD = 0.7;

type PersonProfile = {
    _id: import("../../_generated/dataModel").Id<"personProfiles">;
    name: string;
    nickname?: string;
    relation: string;
};

async function findProfileOrError(
    context: ToolContext,
    personName: string
): Promise<{ profile: PersonProfile } | { profile?: undefined; error: string }> {
    const profiles: PersonProfile[] = await context.ctx.runQuery(api.health.getPersonProfiles, {
        sessionToken: context.sessionToken,
        familyId: context.familyId
    });

    const profile = findBestMatch(
        personName,
        profiles,
        (p) => [p.name, p.nickname].filter(Boolean).join(" "),
        PROFILE_MATCH_THRESHOLD
    );
    if (profile) {
        return { profile };
    }

    const available = profiles.length > 0
        ? ` Perfiles disponibles: ${profiles.map((p) => `${p.name} (${p.relation})`).join(", ")}.`
        : " No hay perfiles de salud; primero crea el perfil en la app.";
    return {
        error: `No encontré un perfil de salud que coincida con "${personName}".${available} Pregunta al usuario a quién se refiere.`
    };
}

export const getHealthSummaryTool: ToolDefinition = {
    name: "getHealthSummary",
    description: "Consultar el resumen de salud de la familia: perfiles registrados, medicamentos activos y registros médicos recientes (últimos 30 días). Usa esto cuando pregunten por medicamentos, citas o salud de algún miembro o mascota.",
    parameters: {
        type: "object" as const,
        properties: {},
        required: []
    }
};

export async function handleGetHealthSummary(context: ToolContext) {
    const summary = await context.ctx.runQuery(api.health.getHealthSummary, {
        sessionToken: context.sessionToken,
        familyId: context.familyId
    });

    if (summary.profileCount === 0) {
        return { success: true, message: "No hay perfiles de salud registrados en la familia." };
    }

    const parts: string[] = [];

    const profileNames = summary.profiles
        .map((p: { name: string; relation?: string }) => (p.relation ? `${p.name} (${p.relation})` : p.name))
        .join(", ");
    parts.push(`Perfiles (${summary.profileCount}): ${profileNames}.`);

    if (summary.activeMedications.length > 0) {
        const meds = summary.activeMedications
            .map((m: { personName: string; medication: { name: string; dosage?: string } }) =>
                `${m.personName}: ${m.medication.name}${m.medication.dosage ? ` (${m.medication.dosage})` : ""}`)
            .join("; ");
        parts.push(`Medicamentos activos: ${meds}.`);
    } else {
        parts.push("Sin medicamentos activos.");
    }

    if (summary.recentRecords.length > 0) {
        const records = summary.recentRecords
            .map((r: { personName: string; record: { title: string; date: number } }) => {
                const date = new Date(r.record.date).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
                return `${r.personName}: ${r.record.title} (${date})`;
            })
            .join("; ");
        parts.push(`Registros recientes: ${records}.`);
    }

    return { success: true, message: parts.join(" ") };
}

export const addMedicationTool: ToolDefinition = {
    name: "addMedication",
    description: "Registrar un medicamento para un miembro de la familia o mascota (busca el perfil por nombre con fuzzy match). Usa esto cuando digan que alguien empezó un tratamiento.",
    parameters: {
        type: "object" as const,
        properties: {
            personName: {
                type: "string" as const,
                description: "Nombre del miembro o mascota (debe tener perfil de salud)"
            },
            name: {
                type: "string" as const,
                description: "Nombre del medicamento (ej: 'Amoxicilina')"
            },
            dosage: {
                type: "string" as const,
                description: "Dosis e indicación (ej: '500mg cada 8 horas')"
            },
            startDate: {
                type: "string" as const,
                description: "Fecha de inicio YYYY-MM-DD (opcional, default hoy)"
            },
            endDate: {
                type: "string" as const,
                description: "Fecha de fin del tratamiento YYYY-MM-DD (opcional)"
            },
            notes: {
                type: "string" as const,
                description: "Notas adicionales (opcional)"
            }
        },
        required: ["personName", "name", "dosage"]
    }
};

export async function handleAddMedication(context: ToolContext, args: Record<string, unknown>) {
    const { personName, name, dosage, startDate, endDate, notes } = args as {
        personName: string;
        name: string;
        dosage: string;
        startDate?: string;
        endDate?: string;
        notes?: string;
    };

    const start = startDate ? parseLocalDate(startDate) : Date.now();
    if (start === null) {
        return { success: false, message: `La fecha de inicio "${startDate}" no es válida. Usa el formato YYYY-MM-DD.` };
    }
    let end: number | undefined;
    if (endDate) {
        const parsed = parseLocalDate(endDate);
        if (parsed === null) {
            return { success: false, message: `La fecha de fin "${endDate}" no es válida. Usa el formato YYYY-MM-DD.` };
        }
        end = parsed;
    }

    const result = await findProfileOrError(context, personName);
    if ("error" in result) {
        return { success: false, message: result.error };
    }

    await context.ctx.runMutation(api.health.createMedication, {
        sessionToken: context.sessionToken,
        personId: result.profile._id,
        name,
        dosage,
        startDate: start,
        endDate: end,
        notes
    });

    return { success: true, message: `Medicamento registrado para ${result.profile.name}: ${name} (${dosage}). 💊` };
}

export const addMedicalRecordTool: ToolDefinition = {
    name: "addMedicalRecord",
    description: "Registrar una consulta médica, estudio o nota de salud para un miembro de la familia o mascota (busca el perfil por nombre con fuzzy match).",
    parameters: {
        type: "object" as const,
        properties: {
            personName: {
                type: "string" as const,
                description: "Nombre del miembro o mascota (debe tener perfil de salud)"
            },
            type: {
                type: "string" as const,
                description: "Tipo de registro",
                enum: ["consultation", "study", "note"]
            },
            title: {
                type: "string" as const,
                description: "Título del registro (ej: 'Consulta pediatría', 'Rayos X tórax')"
            },
            date: {
                type: "string" as const,
                description: "Fecha YYYY-MM-DD (opcional, default hoy)"
            },
            doctorName: {
                type: "string" as const,
                description: "Nombre del doctor (opcional)"
            },
            description: {
                type: "string" as const,
                description: "Detalles, diagnóstico o indicaciones (opcional)"
            }
        },
        required: ["personName", "type", "title"]
    }
};

export async function handleAddMedicalRecord(context: ToolContext, args: Record<string, unknown>) {
    const { personName, type, title, date, doctorName, description } = args as {
        personName: string;
        type: "consultation" | "study" | "note";
        title: string;
        date?: string;
        doctorName?: string;
        description?: string;
    };

    const recordDate = date ? parseLocalDate(date) : Date.now();
    if (recordDate === null) {
        return { success: false, message: `La fecha "${date}" no es válida. Usa el formato YYYY-MM-DD.` };
    }

    const result = await findProfileOrError(context, personName);
    if ("error" in result) {
        return { success: false, message: result.error };
    }

    await context.ctx.runMutation(api.health.createMedicalRecord, {
        sessionToken: context.sessionToken,
        personId: result.profile._id,
        type,
        title,
        date: recordDate,
        doctorName,
        description
    });

    const typeLabel = type === "consultation" ? "Consulta" : type === "study" ? "Estudio" : "Nota";
    return { success: true, message: `${typeLabel} registrada para ${result.profile.name}: ${title}.` };
}
