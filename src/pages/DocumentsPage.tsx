import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { DocumentFormModal } from "../components/documents/DocumentFormModal";
import { DocumentDetailModal } from "../components/documents/DocumentDetailModal";
import { PageHeader } from "../components/ui/PageHeader";
import { FileText, Plus, User, AlertTriangle, Calendar } from "lucide-react";
import { useFamily } from "../contexts/FamilyContext";
import type { Doc } from "../../convex/_generated/dataModel";
import { ResourceCard } from "../components/ui/ResourceCard";
import { HorizontalSelector } from "../components/ui/HorizontalSelector";

export function DocumentsPage() {
    const { currentFamily } = useFamily();
    const [showFormModal, setShowFormModal] = useState(false);
    const [docToEdit, setDocToEdit] = useState<Doc<"documents"> | null>(null);
    const [selectedPersonId, setSelectedPersonId] = useState<string>("all");
    const [selectedDoc, setSelectedDoc] = useState<Doc<"documents"> | null>(null);

    // Queries
    // We fetch all documents for family. We could filter by person on backend, but for UX 'All' view is nice.
    const allDocs = useQuery(api.documents.list, currentFamily ? { familyId: currentFamily._id } : "skip");
    const profiles = useQuery(api.health.getPersonProfiles, currentFamily ? { familyId: currentFamily._id } : "skip");

    if (allDocs === undefined || profiles === undefined) return <PageLoader />;

    // Filter logic
    const docs = allDocs.filter((d) => {
        if (selectedPersonId === "all") return true;
        if (selectedPersonId === "general") return !d.personId;
        return d.personId === selectedPersonId;
    });

    const getPersonName = (id?: string) => {
        if (!id) return "General";
        return profiles.find(p => p._id === id)?.name || "Desconocido";
    };

    const getExpiryStatus = (timestamp?: number) => {
        if (!timestamp) return null;
        const now = new Date().getTime();
        const days = (timestamp - now) / (1000 * 60 * 60 * 24);
        if (days < 0) return { label: "Vencido", color: "text-red-500", bg: "bg-red-500/10" };
        if (days < 30) return { label: "Vence pronto", color: "text-amber-500", bg: "bg-amber-500/10" };
        if (days < 90) return { label: "Vence en 3 meses", color: "text-blue-500", bg: "bg-blue-500/10" };
        return { label: new Date(timestamp).toLocaleDateString(), color: "text-base-content/60", bg: "bg-base-200" };
    };

    const handleCreate = () => {
        setDocToEdit(null);
        setShowFormModal(true);
    };

    const handleEdit = (doc: Doc<"documents">) => {
        setDocToEdit(doc);
        setShowFormModal(true);
    };

    const filterOptions = [
        { id: "all", label: "Todos" },
        { id: "general", label: "General/Familia" },
        ...profiles.map(p => ({ id: p._id, label: p.name }))
    ];

    return (
        <div className="pb-20">
            <PageHeader
                title="Bóveda"
                subtitle={currentFamily?.name}
                action={
                    <button
                        onClick={handleCreate}
                        className="btn btn-primary btn-sm btn-circle"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                }
            />

            {/* Filter Tabs (Horizontal Scroll) */}
            <HorizontalSelector
                options={filterOptions}
                value={selectedPersonId}
                onChange={setSelectedPersonId}
                className="px-4 pb-4"
            />

            <div className="px-4 space-y-3">
                {docs.length > 0 ? (
                    <div className="stagger-children space-y-3">
                        {docs.map((doc) => {
                            const status = getExpiryStatus(doc.expiryDate);
                            return (
                                <ResourceCard
                                    key={doc._id}
                                    onClick={() => setSelectedDoc(doc)}
                                    title={doc.title}
                                    icon={
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                    }
                                    subtitle={
                                        <div className="flex flex-col gap-1.5 mt-0.5">
                                            <div className="flex items-center gap-1.5 text-xs text-base-content/60">
                                                <User className="w-3 h-3" />
                                                <span>{getPersonName(doc.personId)}</span>
                                                {doc.documentNumber && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{doc.documentNumber}</span>
                                                    </>
                                                )}
                                            </div>
                                            {status && (
                                                <div className={`self-start px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 w-fit ${status.bg} ${status.color}`}>
                                                    {status.label === "Vencido" || status.label === "Vence pronto" ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                                                    {status.label}
                                                </div>
                                            )}
                                        </div>
                                    }
                                />
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState
                        icon={FileText}
                        title="Sin documentos"
                        description={selectedPersonId === "all" ? "No hay documentos registrados." : "Esta persona no tiene documentos asignados."}
                        action={
                            <button onClick={handleCreate} className="btn btn-primary btn-sm">
                                Agregar Documento
                            </button>
                        }
                    />
                )}
            </div>

            <DocumentFormModal
                isOpen={showFormModal}
                onClose={() => {
                    setShowFormModal(false);
                    setDocToEdit(null);
                }}
                document={docToEdit}
            />

            <DocumentDetailModal
                document={selectedDoc}
                onClose={() => setSelectedDoc(null)}
                onEdit={() => selectedDoc && handleEdit(selectedDoc)}
                personName={getPersonName(selectedDoc?.personId)}
            />
        </div>
    );
}
