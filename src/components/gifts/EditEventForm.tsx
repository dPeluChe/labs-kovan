
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Input } from "../ui/Input";
import type { Doc } from "../../../convex/_generated/dataModel";

export function EditEventForm({
    event,
    onClose,
}: {
    event: Doc<"giftEvents">;
    onClose: () => void;
}) {
    const [name, setName] = useState(event.name);
    const [date, setDate] = useState(
        event.date ? new Date(event.date).toISOString().split("T")[0] : ""
    );
    const [description, setDescription] = useState(event.description || "");
    const [isLoading, setIsLoading] = useState(false);

    const updateEvent = useMutation(api.gifts.updateGiftEvent);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            await updateEvent({
                eventId: event._id,
                name: name.trim(),
                date: date ? new Date(date).getTime() : undefined,
                description: description.trim() || undefined,
            });
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Nombre del evento *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Navidad 2025"
                autoFocus
                disabled={isLoading}
            />

            <div className="form-control">
                <label className="label"><span className="label-text">Fecha (opcional)</span></label>
                <input
                    type="date"
                    className="input input-bordered w-full"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={isLoading}
                />
            </div>

            <div className="form-control">
                <label className="label"><span className="label-text">Descripción (opcional)</span></label>
                <textarea
                    className="textarea textarea-bordered w-full"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Notas adicionales..."
                    rows={3}
                    disabled={isLoading}
                />
            </div>

            <div className="modal-action">
                <button type="button" className="btn" onClick={onClose} disabled={isLoading}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isLoading || !name.trim()}>
                    {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
                </button>
            </div>
        </form>
    );
}
