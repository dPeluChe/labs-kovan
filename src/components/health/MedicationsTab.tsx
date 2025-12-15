
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, Pill, Trash2, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { PageLoader } from "../ui/LoadingSpinner";
import type { Doc } from "../../../convex/_generated/dataModel";

export function MedicationsTab({
    medications,
    onAdd,
}: {
    medications: Doc<"medications">[] | undefined;
    onAdd: () => void;
}) {
    const deleteMedication = useMutation(api.health.deleteMedication);
    const [showHistory, setShowHistory] = useState(false);
    const [now] = useState(() => Date.now());

    if (medications === undefined) return <PageLoader />;
    const active = medications.filter((m) => !m.endDate || m.endDate > now);
    const past = medications.filter((m) => m.endDate && m.endDate <= now);

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
                                <MedicationCard key={med._id} medication={med} onDelete={() => deleteMedication({ medicationId: med._id })} />
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
                                    <MedicationCard key={med._id} medication={med} onDelete={() => deleteMedication({ medicationId: med._id })} isPast />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

function MedicationCard({
    medication,
    onDelete,
    isPast
}: {
    medication: Doc<"medications">;
    onDelete: () => void;
    isPast?: boolean;
}) {
    return (
        <div className={`card bg-base-100 shadow-sm border ${isPast ? "border-base-200 opacity-75" : "border-success/30"}`}>
            <div className="card-body p-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className={`font-semibold text-sm ${isPast ? "text-base-content/70" : ""}`}>{medication.name}</h4>
                        <p className="text-xs text-base-content/70">{medication.dosage}</p>
                        <p className="text-xs text-base-content/50 mt-1">
                            {new Date(medication.startDate).toLocaleDateString("es-MX")}
                            {medication.endDate && ` - ${new Date(medication.endDate).toLocaleDateString("es-MX")}`}
                        </p>
                    </div>
                    <button onClick={onDelete} className="btn btn-ghost btn-xs btn-circle text-base-content/30 hover:text-error">
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
