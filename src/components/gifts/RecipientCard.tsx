
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, MoreVertical, Edit2, Trash2, Gift, CheckCircle2, ExternalLink } from "lucide-react";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import type { ConfirmOptions } from "../../hooks/useConfirmModal";
import { sortGifts } from "./GiftConstants";

export function RecipientCard({
    recipient,
    items,
    familyId,
    userId,
    onAddItem,
    onEditItem,
    confirmDialog,
    isEventArchived,
}: {
    recipient: Doc<"giftRecipients">;
    items: Doc<"giftItems">[];
    familyId?: Id<"families">;
    userId?: Id<"users">;
    onAddItem: () => void;
    onEditItem: (item: Doc<"giftItems">) => void;
    confirmDialog: (options: ConfirmOptions) => Promise<boolean>;
    isEventArchived?: boolean;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(recipient.name);
    const [editNotes, setEditNotes] = useState(recipient.notes || "");
    const deleteRecipient = useMutation(api.gifts.deleteGiftRecipient);
    const updateRecipient = useMutation(api.gifts.updateGiftRecipient);
    const updateItem = useMutation(api.gifts.updateGiftItem);

    const handleSave = async () => {
        const updates: { name?: string; notes?: string } = {};
        if (editName.trim() && editName.trim() !== recipient.name) {
            updates.name = editName.trim();
        }
        if (editNotes !== (recipient.notes || "")) {
            updates.notes = editNotes;
        }
        if (Object.keys(updates).length > 0) {
            await updateRecipient({ recipientId: recipient._id, ...updates });
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditName(recipient.name);
        setEditNotes(recipient.notes || "");
        setIsEditing(false);
    };

    const handleDelete = async () => {
        const confirmed = await confirmDialog({
            title: "Eliminar destinatario",
            message: `¿Estás seguro de que quieres eliminar a ${recipient.name} y todos sus regalos? Esta acción no se puede deshacer.`,
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            variant: "danger",
            icon: "trash",
        });

        if (confirmed) {
            await deleteRecipient({ recipientId: recipient._id });
        }
    };

    // Stats
    const total = items.length;
    const boughtCount = items.filter(i => ["bought", "wrapped", "delivered"].includes(i.status)).length;
    const hasIdeas = items.some(i => i.status === "idea" || i.status === "to_buy");

    const statusColor = total === 0
        ? "bg-base-300"
        : boughtCount === total
            ? "bg-success"
            : hasIdeas
                ? "bg-warning"
                : "bg-base-300";

    // SORT ITEMS: Incomplete first, then Alphabetical
    const sortedItems = [...items].sort(sortGifts);

    return (
        <div className="card card-compact bg-base-100 shadow-sm border border-base-200 animate-fade-in group">
            <div className="card-body p-3">
                <div className="flex items-center gap-2">
                    {/* Avatar with status indicator */}
                    <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center text-base-content/70 font-semibold text-sm">
                            {recipient.name.charAt(0).toUpperCase()}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-base-100 ${statusColor}`} />
                    </div>

                    {/* Name + Counters */}
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                        <h3 className="font-semibold truncate">{recipient.name}</h3>
                        {total > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${boughtCount === total
                                ? "bg-success/20 text-success"
                                : hasIdeas
                                    ? "bg-warning/20 text-warning"
                                    : "bg-base-200 text-base-content/50"
                                }`}>
                                {boughtCount}/{total}
                            </span>
                        )}
                    </div>

                    {/* Actions */}
                    {!isEventArchived && (
                        <>
                            <button
                                onClick={onAddItem}
                                className="btn btn-ghost btn-xs btn-circle opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Agregar regalo"
                            >
                                <Plus className="w-4 h-4" />
                            </button>

                            <div className="dropdown dropdown-end">
                                <button tabIndex={0} className="btn btn-ghost btn-xs btn-circle">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                                <ul tabIndex={0} className="dropdown-content menu p-1 shadow-lg bg-base-100 rounded-lg w-40 z-50 border border-base-200 text-sm">
                                    <li><button onClick={() => setIsEditing(true)} className="py-1.5"><Edit2 className="w-3.5 h-3.5" /> Editar</button></li>
                                    <li><button onClick={handleDelete} className="text-error py-1.5"><Trash2 className="w-3.5 h-3.5" /> Eliminar</button></li>
                                </ul>
                            </div>
                        </>
                    )}
                </div>

                {/* Notes */}
                {recipient.notes && !isEditing && (
                    <p className="text-xs text-base-content/60 mt-1 italic px-1">📝 {recipient.notes}</p>
                )}

                {/* Inline Edit Form */}
                {isEditing && (
                    <div className="mt-2 p-3 bg-base-200 rounded-lg space-y-2">
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Nombre"
                            className="input input-sm input-bordered w-full"
                            autoFocus
                        />
                        <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Notas (ej: alérgico a perfumes, talla M...)"
                            className="textarea textarea-bordered textarea-sm w-full h-16"
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={handleCancelEdit} className="btn btn-ghost btn-xs">Cancelar</button>
                            <button onClick={handleSave} className="btn btn-primary btn-xs">Guardar</button>
                        </div>
                    </div>
                )}

                {/* Gift Items as Chips */}
                {items.length === 0 ? (
                    !isEventArchived && (
                        <button
                            onClick={onAddItem}
                            className="btn btn-ghost btn-xs text-base-content/40 gap-1 mt-1 justify-start w-max"
                        >
                            <Gift className="w-3 h-3" /> Agregar primer regalo
                        </button>
                    )
                ) : (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {sortedItems.map((item) => {
                            const isBought = ["bought", "wrapped", "delivered"].includes(item.status);

                            return (
                                <div
                                    key={item._id}
                                    onClick={() => !isEventArchived && onEditItem(item)}
                                    className={`badge gap-1.5 transition-all ${!isEventArchived ? "cursor-pointer hover:shadow-sm" : "cursor-default opacity-80"} ${isBought
                                        ? "bg-success/20 text-success border border-success/30"
                                        : "bg-base-200 text-base-content border border-base-300"
                                        }`}
                                >
                                    {!isEventArchived && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Prevent accidental toggles
                                                const newStatus = isBought ? "idea" : "bought";
                                                updateItem({
                                                    itemId: item._id,
                                                    status: newStatus,
                                                    familyId: newStatus === "bought" ? familyId : undefined,
                                                    paidBy: newStatus === "bought" ? userId : undefined,
                                                });
                                            }}
                                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isBought
                                                ? "bg-success border-success text-white"
                                                : "border-base-300 hover:border-success"
                                                }`}
                                            title={isBought ? "Marcar como pendiente" : "Marcar como comprado"}
                                        >
                                            {isBought && <CheckCircle2 className="w-2.5 h-2.5" />}
                                        </button>
                                    )}

                                    <span className={`text-xs ${isBought ? "line-through opacity-60" : ""}`}>
                                        {item.title}
                                    </span>

                                    {item.priceEstimate && (
                                        <span className="text-[10px] opacity-50 border-l border-base-content/20 pl-1.5 ml-0.5">${item.priceEstimate}</span>
                                    )}

                                    {item.url && (
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="opacity-40 hover:opacity-100 border-l border-base-content/20 pl-1.5 ml-0.5"
                                        >
                                            <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
