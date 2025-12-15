
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Input } from "../ui/Input";
import type { Id } from "../../../convex/_generated/dataModel";

export function AddRecipientForm({
    eventId,
    onClose,
}: {
    eventId: Id<"giftEvents">;
    onClose: () => void;
}) {
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const createRecipient = useMutation(api.gifts.createGiftRecipient);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setIsLoading(true);
        try {
            await createRecipient({
                giftEventId: eventId,
                name: name.trim(),
            });
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Nombre *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Mamá, Juan"
                autoFocus
                disabled={isLoading}
            />
            <div className="modal-action">
                <button type="button" className="btn" onClick={onClose} disabled={isLoading}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isLoading || !name.trim()}>
                    {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
                </button>
            </div>
        </form>
    );
}
