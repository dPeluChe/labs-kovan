import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id, Doc } from "../../../../convex/_generated/dataModel";
import { Plane, Building, Car, Ticket, FileText } from "lucide-react";
import { EmptyState } from "../../ui/EmptyState";
import { AddBookingModal } from "../modals/AddBookingModal"; // We will create this
import { useState } from "react";

const TYPE_ICONS = {
    flight: Plane,
    hotel: Building,
    transport: Car, // approximate
    rental: Car,
    activity: Ticket,
    other: FileText
};

export function TripBookingsTab({ tripId }: { tripId: Id<"trips"> }) {
    const bookings = useQuery(api.trips.getTripBookings, { tripId });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Doc<"tripBookings"> | undefined>(undefined);

    const handleAdd = () => {
        setSelectedBooking(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (booking: Doc<"tripBookings">) => {
        setSelectedBooking(booking);
        setIsModalOpen(true);
    };

    if (bookings === undefined) return <div className="p-10 flex justify-center"><span className="loading loading-dots loading-md" /></div>;

    return (
        <div className="space-y-4">
            {bookings.length === 0 ? (
                <EmptyState
                    icon={Plane}
                    title="Sin reservas"
                    description="Agrega vuelos, hoteles y transporte."
                    action={
                        <button onClick={handleAdd} className="btn btn-primary btn-sm">
                            Agregar reserva
                        </button>
                    }
                />
            ) : (
                <div className="space-y-3">
                    {bookings.map((booking) => {
                        const Icon = TYPE_ICONS[booking.type as keyof typeof TYPE_ICONS] || FileText;
                        return (
                            <div
                                key={booking._id}
                                onClick={() => handleEdit(booking)}
                                className="card bg-base-100 shadow-sm border border-base-200 cursor-pointer hover:border-primary transition-colors"
                            >
                                <div className="card-body p-4 flex flex-row items-center gap-4">
                                    <div className="bg-base-200 p-3 rounded-full">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-sm truncate">{booking.provider}</h3>
                                        <p className="text-xs text-base-content/60 capitalize">
                                            {booking.type} {booking.location ? `• ${booking.location}` : ""}
                                        </p>
                                        <div className="text-xs mt-1 font-mono opacity-80">
                                            {booking.startDate ? new Date(booking.startDate).toLocaleDateString() : ""}
                                        </div>
                                    </div>
                                    {booking.cost && (
                                        <div className="font-semibold text-sm">
                                            ${booking.cost.toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <button onClick={handleAdd} className="btn btn-outline btn-block btn-sm mt-4">
                        + Agregar otra reserva
                    </button>
                </div>
            )}

            {isModalOpen && (
                <AddBookingModal
                    tripId={tripId}
                    booking={selectedBooking}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
}
