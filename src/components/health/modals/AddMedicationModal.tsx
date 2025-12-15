
import { useState, useEffect } from "react";
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
    const [status, setStatus] = useState<"active" | "completed" | "paused">("active");
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const createMedication = useMutation(api.health.createMedication);

    // Auto-clear end date logic
    useEffect(() => {
        if (status === "active") {
            setEndDate("");
        } else if (status === "completed" && !endDate) {
            setEndDate(new Date().toISOString().split("T")[0]);
        }
    }, [status]);

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
                endDate: status === "completed" && endDate ? new Date(endDate).getTime() : undefined,
                status,
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
                    placeholder="Ej: Paracetamol"
                    autoFocus
                />

                <Input
                    label="Dosis *"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="Ej: 1 tableta cada 8 horas"
                />

                <div className="form-control">
                    <label className="label"><span className="label-text">Estado</span></label>
                    <div className="join w-full">
                        <input
                            className="join-item btn flex-1 btn-sm"
                            type="radio"
                            name="status_add"
                            aria-label="Activo"
                            checked={status === "active"}
                            onChange={() => setStatus("active")}
                        />
                        <input
                            className="join-item btn flex-1 btn-sm"
                            type="radio"
                            name="status_add"
                            aria-label="Suspendido"
                            checked={status === "paused"}
                            onChange={() => setStatus("paused")}
                        />
                        <input
                            className="join-item btn flex-1 btn-sm"
                            type="radio"
                            name="status_add"
                            aria-label="Terminado"
                            checked={status === "completed"}
                            onChange={() => setStatus("completed")}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <DateInput label="Inicio" value={startDate} onChange={setStartDate} />
                    {status === "completed" && (
                        <DateInput label="Fin" value={endDate} onChange={setEndDate} />
                    )}
                    {status !== "completed" && <div className="hidden sm:block"></div>}
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text">Notas</span></label>
                    <textarea
                        className="textarea textarea-bordered h-24 w-full"
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
