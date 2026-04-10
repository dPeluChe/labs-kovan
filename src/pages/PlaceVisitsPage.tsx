import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Search, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { DetailHeader } from "../components/ui/DetailHeader";
import { Timeline, TimelineItem } from "../components/ui/Timeline";
import { EmptyState } from "../components/ui/EmptyState";

export function PlaceVisitsPage() {
    const navigate = useNavigate();


    // Auth / Family Logic
    const { currentFamily } = useFamily();
    const { sessionToken } = useAuth();
    const familyId = currentFamily?._id;

    // Use explicit type assertion if needed, but inference should work
    const visits = useQuery(
        api.places.getAllVisits,
        familyId && sessionToken ? { sessionToken, familyId, limit: 100 } : "skip"
    );
    const [searchTerm, setSearchTerm] = useState("");

    const filteredVisits = visits?.filter((v) =>
        v.placeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.notes && v.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!familyId || visits === undefined) return (
        <div className="min-h-screen flex items-center justify-center bg-base-100">
            <span className="loading loading-dots loading-lg text-primary"></span>
        </div>
    );

    return (
        <div className="min-h-screen bg-base-100 pb-20">
            <DetailHeader
                title="Bitácora de Visitas"
                onBack={() => navigate(-1)}
                description={
                    <label className="input input-sm flex items-center gap-2 bg-base-200/50 rounded-xl px-3 border-transparent focus-within:border-primary/50 focus-within:ring-2 ring-primary/10 transition-all shadow-sm">
                        <Search className="w-4 h-4 opacity-50" />
                        <input
                            type="text"
                            className="grow placeholder:text-faint bg-transparent"
                            placeholder="Buscar en historial..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </label>
                }
            />

            {/* Content */}
            <div className="p-4 space-y-6">
                {filteredVisits && filteredVisits.length > 0 ? (
                    <Timeline>
                        {filteredVisits.map((visit) => (
                            <TimelineItem key={visit._id}>
                                <div className="flex flex-col gap-2">
                                    {/* Date Header */}
                                    <span className="text-xs font-bold text-primary tracking-wider uppercase opacity-80">
                                        {new Date(visit.visitDate).toLocaleDateString("es-MX", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>

                                    {/* Card */}
                                    <div className="card surface-card shadow-sm overflow-hidden">
                                        <div className="flex">
                                            {visit.placeImage && (
                                                <div className="w-24 shrink-0">
                                                    <img src={visit.placeImage} className="w-full h-full object-cover opacity-90" alt="" />
                                                </div>
                                            )}
                                            <div className="p-3 flex-1 min-w-0">
                                                <h3 className="font-bold text-base line-clamp-1">{visit.placeName}</h3>

                                                {visit.notes && (
                                                    <p className="text-sm text-body italic mt-1 line-clamp-2">"{visit.notes}"</p>
                                                )}

                                                <div className="flex gap-2 mt-2 items-center">
                                                    {visit.rating && (
                                                        <div className="badge badge-xs badge-warning text-warning-content opacity-90 gap-1">
                                                            ★ {visit.rating}
                                                        </div>
                                                    )}
                                                    {visit.visitType && (
                                                        <div className="badge badge-xs badge-ghost opacity-70">
                                                            {visit.visitType}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TimelineItem>
                        ))}
                    </Timeline>
                ) : (
                    <EmptyState
                        icon={Calendar}
                        title="Sin visitas registradas"
                        description="No se encontraron visitas que coincidan con la búsqueda."
                    />
                )}
            </div>
        </div>
    );
}
