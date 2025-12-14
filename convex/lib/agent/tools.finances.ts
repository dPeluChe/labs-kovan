import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";

// ==================== READ TOOLS ====================

export const getExpenseSummaryTool: ToolDefinition = {
    name: "getExpenseSummary",
    description: "Consultar resumen de gastos del mes actual. Usa esto cuando el usuario pregunte cuánto ha gastado, en qué categorías, etc.",
    parameters: {
        type: "object" as const,
        properties: {},
        required: []
    }
};

export async function handleGetExpenseSummary(context: ToolContext) {
    const summary = await context.ctx.runQuery(api.expenses.getExpenseSummary, {
        familyId: context.familyId
    });

    const formattedCategories = Object.entries(summary.byCategory)
        .map(([cat, amount]) => `${cat}: $${amount}`)
        .join(', ');

    return {
        success: true,
        message: `Este mes: $${summary.totalThisMonth} en ${summary.countThisMonth} gastos. Por categoría: ${formattedCategories}`
    };
}

export const getLoansTool: ToolDefinition = {
    name: "getLoans",
    description: "Consultar préstamos activos (dinero que te deben o que debes). Usa esto cuando pregunten quién debe dinero.",
    parameters: {
        type: "object" as const,
        properties: {},
        required: []
    }
};

export async function handleGetLoans(context: ToolContext) {
    const loans = await context.ctx.runQuery(api.loans.list, {
        familyId: context.familyId
    });

    const activeLoans = loans.filter((l: { status: string }) => l.status === "active");

    if (activeLoans.length === 0) {
        return { success: true, message: "No tienes préstamos activos." };
    }

    const lentList = activeLoans.filter((l: { type: string }) => l.type === "lent")
        .map((l: { personName: string; balance: number }) => `${l.personName} te debe $${l.balance}`)
        .join(', ');

    const borrowedList = activeLoans.filter((l: { type: string }) => l.type === "borrowed")
        .map((l: { personName: string; balance: number }) => `Le debes $${l.balance} a ${l.personName}`)
        .join(', ');

    let message = "";
    if (lentList) message += `Prestado: ${lentList}. `;
    if (borrowedList) message += `Debes: ${borrowedList}.`;

    return { success: true, message };
}

// ==================== WRITE TOOLS ====================

export const registerExpenseTool: ToolDefinition = {
    name: "registerExpense",
    description: "Registrar un nuevo gasto (expense).",
    parameters: {
        type: "object" as const,
        properties: {
            description: {
                type: "string" as const,
                description: "Descripción del gasto"
            },
            amount: {
                type: "number" as const,
                description: "Monto del gasto en pesos"
            },
            category: {
                type: "string" as const,
                description: "Categoría del gasto",
                enum: ["food", "transport", "entertainment", "utilities", "health", "shopping", "home", "education", "gifts", "other"]
            },
            date: {
                type: "string" as const,
                description: "Fecha en formato YYYY-MM-DD (opcional)"
            }
        },
        required: ["description", "amount", "category"]
    }
};

export async function handleRegisterExpense(context: ToolContext, args: Record<string, unknown>) {
    const { description, amount, category, date } = args as { description: string; amount: number; category: string; date?: string };

    await context.ctx.runMutation(api.expenses.createExpense, {
        familyId: context.familyId,
        description,
        amount,
        category: category as "food" | "transport" | "entertainment" | "utilities" | "health" | "shopping" | "home" | "education" | "gifts" | "other",
        type: "general",
        date: date ? new Date(date).getTime() : Date.now(),
        paidBy: context.userId,
    });

    return { success: true, message: `Gasto de $${amount} (${description}) registrado en ${category}.` };
}

export const registerLoanTool: ToolDefinition = {
    name: "registerLoan",
    description: "Registrar un préstamo. Usa 'lent' si el usuario prestó dinero a alguien. Usa 'borrowed' si le prestaron dinero al usuario.",
    parameters: {
        type: "object" as const,
        properties: {
            type: {
                type: "string" as const,
                description: "Tipo de préstamo",
                enum: ["lent", "borrowed"]
            },
            personName: {
                type: "string" as const,
                description: "Nombre de la persona"
            },
            amount: {
                type: "number" as const,
                description: "Monto del préstamo"
            }
        },
        required: ["type", "personName", "amount"]
    }
};

export async function handleRegisterLoan(context: ToolContext, args: Record<string, unknown>) {
    const { type, personName, amount } = args as { type: string; personName: string; amount: number };

    await context.ctx.runMutation(api.loans.create, {
        familyId: context.familyId,
        type: type as "lent" | "borrowed",
        personName,
        amount,
        date: Date.now(),
    });

    return {
        success: true,
        message: `Préstamo registrado: ${type === "lent" ? "Prestaste" : "Te prestaron"} $${amount} a/de ${personName}.`
    };
}
