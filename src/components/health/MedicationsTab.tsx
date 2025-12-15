
import { useState } from "react";
import { Plus, Pill, Clock, ChevronUp, ChevronDown, PauseCircle, StopCircle } from "lucide-react";
import { PageLoader } from "../ui/LoadingSpinner";
import type { Doc } from "../../../convex/_generated/dataModel";
import { MedicationDetailModal } from "./modals/MedicationDetailModal";
import { useConfirmModal } from "../../hooks/useConfirmModal";

export function MedicationsTab({
    medications,
    onAdd,
}: {
    medications: Doc<"medications">[] | undefined;
    onAdd: () => void;
}) {
    const [selectedMedication, setSelectedMedication] = useState<Doc<"medications"> | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const { confirm, ConfirmModal } = useConfirmModal();
    const [now] = useState(() => Date.now());

    if (medications === undefined) return <PageLoader />;

    // Helper to determine if active
    const isActive = (m: Doc<"medications">) => {
        if (m.status === "active") return true;
        if (m.status === "paused" || m.status === "completed") return false;
        // Fallback to legacy date logic
        return !m.endDate || m.endDate > now;
    };

    const active = medications.filter(isActive);
    const past = medications.filter((m) => !isActive(m));

    return (
        <>
            <button onClick={onAdd} className="btn btn-outline btn-sm w-full gap-2 mb-4">
                <Plus className="w-4 h-4" />
                Agregar medicación
            </button>

            <div className="space-y-6 animate-fade-in">
                {/* Active Medications */}
                <div>
                    <h3 className="font-semibold text-sm mb-3 text-success flex items-center gap-2">
                        <Pill className="w-4 h-4" /> Activas ({active.length})
                    </h3>
                    {active.length === 0 ? (
                        <div className="text-center py-4 bg-base-200/30 rounded-lg border border-dashed border-base-300">
                            <p className="text-sm text-base-content/50">No hay medicaciones activas</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {active.map((med) => (
                                <MedicationCard
                                    key={med._id}
                                    medication={med}
                                    onClick={() => setSelectedMedication(med)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* History Toggle */}
                {past.length > 0 && (
                    <div>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="flex items-center gap-2 text-sm font-medium text-base-content/60 hover:text-base-content transition-colors w-full"
                        >
                            <Clock className="w-4 h-4" />
                            Historial ({past.length})
                            {showHistory ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                        </button>

                        {showHistory && (
                            <div className="mt-3 space-y-2 animate-slide-down">
                                {past.map((med) => (
                                    <MedicationCard
                                        key={med._id}
                                        medication={med}
                                        onClick={() => setSelectedMedication(med)}
                                        isPast
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {selectedMedication && (
                <MedicationDetailModal
                    medication={selectedMedication}
                    onClose={() => setSelectedMedication(null)}
                    confirm={confirm}
                />
            )}
            <ConfirmModal />
        </>
    );
}

function MedicationCard({
    medication,
    onClick,
    isPast
}: {
    medication: Doc<"medications">;
    onClick: () => void;
    isPast?: boolean;
}) {
    return (
        <div
            onClick={onClick}
            className={`card bg-base-100 shadow-sm border card-interactive ${isPast ? "border-base-200 opacity-75" : "border-success/30"} cursor-pointer hover:bg-base-200/50 transition-colors`}
        >
            <div className="card-body p-3">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className={`font-semibold text-sm ${isPast ? "text-base-content/70" : ""}`}>{medication.name}</h4>
                            {medication.status === "paused" && <PauseCircle className="w-3 h-3 text-warning" />}
                            {medication.status === "completed" && <StopCircle className="w-3 h-3 text-base-content/40" />}
                        </div>
                        <p className="text-xs text-base-content/70">{medication.dosage}</p>
                        <p className="text-xs text-base-content/50 mt-1">
                            {new Date(medication.startDate).toLocaleDateString("es-MX")}
                            {!medication.endDate ? " - Indefinido" : ` - ${new Date(medication.endDate).toLocaleDateString("es-MX")}`}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
