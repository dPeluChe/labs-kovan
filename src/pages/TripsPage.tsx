
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { Plane, Plus, Calendar, MapPin, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { MobileModal } from "../components/ui/MobileModal";
import { Input } from "../components/ui/Input";
import { DateInput } from "../components/ui/DateInput";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { motion } from "framer-motion";
import type { Id } from "../../convex/_generated/dataModel";

export function TripsPage() {
    const { currentFamily } = useFamily();
    const familyId = currentFamily?._id;
    const trips = useQuery(api.trips.getTrips, familyId ? { familyId } : "skip");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

    // Filter Logic
    const filteredTrips = trips?.filter(t => {
        const isCompleted = t.status === "completed";
        if (filter === "upcoming") return !isCompleted;
        return isCompleted;
    });

    if (trips === undefined) return <PageLoader />;

    return (
        <div className="pb-20">
            <PageHeader
                title="Viajes"
                subtitle="Planea tus próximas aventuras"
                action={
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="btn btn-sm btn-primary gap-2"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Viaje
                    </button>
                }
            />

            <div className="px-4 mb-4">
                <div role="tablist" className="tabs tabs-boxed bg-base-200/50 p-1 w-fit">
                    <a
                        role="tab"
                        className={`tab ${filter === 'upcoming' ? 'tab-active bg-base-100 shadow-sm transition-all' : ''}`}
                        onClick={() => setFilter('upcoming')}
                    >
                        Próximos
                    </a>
                    <a
                        role="tab"
                        className={`tab ${filter === 'past' ? 'tab-active bg-base-100 shadow-sm transition-all' : ''}`}
                        onClick={() => setFilter('past')}
                    >
                        Historial
                    </a>
                </div>
            </div>

            <div className="px-4">
                {filteredTrips?.length === 0 ? (
                    <EmptyState
                        icon={Plane}
                        title={filter === 'upcoming' ? "Sin viajes próximos" : "Sin historial"}
                        description={filter === 'upcoming' ? "Crea tu primer viaje para empezar a organizar tu itinerario." : "Tus viajes completados aparecerán aquí."}
                        action={
                            filter === 'upcoming' ? (
                                <button
                                    onClick={() => setIsCreateOpen(true)}
                                    className="btn btn-primary"
                                >
                                    Crear viaje
                                </button>
                            ) : null
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTrips?.map((trip) => (
                            <Link key={trip._id} to={`/trips/${trip._id}`}>
                                <motion.div
                                    whileTap={{ scale: 0.98 }}
                                    className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden hover:shadow-md transition-all h-full"
                                >
                                    {/* Cover Image Placeholder - Could be real image later */}
                                    <div className={`h-32 w-full ${trip.coverImage ? '' : 'bg-gradient-to-r from-blue-500 to-cyan-400'} flex items-center justify-center relative`}>
                                        {trip.coverImage ? (
                                            <img src={trip.coverImage} alt={trip.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Plane className="w-12 h-12 text-white/50" />
                                        )}
                                        <div className={`absolute top-2 right-2 badge badge-sm ${trip.status === 'completed' ? 'badge-ghost bg-base-100/50' : 'bg-black/30 text-white'} border-0 backdrop-blur-md uppercase text-[10px] font-bold tracking-wider`}>
                                            {trip.status === 'planning' ? 'Planeando' : trip.status === 'completed' ? 'Completado' : trip.status}
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <h3 className="font-bold text-lg mb-1 flex items-center justify-between">
                                            {trip.name}
                                            <ChevronRight className="w-4 h-4 text-base-content/30" />
                                        </h3>

                                        {trip.destination && (
                                            <div className="flex items-center text-sm text-base-content/70 mb-2">
                                                <MapPin className="w-3.5 h-3.5 mr-1" />
                                                {trip.destination}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 text-xs text-base-content/60 mt-4">
                                            {trip.startDate && (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center bg-base-200 px-2 py-1 rounded-md">
                                                        <Calendar className="w-3 h-3 mr-1.5" />
                                                        {new Date(trip.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                    </div>

                                                    {(() => {
                                                        if (trip.status === 'completed') return null;
                                                        const now = new Date();
                                                        now.setHours(0, 0, 0, 0);
                                                        const startDate = new Date(trip.startDate);
                                                        startDate.setHours(0, 0, 0, 0);
                                                        const diffTime = startDate.getTime() - now.getTime();
                                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                        if (diffDays < 0) return null;
                                                        if (diffDays === 0) return <span className="text-xs font-bold text-success animate-pulse">¡Hoy comienza!</span>;
                                                        if (diffDays === 1) return <span className="text-xs font-bold text-warning">¡Mañana!</span>;
                                                        return <span className="text-xs font-medium text-primary">Faltan {diffDays} días</span>;
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {isCreateOpen && (
                <CreateTripModal
                    familyId={familyId!}
                    onClose={() => setIsCreateOpen(false)}
                />
            )}
        </div>
    );
}

function CreateTripModal({ familyId, onClose }: { familyId: string, onClose: () => void }) {
    const createTrip = useMutation(api.trips.createTrip);
    const [name, setName] = useState("");
    const [destination, setDestination] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [budget, setBudget] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await createTrip({
                familyId: familyId as Id<"families">,
                name,
                destination: destination || undefined,
                startDate: startDate ? new Date(startDate).getTime() : undefined,
                endDate: endDate ? new Date(endDate).getTime() : undefined,
                budget: budget ? parseFloat(budget) : undefined,
            });
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MobileModal isOpen onClose={onClose} title="Nuevo Viaje">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Nombre del viaje *"
                    placeholder="Ej. Japón 2025"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                />
                <Input
                    label="Destino principal"
                    placeholder="Ej. Tokio, Kioto"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-3">
                    <DateInput
                        label="Inicio"
                        value={startDate}
                        onChange={setStartDate}
                    />
                    <DateInput
                        label="Fin"
                        value={endDate}
                        onChange={setEndDate}
                    />
                </div>

                <Input
                    label="Presupuesto aproximado"
                    type="number"
                    placeholder="0.00"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                />

                <div className="modal-action">
                    <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!name.trim() || isLoading}
                    >
                        {isLoading ? <span className="loading loading-spinner" /> : "Crear Viaje"}
                    </button>
                </div>
            </form>
        </MobileModal>
    );
}
