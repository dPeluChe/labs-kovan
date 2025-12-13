import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageHeader } from "../components/ui/PageHeader";
import { SkeletonPageContent } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { useConfirmModal } from "../hooks/useConfirmModal";
import { MapPin, Plus, Trash2, Check, ExternalLink, Star, ChevronRight, X, FileText, Instagram, Map } from "lucide-react";
import type { Id, Doc } from "../../convex/_generated/dataModel";

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
  const [selectedPlace, setSelectedPlace] = useState<Doc<"places"> | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "visited">("all");
  const { confirm, ConfirmModal } = useConfirmModal();

  const places = useQuery(
    api.places.getPlaces,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const toggleVisited = useMutation(api.places.toggleVisited);
  const deletePlace = useMutation(api.places.deletePlace);

  const handleDelete = async (placeId: Id<"places">, placeName: string) => {
    const confirmed = await confirm({
      title: "Eliminar lugar",
      message: `¿Estás seguro de que quieres eliminar "${placeName}"?`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "danger",
      icon: "trash",
    });
    if (confirmed) {
      await deletePlace({ placeId });
    }
  };

  if (!currentFamily || !user) return null;

  const filteredPlaces = places?.filter((p: Doc<"places">) => {
    if (filter === "pending") return !p.visited;
    if (filter === "visited") return p.visited;
    return true;
  });

  const pendingCount = places?.filter((p: Doc<"places">) => !p.visited).length || 0;
  const visitedCount = places?.filter((p: Doc<"places">) => p.visited).length || 0;

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
          <div className="space-y-2 stagger-children">
            {filteredPlaces?.map((place: Doc<"places">) => {
              const config = CATEGORY_CONFIG[place.category as PlaceCategory];
              return (
                <div
                  key={place._id}
                  onClick={() => setSelectedPlace(place)}
                  className={`card bg-base-100 shadow-sm border cursor-pointer hover:shadow-md transition-shadow animate-fade-in ${place.visited ? "border-success/30" : "border-base-300"
                    }`}
                >
                  <div className="card-body p-3">
                    <div className="flex items-start gap-3">
                      {/* Status Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisited({ placeId: place._id });
                        }}
                        className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${place.visited
                          ? "bg-success border-success text-white"
                          : "border-base-300 hover:border-success"
                          }`}
                      >
                        {place.visited ? <Check className="w-4 h-4" /> : <span className="text-lg">{config.icon}</span>}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold truncate ${place.visited ? "line-through text-base-content/50" : ""}`}>
                            {place.name}
                          </span>
                          {place.visited && <span className="badge badge-success badge-xs">Visitado</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-base-content/60 mt-1">
                          <span className="badge badge-sm badge-ghost">{config.label}</span>
                          {place.address && <span className="truncate">{place.address}</span>}
                        </div>
                        {/* Show highlight - what they sell/why you liked it */}
                        {place.highlight && (
                          <div className="mt-1 text-xs text-primary font-medium">
                            🌟 {place.highlight}
                          </div>
                        )}
                        {place.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < place.rating! ? "text-amber-500 fill-amber-500" : "text-base-300"
                                  }`}
                              />
                            ))}
                          </div>
                        )}
                        {/* Show notes preview */}
                        {place.notes && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-base-content/60">
                            <FileText className="w-3 h-3" />
                            <span className="truncate">{place.notes}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {place.url && (
                          <a
                            href={place.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="btn btn-ghost btn-xs btn-circle text-primary"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <ChevronRight className="w-4 h-4 text-base-content/30" />
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

      {selectedPlace && (
        <PlaceDetailModal
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onDelete={() => handleDelete(selectedPlace._id, selectedPlace.name)}
        />
      )}

      <ConfirmModal />
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
  const [mapsUrl, setMapsUrl] = useState("");
  const [address, setAddress] = useState("");
  const [highlight, setHighlight] = useState("");
  const [notes, setNotes] = useState("");
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
        mapsUrl: mapsUrl.trim() || undefined,
        address: address.trim() || undefined,
        highlight: highlight.trim() || undefined,
        notes: notes.trim() || undefined,
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
            <label className="label">
              <span className="label-text flex items-center gap-1">
                <Instagram className="w-4 h-4" /> Post / Red social
              </span>
            </label>
            <input
              type="url"
              placeholder="Link de Instagram, TikTok, blog..."
              className="input input-bordered w-full"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text flex items-center gap-1">
                <Map className="w-4 h-4" /> Google Maps
              </span>
            </label>
            <input
              type="url"
              placeholder="Link de Google Maps..."
              className="input input-bordered w-full"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
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

          <div className="form-control">
            <label className="label"><span className="label-text">🌟 Qué te gustó / Qué venden</span></label>
            <input
              type="text"
              placeholder="Ej: Pizzas increíbles, café de especialidad..."
              className="input input-bordered w-full"
              value={highlight}
              onChange={(e) => setHighlight(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Notas adicionales</span></label>
            <textarea
              placeholder="Horarios, recomendaciones, tips..."
              className="textarea textarea-bordered w-full"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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

function PlaceDetailModal({
  place,
  onClose,
  onDelete,
}: {
  place: Doc<"places">;
  onClose: () => void;
  onDelete: () => void;
}) {
  const toggleVisited = useMutation(api.places.toggleVisited);
  const updatePlace = useMutation(api.places.updatePlace);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: place.name,
    address: place.address || "",
    highlight: place.highlight || "",
    notes: place.notes || "",
    rating: place.rating || 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const config = CATEGORY_CONFIG[place.category as PlaceCategory];

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updatePlace({
        placeId: place._id,
        name: editData.name.trim(),
        address: editData.address.trim() || undefined,
        highlight: editData.highlight.trim() || undefined,
        notes: editData.notes.trim() || undefined,
        rating: editData.rating || undefined,
      });
      setIsEditing(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{config.icon}</span>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  className="input input-bordered input-sm font-bold text-lg"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              ) : (
                <h3 className="font-bold text-lg">{place.name}</h3>
              )}
              <span className="badge badge-sm badge-ghost">{config.label}</span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toggle */}
        <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg mb-4">
          <span className="font-medium">Estado</span>
          <button
            onClick={() => toggleVisited({ placeId: place._id })}
            className={`btn btn-sm gap-2 ${place.visited ? "btn-success" : "btn-outline"}`}
          >
            <Check className="w-4 h-4" />
            {place.visited ? "Visitado" : "Marcar como visitado"}
          </button>
        </div>

        {/* Rating */}
        <div className="mb-4">
          <label className="label"><span className="label-text font-medium">Calificación</span></label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => {
                  if (isEditing) {
                    setEditData({ ...editData, rating: star });
                  }
                }}
                className={`${isEditing ? "cursor-pointer" : "cursor-default"}`}
              >
                <Star
                  className={`w-6 h-6 ${star <= (isEditing ? editData.rating : (place.rating || 0))
                    ? "text-amber-500 fill-amber-500"
                    : "text-base-300"
                    }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Address */}
        {(place.address || isEditing) && (
          <div className="mb-4">
            <label className="label"><span className="label-text font-medium">Dirección</span></label>
            {isEditing ? (
              <input
                type="text"
                className="input input-bordered w-full"
                value={editData.address}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                placeholder="Dirección..."
              />
            ) : (
              <p className="text-base-content/80">{place.address}</p>
            )}
          </div>
        )}

        {/* Highlight - What you liked */}
        {(place.highlight || isEditing) && (
          <div className="mb-4">
            <label className="label"><span className="label-text font-medium">🌟 Qué te gustó / Qué venden</span></label>
            {isEditing ? (
              <input
                type="text"
                className="input input-bordered w-full"
                value={editData.highlight}
                onChange={(e) => setEditData({ ...editData, highlight: e.target.value })}
                placeholder="Ej: Pizzas increíbles, café de especialidad..."
              />
            ) : (
              <p className="text-primary font-medium">{place.highlight}</p>
            )}
          </div>
        )}

        {/* Links Section */}
        {(place.url || place.mapsUrl) && (
          <div className="mb-4">
            <label className="label"><span className="label-text font-medium">Enlaces</span></label>
            <div className="flex flex-col gap-2">
              {place.url && (
                <a
                  href={place.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline gap-2 justify-start"
                >
                  <Instagram className="w-4 h-4" />
                  Ver post / recomendación
                </a>
              )}
              {place.mapsUrl && (
                <a
                  href={place.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline gap-2 justify-start"
                >
                  <Map className="w-4 h-4" />
                  Abrir en Google Maps
                </a>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mb-4">
          <label className="label"><span className="label-text font-medium">Notas</span></label>
          {isEditing ? (
            <textarea
              className="textarea textarea-bordered w-full"
              rows={4}
              value={editData.notes}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              placeholder="Recomendaciones, horarios, qué pedir..."
            />
          ) : place.notes ? (
            <p className="text-base-content/80 whitespace-pre-wrap">{place.notes}</p>
          ) : (
            <p className="text-base-content/40 italic">Sin notas</p>
          )}
        </div>

        {/* Actions */}
        <div className="modal-action">
          {isEditing ? (
            <>
              <button className="btn btn-ghost" onClick={() => setIsEditing(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={isLoading || !editData.name.trim()}
              >
                {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-error btn-outline"
                onClick={() => {
                  onDelete();
                  onClose();
                }}
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
              <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                Editar
              </button>
            </>
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
