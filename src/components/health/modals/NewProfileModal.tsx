import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { MobileModal } from "../../ui/MobileModal";
import { DateInput } from "../../ui/DateInput";
import type { Id } from "../../../../convex/_generated/dataModel";

interface NewProfileModalProps {
    familyId: Id<"families">;
    onClose: () => void;
    initialType?: "human" | "pet";
}

export function NewProfileModal({
    familyId,
    onClose,
    initialType = "human"
}: NewProfileModalProps) {
    const [name, setName] = useState("");
    const [relation, setRelation] = useState("");
    const [nickname, setNickname] = useState("");
    const [birthDate, setBirthDate] = useState("");
    // Removed unused setType since type doesn't change here
    const [type] = useState<"human" | "pet">(initialType);
    const [isLoading, setIsLoading] = useState(false);

    const createProfile = useMutation(api.health.createPersonProfile);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !relation.trim()) return;

        setIsLoading(true);
        try {
            await createProfile({
                familyId,
                type,
                name: name.trim(),
                relation: relation.trim(),
                nickname: nickname.trim() || undefined,
                birthDate: birthDate ? new Date(birthDate).getTime() : undefined,
            });
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MobileModal
            isOpen={true}
            onClose={onClose}
            title={type === "human" ? "Nuevo perfil de salud" : "Nueva mascota"}
        >
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Type Selector (Optional, maybe hidden if we want to force human, but good to have) */}
                {/* For now, sticking to the passed type or simple toggle if needed, but let's keep it simple */}

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Nombre *</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Ej: Juan, María"
                        className="input input-bordered w-full"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                        autoFocus
                    />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Relación *</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Ej: Yo, Pareja, Mamá"
                        className="input input-bordered w-full"
                        value={relation}
                        onChange={(e) => setRelation(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Apodo (opcional)</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Ej: Peluche, Chuy"
                        className="input input-bordered w-full"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                <DateInput
                    label="Fecha de nacimiento (opcional)"
                    value={birthDate}
                    onChange={setBirthDate}
                    disabled={isLoading}
                />

                <div className="modal-action">
                    <button type="button" className="btn" onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading || !name.trim() || !relation.trim()}
                    >
                        {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Crear"}
                    </button>
                </div>
            </form>
        </MobileModal>
    );
}
