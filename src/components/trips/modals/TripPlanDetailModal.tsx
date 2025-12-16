import { useQuery } from "convex/react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { MapPin, Clock, FileText, CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react";
import { MobileModal } from "../../ui/MobileModal";

interface TripPlanDetailModalProps {
    planId: Id<"tripPlans">;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onToggleCompletion: () => void;
}

export function TripPlanDetailModal({ planId, onClose, onEdit, onDelete, onToggleCompletion }: TripPlanDetailModalProps) {
    const plan = useQuery(api.trips.getTripPlan, { planId });
    // Assuming we might need place details. Plan usually has placeId.
    // If not joined in getTripPlan, we fetch place separately.
    // Let's assume getTripPlan returns the plan doc.
    const place = useQuery(api.places.getPlace, plan?.placeId ? { placeId: plan.placeId } : "skip");

    if (!plan) return null;

    return (
        <MobileModal isOpen={true} onClose={onClose} title="Detalle de Actividad">
            <div className="space-y-6">
                {/* Header Status */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`badge ${plan.isCompleted ? 'badge-success text-white' : 'badge-ghost'}`}>
                            {plan.isCompleted ? 'Completada' : 'Pendiente'}
                        </div>
                        {plan.time && (
                            <div className="badge badge-outline text-xs font-mono">
                                <Clock className="w-3 h-3 mr-1" /> {plan.time}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div>
                    <h3 className="text-xl font-bold leading-tight mb-2">{plan.activity}</h3>
                    {plan.placeId && place && (
                        <div className="flex items-start gap-3 p-3 bg-base-200/50 rounded-xl mb-4">
                            {place.imageUrl ? (
                                <img src={place.imageUrl} className="w-12 h-12 rounded-lg object-cover bg-base-300" alt="" />
                            ) : (
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <MapPin className="w-6 h-6" />
                                </div>
                            )}
                            <div>
                                <div className="font-bold text-sm">{place.name}</div>
                                <div className="text-xs text-base-content/60 line-clamp-1">{place.address || place.category}</div>
                                {place.mapsUrl && (
                                    <a href={place.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-medium mt-0.5 block hover:underline">
                                        Ver en mapa
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {plan.notes && (
                        <div className="p-3 bg-base-100 border border-base-200 rounded-xl text-sm text-base-content/80 whitespace-pre-wrap">
                            <div className="flex items-center gap-2 mb-1 text-xs font-bold text-base-content/40 uppercase tracking-wider">
                                <FileText className="w-3 h-3" /> Notas
                            </div>
                            {plan.notes}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-base-100">
                    <button
                        onClick={() => {
                            onToggleCompletion();
                            onClose();
                        }}
                        className={`btn ${plan.isCompleted ? 'btn-warning text-white' : 'btn-success text-white'}`}
                    >
                        {plan.isCompleted ? <Circle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        {plan.isCompleted ? 'Marcar pendiente' : 'Completar'}
                    </button>

                    <button
                        onClick={() => {
                            onEdit();
                            onClose();
                        }}
                        className="btn btn-primary" // User asked for Edit button in mobile modal
                    >
                        <Pencil className="w-4 h-4" /> Editar
                    </button>

                    <button
                        onClick={() => {
                            // Confirm delete?
                            if (window.confirm("¿Eliminar esta actividad?")) {
                                onDelete();
                                onClose();
                            }
                        }}
                        className="btn btn-ghost text-error col-span-2 btn-sm"
                    >
                        <Trash2 className="w-4 h-4" /> Eliminar Actividad
                    </button>
                </div>
            </div>
        </MobileModal>
    );
}
