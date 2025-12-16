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

    return (
        <div className="space-y-4">
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

            {/* Quick Stats Grid */}
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
                        <div className="text-[10px] text-base-content/50">Gastado</div>
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
                        <span className="text-xs font-semibold text-base-content/60">Planes</span>
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

                                            {booking.startDate && (
                                                <div className="text-xs mt-1.5 flex items-center gap-1">
                                                    {(() => {
                                                        const now = new Date();
                                                        now.setHours(0, 0, 0, 0);
                                                        const bookDate = new Date(booking.startDate);
                                                        bookDate.setHours(0, 0, 0, 0);
                                                        const diffTime = bookDate.getTime() - now.getTime();
                                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                        if (diffDays < 0) return <span className="text-base-content/40">Completado</span>;
                                                        if (diffDays === 0) return <span className="text-success font-bold">¡Hoy!</span>;
                                                        if (diffDays === 1) return <span className="text-warning font-bold">Mañana</span>;
                                                        return <span className="text-primary font-medium">Faltan {diffDays} días</span>;
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-4 text-center text-sm text-base-content/60">
                                {bookings.length} reservas registradas (sin vuelos ni hoteles destacados).
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
