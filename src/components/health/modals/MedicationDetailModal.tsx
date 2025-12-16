
import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { type ConfirmOptions } from "../../../hooks/useConfirmModal";
import { MobileModal } from "../../ui/MobileModal";
import { Input } from "../../ui/Input";
import { DateInput } from "../../ui/DateInput";
import { TextArea } from "../../ui/TextArea";
import { Trash2, Pill, CheckCircle, PauseCircle, StopCircle, Clock } from "lucide-react";
import type { Doc } from "../../../../convex/_generated/dataModel";

export function MedicationDetailModal({
    medication,
    onClose,
    confirm,
}: {
    medication: Doc<"medications">;
    onClose: () => void;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}) {
    const updateMedication = useMutation(api.health.updateMedication);
    const deleteMedication = useMutation(api.health.deleteMedication);

    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Edit state
    const [name, setName] = useState(medication.name);
    const [dosage, setDosage] = useState(medication.dosage);
    const [status, setStatus] = useState<"active" | "completed" | "paused">(
        (medication.status as "active" | "completed" | "paused") || (medication.endDate && medication.endDate <= Date.now() ? "completed" : "active")
    );
    const [startDate, setStartDate] = useState(new Date(medication.startDate).toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(medication.endDate ? new Date(medication.endDate).toISOString().split("T")[0] : "");
    const [notes, setNotes] = useState(medication.notes || "");

    // Logic to auto-set dates based on status change
    useEffect(() => {
        if (status === "active") {
            setEndDate(""); // Clear end date if active
        } else if (status === "completed" && !endDate) {
            setEndDate(new Date().toISOString().split("T")[0]); // Default to today if completed
        }
    }, [status, endDate]);

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: "Eliminar medicación",
            message: `¿Eliminar "${medication.name}"?`,
            confirmText: "Eliminar",
            variant: "danger",
            icon: "trash",
        });

        if (confirmed) {
            await deleteMedication({ medicationId: medication._id });
            onClose();
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            await updateMedication({
                medicationId: medication._id,
                name: name.trim(),
                dosage: dosage.trim(),
                startDate: new Date(startDate).getTime(),
                endDate: status === "completed" && endDate ? new Date(endDate).getTime() : undefined,
                status,
                notes: notes.trim() || undefined,
            });
            setIsEditing(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to get Status Badge Component
    const StatusBadge = ({ s }: { s: string | undefined }) => {
        if (s === "active" || (!s && (!medication.endDate || medication.endDate > Date.now()))) {
            return <span className="badge badge-success badge-sm text-white gap-1"><CheckCircle className="w-3 h-3" /> Activo</span>;
        }
        if (s === "paused") return <span className="badge badge-warning badge-sm text-white gap-1"><PauseCircle className="w-3 h-3" /> Suspendido</span>;
        return <span className="badge badge-ghost badge-sm gap-1"><StopCircle className="w-3 h-3" /> Terminado</span>;
    };

    if (isEditing) {
        return (
            <MobileModal
                isOpen={true}
                onClose={() => setIsEditing(false)}
                title="Editar Medicación"
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <Input
                        label="Nombre *"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Amoxicilina"
                    />

                    <Input
                        label="Dosis *"
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                        placeholder="Ej: 500mg cada 8 horas"
                    />

                    <div className="form-control">
                        <label className="label"><span className="label-text">Estado</span></label>
                        <div className="join w-full">
                            <input
                                className="join-item btn flex-1 btn-sm"
                                type="radio"
                                name="status"
                                aria-label="Activo"
                                checked={status === "active"}
                                onChange={() => setStatus("active")}
                            />
                            <input
                                className="join-item btn flex-1 btn-sm"
                                type="radio"
                                name="status"
                                aria-label="Suspendido"
                                checked={status === "paused"}
                                onChange={() => setStatus("paused")}
                            />
                            <input
                                className="join-item btn flex-1 btn-sm"
                                type="radio"
                                name="status"
                                aria-label="Terminado"
                                checked={status === "completed"}
                                onChange={() => setStatus("completed")}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <DateInput
                            label="Fecha inicio"
                            value={startDate}
                            onChange={setStartDate}
                        />
                        {/* Show end date only if completed */}
                        {status === "completed" && (
                            <DateInput
                                label="Fecha fin"
                                value={endDate}
                                onChange={setEndDate}
                            />
                        )}
                        {status !== "completed" && <div className="hidden sm:block"></div>}
                    </div>

                    <TextArea
                        label="Notas"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Indicaciones adicionales..."
                        className="h-24"
                    />

                    <div className="modal-action">
                        <button type="button" className="btn" onClick={() => setIsEditing(false)}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading || !name.trim()}>Guardar</button>
                    </div>
                </form>
            </MobileModal>
        );
    }

    return (
        <MobileModal
            isOpen={true}
            onClose={onClose}
            title="Detalle de Medicación"
        >
            <div className="space-y-6">
                {/* Header inside body to support custom layout requested */}
                <div className="flex items-center justify-between mb-2 -mt-2">
                    <span className="text-lg font-bold hidden"></span> {/* spacing hack */}
                    <div className="flex gap-2 w-full justify-end">
                        <StatusBadge s={medication.status} />
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${medication.status === "completed" ? "bg-base-200 text-base-content/40" : "bg-purple-500/10 text-purple-600"}`}>
                        <Pill className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold">{medication.name}</h2>
                        <p className="text-base-content/70 font-medium">{medication.dosage}</p>
                    </div>
                </div>

                <div className="bg-base-200/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-base-content/40" />
                        <div>
                            <div className="text-xs text-base-content/40 uppercase font-bold">Periodo</div>
                            <div className="text-sm">
                                {new Date(medication.startDate).toLocaleDateString("es-MX", { month: "short", day: "numeric", year: "numeric" })}
                                {medication.status === "completed" && medication.endDate ? (
                                    <> - {new Date(medication.endDate).toLocaleDateString("es-MX", { month: "short", day: "numeric", year: "numeric" })}</>
                                ) : (medication.status === "active" ? (
                                    " - En curso"
                                ) : (
                                    "" // Paused
                                ))}
                            </div>
                        </div>
                    </div>

                    {medication.notes && (
                        <div className="pt-2 border-t border-base-content/5">
                            <div className="text-xs text-base-content/40 uppercase font-bold mb-1">Notas</div>
                            <p className="text-sm whitespace-pre-wrap">{medication.notes}</p>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 pt-2">
                    <button onClick={handleDelete} className="btn btn-outline btn-error flex-1">
                        <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
                    <button onClick={() => setIsEditing(true)} className="btn btn-primary flex-1">
                        Editar
                    </button>
                </div>
            </div>
        </MobileModal>
    );
}
