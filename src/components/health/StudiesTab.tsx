
import { Plus, TestTube, Download } from "lucide-react";
import { EmptyState } from "../ui/EmptyState";
import { PageLoader } from "../ui/LoadingSpinner";
import type { Doc } from "../../../convex/_generated/dataModel";

export function StudiesTab({
    studies,
    onAdd,
    onSelect,
}: {
    studies: Doc<"medicalStudies">[] | undefined;
    onAdd: () => void;
    onSelect: (study: Doc<"medicalStudies">) => void;
}) {
    if (studies === undefined) return <PageLoader />;

    return (
        <>
            <button onClick={onAdd} className="btn btn-outline btn-sm w-full gap-2 mb-4">
                <Plus className="w-4 h-4" />
                Agregar estudio
            </button>

            {studies.length === 0 ? (
                <EmptyState
                    icon={TestTube}
                    title="Sin estudios"
                    description="Registra análisis de laboratorio y resultados"
                />
            ) : (
                <div className="space-y-3 animate-fade-in">
                    {studies
                        .sort((a, b) => b.date - a.date)
                        .map((study) => (
                            <div
                                key={study._id}
                                onClick={() => onSelect(study)}
                                className="card bg-base-100 shadow-sm border border-base-300 cursor-pointer hover:shadow-md transition-shadow"
                            >
                                <div className="card-body p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-base-content/60 mb-1">
                                                {new Date(study.date).toLocaleDateString("es-MX")}
                                            </div>
                                            <h4 className="font-semibold">{study.title}</h4>
                                            {study.laboratory && (
                                                <p className="text-xs text-base-content/50">{study.laboratory}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {study.fileStorageId && (
                                                <Download className="w-4 h-4 text-primary" />
                                            )}
                                            <TestTube className="w-4 h-4 text-base-content/30" />
                                        </div>
                                    </div>

                                    {/* Results Preview - show first 3 */}
                                    {study.results.length > 0 && (
                                        <div className="bg-base-200/50 rounded-lg p-2 space-y-1 mt-2">
                                            {study.results.slice(0, 3).map((result, idx) => (
                                                <div key={idx} className="flex justify-between text-sm border-b border-base-200 last:border-0 pb-1 last:pb-0">
                                                    <span className="text-base-content/70">{result.parameter}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{result.value} {result.unit}</span>
                                                        {result.status === "high" && <span className="text-error text-xs">↑</span>}
                                                        {result.status === "low" && <span className="text-warning text-xs">↓</span>}
                                                    </div>
                                                </div>
                                            ))}
                                            {study.results.length > 3 && (
                                                <p className="text-xs text-base-content/50 text-center pt-1">
                                                    +{study.results.length - 3} más...
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </>
    );
}
