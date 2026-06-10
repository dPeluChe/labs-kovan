import { api, internal } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";

export const getFamilyOverviewTool: ToolDefinition = {
    name: "getFamilyOverview",
    description: "Resumen general del estado de la familia en una sola consulta: gastos del mes, tareas pendientes, próximos eventos del calendario, medicamentos activos y ranking del hogar. Usa esto para dar contexto general, briefings del día, o cuando pregunten 'cómo vamos'.",
    parameters: {
        type: "object" as const,
        properties: {},
        required: []
    }
};

export async function handleGetFamilyOverview(context: ToolContext) {
    const base = {
        sessionToken: context.sessionToken,
        familyId: context.familyId,
    };

    // Cada sección es independiente: si una falla, las demás siguen útiles.
    const [expenses, tasks, events, health, household] = await Promise.allSettled([
        context.ctx.runQuery(internal.expenses.agentGetExpenseSummary, base),
        context.ctx.runQuery(api.tasks.list, { ...base, status: "pending" }),
        context.ctx.runQuery(api.calendar.getUpcomingEvents, { ...base, limit: 5 }),
        context.ctx.runQuery(api.health.getHealthSummary, base),
        context.ctx.runQuery(api.household.getWeeklyLeaderboard, base),
    ]);

    const parts: string[] = [];

    if (expenses.status === "fulfilled") {
        parts.push(`💰 Gastos del mes: $${expenses.value.totalThisMonth} en ${expenses.value.countThisMonth} movimientos.`);
    }

    if (tasks.status === "fulfilled") {
        if (tasks.value.length === 0) {
            parts.push("✅ Sin tareas pendientes.");
        } else {
            const titles = tasks.value.slice(0, 5).map((t) => t.title).join(", ");
            const extra = tasks.value.length > 5 ? ` (+${tasks.value.length - 5} más)` : "";
            parts.push(`📝 Tareas pendientes (${tasks.value.length}): ${titles}${extra}.`);
        }
    }

    if (events.status === "fulfilled" && events.value.length > 0) {
        const list = events.value
            .map((e) => {
                const date = new Date(e.startDateTime).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
                return `${e.title} (${date})`;
            })
            .join(", ");
        parts.push(`📅 Próximos eventos: ${list}.`);
    }

    if (health.status === "fulfilled" && health.value.activeMedications.length > 0) {
        const meds = health.value.activeMedications
            .map((m: { personName: string; medication: { name: string } }) => `${m.personName}: ${m.medication.name}`)
            .join("; ");
        parts.push(`💊 Medicamentos activos: ${meds}.`);
    }

    if (household.status === "fulfilled" && household.value.leaderboard.length > 0) {
        const top = household.value.leaderboard[0];
        parts.push(`🏠 Hogar: ${top.userName} lidera la semana con ${top.points} pts.`);
    }

    if (parts.length === 0) {
        return { success: true, message: "No hay información registrada todavía. ¡Empieza agregando gastos, tareas o eventos!" };
    }

    return { success: true, message: parts.join("\n") };
}
