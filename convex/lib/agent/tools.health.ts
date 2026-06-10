import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";

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
