
import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, Edit2, Trash2, Gift, CheckCircle2, ExternalLink } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import type { ConfirmOptions } from "../../hooks/useConfirmModal";
import { sortGifts } from "./GiftConstants";
import { useAuth } from "../../contexts/AuthContext";
import { ContextMenu } from "../ui/ContextMenu";

const BOUGHT_STATUSES = ["bought", "wrapped", "delivered"];

function statusColorClass(total: number, boughtCount: number, hasIdeas: boolean) {
    if (total === 0) return "bg-base-300";
    if (boughtCount === total) return "bg-success";
    if (hasIdeas) return "bg-warning";
    return "bg-base-300";
}

function countBadgeClass(boughtCount: number, total: number, hasIdeas: boolean) {
    if (boughtCount === total) return "bg-success/20 text-success";
    if (hasIdeas) return "bg-warning/20 text-warning";
    return "bg-base-200 text-subtle";
}

function GiftChip({
    item,
    isEventArchived,
    onEditItem,
    onToggleStatus,
}: {
    item: Doc<"giftItems">;
    isEventArchived?: boolean;
    onEditItem: (item: Doc<"giftItems">) => void;
    onToggleStatus: (item: Doc<"giftItems">, isBought: boolean) => void;
}) {
    const isBought = BOUGHT_STATUSES.includes(item.status);
    return (
        <div
            className={`badge gap-1.5 transition-all relative ${!isEventArchived ? "cursor-pointer hover:shadow-sm" : "cursor-default opacity-80"} ${isBought
                ? "bg-success/20 text-success border border-success/30"
                : "bg-base-200 text-base-content border border-base-300"
                }`}
        >
            {!isEventArchived && (
                <button
                    type="button"
                    onClick={() => onEditItem(item)}
                    aria-label={`Editar ${item.title}`}
                    className="absolute inset-0 rounded-[inherit]"
                />
            )}
            {!isEventArchived && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus(item, isBought);
                    }}
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center relative z-10 ${isBought
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
                    className="opacity-40 hover:opacity-100 border-l border-base-content/20 pl-1.5 ml-0.5 relative z-10"
                    aria-label="Abrir enlace del regalo"
                >
                    <ExternalLink className="w-2.5 h-2.5" />
                </a>
            )}
        </div>
    );
}

function RecipientEditForm({
    editName,
    editNotes,
    onNameChange,
    onNotesChange,
    onCancel,
    onSave,
}: {
    editName: string;
    editNotes: string;
    onNameChange: (v: string) => void;
    onNotesChange: (v: string) => void;
    onCancel: () => void;
    onSave: () => void;
}) {
    const nameRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        nameRef.current?.focus();
    }, []);
    return (
        <div className="mt-2 p-3 bg-base-200 rounded-lg space-y-2">
            <input
                type="text"
                value={editName}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Nombre"
                aria-label="Nombre"
                className="input input-sm input-bordered w-full"
                ref={nameRef}
            />
            <textarea
                value={editNotes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Notas (ej: alérgico a perfumes, talla M...)"
                aria-label="Notas"
                className="textarea textarea-bordered textarea-sm w-full h-16"
            />
            <div className="flex gap-2 justify-end">
                <button onClick={onCancel} className="btn btn-ghost btn-xs">Cancelar</button>
                <button onClick={onSave} className="btn btn-primary btn-xs">Guardar</button>
            </div>
        </div>
    );
}

export function RecipientCard({
    recipient,
    items,
    onAddItem,
    onEditItem,
    confirmDialog,
    isEventArchived,
}: {
    recipient: Doc<"giftRecipients">;
    items: Doc<"giftItems">[];
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
    const { sessionToken } = useAuth();

    const handleSave = async () => {
        const updates: { name?: string; notes?: string } = {};
        if (editName.trim() && editName.trim() !== recipient.name) {
            updates.name = editName.trim();
        }
        if (editNotes !== (recipient.notes || "")) {
            updates.notes = editNotes;
        }
        if (Object.keys(updates).length > 0) {
            if (!sessionToken) return;
            await updateRecipient({ sessionToken, recipientId: recipient._id, ...updates });
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
            if (!sessionToken) return;
            await deleteRecipient({ sessionToken, recipientId: recipient._id });
        }
    };

    const handleToggleStatus = (item: Doc<"giftItems">, isBought: boolean) => {
        // Prevent accidental toggles
        const newStatus = isBought ? "idea" : "bought";
        if (!sessionToken) return;
        updateItem({ sessionToken, itemId: item._id, status: newStatus });
    };

    // Stats
    const total = items.length;
    const boughtCount = items.filter(i => BOUGHT_STATUSES.includes(i.status)).length;
    const hasIdeas = items.some(i => i.status === "idea" || i.status === "to_buy");
    const statusColor = statusColorClass(total, boughtCount, hasIdeas);

    // SORT ITEMS: Incomplete first, then Alphabetical
    const sortedItems = [...items].sort(sortGifts);

    return (
        <div className="card card-compact bg-base-100 shadow-sm border border-base-200 animate-fade-in group">
            <div className="card-body p-3">
                <div className="flex items-center gap-2">
                    {/* Avatar with status indicator */}
                    <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center text-body font-semibold text-sm">
                            {recipient.name.charAt(0).toUpperCase()}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-base-100 ${statusColor}`} />
                    </div>

                    {/* Name + Counters */}
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                        <h3 className="font-semibold truncate">{recipient.name}</h3>
                        {total > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${countBadgeClass(boughtCount, total, hasIdeas)}`}>
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

                            <ContextMenu
                                items={[
                                    { icon: Edit2, label: "Editar", onClick: () => setIsEditing(true) },
                                    { icon: Trash2, label: "Eliminar", onClick: handleDelete, variant: "danger" },
                                ]}
                                contentClassName="w-40"
                            />
                        </>
                    )}
                </div>

                {/* Notes */}
                {recipient.notes && !isEditing && (
                    <p className="text-xs text-muted mt-1 italic px-1">📝 {recipient.notes}</p>
                )}

                {/* Inline Edit Form */}
                {isEditing && (
                    <RecipientEditForm
                        editName={editName}
                        editNotes={editNotes}
                        onNameChange={setEditName}
                        onNotesChange={setEditNotes}
                        onCancel={handleCancelEdit}
                        onSave={handleSave}
                    />
                )}

                {/* Gift Items as Chips */}
                {items.length === 0 ? (
                    !isEventArchived && (
                        <button
                            onClick={onAddItem}
                            className="btn btn-ghost btn-xs text-faint gap-1 mt-1 justify-start w-max"
                        >
                            <Gift className="w-3 h-3" /> Agregar primer regalo
                        </button>
                    )
                ) : (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {sortedItems.map((item) => (
                            <GiftChip
                                key={item._id}
                                item={item}
                                isEventArchived={isEventArchived}
                                onEditItem={onEditItem}
                                onToggleStatus={handleToggleStatus}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
