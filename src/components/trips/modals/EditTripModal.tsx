import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { MobileModal } from "../../ui/MobileModal";
import { Input } from "../../ui/Input";
import { DateInput } from "../../ui/DateInput";
import { TextArea } from "../../ui/TextArea";

interface EditTripModalProps {
    trip: Doc<"trips">;
    onClose: () => void;
}

export function EditTripModal({ trip, onClose }: EditTripModalProps) {
    const updateTrip = useMutation(api.trips.updateTrip);

    // Initial State pre-filled
    const [name, setName] = useState(trip.name);
    const [destination, setDestination] = useState(trip.destination || "");
    const [startDate, setStartDate] = useState(trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : "");
    const [endDate, setEndDate] = useState(trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : "");
    const [budget, setBudget] = useState(trip.budget ? trip.budget.toString() : "");
    const [description, setDescription] = useState(trip.description || "");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            await updateTrip({
                tripId: trip._id,
                name: name.trim(),
                destination: destination.trim() || undefined,
                startDate: startDate ? new Date(startDate).getTime() : undefined,
                endDate: endDate ? new Date(endDate).getTime() : undefined,
                budget: budget ? parseFloat(budget) : undefined,
                description: description.trim() || undefined,
            });
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MobileModal isOpen onClose={onClose} title="Editar Viaje">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nombre del viaje *"
                    placeholder="Ej. Japón 2025"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <Input
                    label="Destino principal"
                    placeholder="Ej. Tokio, Kioto"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-3">
                    <DateInput
                        label="Inicio"
                        value={startDate}
                        onChange={setStartDate}
                    />
                    <DateInput
                        label="Fin"
                        value={endDate}
                        onChange={setEndDate}
                    />
                </div>

                <Input
                    label="Presupuesto"
                    type="number"
                    placeholder="0.00"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                />

                <TextArea
                    label="Descripción"
                    placeholder="Notas importantes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                />

                <div className="modal-action">
                    <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!name.trim() || isLoading}
                    >
                        {isLoading ? <span className="loading loading-spinner" /> : "Guardar Cambios"}
                    </button>
                </div>
            </form>
        </MobileModal>
    );
}
