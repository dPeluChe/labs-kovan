
import type { Doc } from "../../../convex/_generated/dataModel";

export const STATUS_CONFIG = {
    idea: { label: "Idea", color: "badge-ghost", icon: "💡", bg: "bg-base-200" },
    to_buy: { label: "Por comprar", color: "badge-warning", icon: "🛒", bg: "bg-yellow-500/10" },
    bought: { label: "Comprado", color: "badge-info", icon: "✅", bg: "bg-blue-500/10" },
    wrapped: { label: "Envuelto", color: "badge-secondary", icon: "🎁", bg: "bg-pink-500/10" },
    delivered: { label: "Entregado", color: "badge-success", icon: "🎉", bg: "bg-green-500/10" },
} as const;

export type GiftStatus = keyof typeof STATUS_CONFIG;

export const sortGifts = (a: Doc<"giftItems">, b: Doc<"giftItems">) => {
    // Define status priority: Incomplete (lower value) -> Complete (higher value)
    const isCompleteA = ["bought", "wrapped", "delivered"].includes(a.status);
    const isCompleteB = ["bought", "wrapped", "delivered"].includes(b.status);

    // 1. Incomplete before Complete
    if (isCompleteA !== isCompleteB) {
        return isCompleteA ? 1 : -1;
    }

    // 2. Alphabetical by Title
    return a.title.localeCompare(b.title);
};
