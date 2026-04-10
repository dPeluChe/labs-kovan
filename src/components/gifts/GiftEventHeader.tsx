
import { Edit2, Package, CheckCircle2, Trash2 } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { DetailHeader } from "../ui/DetailHeader";
import { ContextMenu, type ContextMenuItem } from "../ui/ContextMenu";

interface GiftEventHeaderProps {
    event: Doc<"giftEvents">;
    stats: { total: number; bought: number; approxCost: number };
    onBack: () => void;
    onEdit: () => void;
    onAddGiftPool: () => void;
    onToggleComplete: () => void;
    onDelete: () => void;
    filter: string;
    setFilter: (f: "all" | "pending" | "bought" | "gifts") => void;
    pendingCount: number;
}

export function GiftEventHeader({
    event,
    stats,
    onBack,
    onEdit,
    onAddGiftPool,
    onToggleComplete,
    onDelete,
    filter,
    setFilter,
    pendingCount,
}: GiftEventHeaderProps) {
    const menuItems: ContextMenuItem[] = [
        { icon: Edit2, label: "Editar evento", onClick: onEdit, hidden: event.isCompleted },
        { icon: Package, label: "Agregar regalo", onClick: onAddGiftPool, hidden: event.isCompleted },
        {
            icon: CheckCircle2,
            label: event.isCompleted ? "Reactivar evento" : "Finalizar evento",
            onClick: onToggleComplete,
        },
        { icon: Trash2, label: "Eliminar evento", onClick: onDelete, variant: "danger" },
    ];

    return (
        <DetailHeader
            title={event.name}
            onBack={onBack}
            badge={event.isCompleted && <span className="badge badge-success badge-sm">Finalizado</span>}
            subtitle={
                <div className="flex items-center gap-2">
                    <span>{stats.total} regalos</span>
                    <span>•</span>
                    <span className="text-success">{stats.bought} listos</span>
                    <span>•</span>
                    <span>${stats.approxCost.toLocaleString()} aprox</span>
                </div>
            }
            action={<ContextMenu items={menuItems} />}
            description={
                event.description && (
                    <div className="bg-base-200 border border-base-300 rounded-lg px-3 py-2">
                        <p className="text-sm text-body whitespace-pre-wrap">{event.description}</p>
                    </div>
                )
            }
            tabs={
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setFilter("all")}
                        className={`btn btn-xs rounded-full ${filter === "all" ? "btn-neutral" : "btn-ghost"}`}
                    >
                        Personas
                    </button>
                    <button
                        onClick={() => setFilter("gifts")}
                        className={`btn btn-xs rounded-full ${filter === "gifts" ? "btn-primary" : "btn-ghost"}`}
                    >
                        Regalos ({stats.total})
                    </button>
                    <button
                        onClick={() => setFilter("pending")}
                        className={`btn btn-xs rounded-full ${filter === "pending" ? "btn-warning" : "btn-ghost"}`}
                    >
                        Pendientes ({pendingCount})
                    </button>
                    <button
                        onClick={() => setFilter("bought")}
                        className={`btn btn-xs rounded-full ${filter === "bought" ? "btn-success text-white" : "btn-ghost"}`}
                    >
                        Listos ({stats.bought})
                    </button>
                </div>
            }
            banner={
                event.isCompleted && (
                    <div className="bg-base-200 px-4 py-2 text-xs text-center text-muted border-b border-base-300">
                        🔒 Este evento está finalizado y es solo de lectura.
                    </div>
                )
            }
        />
    );
}
