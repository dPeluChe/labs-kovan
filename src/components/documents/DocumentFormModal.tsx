import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MobileModal } from "../ui/MobileModal";
import { Input } from "../ui/Input";
import { useFamily } from "../../contexts/FamilyContext";
import { useAuth } from "../../contexts/AuthContext";
import {
    Hash, Globe,
    CreditCard, Car, Shield, Plane, Plus
} from "lucide-react";
import type { Id, Doc } from "../../../convex/_generated/dataModel";

interface DocumentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    document?: Doc<"documents"> | null;
}

const COMMON_DOCS = [
    { id: "passport", label: "Pasaporte", type: "travel", icon: Globe },
    { id: "visa", label: "Visa", type: "travel", icon: Plane },
    { id: "ine", label: "INE / ID", type: "identity", icon: CreditCard },
    { id: "license", label: "Licencia", type: "identity", icon: Car },
    { id: "curp", label: "CURP", type: "identity", icon: Hash },
    { id: "insurance", label: "Seguro", type: "insurance", icon: Shield },
    { id: "other", label: "Otro", type: "other", icon: Plus },
] as const;

export function DocumentFormModal({ isOpen, onClose, document }: DocumentFormModalProps) {
    const { currentFamily } = useFamily();
    const { user } = useAuth();
    const create = useMutation(api.documents.create);
    const update = useMutation(api.documents.update);
    const profiles = useQuery(api.health.getPersonProfiles, currentFamily ? { familyId: currentFamily._id } : "skip");

    const [title, setTitle] = useState("");
    const [type, setType] = useState<string>("other");
    const [personId, setPersonId] = useState<string>("");
    const [documentNumber, setDocumentNumber] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [issueDate, setIssueDate] = useState("");
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (document) {
                // Edit mode
                setTitle(document.title);
                setType(document.type);
                setPersonId(document.personId || "");
                setDocumentNumber(document.documentNumber || "");
                setExpiryDate(document.expiryDate ? new Date(document.expiryDate).toISOString().split('T')[0] : "");
                setIssueDate(document.issueDate ? new Date(document.issueDate).toISOString().split('T')[0] : "");
                setNotes(document.notes || "");
            } else {
                // Create mode: Cleanup
                setTitle("");
                setType("other");
                setPersonId("");
                setDocumentNumber("");
                setExpiryDate("");
                setIssueDate("");
                setNotes("");
            }
        }
    }, [isOpen, document]);


    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        const doc = COMMON_DOCS.find(d => d.id === val);
        if (doc) {
            setType(doc.type);
            if (doc.id !== "other" && !document) {
                // Only auto-set title if creating new
                setTitle(doc.label);
            }
        }
    };

    const humans = profiles?.filter(p => p.type === "human") || [];
    const pets = profiles?.filter(p => p.type === "pet") || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !currentFamily || !user) return;

        setIsLoading(true);
        try {
            const commonFields = {
                familyId: currentFamily._id,
                title: title.trim(),
                type: type as "identity" | "travel" | "financial" | "insurance" | "education" | "health" | "other",
                personId: personId ? (personId as Id<"personProfiles">) : undefined,
                documentNumber: documentNumber.trim(),
                expiryDate: expiryDate ? new Date(expiryDate).getTime() : undefined,
                issueDate: issueDate ? new Date(issueDate).getTime() : undefined,
                notes: notes.trim(),
            };

            if (document) {
                await update({
                    documentId: document._id,
                    ...commonFields,
                });
            } else {
                await create({
                    userId: user._id,
                    ...commonFields,
                });
            }
            onClose();
        } catch (error) {
            console.error("Failed to save document:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MobileModal isOpen={isOpen} onClose={onClose} title={document ? "Editar Documento" : "Nuevo Documento"}>
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Document Type Dropdown */}
                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text">Tipo de documento</span>
                    </label>
                    <select
                        className="select select-bordered w-full rounded-xl"
                        onChange={handleTypeChange}
                        value={COMMON_DOCS.find(d => d.type === type && (d.id !== 'other' ? d.label === title : true))?.id || user && document ? "custom" : "other"}
                    >
                        {/* Logic for select value is tricky if title changed. Just map by type or keep simple */}
                        {/* Better: just show types. But user wants shortcuts. */}
                        {/* Let's keep it simple: if editing, maybe don't force select mapping, just show type via a different simple select or just rely on manual edits */}
                        {/* For now, just let them pick shortcuts or ignore if custom */}
                        <option value="custom" disabled>Personalizado ({type})</option>
                        {COMMON_DOCS.map(doc => (
                            <option key={doc.id} value={doc.id}>{doc.label}</option>
                        ))}
                    </select>
                </div>

                {/* Dynamic Title Input - Only show if Other or user edits */}
                <Input
                    label="Nombre"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Pasaporte Americano..."
                />

                {/* Person Selector with Groups */}
                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text">¿De quién es?</span>
                    </label>
                    <select
                        className="select select-bordered w-full rounded-xl"
                        value={personId}
                        onChange={(e) => setPersonId(e.target.value)}
                    >
                        <option value="">Toda la familia / General</option>

                        {humans.length > 0 && (
                            <optgroup label="Integrantes">
                                {humans.map((p) => (
                                    <option key={p._id} value={p._id}>
                                        {p.name}
                                    </option>
                                ))}
                            </optgroup>
                        )}

                        {pets.length > 0 && (
                            <optgroup label="Mascotas">
                                {pets.map((p) => (
                                    <option key={p._id} value={p._id}>
                                        {p.name}
                                    </option>
                                ))}
                            </optgroup>
                        )}
                    </select>
                </div>

                {/* Dates & Numbers */}
                <div className="space-y-3">
                    <div className="form-control w-full">
                        <label className="label text-xs font-medium text-base-content/60">Número / Folio</label>
                        <input
                            type="text"
                            className="input input-bordered w-full rounded-xl"
                            value={documentNumber}
                            onChange={(e) => setDocumentNumber(e.target.value)}
                            placeholder="#"
                        />
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="label text-xs font-medium text-base-content/60">Expedición (Opcional)</label>
                            <input
                                type="date"
                                className="input input-bordered w-full rounded-xl"
                                value={issueDate}
                                onChange={(e) => setIssueDate(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="label text-xs font-medium text-base-content/60">Vencimiento (Opcional)</label>
                            <input
                                type="date"
                                className="input input-bordered w-full rounded-xl"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-control w-full">
                        <label className="label text-xs font-medium text-base-content/60">Notas</label>
                        <textarea
                            className="textarea textarea-bordered w-full rounded-xl"
                            placeholder="Detalles adicionales, ubicación física, contraseñas..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        className="btn btn-primary w-full rounded-xl"
                        disabled={isLoading || !title.trim()}
                    >
                        {isLoading ? <span className="loading loading-spinner" /> : (document ? "Guardar Cambios" : "Guardar Documento")}
                    </button>
                </div>
            </form>
        </MobileModal>
    );
}
