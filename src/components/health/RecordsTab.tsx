
import { Plus, FileText, Stethoscope } from "lucide-react";
import { EmptyState } from "../ui/EmptyState";
import { PageLoader } from "../ui/LoadingSpinner";
import type { Doc } from "../../../convex/_generated/dataModel";

export function RecordsTab({
    records,
    onAdd,
    onSelect,
}: {
    records: Doc<"medicalRecords">[] | undefined;
    onAdd: () => void;
    onSelect: (record: Doc<"medicalRecords">) => void;
}) {
    if (records === undefined) return <PageLoader />;

    return (
        <>
            <button onClick={onAdd} className="btn btn-outline btn-sm w-full gap-2 mb-4">
                <Plus className="w-4 h-4" />
                Agregar consulta
            </button>

            {records.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="Sin registros"
                    description="Agrega consultas médicas y notas"
                />
            ) : (
                <div className="space-y-3 animate-fade-in">
                    {records
                        .sort((a, b) => b.date - a.date)
                        .map((record) => (
                            <div
                                key={record._id}
                                onClick={() => onSelect(record)}
                                className="card bg-base-100 shadow-sm border border-base-300 cursor-pointer hover:shadow-md transition-shadow"
                            >
                                <div className="card-body p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="badge badge-sm badge-ghost">
                                                    {record.type === "consultation" ? "Consulta" : "Nota"}
                                                </span>
                                                <span className="text-xs text-base-content/60">
                                                    {new Date(record.date).toLocaleDateString("es-MX")}
                                                </span>
                                            </div>
                                            <h4 className="font-semibold">{record.title}</h4>
                                            {record.description && (
                                                <p className="text-sm text-base-content/70 mt-1 line-clamp-2">{record.description}</p>
                                            )}
                                            {(record.doctorName || record.clinicName) && (
                                                <p className="text-xs text-base-content/50 mt-1">
                                                    {[record.doctorName, record.clinicName].filter(Boolean).join(" - ")}
                                                </p>
                                            )}
                                        </div>
                                        <Stethoscope className="w-4 h-4 text-base-content/30 flex-shrink-0" />
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </>
    );
}
