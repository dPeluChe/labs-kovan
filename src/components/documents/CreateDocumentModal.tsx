import { useState } from "react";
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
import type { Id } from "../../../convex/_generated/dataModel";

interface CreateDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
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

export function CreateDocumentModal({ isOpen, onClose }: CreateDocumentModalProps) {
    const { currentFamily } = useFamily();
    const { user } = useAuth();
    const create = useMutation(api.documents.create);
    const profiles = useQuery(api.health.getPersonProfiles, currentFamily ? { familyId: currentFamily._id } : "skip");

    const [title, setTitle] = useState("");
    const [type, setType] = useState<string>("other");
    const [personId, setPersonId] = useState<string>("");
    const [documentNumber, setDocumentNumber] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [issueDate, setIssueDate] = useState("");
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        const doc = COMMON_DOCS.find(d => d.id === val);
        if (doc) {
            setType(doc.type);
            if (doc.id !== "other") {
                setTitle(doc.label);
            } else {
                setTitle("");
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
            await create({
                familyId: currentFamily._id,
                userId: user._id,
                title: title.trim(),
                type: type as "identity" | "travel" | "financial" | "insurance" | "education" | "health" | "other",
                personId: personId ? (personId as Id<"personProfiles">) : undefined,
                documentNumber: documentNumber.trim() || undefined,
                expiryDate: expiryDate ? new Date(expiryDate).getTime() : undefined,
                issueDate: issueDate ? new Date(issueDate).getTime() : undefined,
                notes: notes.trim() || undefined,
            });
            onClose();
            // Reset
            setTitle("");
            setPersonId("");
            setDocumentNumber("");
            setExpiryDate("");
            setIssueDate("");
            setNotes("");
        } catch (error) {
            console.error("Failed to create document:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MobileModal isOpen={isOpen} onClose={onClose} title="Nuevo Documento">
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Document Type Dropdown */}
                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text">Tipo de documento</span>
                    </label>
                    <select
                        className="select select-bordered w-full rounded-xl"
                        onChange={handleTypeChange}
                        defaultValue="other"
                    >
                        <option value="other" disabled selected>Selecciona un tipo</option>
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
                        {isLoading ? <span className="loading loading-spinner" /> : "Guardar Documento"}
                    </button>
                </div>
            </form>
        </MobileModal>
    );
}
