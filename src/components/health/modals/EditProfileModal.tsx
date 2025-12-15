
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Input } from "../../ui/Input";
import { DateInput } from "../../ui/DateInput";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { MobileModal } from "../../ui/MobileModal";

export function EditProfileModal({
    profile,
    onClose,
}: {
    profile: Doc<"personProfiles">;
    onClose: () => void;
}) {
    const [name, setName] = useState(profile.name);
    const [relation, setRelation] = useState(profile.relation);
    const [nickname, setNickname] = useState(profile.nickname || "");
    const [birthDate, setBirthDate] = useState(
        profile.birthDate ? new Date(profile.birthDate).toISOString().split("T")[0] : ""
    );
    const [isLoading, setIsLoading] = useState(false);

    const updateProfile = useMutation(api.health.updatePersonProfile);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !relation.trim()) return;

        setIsLoading(true);
        try {
            await updateProfile({
                personId: profile._id,
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
            title="Editar Perfil"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nombre *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Max, Luna"
                    disabled={isLoading}
                    autoFocus
                />

                <Input
                    label={profile.type === "pet" ? "Especie / Raza *" : "Relación *"}
                    value={relation}
                    onChange={(e) => setRelation(e.target.value)}
                    placeholder={profile.type === "pet" ? "Ej: Perro, Gato" : "Ej: Mamá, Hijo"}
                    disabled={isLoading}
                />

                <Input
                    label="Apodo"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Ej: Peluchin"
                    disabled={isLoading}
                />

                <DateInput
                    label="Fecha de nacimiento"
                    value={birthDate}
                    onChange={setBirthDate}
                    disabled={isLoading}
                />

                <div className="modal-action">
                    <button type="button" className="btn" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading || !name.trim() || !relation.trim()}
                    >
                        {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
                    </button>
                </div>
            </form>
        </MobileModal>
    );
}
