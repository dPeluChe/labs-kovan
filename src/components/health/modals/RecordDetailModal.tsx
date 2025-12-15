
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Stethoscope, Trash2 } from "lucide-react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import type { ConfirmOptions } from "../../../hooks/useConfirmModal";
import { MobileModal } from "../../ui/MobileModal";

export function RecordDetailModal({
    record,
    onClose,
    confirm,
}: {
    record: Doc<"medicalRecords">;
    onClose: () => void;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}) {
    const deleteRecord = useMutation(api.health.deleteMedicalRecord);

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: "Eliminar registro",
            message: "¿Estás seguro de que quieres eliminar este registro médico?",
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            variant: "danger",
            icon: "trash",
        });
        if (confirmed) {
            await deleteRecord({ recordId: record._id });
            onClose();
        }
    };

    return (
        <MobileModal
            isOpen={true}
            onClose={onClose}
            title={record.title}
        >
            {/* Metadata Header */}
            <div className="flex items-center gap-2 mb-4">
                <span className="badge badge-sm badge-ghost">
                    {record.type === "consultation" ? "Consulta" : "Nota"}
                </span>
                <span className="text-sm text-base-content/60">
                    {new Date(record.date).toLocaleDateString("es-MX", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                </span>
            </div>

            {/* Doctor/Clinic Info */}
            {(record.doctorName || record.clinicName) && (
                <div className="flex items-center gap-2 p-3 bg-base-200 rounded-lg mb-4">
                    <Stethoscope className="w-5 h-5 text-primary" />
                    <div>
                        {record.doctorName && <p className="font-medium">{record.doctorName}</p>}
                        {record.clinicName && <p className="text-sm text-base-content/60">{record.clinicName}</p>}
                    </div>
                </div>
            )}

            {/* Description */}
            {record.description && (
                <div className="mb-4">
                    <label className="label"><span className="label-text font-medium">Descripción</span></label>
                    <p className="text-base-content/80 whitespace-pre-wrap">{record.description}</p>
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
