
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Input } from "../../ui/Input";
import { DateInput } from "../../ui/DateInput";
import type { Id } from "../../../../convex/_generated/dataModel";
import { MobileModal } from "../../ui/MobileModal";

export function AddRecordModal({
    personId,
    onClose,
}: {
    personId: Id<"personProfiles">;
    onClose: () => void;
}) {
    const [type] = useState<"consultation" | "study" | "note">("consultation");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [doctorName, setDoctorName] = useState("");
    const [clinicName, setClinicName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const createRecord = useMutation(api.health.createMedicalRecord);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsLoading(true);
        try {
            await createRecord({
                personId,
                type,
                title: title.trim(),
                description: description.trim() || undefined,
                date: new Date(date).getTime(),
                doctorName: doctorName.trim() || undefined,
                clinicName: clinicName.trim() || undefined,
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
            title="Nueva consulta"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Título *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Chequeo general"
                />

                <DateInput
                    label="Fecha"
                    value={date}
                    onChange={setDate}
                />

                <div className="form-control">
                    <label className="label"><span className="label-text">Descripción</span></label>
                    <textarea
                        className="textarea textarea-bordered w-full"
                        placeholder="Notas, resultados, observaciones..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Input
                        label="Doctor"
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        placeholder="Dr. House"
                    />
                    <Input
                        label="Clínica"
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                        placeholder="Hospital General"
                    />
                </div>

                <div className="modal-action">
                    <button type="button" className="btn" onClick={onClose}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isLoading || !title.trim()}>
                        {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
                    </button>
                </div>
            </form>
        </MobileModal>
    );
}
