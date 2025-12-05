import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { SkeletonPageContent } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Heart, Plus, User, Cat, ChevronRight } from "lucide-react";
import { DateInput } from "../components/ui/DateInput";
import { Link } from "react-router-dom";
import type { Id } from "../../convex/_generated/dataModel";

export function HealthPage() {
  const { currentFamily } = useFamily();
  const [showNewProfile, setShowNewProfile] = useState(false);

  const profiles = useQuery(
    api.health.getPersonProfiles,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  if (!currentFamily) return null;

  return (
    <div className="pb-4">
      <PageHeader
        title="Salud"
        subtitle="Perfiles de salud de la familia"
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
        ) : profiles.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Sin perfiles de salud"
            description="Agrega personas y mascotas para registrar su historial médico"
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
          <div className="space-y-3">
            {profiles.map((profile) => (
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
  const Icon = profile.type === "pet" ? Cat : User;

  return (
    <Link
      to={`/health/${profile._id}`}
      className="card bg-base-100 shadow-sm border border-base-300"
    >
      <div className="card-body p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${profile.type === "pet" ? "bg-orange-500/10" : "bg-pink-500/10"}`}>
            <Icon className={`w-5 h-5 ${profile.type === "pet" ? "text-orange-600" : "text-pink-600"}`} />
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
  const [type, setType] = useState<"human" | "pet">("human");
  const [relation, setRelation] = useState("");
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
        type,
        name: name.trim(),
        relation: relation.trim(),
        birthDate: birthDate ? new Date(birthDate).getTime() : undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Nuevo perfil de salud</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Tipo</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("human")}
                className={`btn btn-sm flex-1 ${type === "human" ? "btn-primary" : "btn-ghost"}`}
              >
                <User className="w-4 h-4" /> Persona
              </button>
              <button
                type="button"
                onClick={() => setType("pet")}
                className={`btn btn-sm flex-1 ${type === "pet" ? "btn-primary" : "btn-ghost"}`}
              >
                <Cat className="w-4 h-4" /> Mascota
              </button>
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Nombre *</span>
            </label>
            <input
              type="text"
              placeholder={type === "pet" ? "Ej: Max, Luna" : "Ej: Juan, María"}
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Relación *</span>
            </label>
            <input
              type="text"
              placeholder={type === "pet" ? "Ej: Perro, Gato" : "Ej: Yo, Pareja, Mamá"}
              className="input input-bordered w-full"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
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
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
