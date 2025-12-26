import { Trash2 } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { CATEGORY_CONFIG } from "./constants";

interface ExpenseCardProps {
    expense: Doc<"expenses">;
    onEdit: (expense: Doc<"expenses">) => void;
    onDelete: (expenseId: Doc<"expenses">["_id"]) => void;
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
    const { confirm, ConfirmModal } = useConfirmModal();

    const config = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.other;

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const isConfirmed = await confirm({
            title: "Eliminar gasto",
            message: `¿Estás seguro de que deseas eliminar el gasto "${expense.description}"?`,
            confirmText: "Eliminar",
            variant: "danger",
            icon: "trash"
        });

        if (isConfirmed) {
            onDelete(expense._id);
        }
    };

    return (
        <>
            <div
                onClick={() => onEdit(expense)}
                className={`card bg-gradient-to-r ${config.color} to-transparent border border-base-300 animate-fade-in hover:shadow-md transition-all cursor-pointer group`}
            >
                <div className="card-body p-3">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{config.icon}</span>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{expense.description}</div>
                            <div className="flex items-center gap-2 text-xs text-base-content/60">
                                <span className="badge badge-sm badge-ghost gap-1 opacity-70">
                                    {expense.type}
                                </span>
                                <span>{new Date(expense.date).toLocaleDateString("es-MX")}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-bold">
                                {expense.amount.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                            </div>
                        </div>
                        <button
                            onClick={handleDelete}
                            className="btn btn-ghost btn-xs btn-circle text-error opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
            <ConfirmModal />
        </>
    );
}
