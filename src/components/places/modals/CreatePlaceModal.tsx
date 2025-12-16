
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Input } from "../../ui/Input";
import { TextArea } from "../../ui/TextArea";
import type { Id } from "../../../../convex/_generated/dataModel";
import { MobileModal } from "../../ui/MobileModal";

export function CreatePlaceModal({
    familyId,
    preselectedListId, // Optional: if opening from a specific list
    onClose,
}: {
    familyId: Id<"families">;
    preselectedListId?: Id<"placeLists">;
    onClose: () => void;
}) {
    const [name, setName] = useState("");
    const [listId, setListId] = useState<Id<"placeLists"> | "">(preselectedListId || "");
    const [category, setCategory] = useState<string>("restaurant");
    const [highlight, setHighlight] = useState("");
    const [url, setUrl] = useState("");
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const lists = useQuery(api.places.getLists, { familyId });
    const createPlace = useMutation(api.places.createPlace);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            await createPlace({
                familyId,
                listId: listId ? (listId as Id<"placeLists">) : undefined,
                name: name.trim(),
                category: category as "restaurant" | "cafe" | "travel" | "activity" | "other",
                highlight: highlight.trim() || undefined,
                url: url.trim() || undefined,
                notes: notes.trim() || undefined,
                // Add defaults for fields we aren't asking yet to keep UI simple
                visited: false,
            });
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const CATEGORIES = [
        { id: "restaurant", label: "Restaurante", emoji: "🍽️" },
        { id: "cafe", label: "Café", emoji: "☕" },
        { id: "travel", label: "Turismo", emoji: "📸" },
        { id: "activity", label: "Actividad", emoji: "🎟️" },
        { id: "other", label: "Otro", emoji: "📍" },
    ];

    return (
        <MobileModal
            isOpen={true}
            onClose={onClose}
            title="Nuevo Lugar"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nombre *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Pujol, Parque México..."
                    autoFocus
                />

                <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                        <label className="label"><span className="label-text">Categoría</span></label>
                        <select
                            className="select select-bordered w-full"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            {CATEGORIES.map(c => (
                                <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Lista</span></label>
                        <select
                            className="select select-bordered w-full"
                            value={listId}
                            onChange={(e) => setListId(e.target.value as Id<"placeLists">)}
                        >
                            <option value="">Sin lista</option>
                            {lists?.map(l => (
                                <option key={l._id} value={l._id}>{l.icon} {l.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <Input
                    label="Highlight / Recomendación"
                    value={highlight}
                    onChange={(e) => setHighlight(e.target.value)}
                    placeholder="Ej: Pedir el mole madre..."
                />

                <Input
                    label="Link / Instagram"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                />

                <TextArea
                    label="Notas"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Horarios, tips, como llegar..."
                    rows={2}
                />

                <div className="modal-action">
                    <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={isLoading || !name.trim()}>
                        {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar Lugar"}
                    </button>
                </div>
            </form>
        </MobileModal>
    );
}
