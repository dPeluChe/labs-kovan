import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowLeft, Search, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFamily } from "../contexts/FamilyContext";
// Actually we need the user's family. Since this is a page, we need to get family context.
// Assuming we pass familyId relative to the wrapper or fetch it.
// For now, let's assume we use the same hook pattern as Dashboard or others. 
// But wait, standard pages usually get familyId from a Context or similar.
// In this project, `App.tsx` passes `familyId` to components. 
// But a Route component needs to fetch it.
// Let's look at how other pages work. `PlacesPage.tsx` likely gets it.

// Let's assume we will pass familyId via prop (if routed from a wrapper) or fetch user's family.
// Existing pages like `DashboardPage` fetch the family.

export function PlaceVisitsPage() {
    const navigate = useNavigate();


    // Auth / Family Logic
    const { currentFamily } = useFamily();
    const familyId = currentFamily?._id;

    // Use explicit type assertion if needed, but inference should work
    const visits = useQuery(api.places.getAllVisits, familyId ? { familyId, limit: 100 } : "skip");
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
            {/* Header */}
            <div className="sticky top-0 z-20 bg-base-100/80 backdrop-blur-md border-b border-base-content/5 px-4 py-3">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="btn btn-circle btn-ghost btn-sm">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold font-display">Bitácora de Visitas</h1>
                </div>

                {/* Search */}
                <div className="mt-3">
                    <label className="input input-sm flex items-center gap-2 bg-base-200/50 rounded-xl px-3 border-transparent focus-within:border-primary/50 focus-within:ring-2 ring-primary/10 transition-all shadow-sm">
                        <Search className="w-4 h-4 opacity-50" />
                        <input
                            type="text"
                            className="grow placeholder:text-base-content/40 bg-transparent"
                            placeholder="Buscar en historial..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </label>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
                {filteredVisits && filteredVisits.length > 0 ? (
                    <div className="relative border-l-2 border-base-content/10 ml-3 space-y-8 py-2">
                        {filteredVisits.map((visit) => (
                            <div key={visit._id} className="relative pl-6">
                                {/* Timeline Dot */}
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-base-100 shadow-sm"></div>

                                <div className="flex flex-col gap-2">
                                    {/* Date Header */}
                                    <span className="text-xs font-bold text-primary tracking-wider uppercase opacity-80">
                                        {new Date(visit.visitDate).toLocaleDateString("es-MX", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>

                                    {/* Card */}
                                    <div className="card bg-base-100 shadow-sm border border-base-content/5 overflow-hidden">
                                        <div className="flex">
                                            {visit.placeImage && (
                                                <div className="w-24 shrink-0">
                                                    <img src={visit.placeImage} className="w-full h-full object-cover opacity-90" alt="" />
                                                </div>
                                            )}
                                            <div className="p-3 flex-1 min-w-0">
                                                <h3 className="font-bold text-base line-clamp-1">{visit.placeName}</h3>

                                                {visit.notes && (
                                                    <p className="text-sm text-base-content/70 italic mt-1 line-clamp-2">"{visit.notes}"</p>
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
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 opacity-50 space-y-4">
                        <Calendar className="w-16 h-16 mx-auto text-base-content/20" />
                        <p>No se encontraron visitas.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
