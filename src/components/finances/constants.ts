import { DollarSign, CreditCard, Repeat, Car, Gift } from "lucide-react";

export type ExpenseType = "all" | "general" | "subscription" | "vehicle" | "gift";
export type ExpenseCategory = "food" | "transport" | "entertainment" | "utilities" | "health" | "shopping" | "home" | "education" | "gifts" | "vehicle" | "subscription" | "other";

export const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
    food: { label: "Comida", icon: "", color: "from-orange-500/20" },
    transport: { label: "Transporte", icon: "🚗", color: "from-blue-500/20" },
    entertainment: { label: "Entretenimiento", icon: "🎬", color: "from-purple-500/20" },
    utilities: { label: "Servicios", icon: "💡", color: "from-yellow-500/20" },
    health: { label: "Salud", icon: "💊", color: "from-red-500/20" },
    shopping: { label: "Compras", icon: "🛍️", color: "from-pink-500/20" },
    home: { label: "Hogar", icon: "🏠", color: "from-teal-500/20" },
    education: { label: "Educación", icon: "📚", color: "from-indigo-500/20" },
    gifts: { label: "Regalos", icon: "🎁", color: "from-red-500/20" },
    vehicle: { label: "Auto", icon: "🚙", color: "from-green-500/20" },
    subscription: { label: "Suscripción", icon: "📺", color: "from-violet-500/20" },
    other: { label: "Otro", icon: "📋", color: "from-gray-500/20" },
};

export const TYPE_CONFIG: Record<ExpenseType, { label: string; icon: typeof DollarSign }> = {
    all: { label: "Todos", icon: DollarSign },
    general: { label: "Puntuales", icon: CreditCard },
    subscription: { label: "Suscripciones", icon: Repeat },
    vehicle: { label: "Auto", icon: Car },
    gift: { label: "Regalos", icon: Gift },
};

export const GENERAL_EXPENSE_CATEGORIES: ExpenseCategory[] = [
    "food", "transport", "entertainment", "utilities", "health", "shopping", "home", "education", "other"
];

export const SUBSCRIPTION_TYPES = {
    streaming: { label: "Streaming", icon: "📺" },
    utility: { label: "Servicios", icon: "💡" },
    internet: { label: "Internet", icon: "📶" },
    insurance: { label: "Seguros", icon: "🛡️" },
    membership: { label: "Membresías", icon: "🎫" },
    software: { label: "Software", icon: "💻" },
    other: { label: "Otro", icon: "📋" },
};
