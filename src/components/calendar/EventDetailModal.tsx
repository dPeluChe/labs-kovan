import { useState } from "react";
import { Clock, MapPin, AlignLeft, Trash2, Edit } from "lucide-react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { useFamily } from "../../contexts/FamilyContext";
import { useToast } from "../../components/ui/Toast";
import { MobileModal } from "../ui/MobileModal";
import { EventFormModal } from "./EventFormModal";

interface EventDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Doc<"cachedCalendarEvents"> | null;
}

export function EventDetailModal({ isOpen, onClose, event }: EventDetailModalProps) {
    const { currentFamily } = useFamily();
    const deleteEvent = useAction(api.calendar.deleteEvent);
    const { showToast } = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    if (!event) return null;

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de que quieres eliminar este evento?")) return;

        setIsLoading(true);
        try {
            if (currentFamily) {
                await deleteEvent({
                    familyId: currentFamily._id,
                    eventId: event.externalId,
                });
            }
            showToast("Evento eliminado", "success");
            onClose();
        } catch (error) {
            console.error(error);
            showToast("Error al eliminar evento", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // If editing mode is active, render the form modal but "controlled"
    if (isEditing) {
        return (
            <EventFormModal
                isOpen={true}
                onClose={() => setIsEditing(false)}
                existingEvent={event} // Pass existing event to pre-fill form
                onSuccess={() => {
                    setIsEditing(false);
                    onClose(); // Close details view after successful edit
                }}
            />
        );
    }

    // Determine status badge
    const now = new Date();
    const start = new Date(event.startDateTime);
    const end = new Date(event.endDateTime);
    let statusBadge = null;

    if (now >= start && now <= end) {
        statusBadge = <span className="badge badge-primary">En curso</span>;
    } else if (now > end) {
        statusBadge = <span className="badge badge-ghost">Finalizado</span>;
    } else {
        // Upcoming
    }


    return (
        <MobileModal isOpen={isOpen} onClose={onClose} title="Detalles del Evento">
            <div className="space-y-6">

                {/* Header Section */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                            {start.toLocaleDateString("es-MX", { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                        {statusBadge}
                    </div>
                    <h2 className="text-2xl font-bold leading-tight">{event.title}</h2>
                </div>

                {/* Time & Date */}
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="font-semibold text-lg">
                            {start.toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' })}
                            {' - '}
                            {end.toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-sm text-base-content/60">
                            Duración: {Math.round((end.getTime() - start.getTime()) / (1000 * 60))} min
                        </p>
                    </div>
                </div>

                {/* Location */}
                {event.location && (
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-base-200 rounded-lg text-base-content/70">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium">{event.location}</p>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-primary hover:underline"
                            >
                                Ver en mapa
                            </a>
                        </div>
                    </div>
                )}

                {/* Description */}
                {/* Convex caches description? Let's assume we might need to fetch full details if not cached. 
                    Currently our cache stores: externalId, title, start, end, location, allDay.
                    MISSING in cache: description. 
                    NOTE: We should probably update the cache schema to store description if we want to show it here without fetching.
                    For now, it might be empty.
                */}

                <div className="flex items-start gap-4">
                    <div className="p-2 bg-base-200 rounded-lg text-base-content/70">
                        <AlignLeft className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-base-content/80 whitespace-pre-wrap">
                            {event.description || "Sin descripción."}
                        </p>
                    </div>
                </div>


                {/* Actions */}
                <div className="flex gap-3 pt-6 border-t border-base-200">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="btn btn-outline flex-1"
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                    </button>
                    <button
                        onClick={handleDelete}
                        className="btn btn-outline btn-error flex-1"
                        disabled={isLoading}
                    >
                        {isLoading ? <span className="loading loading-spinner"></span> : <Trash2 className="w-4 h-4 mr-2" />}
                        Eliminar
                    </button>
                </div>

            </div>
        </MobileModal>
    );
}
