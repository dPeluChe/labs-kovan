import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Plane, Calendar, DollarSign, ArrowRight, Building, Car, Ticket, FileText } from "lucide-react";

const BOOKING_ICONS = {
    flight: Plane,
    hotel: Building,
    transport: Car,
    rental: Car,
    activity: Ticket,
    other: FileText
};

export function TripOverviewTab({ tripId, onChangeTab }: { tripId: Id<"trips">, onChangeTab: (tab: string) => void }) {
    const trip = useQuery(api.trips.getTrip, { tripId });
    const plans = useQuery(api.trips.getTripPlans, { tripId });
    const expenses = useQuery(api.expenses.getExpensesByTrip, { tripId });
    const bookings = useQuery(api.trips.getTripBookings, { tripId });

    if (!trip) return null;

    // Countdown logic
    const today = new Date().setHours(0, 0, 0, 0);
    const start = trip.startDate || 0;
    const diff = start - today;
    const daysToGo = Math.ceil(diff / (1000 * 60 * 60 * 24));

    // Stats
    const totalSpent = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const completedPlans = plans?.filter(p => p.isCompleted).length || 0;
    const totalPlans = plans?.length || 0;
    const completionRate = totalPlans > 0 ? (completedPlans / totalPlans) * 100 : 0;

    // Filter important bookings for summary (Flights and Hotels)
    const importantBookings = bookings?.filter(b => b.type === "flight" || b.type === "hotel")
        .sort((a, b) => (a.startDate || 0) - (b.startDate || 0)) || [];

    // Agenda Logic
    const todayTimestamp = new Date().setHours(0, 0, 0, 0);

    // Find plans for today
    let agendaTitle = "Agenda de Hoy";
    let agendaDateDisplay = new Date(todayTimestamp).toLocaleDateString("es-MX", { weekday: 'long', day: 'numeric', month: 'long' });
    let agendaPlans = plans?.filter(p => p.dayDate === todayTimestamp) || [];

    // If no plans today, find next scheduled day
    if (agendaPlans.length === 0 && plans && plans.length > 0) {
        // Sort plans by date
        const sortedPlans = [...plans].sort((a, b) => (a.dayDate || 0) - (b.dayDate || 0));
        // Find first plan in future (or today if I messed up logic, but we checked today equality above)
        // Actually we want nearest future date.
        const nextPlan = sortedPlans.find(p => (p.dayDate || 0) > todayTimestamp);

        if (nextPlan && nextPlan.dayDate) {
            const nextDate = nextPlan.dayDate;
            agendaPlans = plans.filter(p => p.dayDate === nextDate);
            agendaTitle = "Próxima Agenda";
            agendaDateDisplay = new Date(nextDate).toLocaleDateString("es-MX", { weekday: 'long', day: 'numeric', month: 'long' });
        } else if (sortedPlans.length > 0) {
            // Fallback: Show first day of trip if everything is in past? Or just last day?
            // Maybe show "Primer día" if trip hasn't started.
            // Let's just show top 3 upcoming or nothing.
        }
    }

    // Check if trip is completed or far past?
    // User wants "Activities of the day".

    return (
        <div className="space-y-6">
            {/* Countdown / Welcome Card */}
            <div className={`card overflow-hidden shadow-md text-white border-0 relative ${daysToGo > 0 ? "bg-gradient-to-br from-indigo-500 to-purple-600" : "bg-gradient-to-br from-emerald-500 to-teal-600"
                }`}>
                {/* Background decoration */}
                <Plane className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 rotate-12" />

                <div className="card-body p-6 relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            {daysToGo > 0 ? (
                                <>
                                    <div className="text-sm font-medium opacity-90 mb-1">Faltan</div>
                                    <div className="text-4xl font-black">{daysToGo}</div>
                                    <div className="text-sm opacity-90">días para el viaje</div>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold">¡Buen viaje!</h2>
                                    <p className="text-sm opacity-90">Disfruta cada momento.</p>
                                </>
                            )}
                        </div>
                        {trip.startDate && (
                            <div className="text-right">
                                <span className="block text-xs opacity-70">Salida</span>
                                <span className="font-bold">{new Date(trip.startDate).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Agenda Section (Primary) */}
            <div className="space-y-2">
                <div className="flex justify-between items-end px-1">
                    <div>
                        <h3 className="font-bold text-lg leading-none">{agendaTitle}</h3>
                        <p className="text-xs text-base-content/60 capitalize">{agendaDateDisplay}</p>
                    </div>
                    <button onClick={() => onChangeTab("itinerary")} className="btn btn-xs btn-ghost text-primary">
                        Ver todo <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                </div>

                <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
                    {agendaPlans.length > 0 ? (
                        <div className="divide-y divide-base-200">
                            {agendaPlans.map(plan => (
                                <div key={plan._id} className="p-3 flex gap-3 items-start hover:bg-base-50 transition-colors">
                                    <div className="w-12 pt-1 flex flex-col items-center shrink-0">
                                        <span className="font-mono text-xs font-bold text-base-content/70">
                                            {plan.time || "--:--"}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-medium text-sm ${plan.isCompleted ? 'line-through text-base-content/50' : ''}`}>
                                            {plan.activity}
                                        </div>
                                        {plan.notes && (
                                            <p className="text-xs text-base-content/60 truncate">{plan.notes}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-base-content/50">
                            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No hay actividades programadas para este periodo.</p>
                            <button onClick={() => onChangeTab("itinerary")} className="btn btn-sm btn-outline btn-primary mt-3">
                                Planear Itinerario
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Secondary Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div
                    onClick={() => onChangeTab("finances")}
                    className="card bg-base-100 border border-base-200 shadow-sm p-4 active:scale-95 transition-transform"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-green-100 text-green-600 rounded-md">
                            <DollarSign className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-base-content/60">Finanzas</span>
                    </div>
                    <div>
                        <div className="text-lg font-bold">${totalSpent.toLocaleString()}</div>
                    </div>
                </div>

                <div
                    onClick={() => onChangeTab("itinerary")}
                    className="card bg-base-100 border border-base-200 shadow-sm p-4 active:scale-95 transition-transform"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-base-content/60">Progreso</span>
                    </div>
                    <div className="w-full">
                        <div className="flex justify-between items-end mb-1">
                            <div className="text-lg font-bold">{completedPlans}/{totalPlans}</div>
                            <div className="text-[10px] text-base-content/50">{completionRate.toFixed(0)}%</div>
                        </div>
                        <progress className="progress progress-primary w-full h-1.5" value={completedPlans} max={totalPlans || 1}></progress>
                    </div>
                </div>
            </div>

            {/* Key Bookings Summary */}
            {bookings && bookings.length > 0 && (
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                    <div className="p-4 border-b border-base-200 flex justify-between items-center bg-base-50/50">
                        <h3 className="font-bold text-sm">Reservas Principales</h3>
                        <button onClick={() => onChangeTab("bookings")} className="btn btn-ghost btn-xs gap-1 text-primary">
                            Ver todas <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="divide-y divide-base-100">
                        {importantBookings.length > 0 ? (
                            importantBookings.map(booking => {
                                const Icon = BOOKING_ICONS[booking.type as keyof typeof BOOKING_ICONS] || FileText;
                                return (
                                    <div key={booking._id} className="p-3 flex items-start gap-3">
                                        <div className={`p-2 rounded-lg mt-1 ${booking.type === 'flight' ? 'bg-sky-100 text-sky-600' : 'bg-orange-100 text-orange-600'}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div className="font-bold text-sm truncate pr-2">{booking.provider}</div>
                                                {booking.confirmationCode && (
                                                    <span className="badge badge-sm badge-ghost font-mono text-[10px] tracking-wider shrink-0">
                                                        {booking.confirmationCode}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-xs text-base-content/60 flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                                                <span className="capitalize font-medium text-base-content/80">{booking.type}</span>
                                                {booking.location && <span>• {booking.location}</span>}
                                                {booking.startDate && (
                                                    <span>• {new Date(booking.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-4 text-center text-sm text-base-content/60">
                                {bookings.length} reservas registradas.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
