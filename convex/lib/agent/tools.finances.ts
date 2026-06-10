import { api, internal } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";
import { findBestMatch } from "./fuzzyMatch";
import { parseLocalDate } from "./dates";

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
    const summary = await context.ctx.runQuery(internal.expenses.agentGetExpenseSummary, {
        sessionToken: context.sessionToken,
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
        sessionToken: context.sessionToken,
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

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
        return { success: false, message: `El monto "${amount}" no es válido. Debe ser un número mayor a 0.` };
    }

    const expenseDate = date ? parseLocalDate(date) : Date.now();
    if (expenseDate === null) {
        return { success: false, message: `La fecha "${date}" no es válida. Usa el formato YYYY-MM-DD.` };
    }

    await context.ctx.runMutation(internal.expenses.agentCreateExpense, {
        sessionToken: context.sessionToken,
        familyId: context.familyId,
        description,
        amount,
        category: category as "food" | "transport" | "entertainment" | "utilities" | "health" | "shopping" | "home" | "education" | "gifts" | "other",
        type: "general",
        date: expenseDate,
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

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
        return { success: false, message: `El monto "${amount}" no es válido. Debe ser un número mayor a 0.` };
    }

    await context.ctx.runMutation(api.loans.create, {
        sessionToken: context.sessionToken,
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

const LOAN_MATCH_THRESHOLD = 0.6;

export const registerLoanPaymentTool: ToolDefinition = {
    name: "registerLoanPayment",
    description: "Registrar un abono/pago a un préstamo activo, buscándolo por el nombre de la persona (fuzzy match). Actualiza el saldo y marca el préstamo como saldado si llega a 0.",
    parameters: {
        type: "object" as const,
        properties: {
            personName: {
                type: "string" as const,
                description: "Nombre de la persona del préstamo"
            },
            amount: {
                type: "number" as const,
                description: "Monto del abono"
            },
            date: {
                type: "string" as const,
                description: "Fecha del abono YYYY-MM-DD (opcional, default hoy)"
            },
            notes: {
                type: "string" as const,
                description: "Notas (opcional)"
            }
        },
        required: ["personName", "amount"]
    }
};

export async function handleRegisterLoanPayment(context: ToolContext, args: Record<string, unknown>) {
    const { personName, amount, date, notes } = args as {
        personName: string;
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

    const loans = await context.ctx.runQuery(api.loans.list, {
        sessionToken: context.sessionToken,
        familyId: context.familyId
    });
    const activeLoans = loans.filter((l: { status: string }) => l.status === "active");

    const loan = findBestMatch(personName, activeLoans, (l) => l.personName, LOAN_MATCH_THRESHOLD);
    if (!loan) {
        const available = activeLoans.length > 0
            ? ` Préstamos activos: ${activeLoans.map((l: { personName: string; balance: number }) => `${l.personName} ($${l.balance})`).join(", ")}.`
            : " No hay préstamos activos.";
        return {
            success: false,
            message: `No encontré un préstamo activo de "${personName}".${available}`
        };
    }

    if (amount > loan.balance) {
        return {
            success: false,
            message: `El abono ($${amount}) es mayor al saldo pendiente de ${loan.personName} ($${loan.balance}). Confirma el monto con el usuario.`
        };
    }

    await context.ctx.runMutation(api.loans.addPayment, {
        sessionToken: context.sessionToken,
        loanId: loan._id,
        amount,
        date: paymentDate,
        notes
    });

    const newBalance = loan.balance - amount;
    const settled = newBalance <= 0.01;
    return {
        success: true,
        message: settled
            ? `Abono de $${amount} registrado. El préstamo de ${loan.personName} quedó saldado. ✅`
            : `Abono de $${amount} registrado. Saldo pendiente de ${loan.personName}: $${newBalance}.`
    };
}
