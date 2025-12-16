import { MapPin, Star, Link as LinkIcon, Map, Plus } from "lucide-react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { MobileModal } from "../../ui/MobileModal";

interface TripPlaceDetailModalProps {
    place: Doc<"places">;
    onClose: () => void;
    onAddToItinerary: () => void;
}

export function TripPlaceDetailModal({ place, onClose, onAddToItinerary }: TripPlaceDetailModalProps) {
    return (
        <MobileModal isOpen onClose={onClose} title={place.name}>
            <div className="space-y-6">
                {/* Image */}
                {place.imageUrl && (
                    <div className="rounded-xl overflow-hidden h-48 w-full">
                        <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" />
                    </div>
                )}

                {/* Header Info */}
                <div>
                    <div className="flex justify-between items-start">
                        <div className="badge badge-outline capitalize">{place.category}</div>
                        {place.rating && (
                            <div className="flex items-center text-amber-500 font-bold">
                                <Star className="w-4 h-4 fill-current mr-1" /> {place.rating}
                            </div>
                        )}
                    </div>
                    {place.highlight && (
                        <div className="mt-2 text-primary font-medium">
                            ✨ {place.highlight}
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm">
                    {place.address && (
                        <div className="flex gap-2">
                            <MapPin className="w-4 h-4 text-base-content/50 shrink-0 mt-0.5" />
                            <span>{place.address}</span>
                        </div>
                    )}
                    {place.notes && (
                        <p className="p-3 bg-base-200/50 rounded-lg italic text-base-content/80">
                            "{place.notes}"
                        </p>
                    )}
                </div>

                {/* Links */}
                <div className="flex gap-2">
                    {place.mapsUrl && (
                        <a href={place.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline gap-2">
                            <Map className="w-4 h-4" /> Google Maps
                        </a>
                    )}
                    {place.url && (
                        <a href={place.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline gap-2">
                            <LinkIcon className="w-4 h-4" /> Web / Link
                        </a>
                    )}
                </div>

                {/* Action */}
                <div className="pt-4 border-t border-base-200">
                    <button
                        onClick={() => {
                            onClose();
                            onAddToItinerary();
                        }}
                        className="btn btn-primary btn-block gap-2"
                    >
                        <Plus className="w-4 h-4" /> Agregar al Itinerario
                    </button>
                    <p className="text-center text-xs text-base-content/50 mt-2">
                        Programa una visita a este lugar en tu calendario.
                    </p>
                </div>
            </div>
        </MobileModal>
    );
}
