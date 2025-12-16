import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArrowLeft, Calendar, Plus, LayoutDashboard, Plane, DollarSign, Lightbulb, Pencil, MapPin, CheckCircle2, Circle, Building, Car, Ticket, FileText } from "lucide-react";
import { MobileModal } from "../components/ui/MobileModal";
import { SwipeableCard } from "../components/ui/SwipeableCard";
import { Input } from "../components/ui/Input";
import { TextArea } from "../components/ui/TextArea";
import { DateInput } from "../components/ui/DateInput";
import { AnimatedTabs } from "../components/ui/AnimatedTabs";
import { TripOverviewTab } from "../components/trips/tabs/TripOverviewTab";
import { TripBookingsTab } from "../components/trips/tabs/TripBookingsTab";
import { TripFinancesTab } from "../components/trips/tabs/TripFinancesTab";
import { TripIdeasTab } from "../components/trips/tabs/TripIdeasTab";
import { EditTripModal } from "../components/trips/modals/EditTripModal";
import { TripPlanDetailModal } from "../components/trips/modals/TripPlanDetailModal";
import type { Id, Doc } from "../../convex/_generated/dataModel";

// Helper to normalized mixed items
type ItineraryItemType =
    | (Doc<"tripPlans"> & { kind: "plan"; placeName?: string })
    | (Doc<"tripBookings"> & { kind: "booking" });

