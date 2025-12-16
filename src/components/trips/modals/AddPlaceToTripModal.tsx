import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { MobileModal } from "../../ui/MobileModal";
import { Input } from "../../ui/Input";
import { TextArea } from "../../ui/TextArea";

interface AddPlaceToTripModalProps {
    familyId: Id<"families">;
    placeListId: Id<"placeLists">;
    onClose: () => void;
}

export function AddPlaceToTripModal({ familyId, placeListId, onClose }: AddPlaceToTripModalProps) {
    const createPlace = useMutation(api.places.createPlace);

    const [name, setName] = useState("");
    const [category, setCategory] = useState("restaurant");
    const [highlight, setHighlight] = useState("");
    const [mapsUrl, setMapsUrl] = useState("");
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            await createPlace({
                familyId,
                listId: placeListId, // Automatically link to trip's list
                name: name.trim(),
                category: category as "restaurant" | "cafe" | "travel" | "activity" | "other",
                highlight: highlight.trim() || undefined,
                mapsUrl: mapsUrl.trim() || undefined,
                notes: notes.trim() || undefined,
            });
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MobileModal isOpen onClose={onClose} title="Nuevo Lugar para el Viaje">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nombre del lugar *"
                    placeholder="Ej. Ramen Street"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                />

                <div className="form-control">
                    <label className="label"><span className="label-text">Categoría</span></label>
                    <select className="select select-bordered w-full" value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="restaurant">Restaurante / Comida</option>
                        <option value="cafe">Café / Bar</option>
                        <option value="activity">Actividad / Museo</option>
                        <option value="travel">Punto de interés</option>
                        <option value="other">Otro</option>
                    </select>
                </div>

                <Input
                    label="Lo imperdible (Highlight)"
                    placeholder="Ej. Probar el platillo X..."
                    value={highlight}
                    onChange={(e) => setHighlight(e.target.value)}
                />

                <Input
                    label="Link de Maps"
                    placeholder="https://maps.google.com/..."
                    value={mapsUrl}
                    onChange={(e) => setMapsUrl(e.target.value)}
                />

                <TextArea
                    label="Notas / Dirección"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />

                <div className="modal-action">
                    <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={!name.trim() || isLoading}>
                        {isLoading ? <span className="loading loading-spinner" /> : "Guardar Lugar"}
                    </button>
                </div>
            </form>
        </MobileModal>
    );
}
