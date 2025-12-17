import { MobileModal } from "../ui/MobileModal";
import { FileText, User, Hash, Globe, Building, Shield } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";

interface DocumentDetailModalProps {
    document: Doc<"documents"> | null;
    onClose: () => void;
    personName?: string;
    // We could pass helper to getPersonName if needed, or pass the name directly.
}

const TYPE_ICONS: Record<string, any> = {
    identity: User,
    travel: Globe,
    financial: Building,
    insurance: Shield,
    education: FileText,
    health: Hash,
    other: FileText,
};

export function DocumentDetailModal({ document, onClose, personName }: DocumentDetailModalProps) {
    if (!document) return null;

    const Icon = TYPE_ICONS[document.type] || FileText;

    const formatDate = (ts?: number) => {
        if (!ts) return "N/A";
        return new Date(ts).toLocaleDateString("es-MX", { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <MobileModal isOpen={!!document} onClose={onClose} title="Detalle del Documento">
            <div className="space-y-6">
                {/* Header Info */}
                <div className="flex flex-col items-center gap-3 pt-2">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Icon className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-lg font-bold">{document.title}</h2>
                        <p className="text-sm text-base-content/60">{personName || "Sin asignar"}</p>
                    </div>
                </div>

                {/* Properties Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-base-100 border border-base-200 rounded-xl space-y-1">
                        <span className="text-xs text-base-content/60 block">Número / Folio</span>
                        <span className="font-mono font-medium text-sm break-all">
                            {document.documentNumber || "—"}
                        </span>
                    </div>
                    <div className="p-3 bg-base-100 border border-base-200 rounded-xl space-y-1">
                        <span className="text-xs text-base-content/60 block">Vencimiento</span>
                        <span className={`font-medium text-sm ${document.expiryDate && document.expiryDate < Date.now() ? "text-red-500" : ""}`}>
                            {formatDate(document.expiryDate)}
                        </span>
                    </div>
                    <div className="p-3 bg-base-100 border border-base-200 rounded-xl space-y-1">
                        <span className="text-xs text-base-content/60 block">Expedición</span>
                        <span className="font-medium text-sm">
                            {formatDate(document.issueDate)}
                        </span>
                    </div>
                    <div className="p-3 bg-base-100 border border-base-200 rounded-xl space-y-1">
                        <span className="text-xs text-base-content/60 block">Tipo</span>
                        <span className="font-medium text-sm capitalize">
                            {document.type}
                        </span>
                    </div>
                </div>

                {/* Notes */}
                {document.notes && (
                    <div className="bg-base-100 border border-base-200 rounded-xl p-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/40 mb-2">Notas</h3>
                        <p className="text-sm whitespace-pre-wrap">{document.notes}</p>
                    </div>
                )}

                {/* Future: Files Preview */}
                {/* <div className="border border-dashed border-base-300 rounded-xl p-8 flex flex-col items-center justify-center text-base-content/40 gap-2">
                    <FileText className="w-8 h-8 opacity-50" />
                    <span className="text-xs">Sin archivos adjuntos</span>
                </div> */}

                <div className="pt-4">
                    <button className="btn btn-outline btn-block" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </MobileModal>
    );
}
