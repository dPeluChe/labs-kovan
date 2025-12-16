import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id, Doc } from "../../../../convex/_generated/dataModel";
import { MapPin, Plus } from "lucide-react";
import { EmptyState } from "../../ui/EmptyState";
import { PlaceCard } from "../../places/PlaceCard";
import { AddPlaceToTripModal } from "../modals/AddPlaceToTripModal";
import { TripPlaceDetailModal } from "../modals/TripPlaceDetailModal";

interface TripIdeasTabProps {
    tripId: Id<"trips">;
    onAddToItinerary?: (place: Doc<"places">) => void;
}

export function TripIdeasTab({ tripId, onAddToItinerary }: TripIdeasTabProps) {
    const trip = useQuery(api.trips.getTrip, { tripId });
    // If trip has placeListId, fetch places
    const places = useQuery(api.places.getPlaces,
        trip?.placeListId
            ? { familyId: trip.familyId, listId: trip.placeListId }
            : "skip"
    );

    const updateTrip = useMutation(api.trips.updateTrip);
    const lists = useQuery(api.places.getLists, trip ? { familyId: trip.familyId } : "skip");

    const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState<Doc<"places"> | null>(null);

    // Logic to link a list
    const handleLinkList = async (listId: Id<"placeLists"> | null) => {
        await updateTrip({ tripId, placeListId: listId });
    };

    if (trip === undefined) return <div className="p-10 flex justify-center"><span className="loading loading-dots loading-md" /></div>;
    if (trip === null) return <div className="p-10 text-center">Viaje no encontrado</div>;

    if (!trip.placeListId) {
        return (
            <div className="space-y-6">
                <EmptyState
                    icon={MapPin}
                    title="Vincula una lista de lugares"
                    description="Selecciona una lista existente para ver tus opciones de visita aquí."
                    action={null}
                />

                <div className="space-y-2">
                    <p className="font-semibold text-sm px-1">Tus Listas</p>
                    {lists?.map((list) => (
                        <button
                            key={list._id}
                            onClick={() => handleLinkList(list._id)}
                            className="btn btn-block btn-outline justify-start gap-3 h-auto py-3 bg-base-100"
                        >
                            <span className="text-2xl">{list.icon || "📁"}</span>
                            <div className="text-left">
                                <div className="font-bold text-sm">{list.name}</div>
                                <div className="text-xs font-normal opacity-60">{list.count || 0} lugares</div>
                            </div>
                        </button>
                    ))}
                    {/* Could add Create List option here */}
                </div>
            </div>
        );
    }

    if (places === undefined) return <div className="p-10 flex justify-center"><span className="loading loading-dots loading-md" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <span className="text-sm opacity-60 font-medium">Lugares guardados ({places.length})</span>
                <button
                    onClick={() => setIsAddPlaceOpen(true)}
                    className="btn btn-xs btn-primary gap-1"
                >
                    <Plus className="w-3 h-3" /> Agregar Lugar
                </button>
            </div>

            {places.length === 0 ? (
                <EmptyState
                    icon={MapPin}
                    title="Lista vacía"
                    description="Agrega lugares a esta lista para planear tu viaje."
                    action={
                        <button onClick={() => setIsAddPlaceOpen(true)} className="btn btn-primary btn-sm">
                            Agregar primer lugar
                        </button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {places.map((place) => (
                        <PlaceCard
                            key={place._id}
                            place={place}
                            onClick={() => setSelectedPlace(place)}
                            onCheckIn={() => { }} // Placeholder
                        />
                    ))}
                </div>
            )}

            <div className="flex justify-center mt-4">
                <button
                    onClick={() => handleLinkList(null)}
                    className="btn btn-ghost btn-xs text-base-content/40"
                >
                    Cambiar lista vinculada
                </button>
            </div>

            {isAddPlaceOpen && (
                <AddPlaceToTripModal
                    familyId={trip.familyId}
                    placeListId={trip.placeListId}
                    onClose={() => setIsAddPlaceOpen(false)}
                />
            )}

            {selectedPlace && (
                <TripPlaceDetailModal
                    place={selectedPlace}
                    onClose={() => setSelectedPlace(null)}
                    onAddToItinerary={() => {
                        onAddToItinerary?.(selectedPlace);
                        // Also close logic if needed, but assuming callback handles navigation/modal
                    }}
                />
            )}
        </div>
    );
}
