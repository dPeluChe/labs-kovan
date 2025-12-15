import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Input } from "../ui/Input";
import { Trash2 } from "lucide-react";
import { STATUS_CONFIG, type GiftStatus } from "./GiftConstants";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import type { ConfirmOptions } from "../../hooks/useConfirmModal";

export function GiftItemForm({
    eventId,
    recipientId,
    initialData,
    onClose,
    confirmDialog,
}: {
    eventId: Id<"giftEvents">;
    recipientId?: Id<"giftRecipients">;
    initialData?: Doc<"giftItems">;
    onClose: () => void;
    confirmDialog: (options: ConfirmOptions) => Promise<boolean>;
}) {
    const createItem = useMutation(api.gifts.createGiftItem);
    const updateItem = useMutation(api.gifts.updateGiftItem);
    const deleteItem = useMutation(api.gifts.deleteGiftItem);

    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        url: initialData?.url || "",
        priceEstimate: initialData?.priceEstimate?.toString() || "",
        status: initialData?.status || "idea",
        notes: initialData?.notes || "",
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) return;

        setIsLoading(true);
        try {
            if (initialData) {
                await updateItem({
                    itemId: initialData._id,
                    title: formData.title.trim(),
                    url: formData.url.trim() || undefined,
                    priceEstimate: formData.priceEstimate ? parseFloat(formData.priceEstimate) : undefined,
                    status: formData.status as GiftStatus,
                    notes: formData.notes.trim() || undefined,
                });
            } else {
                await createItem({
                    giftEventId: eventId,
                    giftRecipientId: recipientId,
                    title: formData.title.trim(),
                    url: formData.url.trim() || undefined,
                    priceEstimate: formData.priceEstimate ? parseFloat(formData.priceEstimate) : undefined,
                    status: formData.status as GiftStatus,
                    notes: formData.notes.trim() || undefined,
                });
            }
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        const confirmed = await confirmDialog({
            title: "Eliminar regalo",
            message: "¿Estás seguro de que quieres eliminar este regalo? Esta acción no se puede deshacer.",
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            variant: "danger",
            icon: "trash",
        });

        if (confirmed && initialData) {
            await deleteItem({ itemId: initialData._id });
            onClose();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Título *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Lego Star Wars"
                autoFocus
                disabled={isLoading}
            />

            <Input
                label="URL Link"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://amazon.com/..."
                type="url"
                disabled={isLoading}
            />

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Precio estimado"
                    value={formData.priceEstimate}
                    onChange={(e) => setFormData({ ...formData, priceEstimate: e.target.value })}
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    disabled={isLoading}
                />

                <div className="form-control w-full">
                    <label className="label"><span className="label-text font-medium">Estado</span></label>
                    <select
                        className="select select-bordered w-full"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as GiftStatus })}
                        disabled={isLoading}
                    >
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>{config.icon} {config.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="form-control">
                <label className="label"><span className="label-text font-medium">Notas</span></label>
                <textarea
                    className="textarea textarea-bordered h-20"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Talla, color, detalles..."
                    disabled={isLoading}
                ></textarea>
            </div>

            <div className="modal-action justify-between items-center mt-6">
                {initialData ? (
                    <button type="button" onClick={handleDelete} className="btn btn-ghost text-error" disabled={isLoading}>
                        <Trash2 className="w-4 h-4" /> Borrar
                    </button>
                ) : (
                    <div></div> // Spacer
                )}
                <div className="flex gap-2">
                    <button type="button" className="btn" onClick={onClose} disabled={isLoading}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={isLoading || !formData.title.trim()}>
                        {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
                    </button>
                </div>
            </div>
        </form>
    );
}
