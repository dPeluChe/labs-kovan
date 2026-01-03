
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { SkeletonPageContent } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Cat, Plus } from "lucide-react";
import { DateInput } from "../components/ui/DateInput";
import type { Id } from "../../convex/_generated/dataModel";
import { MobileModal } from "../components/ui/MobileModal";
import { Input } from "../components/ui/Input";
import { ResourceCard } from "../components/ui/ResourceCard";

export function PetsPage() {
    const { currentFamily } = useFamily();
    const [showNewProfile, setShowNewProfile] = useState(false);

    const profiles = useQuery(
        api.health.getPersonProfiles,
        currentFamily ? { familyId: currentFamily._id } : "skip"
    );

    if (!currentFamily) return null;

    // Filter only pets
    const petProfiles = profiles?.filter(p => p.type === "pet");

    return (
        <div className="pb-4">
            <PageHeader
                title="Mascotas"
                subtitle="Expediente médico"
                action={
                    <button
                        onClick={() => setShowNewProfile(true)}
                        className="btn btn-primary btn-sm gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva
                    </button>
                }
            />

            <div className="px-4">
                {profiles === undefined ? (
                    <SkeletonPageContent cards={2} />
                ) : petProfiles && petProfiles.length === 0 ? (
                    <EmptyState
                        icon={Cat}
                        title="Sin mascotas"
                        description="Agrega a tus mascotas para controlar su salud"
                        action={
                            <button
                                onClick={() => setShowNewProfile(true)}
                                className="btn btn-primary btn-sm"
                            >
                                Agregar mascota
                            </button>
                        }
                    />
                ) : (
                    <div className="space-y-3 stagger-children">
                        {petProfiles?.map((profile) => (
                            <ResourceCard
                                key={profile._id}
                                to={`/pets/${profile._id}`}
                                title={profile.name}
                                subtitle={profile.relation}
                                icon={
                                    <div className="p-2 rounded-lg bg-orange-500/10">
                                        <Cat className="w-5 h-5 text-orange-600" />
                                    </div>
                                }
                            />
                        ))}
                    </div>
                )}
            </div>

            {showNewProfile && currentFamily && (
                <NewPetModal
                    familyId={currentFamily._id}
                    onClose={() => setShowNewProfile(false)}
                />
            )}
        </div>
    );
}

function NewPetModal({
    familyId,
    onClose,
}: {
    familyId: Id<"families">;
    onClose: () => void;
}) {
    const [name, setName] = useState("");
    const [relation, setRelation] = useState("");
    const [nickname, setNickname] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const createProfile = useMutation(api.health.createPersonProfile);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !relation.trim()) return;

        setIsLoading(true);
        try {
            await createProfile({
                familyId,
                type: "pet",
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
            title="Nueva Mascota"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nombre *"
                    placeholder="Ej: Max, Luna"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                />

                <Input
                    label="Especie / Raza *"
                    placeholder="Ej: Perro, Gato, Golden Retriever"
                    value={relation}
                    onChange={(e) => setRelation(e.target.value)}
                    disabled={isLoading}
                />

                <Input
                    label="Apodo (opcional)"
                    placeholder="Ej: Peluchin, Firulais"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    disabled={isLoading}
                />

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