export function TripDetailPage() {
    const { tripId } = useParams();
    const navigate = useNavigate();
    const trip = useQuery(api.trips.getTrip, { tripId: tripId as Id<"trips"> });
    const plans = useQuery(api.trips.getTripPlans, { tripId: tripId as Id<"trips"> });
    const bookings = useQuery(api.trips.getTripBookings, { tripId: tripId as Id<"trips"> }); // Need bookings here
    const deletePlan = useMutation(api.trips.deleteTripPlan);
    const toggleCompletion = useMutation(api.trips.togglePlanCompletion);

    const [activeTab, setActiveTab] = useState("overview");
    const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [preselectedPlaceId, setPreselectedPlaceId] = useState<Id<"places"> | undefined>(undefined);
    const [selectedPlanId, setSelectedPlanId] = useState<Id<"tripPlans"> | undefined>(undefined);
    const [planToEditId, setPlanToEditId] = useState<Id<"tripPlans"> | undefined>(undefined);

    if (trip === undefined || plans === undefined || bookings === undefined) return null;
    if (trip === null) return <div>Viaje no encontrado</div>;

    const tabs = [
        { id: "overview", label: "Resumen", icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: "itinerary", label: "Itinerario", icon: <Calendar className="w-5 h-5" /> },
        { id: "bookings", label: "Reservas", icon: <Plane className="w-5 h-5" /> },
        { id: "finances", label: "Finanzas", icon: <DollarSign className="w-5 h-5" /> },
        { id: "ideas", label: "Ideas", icon: <Lightbulb className="w-5 h-5" /> },
    ];

    // Mix and Group items by date
    const mixedItems: ItineraryItemType[] = [
        ...plans.map(p => ({ ...p, kind: "plan" as const })),
        ...bookings.filter(b => b.startDate).map(b => ({ ...b, kind: "booking" as const }))
    ];

    const groupedItems = mixedItems.reduce((acc, item) => {
        const dateKey = item.kind === "plan"
            ? (item.dayDate ? new Date(item.dayDate).toDateString() : 'unscheduled')
            : (item.startDate ? new Date(item.startDate).toDateString() : 'unscheduled');

        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
    }, {} as Record<string, ItineraryItemType[]>);

    // Sort items within each day
    Object.keys(groupedItems).forEach(key => {
        groupedItems[key].sort((a, b) => {
            // Plans with time string vs Booking numeric timestamp
            const getTime = (item: ItineraryItemType) => {
                if (item.kind === "booking") return new Date(item.startDate).getHours() * 60 + new Date(item.startDate).getMinutes();
                if (item.kind === "plan" && item.time) {
                    const [h, m] = item.time.split(':').map(Number);
                    return h * 60 + m;
                }
                return 0; // Default to start of day
            };
            return getTime(a) - getTime(b);
        });
    });

    // Generate days array if dates exist
    const days = [];
    if (trip.startDate && trip.endDate) {
        const current = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        while (current <= end) {
            days.push(new Date(current)); // Push copy
            current.setDate(current.getDate() + 1);
        }
    }

    // Combine actual trip days and unscheduled plans for sorting
    const sortedDates = [
        ...days.map(d => d.toDateString()),
        ...(groupedItems['unscheduled'] ? ['unscheduled'] : [])
    ].filter((value, index, self) => self.indexOf(value) === index); // Ensure unique dates

    return (
        <div className="pb-24">
            <div className="sticky top-0 z-20 bg-base-100/80 backdrop-blur-md border-b border-base-200">
                <div className="navbar min-h-16 px-4 gap-2">
                    <button onClick={() => navigate(-1)} className="btn btn-ghost btn-circle btn-sm">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-bold text-lg truncate leading-tight">{trip.name}</h1>
                        <p className="text-xs text-base-content/60 truncate flex items-center gap-1">
                            {trip.destination && <span>{trip.destination} • </span>}
                            {trip.status}
                        </p>
                    </div>
                    <button onClick={() => setIsEditOpen(true)} className="btn btn-ghost btn-circle btn-sm">
                        <Pencil className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-4 pb-2">
                    <AnimatedTabs
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />
                </div>
            </div>

            <div className="p-4 space-y-6">
                {activeTab === "overview" && (
                    <TripOverviewTab tripId={tripId as Id<"trips">} onChangeTab={setActiveTab} />
                )}

                {activeTab === "itinerary" && (
                    trip.startDate && trip.endDate ? (
                        <div className="space-y-8">
                            {sortedDates.map((dateKey) => {
                                const dayItems = groupedItems[dateKey] || [];
                                const isUnscheduled = dateKey === "unscheduled";
                                const displayDate = isUnscheduled ? "Sin fecha" : new Date(dateKey).toLocaleDateString("es-ES", { weekday: 'long', day: 'numeric', month: 'long' });

                                return (
                                    <div key={dateKey} className="relative pl-4 border-l-2 border-primary/20 pb-4">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-base-100" />
                                        <h3 className="font-bold text-lg mb-3 capitalize text-primary">{displayDate}</h3>
                                        <div className="space-y-3">
                                            {dayItems.length === 0 ? (
                                                <div className="text-sm text-base-content/40 italic py-2">
                                                    Nada planeado para este día
                                                </div>
                                            ) : (
                                                dayItems.map((item) => {
                                                    if (item.kind === "booking") {
                                                        const Icon = BOOKING_ICONS[item.type as keyof typeof BOOKING_ICONS] || Plane;
                                                        return (
                                                            <div key={item._id} className="card bg-base-200/50 border border-base-200 p-3 flex flex-row gap-3 items-center">
                                                                <div className="p-2 bg-base-100 rounded-lg shrink-0">
                                                                    <Icon className="w-4 h-4 text-base-content/70" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-bold text-sm truncate">{item.provider}</div>
                                                                    <div className="text-xs text-base-content/60 flex gap-2">
                                                                        <span className="capitalize font-medium">{item.type}</span>
                                                                        <span>{new Date(item.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <PlanItem
                                                            key={item._id}
                                                            plan={item}
                                                            onDelete={() => deletePlan({ planId: item._id })}
                                                            onCheckIn={() => toggleCompletion({ planId: item._id })}
                                                            onSelect={() => setSelectedPlanId(item._id)}
                                                        />
                                                    );
                                                })
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIsAddPlanOpen(true);
                                            }}
                                            className="btn btn-xs btn-ghost text-primary gap-1 pl-0 opacity-50 hover:opacity-100 mt-2"
                                        >
                                            <Plus className="w-3 h-3" /> Agregar actividad
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 space-y-4">
                            <Calendar className="w-12 h-12 mx-auto text-base-content/20" />
                            <div>
                                <h3 className="font-bold">Sin fechas definidas</h3>
                                <p className="text-sm text-base-content/60">Configura las fechas de tu viaje para poder armar un itinerario detallado.</p>
                            </div>
                            <button onClick={() => setIsEditOpen(true)} className="btn btn-primary btn-sm">Configurar fechas</button>
                        </div>
                    )
                )}

                {activeTab === "bookings" && (
                    <TripBookingsTab tripId={tripId as Id<"trips">} />
                )}

                {activeTab === "finances" && (
                    <TripFinancesTab tripId={tripId as Id<"trips">} />
                )}

                {activeTab === "ideas" && (
                    <TripIdeasTab
                        tripId={tripId as Id<"trips">}
                        onAddToItinerary={(place) => {
                            setPreselectedPlaceId(place._id);
                            setIsAddPlanOpen(true);
                            // Optionally switch tab? setActiveTab("itinerary");
                        }}
                    />
                )}
            </div>

            {isAddPlanOpen && (
                <AddPlanModal
                    tripId={tripId as Id<"trips">}
                    familyId={trip.familyId}
                    placeListId={trip.placeListId}
                    initialPlaceId={preselectedPlaceId}
                    minDate={trip.startDate}
                    maxDate={trip.endDate}
                    editPlanId={planToEditId}
                    onClose={() => {
                        setIsAddPlanOpen(false);
                        setPreselectedPlaceId(undefined);
                        setPlanToEditId(undefined);
                    }}
                />
            )}

            {isEditOpen && (
                <EditTripModal
                    trip={trip}
                    onClose={() => setIsEditOpen(false)}
                />
            )}

            {selectedPlanId && (
                <TripPlanDetailModal
                    planId={selectedPlanId}
                    onClose={() => setSelectedPlanId(undefined)}
                    onEdit={() => {
                        setPlanToEditId(selectedPlanId);
                        setSelectedPlanId(undefined);
                        setIsAddPlanOpen(true);
                    }}
                    onDelete={() => {
                        deletePlan({ planId: selectedPlanId });
                        setSelectedPlanId(undefined);
                    }}
                    onToggleCompletion={() => {
                        toggleCompletion({ planId: selectedPlanId });
                        // Don't close, let user see status change? Or close.
                        // User might want to toggle and stay.
                        // But modal has button inside.
                    }}
                />
            )}
        </div>
    );
}

function PlanItem({ plan, onDelete, onCheckIn, onSelect }: {
    plan: Doc<"tripPlans"> & { placeName?: string },
    onDelete?: () => void,
    onCheckIn: () => void,
    onSelect: () => void
}) {
    return (
        <SwipeableCard
            className="mb-1"
            contentClassName={`relative bg-base-100 p-3 border border-base-200 rounded-xl shadow-sm z-10 select-none ${plan.isCompleted ? 'bg-base-200 opacity-60' : ''}`}
            actionWidth={100} // Adjusted width for 2 buttons
            onClick={onSelect}
            actions={({ close }) => (
                <>
                    <button
                        className={`btn btn-sm btn-circle shadow-sm ${plan.isCompleted ? 'btn-warning text-white' : 'btn-success text-white'}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            close();
                            onCheckIn();
                        }}
                    >
                        {plan.isCompleted ? <Circle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    {onDelete && (
                        <button
                            className="btn btn-sm btn-circle btn-error text-white shadow-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                close();
                                onDelete();
                            }}
                        >
                            <span className="text-lg">×</span>
                        </button>
                    )}
                </>
            )}
        >
            <div className="flex gap-3 items-start">
                {plan.time ? (
                    <div className="pt-0.5 flex flex-col items-center min-w-[3rem] border-r border-base-content/10 pr-2 mr-1">
                        <span className="font-mono text-sm font-bold text-primary">{plan.time}</span>
                        {plan.isCompleted && <span className="text-[10px] text-success font-bold uppercase mt-1">Listo</span>}
                    </div>
                ) : (
                    /* Minimal indicator for untimed activities */
                    <div className="pt-1.5 flex flex-col items-center min-w-[1rem] mr-2">
                        <div className={`w-2 h-2 rounded-full ${plan.isCompleted ? 'bg-success' : 'bg-primary/20'}`} />
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className={`font-medium leading-tight ${plan.isCompleted ? 'line-through text-base-content/50' : 'text-base-content'}`}>
                        {plan.activity}
                    </div>

                    {plan.placeName && (
                        <div className="text-xs text-primary/80 mt-0.5 flex items-center gap-1 font-medium">
                            <MapPin className="w-3 h-3" /> {plan.placeName}
                        </div>
                    )}

                    {plan.notes && (
                        <p className="text-xs text-base-content/60 mt-1 line-clamp-2">
                            {plan.notes}
                        </p>
                    )}
                </div>

                {/* Drag Hint */}
                <div className="w-1 h-8 rounded-full bg-base-200 ml-1 self-center shrink-0 opacity-50" />
            </div>
        </SwipeableCard>
    );
}

const BOOKING_ICONS = {
    flight: Plane,
    hotel: Building,
    transport: Car,
    rental: Car,
    activity: Ticket,
    other: FileText
};

function AddPlanModal({ tripId, familyId, placeListId, initialPlaceId, minDate, maxDate, editPlanId, onClose }: {
    tripId: Id<"trips">,
    familyId: Id<"families">,
    placeListId?: Id<"placeLists"> | null,
    initialPlaceId?: Id<"places">,
    minDate?: number,
    maxDate?: number,
    editPlanId?: Id<"tripPlans">,
    onClose: () => void
}) {
    const addPlan = useMutation(api.trips.addTripPlan);
    const updatePlan = useMutation(api.trips.updateTripPlan);

    // Conditionally fetch places based on list ID
    const places = useQuery(api.places.getPlaces, { familyId, listId: placeListId || undefined });
    const planToEdit = useQuery(api.trips.getTripPlan, editPlanId ? { planId: editPlanId } : "skip");

    const [activity, setActivity] = useState("");
    const [placeId, setPlaceId] = useState<Id<"places"> | "">(initialPlaceId || "");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Load data for editing
    useEffect(() => {
        if (planToEdit) {
            setActivity(planToEdit.activity || "");
            setPlaceId(planToEdit.placeId || "");
            if (planToEdit.dayDate) {
                // Ensure correct date string format (YYYY-MM-DD)
                const d = new Date(planToEdit.dayDate);
                setDate(d.toISOString().split('T')[0]);
            }
            setTime(planToEdit.time || "");
            setNotes(planToEdit.notes || "");
        }
    }, [planToEdit]);

    // Pre-fill activity name if initialPlaceId is present and places loaded
    // Let's use useState default if possible, but places might be undefined initially.
    // We'll use an effect.

    useEffect(() => {
        if (initialPlaceId && places && !activity) {
            const p = places.find(pl => pl._id === initialPlaceId);
            if (p) {
                setActivity(`Visitar ${p.name} `);
            }
        }
    }, [initialPlaceId, places, activity]); // Added activity to dependencies to prevent re-setting if user types

    // Auto-fill activity name when place is selected if empty
    const handlePlaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPlaceId = e.target.value as Id<"places">;
        setPlaceId(newPlaceId);
        if (newPlaceId && !activity && places) {
            const place = places.find(p => p._id === newPlaceId);
            if (place) {
                setActivity(`Visitar ${place.name} `);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activity.trim()) return;

        setIsLoading(true);
        try {
            const dayTimestamp = date ? new Date(date + "T12:00:00").getTime() : undefined;

            if (editPlanId) {
                await updatePlan({
                    planId: editPlanId,
                    activity: activity.trim(),
                    placeId: placeId && placeId !== "" ? (placeId as Id<"places">) : undefined,
                    dayDate: dayTimestamp,
                    time: time || undefined,
                    notes: notes.trim() || undefined,
                });
            } else {
                await addPlan({
                    tripId,
                    placeId: placeId && placeId !== "" ? (placeId as Id<"places">) : undefined,
                    activity: activity.trim(),
                    dayDate: dayTimestamp,
                    time: time || undefined,
                    notes: notes.trim() || undefined,
                });
            }
            onClose();
        } catch (error) {
            console.error("Error saving plan:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MobileModal isOpen onClose={onClose} title={editPlanId ? "Editar Actividad" : "Nueva Actividad"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-control">
                    <label className="label"><span className="label-text">Lugar (Opcional)</span></label>

                    {!placeListId ? (
                        <div className="alert alert-warning py-2 text-xs flex shadow-sm">
                            <Lightbulb className="w-4 h-4 shrink-0" /> {/* Need Icon */}
                            <span>
                                No has vinculado una lista de lugares.
                                <br />Vincula una en la pestaña <strong>Ideas</strong> para ver tus sugerencias aquí.
                            </span>
                        </div>
                    ) : (
                        <select
                            className="select select-bordered w-full"
                            value={placeId}
                            onChange={handlePlaceChange}
                        >
                            <option value="">-- Seleccionar lugar de lista --</option>
                            {places?.map(place => (
                                <option key={place._id} value={place._id}>{place.name}</option>
                            ))}
                        </select>
                    )}
                    {/* Fallback to allow adding manual even if list not linked? User asked to "force" assoc, but maybe just warning is enough. The previous dropdown logic allowed selecting from ALL places. Now we restrict. */}
                </div>

                <Input
                    label="Actividad *"
                    placeholder="Ej. Visitar Museo del Prado"
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-3">
                    <DateInput
                        label="Fecha (Opcional)"
                        value={date}
                        onChange={setDate}
                        min={minDate ? new Date(minDate).toISOString().split('T')[0] : undefined}
                        max={maxDate ? new Date(maxDate).toISOString().split('T')[0] : undefined}
                    />
                    <Input
                        label="Hora (Opcional)"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                    />
                </div>

                <TextArea
                    label="Notas"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                />

                <div className="modal-action">
                    <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={!activity.trim() || isLoading}>
                        {isLoading ? <span className="loading loading-spinner" /> : "Guardar"}
                    </button>
                </div>
            </form>
        </MobileModal>
    );
}
