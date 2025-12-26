import { useState } from "react";
import { Clock, MapPin, AlignLeft } from "lucide-react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { useFamily } from "../../contexts/FamilyContext";
import { useToast } from "../../components/ui/Toast";
import { MobileModal } from "../ui/MobileModal";
import { DateInput } from "../ui/DateInput";


interface EventFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    preselectedDate?: Date;
    existingEvent?: Doc<"cachedCalendarEvents">;
    onSuccess?: () => void;
}

export function EventFormModal({ isOpen, onClose, preselectedDate, existingEvent, onSuccess }: EventFormModalProps) {
    const { currentFamily } = useFamily();
    const createEvent = useAction(api.calendar.createEvent);
    const updateEvent = useAction(api.calendar.updateEvent);
    const { showToast } = useToast();

    // Initial state based on existingEvent or defaults
    const [title, setTitle] = useState(existingEvent?.title || "");
    const [description, setDescription] = useState(existingEvent?.description || "");
    const [location, setLocation] = useState(existingEvent?.location || "");

    const initializeDates = () => {
        if (existingEvent) {
            const start = new Date(existingEvent.startDateTime);
            const end = new Date(existingEvent.endDateTime);
            return {
                d: start.toISOString().split('T')[0],
                s: start.toTimeString().slice(0, 5),
                e: end.toTimeString().slice(0, 5)
            };
        }
        const defaultStart = preselectedDate ? new Date(preselectedDate) : new Date();
        defaultStart.setHours(defaultStart.getHours() + 1, 0, 0, 0);
        const defaultEnd = new Date(defaultStart);
        defaultEnd.setHours(defaultEnd.getHours() + 1);

        return {
            d: defaultStart.toISOString().split('T')[0],
            s: defaultStart.toTimeString().slice(0, 5),
            e: defaultEnd.toTimeString().slice(0, 5)
        };
    };

    const [date, setDate] = useState(() => initializeDates().d);
    const [startTime, setStartTime] = useState(() => initializeDates().s);
    const [endTime, setEndTime] = useState(() => initializeDates().e);

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentFamily) return;

        setIsLoading(true);
        try {
            const startDateTime = new Date(`${date}T${startTime}`);
            const endDateTime = new Date(`${date}T${endTime}`);

            if (existingEvent) {
                await updateEvent({
                    familyId: currentFamily._id,
                    eventId: existingEvent.externalId,
                    title,
                    description: description || undefined,
                    location: location || undefined,
                    startTime: startDateTime.getTime(),
                    endTime: endDateTime.getTime(),
                });
                showToast("Evento actualizado", "success");
            } else {
                await createEvent({
                    familyId: currentFamily._id,
                    title,
                    description: description || undefined,
                    location: location || undefined,
                    startTime: startDateTime.getTime(),
                    endTime: endDateTime.getTime(),
                });
                showToast("Evento creado correctamente", "success");
            }

            if (onSuccess) onSuccess();
            handleClose();
        } catch (error) {
            console.error(error);
            showToast("Error al guardar evento. Verifica tu conexión.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        // Only reset if not editing existin event to allow re-opening same state? 
        // Or reset always. Resetting is safer.
        if (!existingEvent) {
            setTitle("");
            setDescription("");
            setLocation("");
        }
        onClose();
    }

    return (
        <MobileModal isOpen={isOpen} onClose={handleClose} title={existingEvent ? "Editar Evento" : "Nuevo Evento"}>
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Title */}
                <div className="form-control">
                    <input
                        type="text"
                        placeholder="Título del evento"
                        className="input input-lg text-lg font-semibold w-full focus:outline-none px-0 border-0 border-b-2 border-base-200 focus:border-primary rounded-none transition-colors"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        autoFocus={!existingEvent}
                    />
                </div>

                {/* Date & Time */}
                <div className="space-y-3">
                    <DateInput
                        value={date}
                        onChange={setDate}
                        required
                    />

                    <div className="flex items-center gap-3 text-base-content/80 pl-[2px]">
                        <Clock className="w-5 h-5 text-primary" />
                        <div className="flex items-center gap-2 flex-1">
                            <input
                                type="time"
                                className="input input-ghost input-sm w-full font-medium appearance-none min-h-[2.5rem]"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                                style={{ WebkitAppearance: 'none' }}
                            />
                            <span className="text-base-content/40">→</span>
                            <input
                                type="time"
                                className="input input-ghost input-sm w-full font-medium appearance-none min-h-[2.5rem]"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                                style={{ WebkitAppearance: 'none' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-3 text-base-content/80">
                    <MapPin className="w-5 h-5 text-base-content/40" />
                    <input
                        type="text"
                        placeholder="Ubicación (opcional)"
                        className="input input-ghost input-sm w-full"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                </div>

                {/* Description */}
                <div className="flex items-start gap-3 text-base-content/80">
                    <AlignLeft className="w-5 h-5 text-base-content/40 mt-2" />
                    <textarea
                        placeholder="Notas o descripción..."
                        className="textarea textarea-ghost w-full resize-none"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading || !title.trim()}
                    >
                        {isLoading && <span className="loading loading-spinner loading-xs"></span>}
                        {existingEvent ? "Actualizar Evento" : "Guardar Evento"}
                    </button>
                </div>
            </form>
        </MobileModal>
    );
}
