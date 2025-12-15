
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { UserPlus, Edit2, Trash2 } from "lucide-react";
import { STATUS_CONFIG, type GiftStatus } from "./GiftConstants";
import type { Doc } from "../../../convex/_generated/dataModel";
import type { ConfirmOptions } from "../../hooks/useConfirmModal";

export function UnassignedGiftItem({
    item,
    recipients,
    onEdit,
    confirmDialog,
    isEventArchived,
}: {
    item: Doc<"giftItems">;
    recipients: Doc<"giftRecipients">[];
    onEdit: () => void;
    confirmDialog: (options: ConfirmOptions) => Promise<boolean>;
    isEventArchived?: boolean;
}) {
    const assignItem = useMutation(api.gifts.assignGiftItem);
    const deleteItem = useMutation(api.gifts.deleteGiftItem);
    const statusConfig = STATUS_CONFIG[item.status as GiftStatus];

    const handleDelete = async () => {
        const confirmed = await confirmDialog({
            title: "Eliminar regalo",
            message: "¿Eliminar este regalo?",
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            variant: "danger",
            icon: "trash",
        });
        if (confirmed) {
            await deleteItem({ itemId: item._id });
        }
    };

    return (
        <div className={`flex items-center gap-2 p-2 bg-base-100 rounded-lg border border-base-300 ${isEventArchived ? "opacity-75" : ""}`}>
            <span className="text-lg">{statusConfig.icon}</span>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.title}</p>
                {item.priceEstimate && (
                    <p className="text-xs text-base-content/60">${item.priceEstimate}</p>
                )}
            </div>

            {!isEventArchived && (
                <>
                    {/* Assign Dropdown */}
                    <div className="dropdown dropdown-end">
                        <button tabIndex={0} className="btn btn-ghost btn-xs gap-1">
                            <UserPlus className="w-3 h-3" /> Asignar
                        </button>
                        <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40 border border-base-300 z-50">
                            {recipients.map((recipient) => (
                                <li key={recipient._id}>
                                    <button onClick={() => assignItem({ itemId: item._id, giftRecipientId: recipient._id })}>
                                        {recipient.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button onClick={onEdit} className="btn btn-ghost btn-xs btn-circle">
                        <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={handleDelete} className="btn btn-ghost btn-xs btn-circle text-error">
                        <Trash2 className="w-3 h-3" />
                    </button>
                </>
            )}
        </div>
    );
}
