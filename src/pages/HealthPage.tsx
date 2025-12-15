
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { SkeletonPageContent } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Heart, Plus, User, ChevronRight } from "lucide-react";
import { DateInput } from "../components/ui/DateInput";
import { Link } from "react-router-dom";
import type { Id } from "../../convex/_generated/dataModel";
import { MobileModal } from "../components/ui/MobileModal";

export function HealthPage() {
  const { currentFamily } = useFamily();
  const [showNewProfile, setShowNewProfile] = useState(false);

  const profiles = useQuery(
    api.health.getPersonProfiles,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  if (!currentFamily) return null;

  // Filter only humans
  const humanProfiles = profiles?.filter(p => p.type === "human");

  return (
    <div className="pb-4">
      <PageHeader
        title="Salud"
        subtitle="Expedientes familiares"
        action={
          <button
            onClick={() => setShowNewProfile(true)}
            className="btn btn-primary btn-sm gap-1"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        }
      />

      <div className="px-4">
        {profiles === undefined ? (
          <SkeletonPageContent cards={3} />
        ) : humanProfiles && humanProfiles.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Sin perfiles de salud"
            description="Agrega a los miembros de la familia para registrar su historial médico"
            action={
              <button
                onClick={() => setShowNewProfile(true)}
                className="btn btn-primary btn-sm"
              >
                Crear perfil
              </button>
            }
          />
        ) : (
          <div className="space-y-3 stagger-children">
            {humanProfiles?.map((profile) => (
              <ProfileCard key={profile._id} profile={profile} />
            ))}
          </div>
        )}
      </div>

      {showNewProfile && currentFamily && (
        <NewProfileModal
          familyId={currentFamily._id}
          onClose={() => setShowNewProfile(false)}
        />
      )}
    </div>
  );
}

function ProfileCard({
  profile,
}: {
  profile: {
    _id: Id<"personProfiles">;
    type: "human" | "pet";
    name: string;
    relation: string;
    birthDate?: number;
  };
}) {
  return (
    <Link
      to={`/health/${profile._id}`}
      className="card bg-base-100 shadow-sm border border-base-300 card-interactive animate-fade-in"
    >
      <div className="card-body p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-pink-500/10">
            <User className="w-5 h-5 text-pink-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">{profile.name}</h3>
            <p className="text-sm text-base-content/60">{profile.relation}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-base-content/40" />
        </div>
      </div>
    </Link>
  );
}

function NewProfileModal({
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
        type: "human", // Hardcoded to human
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
      title="Nuevo perfil de salud"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
