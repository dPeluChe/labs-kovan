
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { Plus, ListFilter, Map, MapPin, LayoutGrid, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatedTabs } from "../ui/AnimatedTabs";
import { useAuth } from "../../contexts/AuthContext";
import { StickyHeader } from "../ui/StickyHeader";
import { EmptyState } from "../ui/EmptyState";

import { PlaceCard } from "./PlaceCard";
import { CreateListModal } from "./modals/CreateListModal";
import { CreatePlaceModal } from "./modals/CreatePlaceModal";
import { PlaceDetailModal } from "./modals/PlaceDetailModal";
import { useConfirmModal } from "../../hooks/useConfirmModal";

export function PlacesLayout({ familyId }: { familyId: Id<"families"> }) {
    const { sessionToken } = useAuth();
    const navigate = useNavigate();
    const [selectedListId, setSelectedListId] = useState<Id<"placeLists"> | null>(null);
    const [showCreateList, setShowCreateList] = useState(false);
    const [showCreatePlace, setShowCreatePlace] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState<Doc<"places"> | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'visited'>('all');

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
            if (!sessionToken) return;
            await deletePlace({ sessionToken, placeId });
            setSelectedPlace(null);
        }
    };


    const lists = useQuery(api.places.getLists, sessionToken ? { sessionToken, familyId } : "skip");
    const places = useQuery(
        api.places.getPlaces,
        sessionToken
            ? {
                sessionToken,
                familyId,
                listId: selectedListId || undefined
            }
            : "skip"
    );


    const filteredPlaces = places?.filter(place => {
        if (filter === 'pending') return !place.visited;
        if (filter === 'visited') return place.visited;
        return true;
    }) || [];

    const allCount = places?.length || 0;
    const pendingCount = places?.filter(p => !p.visited).length || 0;
    const visitedCount = places?.filter(p => p.visited).length || 0;

    // Icons for tabs
    const tabs = [
        { id: 'all', label: 'Todos', count: allCount, icon: <LayoutGrid className="w-4 h-4" /> },
        { id: 'pending', label: 'Pendientes', count: pendingCount, icon: <Clock className="w-4 h-4" /> },
        { id: 'visited', label: 'Visitados', count: visitedCount, icon: <CheckCircle className="w-4 h-4" /> },
    ] as const;

    return (
        <div className="min-h-screen bg-base-100 pb-20">
            <StickyHeader
                title="Lugares"
                action={
                    <>
                        <button
                            className="btn btn-circle btn-ghost btn-sm"
                            onClick={() => navigate('/places/visits')}
                            aria-label="Bitácora"
                        >
                            <MapPin className="w-5 h-5" />
                        </button>
                        <button
                            className="btn btn-circle btn-ghost btn-sm"
                            onClick={() => setShowCreateList(true)}
                            aria-label="Crear lista"
                        >
                            <ListFilter className="w-5 h-5" />
                        </button>
                        <button
                            className="btn btn-primary btn-sm rounded-full gap-2 px-4 shadow-lg shadow-primary/20"
                            onClick={() => setShowCreatePlace(true)}
                        >
                            <Plus className="w-4 h-4" /> Nuevo
                        </button>
                    </>
                }
                tabs={
                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 snap-x">
                        {/* "All" Option */}
                        <div className="snap-start shrink-0">
                            <div
                                onClick={() => setSelectedListId(null)}
                                className={`h-12 px-4 rounded-xl flex items-center gap-2 border cursor-pointer transition-all whitespace-nowrap
                                    ${selectedListId === null
                                        ? 'bg-neutral text-neutral-content border-neutral shadow-md'
                                        : 'bg-base-100 border-base-300'
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
                                            : 'bg-base-100 border-base-300'
                                        }
                                    `}
                                >
                                    <span className="text-lg">{list.icon || "📁"}</span>
                                    <span className="font-bold text-sm">{list.name}</span>
                                    {list.count > 0 && (
                                        <span className={`badge badge-sm badge-circle border-0 ml-1 ${selectedListId === list._id ? 'bg-white/20 text-white' : 'bg-base-content/10'}`}>
                                            {list.count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Add List Button Inline */}
                        <div className="snap-start shrink-0">
                            <button
                                onClick={() => setShowCreateList(true)}
                                className="h-12 w-12 rounded-xl flex items-center justify-center border border-dashed border-base-300 text-subtle hover:bg-base-200"
                                aria-label="Crear lista"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                }
            />

            {/* Main Content */}
            <div className="p-4 space-y-4">

                {/* Filter Tabs (Reusable Component) */}
                <AnimatedTabs
                    tabs={tabs}
                    activeTab={filter}
                    onTabChange={setFilter}
                    className="mb-2"
                />

                {/* Places Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {places === undefined ? (
                        <div className="flex justify-center py-10"><span className="loading loading-dots loading-lg text-primary/30"></span></div>
                    ) : filteredPlaces.length === 0 ? (
                        <EmptyState
                            icon={Map}
                            title={filter === 'pending' ? '¡Todo visitado!' : filter === 'visited' ? 'Aún no has visitado nada' : 'Sin lugares'}
                            description={filter === 'visited' ? 'Registra visitas a tus lugares favoritos.' : 'Empieza agregando un lugar que te gustaría visitar.'}
                            action={
                                filter !== 'visited' && (
                                    <button
                                        onClick={() => setShowCreatePlace(true)}
                                        className="btn btn-primary btn-sm"
                                    >
                                        Agregar lugar
                                    </button>
                                )
                            }
                        />
                    ) : (
                        filteredPlaces.map(place => (
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
                    sessionToken={sessionToken}
                    familyId={familyId}
                    onClose={() => setShowCreateList(false)}
                />
            )}

            {showCreatePlace && (
                <CreatePlaceModal
                    sessionToken={sessionToken}
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
