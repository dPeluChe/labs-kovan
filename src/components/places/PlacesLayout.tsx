
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { Plus, ListFilter, Map } from "lucide-react";

import { PlaceCard } from "./PlaceCard";
import { CreateListModal } from "./modals/CreateListModal";
import { CreatePlaceModal } from "./modals/CreatePlaceModal";
import { PlaceDetailModal } from "./modals/PlaceDetailModal";
import { useConfirmModal } from "../../hooks/useConfirmModal";

export function PlacesLayout({ familyId }: { familyId: Id<"families"> }) {
    const [selectedListId, setSelectedListId] = useState<Id<"placeLists"> | null>(null);
    const [showCreateList, setShowCreateList] = useState(false);
    const [showCreatePlace, setShowCreatePlace] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState<Doc<"places"> | null>(null);

    const { confirm, ConfirmModal } = useConfirmModal();
    const deletePlace = useMutation(api.places.deletePlace);

    const handleDelete = async (placeId: Id<"places">) => {
        const ok = await confirm({
            title: "Eliminar Lugar",
            message: "¿Seguro que quieres eliminar este lugar?",
            confirmText: "Eliminar",
            variant: "danger"
        });
        if (ok) {
            await deletePlace({ placeId });
            setSelectedPlace(null);
        }
    };


    const lists = useQuery(api.places.getLists, { familyId });
    const places = useQuery(api.places.getPlaces, {
        familyId,
        listId: selectedListId || undefined // If null, passes undefined to get all
    });

    // Helper: Find selected list name
    const selectedList = lists?.find(l => l._id === selectedListId);

    return (
        <div className="min-h-screen bg-base-100 pb-20">
            {/* Header Area */}
            <div className="bg-base-100 sticky top-0 z-20 px-4 py-3 border-b border-base-content/5">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold font-display">Lugares</h1>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-circle btn-ghost btn-sm"
                            onClick={() => setShowCreateList(true)}
                        >
                            <ListFilter className="w-5 h-5" />
                        </button>
                        <button
                            className="btn btn-primary btn-sm rounded-full gap-2 px-4 shadow-lg shadow-primary/20"
                            onClick={() => setShowCreatePlace(true)}
                        >
                            <Plus className="w-4 h-4" /> Nuevo
                        </button>
                    </div>
                </div>

                {/* Lists Horizontal Scroll */}
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 snap-x">
                    {/* "All" Option */}
                    <div className="snap-start shrink-0">
                        <div
                            onClick={() => setSelectedListId(null)}
                            className={`h-12 px-4 rounded-xl flex items-center gap-2 border cursor-pointer transition-all whitespace-nowrap
                                ${selectedListId === null
                                    ? 'bg-neutral text-neutral-content border-neutral shadow-md'
                                    : 'bg-base-100 border-base-content/10'
                                }
                             `}
                        >
                            <Map className="w-4 h-4" />
                            <span className="font-bold text-sm">Todos</span>
                        </div>
                    </div>

                    {lists?.map((list) => (
                        <div key={list._id} className="snap-start shrink-0">
                            <div
                                onClick={() => setSelectedListId(list._id)}
                                className={`h-12 px-4 rounded-xl flex items-center gap-2 border cursor-pointer transition-all whitespace-nowrap
                                    ${selectedListId === list._id
                                        ? 'bg-primary text-primary-content border-primary shadow-md'
                                        : 'bg-base-100 border-base-content/10'
                                    }
                                `}
                            >
                                <span className="text-lg">{list.icon || "📁"}</span>
                                <span className="font-bold text-sm">{list.name}</span>
                            </div>
                        </div>
                    ))}

                    {/* Add List Button Inline */}
                    <div className="snap-start shrink-0">
                        <button
                            onClick={() => setShowCreateList(true)}
                            className="h-12 w-12 rounded-xl flex items-center justify-center border border-dashed border-base-content/30 text-base-content/50 hover:bg-base-200"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-4 space-y-4">
                {/* Context Header */}
                <div className="flex items-center justify-between text-base-content/50 text-sm pl-1">
                    <span>
                        {selectedList ? `${selectedList.icon} ${selectedList.name}` : "Todos los lugares"}
                    </span>
                    <span>{places?.length || 0} spots</span>
                </div>

                {/* Places Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {places === undefined ? (
                        <div className="flex justify-center py-10"><span className="loading loading-dots loading-lg text-primary/30"></span></div>
                    ) : places.length === 0 ? (
                        <div className="text-center py-20 opacity-50 space-y-4">
                            <Map className="w-16 h-16 mx-auto text-base-content/20" />
                            <p>No hay lugares aquí aún.</p>
                            <button
                                onClick={() => setShowCreatePlace(true)}
                                className="btn btn-outline btn-sm animate-pulse"
                            >
                                Agregar el primero
                            </button>
                        </div>
                    ) : (
                        places.map(place => (
                            <PlaceCard
                                key={place._id}
                                place={place}
                                onClick={() => setSelectedPlace(place)}
                                onCheckIn={(e) => {
                                    e.stopPropagation();
                                    // Open check-in modal (TODO)
                                    // For now just toggle via detail if needed, or simple alert
                                    console.log("Check in", place._id);
                                }}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Modals */}
            {showCreateList && (
                <CreateListModal
                    familyId={familyId}
                    onClose={() => setShowCreateList(false)}
                />
            )}

            {showCreatePlace && (
                <CreatePlaceModal
                    familyId={familyId}
                    preselectedListId={selectedListId || undefined}
                    onClose={() => setShowCreatePlace(false)}
                />
            )}

            {selectedPlace && (
                <PlaceDetailModal
                    place={selectedPlace}
                    onClose={() => setSelectedPlace(null)}
                    onDelete={() => handleDelete(selectedPlace._id)}
                />
            )}

            <ConfirmModal />
        </div>
    );
}
