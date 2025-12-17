import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MobileModal } from "../ui/MobileModal";
import { Input } from "../ui/Input";
import { useFamily } from "../../contexts/FamilyContext";
import { useAuth } from "../../contexts/AuthContext";
import {
    Zap, Wifi, Tv, Shield, CreditCard, Smartphone, HelpCircle,
    Hash, Info
} from "lucide-react";

interface CreateSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SERVICE_TYPES = [
    { id: "utility", label: "Servicios (Luz/Agua)", icon: Zap },
    { id: "internet", label: "Internet / Teléfono", icon: Wifi },
    { id: "streaming", label: "Streaming", icon: Tv },
    { id: "insurance", label: "Seguros", icon: Shield },
    { id: "membership", label: "Membresía", icon: CreditCard },
    { id: "software", label: "Software / Apps", icon: Smartphone },
    { id: "other", label: "Otro", icon: HelpCircle },
];

export function CreateSubscriptionModal({ isOpen, onClose }: CreateSubscriptionModalProps) {
    const { currentFamily } = useFamily();
    const { user } = useAuth();
    const create = useMutation(api.subscriptions.create);

    const [name, setName] = useState("");
    const [type, setType] = useState("streaming");

    // Quick Add fields
    const [referenceNumber, setReferenceNumber] = useState("");
    const [notes, setNotes] = useState("");

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !currentFamily || !user) return;

        setIsLoading(true);
        try {
            await create({
                familyId: currentFamily._id,
                userId: user._id,
                name: name.trim(),
                type: type as any,
                referenceNumber: referenceNumber.trim() || undefined,
                notes: notes.trim() || undefined,
                // Defaults for others
                billingCycle: "monthly",
            });
            onClose();
            // Reset form
            setName("");
            setReferenceNumber("");
            setNotes("");
            setType("streaming");
        } catch (error) {
            console.error("Failed to create subscription:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MobileModal isOpen={isOpen} onClose={onClose} title="Nueva Suscripción o Servicio">
            <form onSubmit={handleSubmit} className="space-y-5">

                {/* Name */}
                <Input
                    label="Nombre del servicio"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. CFE, Netflix, Internet..."
                    autoFocus
                />

                {/* Type */}
                <div className="form-control w-full">
                    <label className="label py-0 pb-1">
                        <span className="label-text">Categoría</span>
                    </label>
                    <select
                        className="select select-bordered w-full rounded-xl"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        {SERVICE_TYPES.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                    </select>
                </div>

                {/* Contract / Reference */}
                <div className="form-control w-full">
                    <label className="label py-0 pb-1 text-xs font-medium text-base-content/60">No. Contrato / Referencia (Opcional)</label>
                    <div className="relative">
                        <input
                            type="text"
                            className="input input-bordered w-full pl-8 rounded-xl"
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            placeholder="Ej. 1234567890"
                        />
                        <Hash className="absolute left-2.5 top-3.5 w-4 h-4 text-base-content/40" />
                    </div>
                </div>

                {/* Notes */}
                <div className="form-control w-full">
                    <label className="label py-0 pb-1 text-xs font-medium text-base-content/60">Notas</label>
                    <textarea
                        className="textarea textarea-bordered w-full rounded-xl"
                        placeholder="Contraseñas, detalles adicionales..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                    />
                </div>

                <div className="bg-base-200 p-3 rounded-xl flex gap-3 items-start">
                    <Info className="w-5 h-5 text-base-content/40 shrink-0 mt-0.5" />
                    <p className="text-xs text-base-content/60">
                        Podrás agregar más detalles como <strong>costo</strong>, <strong>día de pago</strong> y <strong>código de barras</strong> editando el servicio después de crearlo.
                    </p>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        className="btn btn-primary w-full rounded-xl"
                        disabled={isLoading || !name.trim()}
                    >
                        {isLoading ? <span className="loading loading-spinner" /> : "Guardar Servicio"}
                    </button>
                </div>
            </form>
        </MobileModal>
    );
}
