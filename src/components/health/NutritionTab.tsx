
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, ShoppingBag, Calendar, DollarSign, Trash2 } from "lucide-react";
import { EmptyState } from "../ui/EmptyState";
import { PageLoader } from "../ui/LoadingSpinner";
import type { Id } from "../../../convex/_generated/dataModel";
import type { ConfirmOptions } from "../../hooks/useConfirmModal";

export function NutritionTab({
    personId,
    onAdd,
    confirmDialog,
}: {
    personId: Id<"personProfiles">;
    onAdd: () => void;
    confirmDialog: (options: ConfirmOptions) => Promise<boolean>;
}) {
    const history = useQuery(api.petNutrition.getNutritionHistory, { personId });
    const deleteRecord = useMutation(api.petNutrition.deleteNutritionRecord);

    if (history === undefined) return <PageLoader />;

    const handleDelete = async (recordId: Id<"petNutrition">, brand: string) => {
        const confirmed = await confirmDialog({
            title: "Eliminar registro",
            message: `¿Eliminar registro de compra de ${brand}?`,
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            variant: "danger",
            icon: "trash",
        });

        if (confirmed) {
            await deleteRecord({ id: recordId });
        }
    };

    return (
        <>
            <button onClick={onAdd} className="btn btn-outline btn-sm w-full gap-2 mb-4">
                <Plus className="w-4 h-4" />
                Registrar alimento / compra
            </button>

            {history.length === 0 ? (
                <EmptyState
                    icon={ShoppingBag}
                    title="Sin registro de alimentación"
                    description="Registra la comida que compras para saber cuánto dura y cuánto cuesta."
                />
            ) : (
                <div className="space-y-3 animate-fade-in">
                    {history.map((record) => (
                        <div
                            key={record._id}
                            className="card bg-base-100 shadow-sm border border-base-200"
                        >
                            <div className="card-body p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`badge badge-sm ${record.type === "food" ? "badge-primary" : "badge-ghost"
                                                }`}>
                                                {record.type === "food" ? "Comida" :
                                                    record.type === "treats" ? "Premios" :
                                                        record.type === "supplement" ? "Suplemento" : "Otro"}
                                            </span>
                                            <span className="text-xs text-base-content/60 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(record.purchaseDate).toLocaleDateString("es-MX", {
                                                    month: "short", day: "numeric", year: "numeric"
                                                })}
                                            </span>
                                        </div>

                                        <h4 className="font-bold text-base">{record.brand}</h4>
                                        {record.productName && (
                                            <p className="text-sm opacity-80">{record.productName}</p>
                                        )}

                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-base-content/70">
                                            {record.amount && (
                                                <span className="flex items-center gap-1 font-medium text-success">
                                                    <DollarSign className="w-3 h-3" />
                                                    ${record.amount.toLocaleString()}
                                                </span>
                                            )}
                                            {record.weight && (
                                                <span className="flex items-center gap-1 border-l border-base-content/20 pl-2">
                                                    <ShoppingBag className="w-3 h-3" />
                                                    {record.weight}
                                                </span>
                                            )}
                                            {record.store && (
                                                <span className="border-l border-base-content/20 pl-2">
                                                    📍 {record.store}
                                                </span>
                                            )}
                                        </div>

                                        {record.notes && (
                                            <p className="text-xs italic mt-2 opacity-60 bg-base-200/50 p-2 rounded">
                                                "{record.notes}"
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleDelete(record._id, record.brand)}
                                        className="btn btn-ghost btn-xs btn-circle text-base-content/30 hover:text-error"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
