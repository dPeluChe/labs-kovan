import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { SkeletonPageContent } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Heart, Plus, User } from "lucide-react";
import { NewProfileModal } from "../components/health/modals/NewProfileModal";
import { ResourceCard } from "../components/ui/ResourceCard";

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
              <ResourceCard
                key={profile._id}
                to={`/health/${profile._id}`}
                title={profile.name}
                subtitle={profile.relation}
                icon={
                  <div className="p-2 rounded-lg bg-pink-500/10">
                    <User className="w-5 h-5 text-pink-600" />
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>

      {showNewProfile && currentFamily && (
        <NewProfileModal
          familyId={currentFamily._id}
          onClose={() => setShowNewProfile(false)}
          initialType="human"
        />
      )}
    </div>
  );
}
