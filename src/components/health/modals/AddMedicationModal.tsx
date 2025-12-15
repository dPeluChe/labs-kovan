
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Input } from "../../ui/Input";
import { DateInput } from "../../ui/DateInput";
import type { Id } from "../../../../convex/_generated/dataModel";
import { MobileModal } from "../../ui/MobileModal";

export function AddMedicationModal({
    personId,
    onClose,
}: {
    personId: Id<"personProfiles">;
    onClose: () => void;
}) {
    const [name, setName] = useState("");
    const [dosage, setDosage] = useState("");
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState("");
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const createMedication = useMutation(api.health.createMedication);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !dosage.trim()) return;

        setIsLoading(true);
        try {
            await createMedication({
                personId,
                name: name.trim(),
                dosage: dosage.trim(),
                startDate: new Date(startDate).getTime(),
                endDate: endDate ? new Date(endDate).getTime() : undefined,
                notes: notes.trim() || undefined,
            });
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MobileModal
            isOpen={true}
            onClose={onClose}
            title="Nueva medicación"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Medicamento *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Paracetamol, Amoxicilina"
                />

                <Input
                    label="Dosis *"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="Ej: 1 tableta cada 8 horas"
                />

                <div className="grid grid-cols-2 gap-2">
                    <DateInput label="Inicio" value={startDate} onChange={setStartDate} />
                    <DateInput label="Fin (opcional)" value={endDate} onChange={setEndDate} />
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text">Notas</span></label>
                    <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Indicaciones adicionales..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                <div className="modal-action">
                    <button type="button" className="btn" onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading || !name.trim() || !dosage.trim()}
                    >
                        {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
                    </button>
                </div>
            </form>
        </MobileModal>
    );
}
