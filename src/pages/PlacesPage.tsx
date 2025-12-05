import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageHeader } from "../components/ui/PageHeader";
import { SkeletonPageContent } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { MapPin, Plus, Trash2, Check, ExternalLink, Star } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

type PlaceCategory = "restaurant" | "cafe" | "travel" | "activity" | "other";

const CATEGORY_CONFIG: Record<PlaceCategory, { label: string; icon: string }> = {
  restaurant: { label: "Restaurante", icon: "🍽️" },
  cafe: { label: "Café", icon: "☕" },
  travel: { label: "Viaje", icon: "✈️" },
  activity: { label: "Actividad", icon: "🎯" },
  other: { label: "Otro", icon: "📍" },
};

export function PlacesPage() {
  const { currentFamily } = useFamily();
  const { user } = useAuth();
  const [showNewPlace, setShowNewPlace] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "visited">("all");

  const places = useQuery(
    api.places.getPlaces,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const toggleVisited = useMutation(api.places.toggleVisited);
  const deletePlace = useMutation(api.places.deletePlace);

  if (!currentFamily || !user) return null;

  const filteredPlaces = places?.filter((p) => {
    if (filter === "pending") return !p.visited;
    if (filter === "visited") return p.visited;
    return true;
  });

  const pendingCount = places?.filter((p) => !p.visited).length || 0;
  const visitedCount = places?.filter((p) => p.visited).length || 0;

  return (
    <div className="pb-4">
      <PageHeader
        title="Lugares"
        subtitle="Lugares por conocer y visitados"
        action={
          <button
            onClick={() => setShowNewPlace(true)}
            className="btn btn-primary btn-sm gap-1"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        }
      />

      {/* Filter tabs */}
      <div className="px-4 mb-4">
        <div className="tabs tabs-boxed bg-base-200 p-1">
          <button
            className={`tab flex-1 ${filter === "all" ? "tab-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Todos ({places?.length || 0})
          </button>
          <button
            className={`tab flex-1 ${filter === "pending" ? "tab-active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            className={`tab flex-1 ${filter === "visited" ? "tab-active" : ""}`}
            onClick={() => setFilter("visited")}
          >
            Visitados ({visitedCount})
          </button>
        </div>
      </div>

      <div className="px-4">
        {places === undefined ? (
          <SkeletonPageContent cards={3} />
        ) : places.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="Sin lugares"
            description="Guarda lugares que quieres conocer"
            action={
              <button
                onClick={() => setShowNewPlace(true)}
                className="btn btn-primary btn-sm"
              >
                Agregar lugar
              </button>
            }
          />
        ) : filteredPlaces?.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="Sin lugares"
            description={filter === "pending" ? "¡Ya visitaste todos!" : "Aún no has visitado ninguno"}
          />
        ) : (
          <div className="space-y-2">
            {filteredPlaces?.map((place) => {
              const config = CATEGORY_CONFIG[place.category as PlaceCategory];
              return (
                <div
                  key={place._id}
                  className={`card bg-base-100 shadow-sm border ${
                    place.visited ? "border-success/30 opacity-75" : "border-base-300"
                  }`}
                >
                  <div className="card-body p-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{config.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">{place.name}</span>
                          {place.visited && <Check className="w-4 h-4 text-success" />}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-base-content/60 mt-1">
                          <span className="badge badge-sm badge-ghost">{config.label}</span>
                          {place.address && <span className="truncate">{place.address}</span>}
                        </div>
                        {place.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < place.rating! ? "text-amber-500 fill-amber-500" : "text-base-300"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        {place.url && (
                          <a
                            href={place.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-xs btn-circle text-primary"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => toggleVisited({ placeId: place._id })}
                          className={`btn btn-ghost btn-xs btn-circle ${
                            place.visited ? "text-success" : "text-base-content/40"
                          }`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deletePlace({ placeId: place._id })}
                          className="btn btn-ghost btn-xs btn-circle text-error"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNewPlace && currentFamily && user && (
        <NewPlaceModal
          familyId={currentFamily._id}
          userId={user._id}
          onClose={() => setShowNewPlace(false)}
        />
      )}
    </div>
  );
}

function NewPlaceModal({
  familyId,
  userId,
  onClose,
}: {
  familyId: Id<"families">;
  userId: Id<"users">;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState<PlaceCategory>("restaurant");
  const [isLoading, setIsLoading] = useState(false);

  const createPlace = useMutation(api.places.createPlace);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await createPlace({
        familyId,
        name: name.trim(),
        url: url.trim() || undefined,
        address: address.trim() || undefined,
        category,
        addedBy: userId,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Nuevo lugar</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Nombre *</span></label>
            <input
              type="text"
              placeholder="Ej: Café Paraíso"
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Categoría</span></label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(CATEGORY_CONFIG) as [PlaceCategory, typeof CATEGORY_CONFIG[PlaceCategory]][]).map(
                ([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={`btn btn-sm gap-1 ${category === key ? "btn-primary" : "btn-ghost"}`}
                  >
                    {config.icon} {config.label}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">URL (Google Maps, sitio web)</span></label>
            <input
              type="url"
              placeholder="https://..."
              className="input input-bordered w-full"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Dirección</span></label>
            <input
              type="text"
              placeholder="Calle, colonia, ciudad..."
              className="input input-bordered w-full"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || !name.trim()}>
              {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
