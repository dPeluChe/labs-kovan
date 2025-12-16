
import { ArrowLeft, MoreVertical, Edit2, Package, CheckCircle2, Trash2 } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";

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
    return (
        <div className="sticky top-0 z-30 bg-base-100/95 backdrop-blur-md border-b border-base-300 shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3">
                <button onClick={onBack} className="btn btn-ghost btn-sm btn-circle">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold truncate leading-tight flex items-center gap-2">
                        {event.name}
                        {event.isCompleted && <span className="badge badge-success badge-sm">Finalizado</span>}
                    </h1>
                    <div className="flex items-center gap-2 text-xs text-base-content/60">
                        <span>{stats.total} regalos</span>
                        <span>•</span>
                        <span className="text-success">{stats.bought} listos</span>
                        <span>•</span>
                        <span className="text-base-content/60">${stats.approxCost.toLocaleString()} aprox</span>
                    </div>
                </div>
                <div className="dropdown dropdown-end">
                    <button tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                    <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 border border-base-300 z-50">
                        {!event.isCompleted && (
                            <>
                                <li><button onClick={onEdit}><Edit2 className="w-4 h-4" /> Editar evento</button></li>
                                <li><button onClick={onAddGiftPool}><Package className="w-4 h-4" /> Agregar regalo</button></li>
                            </>
                        )}
                        <li>
                            <button onClick={onToggleComplete}>
                                <CheckCircle2 className="w-4 h-4" />
                                {event.isCompleted ? "Reactivar evento" : "Finalizar evento"}
                            </button>
                        </li>
                        <li><button onClick={onDelete} className="text-error"><Trash2 className="w-4 h-4" /> Eliminar evento</button></li>
                    </ul>
                </div>
            </div>

            {event.description && (
                <div className="px-4 pb-2">
                    <div className="bg-base-200 border border-base-300 rounded-lg px-3 py-2">
                        <p className="text-sm text-base-content/70 whitespace-pre-wrap">{event.description}</p>
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
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

            {/* Archived Banner */}
            {event.isCompleted && (
                <div className="bg-base-200 px-4 py-2 text-xs text-center text-base-content/60 border-b border-base-300">
                    🔒 Este evento está finalizado y es solo de lectura.
                </div>
            )}
        </div>
    );
}
