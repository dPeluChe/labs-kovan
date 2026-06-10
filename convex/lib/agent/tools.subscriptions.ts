import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";

type BillingCycle = "monthly" | "bimonthly" | "quarterly" | "annual" | "variable";

const CYCLE_LABEL: Record<BillingCycle, string> = {
    monthly: "mensual",
    bimonthly: "bimestral",
    quarterly: "trimestral",
    annual: "anual",
    variable: "variable",
};

const CYCLE_MONTHLY_FACTOR: Record<BillingCycle, number> = {
    monthly: 1,
    bimonthly: 1 / 2,
    quarterly: 1 / 3,
    annual: 1 / 12,
    variable: 0,
};

export const getSubscriptionsTool: ToolDefinition = {
    name: "getSubscriptions",
    description: "Consultar las suscripciones y servicios recurrentes de la familia (streaming, luz, internet, seguros, membresías) con su costo estimado mensual. Usa esto cuando pregunten cuánto pagan de servicios o qué suscripciones tienen.",
    parameters: {
        type: "object" as const,
        properties: {},
        required: []
    }
};

export async function handleGetSubscriptions(context: ToolContext) {
    const subscriptions = await context.ctx.runQuery(api.subscriptions.list, {
        sessionToken: context.sessionToken,
        familyId: context.familyId
    });

    const active = subscriptions.filter((s) => s.isActive !== false);
    if (active.length === 0) {
        return { success: true, message: "No hay suscripciones registradas." };
    }

    let monthlyEstimate = 0;
    const lines = active.map((sub) => {
        const cycle = sub.billingCycle as BillingCycle;
        if (sub.amount) {
            monthlyEstimate += sub.amount * (CYCLE_MONTHLY_FACTOR[cycle] ?? 0);
        }
        const amount = sub.amount ? ` $${sub.amount} ${CYCLE_LABEL[cycle] ?? cycle}` : ` (${CYCLE_LABEL[cycle] ?? cycle})`;
        const dueDay = sub.dueDay ? `, vence el día ${sub.dueDay}` : "";
        return `- ${sub.name}:${amount}${dueDay}`;
    });

    const estimate = monthlyEstimate > 0
        ? ` Estimado mensual: $${Math.round(monthlyEstimate)}.`
        : "";

    return {
        success: true,
        message: `Suscripciones activas (${active.length}):\n${lines.join("\n")}\n${estimate}`
    };
}
