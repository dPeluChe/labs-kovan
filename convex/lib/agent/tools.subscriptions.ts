import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";
import { findBestMatch } from "./fuzzyMatch";
import { parseLocalDate } from "./dates";

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

const SUBSCRIPTION_MATCH_THRESHOLD = 0.6;
const DUPLICATE_THRESHOLD = 0.85;

type SubscriptionType = "streaming" | "utility" | "internet" | "insurance" | "membership" | "software" | "other";

export const addSubscriptionTool: ToolDefinition = {
    name: "addSubscription",
    description: "Dar de alta una suscripción o servicio recurrente (streaming, luz, internet, seguro, membresía, software).",
    parameters: {
        type: "object" as const,
        properties: {
            name: {
                type: "string" as const,
                description: "Nombre del servicio (ej: 'Netflix', 'Luz CFE')"
            },
            type: {
                type: "string" as const,
                description: "Tipo de servicio",
                enum: ["streaming", "utility", "internet", "insurance", "membership", "software", "other"]
            },
            billingCycle: {
                type: "string" as const,
                description: "Ciclo de cobro",
                enum: ["monthly", "bimonthly", "quarterly", "annual", "variable"]
            },
            amount: {
                type: "number" as const,
                description: "Monto por ciclo (opcional, omitir si es variable)"
            },
            dueDay: {
                type: "number" as const,
                description: "Día del mes en que vence (1-31, opcional)"
            },
            notes: {
                type: "string" as const,
                description: "Notas (opcional)"
            },
            allowDuplicate: {
                type: "boolean" as const,
                description: "Permitir alta aunque exista una suscripción con nombre muy similar. SOLO usar true cuando el usuario confirme que es un servicio distinto."
            }
        },
        required: ["name", "type", "billingCycle"]
    }
};

export async function handleAddSubscription(context: ToolContext, args: Record<string, unknown>) {
    const { name, type, billingCycle, amount, dueDay, notes, allowDuplicate } = args as {
        name: string;
        type: SubscriptionType;
        billingCycle: BillingCycle;
        amount?: number;
        dueDay?: number;
        notes?: string;
        allowDuplicate?: boolean;
    };

    if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
        return { success: false, message: `El monto "${amount}" no es válido. Debe ser un número mayor a 0 (u omitirse si es variable).` };
    }
    if (dueDay !== undefined && (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)) {
        return { success: false, message: `El día de vencimiento "${dueDay}" no es válido. Usa un día del mes entre 1 y 31.` };
    }

    const subscriptions = await context.ctx.runQuery(api.subscriptions.list, {
        sessionToken: context.sessionToken,
        familyId: context.familyId
    });

    if (!allowDuplicate) {
        const duplicate = findBestMatch(name, subscriptions, (s) => s.name, DUPLICATE_THRESHOLD);
        if (duplicate) {
            return {
                success: false,
                message: `Ya existe la suscripción "${duplicate.name}" (${CYCLE_LABEL[duplicate.billingCycle as BillingCycle] ?? duplicate.billingCycle}). Confirma con el usuario si es la misma; si es un servicio distinto, vuelve a llamar con allowDuplicate=true.`
            };
        }
    }

    await context.ctx.runMutation(api.subscriptions.create, {
        sessionToken: context.sessionToken,
        familyId: context.familyId,
        name,
        type,
        billingCycle,
        amount,
        dueDay,
        notes
    });

    const amountMsg = amount ? ` ($${amount} ${CYCLE_LABEL[billingCycle] ?? billingCycle})` : "";
    return { success: true, message: `Suscripción dada de alta: ${name}${amountMsg}.` };
}

export const recordSubscriptionPaymentTool: ToolDefinition = {
    name: "recordSubscriptionPayment",
    description: "Registrar el pago de una suscripción o servicio (busca la suscripción por nombre con fuzzy match). El pago queda en el historial de gastos ligado a la suscripción.",
    parameters: {
        type: "object" as const,
        properties: {
            subscriptionName: {
                type: "string" as const,
                description: "Nombre de la suscripción o servicio pagado"
            },
            amount: {
                type: "number" as const,
                description: "Monto pagado"
            },
            date: {
                type: "string" as const,
                description: "Fecha del pago YYYY-MM-DD (opcional, default hoy)"
            },
            notes: {
                type: "string" as const,
                description: "Notas (opcional)"
            }
        },
        required: ["subscriptionName", "amount"]
    }
};

export async function handleRecordSubscriptionPayment(context: ToolContext, args: Record<string, unknown>) {
    const { subscriptionName, amount, date, notes } = args as {
        subscriptionName: string;
        amount: number;
        date?: string;
        notes?: string;
    };

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
        return { success: false, message: `El monto "${amount}" no es válido. Debe ser un número mayor a 0.` };
    }

    const paymentDate = date ? parseLocalDate(date) : Date.now();
    if (paymentDate === null) {
        return { success: false, message: `La fecha "${date}" no es válida. Usa el formato YYYY-MM-DD.` };
    }

    const subscriptions = await context.ctx.runQuery(api.subscriptions.list, {
        sessionToken: context.sessionToken,
        familyId: context.familyId
    });

    const subscription = findBestMatch(subscriptionName, subscriptions, (s) => s.name, SUBSCRIPTION_MATCH_THRESHOLD);
    if (!subscription) {
        const available = subscriptions.length > 0
            ? ` Suscripciones registradas: ${subscriptions.map((s) => s.name).join(", ")}.`
            : " No hay suscripciones registradas; primero dala de alta con addSubscription.";
        return {
            success: false,
            message: `No encontré una suscripción que coincida con "${subscriptionName}".${available}`
        };
    }

    await context.ctx.runMutation(api.subscriptions.recordSubscriptionPayment, {
        sessionToken: context.sessionToken,
        subscriptionId: subscription._id,
        amount,
        date: paymentDate,
        paidBy: context.userId,
        notes
    });

    return { success: true, message: `Pago registrado: ${subscription.name} por $${amount}. 💳` };
}
