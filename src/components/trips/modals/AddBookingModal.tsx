import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id, Doc } from "../../../../convex/_generated/dataModel";
import { MobileModal } from "../../ui/MobileModal";
import { Input } from "../../ui/Input";
import { DateInput } from "../../ui/DateInput";
import { TextArea } from "../../ui/TextArea";
import { Trash2 } from "lucide-react";

interface AddBookingModalProps {
    tripId: Id<"trips">;
    booking?: Doc<"tripBookings">;
    onClose: () => void;
}

export function AddBookingModal({ tripId, booking, onClose }: AddBookingModalProps) {
    const addBooking = useMutation(api.trips.addTripBooking);
    const updateBooking = useMutation(api.trips.updateTripBooking);
    const deleteBooking = useMutation(api.trips.deleteTripBooking);

    const [type, setType] = useState("flight");
    const [provider, setProvider] = useState("");
    const [startDate, setStartDate] = useState("");
    const [cost, setCost] = useState("");
    const [bookingRef, setBookingRef] = useState(""); // Confirmation Code
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (booking) {
            setType(booking.type);
            setProvider(booking.provider);
            setStartDate(booking.startDate ? new Date(booking.startDate).toISOString().split('T')[0] : "");
            setCost(booking.cost ? booking.cost.toString() : "");
            setBookingRef(booking.confirmationCode || "");
            setNotes(booking.notes || "");
        }
    }, [booking]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!provider.trim()) return;

        setIsLoading(true);
        try {
            const commonData = {
                type: type as "flight" | "hotel" | "transport" | "rental" | "activity" | "other",
                provider: provider.trim(),
                startDate: startDate ? new Date(startDate).getTime() : Date.now(),
                cost: cost ? parseFloat(cost) : undefined,
                confirmationCode: bookingRef.trim() || undefined,
                notes: notes.trim() || undefined,
            };

            if (booking) {
                await updateBooking({
                    bookingId: booking._id,
                    ...commonData,
                });
            } else {
                await addBooking({
                    tripId,
                    ...commonData,
                });
            }
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!booking) return;
        if (!confirm("¿Seguro que deseas eliminar esta reserva?")) return;

        setIsLoading(true);
        try {
            await deleteBooking({ bookingId: booking._id });
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MobileModal isOpen onClose={onClose} title={booking ? "Editar Reserva" : "Nueva Reserva"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-control">
                    <label className="label"><span className="label-text">Tipo</span></label>
                    <select className="select select-bordered w-full" value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="flight">Vuelo</option>
                        <option value="hotel">Hospedaje</option>
                        <option value="transport">Transporte (Tren/Bus)</option>
                        <option value="rental">Renta de Auto</option>
                        <option value="activity">Actividad / Tour</option>
                        <option value="other">Otro</option>
                    </select>
                </div>

                <Input
                    label="Proveedor *"
                    placeholder="Ej. Aeromexico, Airbnb..."
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                />

                <Input
                    label="Código de confirmación"
                    placeholder="XYZ123"
                    value={bookingRef}
                    onChange={(e) => setBookingRef(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-3">
                    <DateInput
                        label="Fecha Inicio *"
                        value={startDate}
                        onChange={setStartDate}
                    />
                    <Input
                        label="Costo"
                        type="number"
                        placeholder="0.00"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                    />
                </div>

                <TextArea
                    label="Notas"
                    placeholder="Horarios, terminales, dirección..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />

                <div className="modal-action justify-between">
                    {booking && (
                        <button type="button" className="btn btn-ghost text-error" onClick={handleDelete} disabled={isLoading}>
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                    <div className="flex gap-2">
                        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading || !provider.trim()}>
                            {isLoading ? <span className="loading loading-spinner" /> : "Guardar"}
                        </button>
                    </div>
                </div>
            </form>
        </MobileModal>
    );
}
