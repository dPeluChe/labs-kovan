
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Download, Trash2 } from "lucide-react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import type { ConfirmOptions } from "../../../hooks/useConfirmModal";
import { MobileModal } from "../../ui/MobileModal";

export function StudyDetailModal({
    study,
    onClose,
    confirm,
}: {
    study: Doc<"medicalStudies">;
    onClose: () => void;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}) {
    const deleteStudy = useMutation(api.health.deleteStudy);

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: "Eliminar estudio",
            message: "¿Estás seguro de que quieres eliminar este estudio médico?",
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            variant: "danger",
            icon: "trash",
        });
        if (confirmed) {
            await deleteStudy({ studyId: study._id });
            onClose();
        }
    };

    return (
        <MobileModal
            isOpen={true}
            onClose={onClose}
            title={study.title}
        >
            {/* Header info */}
            <div className="mb-4">
                <div className="text-sm text-base-content/60 mb-1">
                    {new Date(study.date).toLocaleDateString("es-MX", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                </div>
                {study.laboratory && (
                    <p className="text-sm text-base-content/60">{study.laboratory}</p>
                )}
            </div>

            {/* File Attachment */}
            {study.fileStorageId && (
                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg mb-4">
                    <Download className="w-5 h-5 text-primary" />
                    <span className="text-sm">Archivo adjunto disponible</span>
                    <button className="btn btn-primary btn-xs ml-auto">Ver archivo</button>
                </div>
            )}

            {/* Results Table */}
            {study.results.length > 0 && (
                <div className="mb-4">
                    <label className="label"><span className="label-text font-medium">Resultados</span></label>
                    <div className="overflow-x-auto">
                        <table className="table table-sm">
                            <thead>
                                <tr>
                                    <th>Parámetro</th>
                                    <th className="text-right">Valor</th>
                                    <th className="text-right">Unidad</th>
                                    <th className="text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {study.results.map((result, idx: number) => (
                                    <tr key={idx}>
                                        <td>{result.parameter}</td>
                                        <td className="text-right font-medium">{result.value}</td>
                                        <td className="text-right text-base-content/60">{result.unit || "-"}</td>
                                        <td className="text-center">
                                            {result.status === "high" && (
                                                <span className="badge badge-error badge-xs">Alto ↑</span>
                                            )}
                                            {result.status === "low" && (
                                                <span className="badge badge-warning badge-xs">Bajo ↓</span>
                                            )}
                                            {result.status === "normal" && (
                                                <span className="badge badge-success badge-xs">Normal</span>
                                            )}
                                            {!result.status && "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Notes */}
            {study.notes && (
                <div className="mb-4">
                    <label className="label"><span className="label-text font-medium">Notas</span></label>
                    <p className="text-base-content/80 whitespace-pre-wrap">{study.notes}</p>
                </div>
            )}

            {/* Actions */}
            <div className="modal-action">
                <button className="btn btn-error btn-outline" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                </button>
                <button className="btn btn-ghost" onClick={onClose}>
                    Cerrar
                </button>
            </div>
        </MobileModal>
    );
}
