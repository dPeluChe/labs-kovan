
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Trash2, Check, ShoppingCart, Box, MoreVertical } from "lucide-react";
import { TYPE_CONFIG, STATUS_LABELS } from "./CollectionConstants";
import type { Doc } from "../../../convex/_generated/dataModel";
import type { ConfirmOptions } from "../../hooks/useConfirmModal";

export function ItemCard({
    item,
    showVolume = false,
    confirm,
}: {
    item: Doc<"collections">;
    showVolume?: boolean;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}) {
    const updateItem = useMutation(api.collections.updateItem);
    const deleteItem = useMutation(api.collections.deleteItem);

    const TypeIcon = TYPE_CONFIG[item.type]?.icon || Box;

    const toggleOwned = async () => {
        await updateItem({ itemId: item._id, owned: !item.owned });
    };

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: "Eliminar item",
            message: `¿Borrar "${item.title}"?`,
            confirmText: "Eliminar",
            variant: "danger",
        });
        if (confirmed) {
            await deleteItem({ itemId: item._id });
        }
    };

    return (
        <div className={`group relative flex flex-col bg-base-100 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg border ${item.owned ? "border-base-200" : "border-dashed border-base-300 opacity-90"}`}>

            {/* Visual Header / Cover Placeholder */}
            <div className={`h-24 w-full relative ${item.imageUrl ? "" : "bg-gradient-to-br from-base-200 to-base-300"} flex items-center justify-center`}>
                {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                    <TypeIcon className="w-8 h-8 text-base-content/20" />
                )}

                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                    <span className={`badge badge-xs shadow-sm ${item.status === 'finished' ? 'badge-success text-white' : item.status === 'in_progress' ? 'badge-warning text-white' : 'badge-ghost bg-base-100/80 backdrop-blur-sm'}`}>
                        {STATUS_LABELS[item.status]}
                    </span>
                </div>

                {/* Owned Toggle (Quick Action) */}
                {!item.owned && (
                    <div className="absolute top-2 right-2">
                        <span className="badge badge-xs badge-neutral badge-outline bg-base-100/80 backdrop-blur-sm">Deseado</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3 flex-1 flex flex-col relative">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm leading-tight line-clamp-2" title={item.title}>
                            {showVolume && item.volumeOrVersion ? item.volumeOrVersion : item.title}
                        </h4>

                        {/* Subtitle logic */}
                        <div className="text-xs text-base-content/60 mt-1 truncate">
                            {showVolume && item.volumeOrVersion
                                ? <span className="text-base-content/40">{item.title}</span>
                                : (item.creator || <span className="opacity-50 italic">Sin autor</span>)
                            }
                        </div>
                    </div>

                    {/* Context Menu */}
                    <div className="dropdown dropdown-end">
                        <button tabIndex={0} className="btn btn-ghost btn-xs btn-circle -mr-1 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[50] w-40 p-1 shadow-xl border border-base-200 text-sm">
                            <li>
                                <button onClick={toggleOwned} className="py-2">
                                    {item.owned ? <ShoppingCart className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                    {item.owned ? "A Deseados" : "Ya lo tengo"}
                                </button>
                            </li>
                            <li>
                                <button onClick={handleDelete} className="text-error py-2">
                                    <Trash2 className="w-4 h-4" /> Eliminar
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-auto pt-2 flex items-center justify-between text-[10px] text-base-content/40 uppercase font-medium tracking-wide">
                    <span>{TYPE_CONFIG[item.type]?.label}</span>
                    {item.series && <span className="truncate max-w-[60%] text-right">{item.series}</span>}
                </div>
            </div>
        </div>
    );
}
