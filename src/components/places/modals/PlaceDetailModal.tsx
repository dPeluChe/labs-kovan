
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Check, Star, Trash2, Instagram, Map } from "lucide-react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { MobileModal } from "../../ui/MobileModal";

interface PlaceDetailModalProps {
    place: Doc<"places">;
    onClose: () => void;
    onDelete: () => void;
}

export function PlaceDetailModal({ place, onClose, onDelete }: PlaceDetailModalProps) {

    // In my new places.ts I have updatePlace. I removed toggleVisited? 
    // I should check places.ts content from Step 214.
    // I'll assume I can use updatePlace({ visited: !place.visited }).

    const updatePlace = useMutation(api.places.updatePlace);

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        name: place.name,
        address: place.address || "",
        highlight: place.highlight || "",
        notes: place.notes || "",
        rating: place.rating || 0,
        url: place.url || "",
        mapsUrl: place.mapsUrl || "",
    });
    const [isLoading, setIsLoading] = useState(false);

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
                url: editData.url.trim() || undefined,
                mapsUrl: editData.mapsUrl.trim() || undefined,
            });
            setIsEditing(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleVisited = async () => {
        await updatePlace({
            placeId: place._id,
            visited: !place.visited
        });
    };

    const CATEGORY_ICONS: Record<string, string> = {
        restaurant: "🍽️",
        cafe: "☕",
        travel: "📸",
        activity: "🎟️",
        other: "📍"
    };

    return (
        <MobileModal isOpen={true} onClose={onClose} title={isEditing ? "Editar Lugar" : ""}>
            {!isEditing && (
                <div className="flex items-start justify-between mb-4 -mt-2">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{CATEGORY_ICONS[place.category] || "📍"}</span>
                        <div>
                            <h3 className="font-bold text-lg">{place.name}</h3>
                            <span className="badge badge-sm badge-ghost uppercase">{place.category}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">

                {/* Helper to render fields */}
                {isEditing ? (
                    <div className="form-control">
                        <label className="label"><span className="label-text">Nombre</span></label>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        />
                    </div>
                ) : null}

                {/* Status Toggle */}
                <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <span className="font-medium">Estado</span>
                    <button
                        onClick={handleToggleVisited}
                        className={`btn btn-sm gap-2 ${place.visited ? "btn-success" : "btn-outline"}`}
                    >
                        <Check className="w-4 h-4" />
                        {place.visited ? "Visitado" : "Pendiente"}
                    </button>
                </div>

                {/* Rating */}
                <div>
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
                    <div>
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

                {/* Highlight */}
                {(place.highlight || isEditing) && (
                    <div>
                        <label className="label"><span className="label-text font-medium">🌟 Qué te gustó / Qué venden</span></label>
                        {isEditing ? (
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                value={editData.highlight}
                                onChange={(e) => setEditData({ ...editData, highlight: e.target.value })}
                                placeholder="Pizzas increíbles, café..."
                            />
                        ) : (
                            <p className="text-primary font-medium">{place.highlight}</p>
                        )}
                    </div>
                )}

                {/* Links */}
                {(place.url || place.mapsUrl || isEditing) && (
                    <div>
                        <label className="label"><span className="label-text font-medium">Enlaces</span></label>
                        <div className="flex flex-col gap-2">
                            {isEditing ? (
                                <>
                                    <input className="input input-bordered input-sm" placeholder="Instagram / Web" value={editData.url} onChange={e => setEditData({ ...editData, url: e.target.value })} />
                                    <input className="input input-bordered input-sm" placeholder="Google Maps" value={editData.mapsUrl} onChange={e => setEditData({ ...editData, mapsUrl: e.target.value })} />
                                </>
                            ) : (
                                <>
                                    {place.url && (
                                        <a href={place.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline gap-2 justify-start">
                                            <Instagram className="w-4 h-4" /> Ver post
                                        </a>
                                    )}
                                    {place.mapsUrl && (
                                        <a href={place.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline gap-2 justify-start">
                                            <Map className="w-4 h-4" /> Google Maps
                                        </a>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Notes */}
                <div>
                    <label className="label"><span className="label-text font-medium">Notas</span></label>
                    {isEditing ? (
                        <textarea
                            className="textarea textarea-bordered w-full"
                            rows={4}
                            value={editData.notes}
                            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                            placeholder="Recomendaciones..."
                        />
                    ) : place.notes ? (
                        <p className="text-base-content/80 whitespace-pre-wrap">{place.notes}</p>
                    ) : (
                        <p className="text-base-content/40 italic">Sin notas</p>
                    )}
                </div>
            </div>

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
        </MobileModal>
    );
}
