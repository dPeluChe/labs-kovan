import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { MobileModal } from "../../ui/MobileModal";
import { DateInput } from "../../ui/DateInput";
import { EVENT_TYPE_CONFIG, type EventType } from "../constants";

interface AddVehicleEventModalProps {
  sessionToken: string;
  vehicleId: Id<"vehicles">;
  vehicleName: string;
  onClose: () => void;
}

export function AddVehicleEventModal({
  sessionToken,
  vehicleId,
  vehicleName,
  onClose,
}: AddVehicleEventModalProps) {
  const [type, setType] = useState<EventType>("service");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [odometer, setOdometer] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createEvent = useMutation(api.vehicles.createVehicleEvent);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      if (!sessionToken) return;
      await createEvent({
        sessionToken,
        vehicleId,
        type,
        title: title.trim(),
        date: new Date(date).getTime(),
        amount: amount ? parseFloat(amount) : undefined,
        odometer: odometer ? parseInt(odometer, 10) : undefined,
        nextDate: nextDate ? new Date(nextDate).getTime() : undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeChange = (newType: EventType) => {
    setType(newType);
    if (!title.trim()) {
      setTitle(EVENT_TYPE_CONFIG[newType].label);
    }
  };

  return (
    <MobileModal
      isOpen={true}
      onClose={onClose}
      title="Nuevo evento"
    >
      <p className="text-sm text-base-content/60 mb-4">{vehicleName}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label"><span className="label-text">Tipo de evento</span></label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(EVENT_TYPE_CONFIG) as [EventType, typeof EVENT_TYPE_CONFIG[EventType]][]).map(([key, config]) => {
              const Icon = config.icon;
              const isActive = type === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTypeChange(key)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-base-300 hover:border-primary/50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Descripción *</span></label>
          <input
            type="text"
            placeholder="Ej: Cambio de aceite"
            className="input input-bordered w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <DateInput
            label="Fecha"
            value={date}
            onChange={setDate}
          />
          <div className="form-control">
            <label className="label"><span className="label-text">Monto</span></label>
            <input
              type="number"
              placeholder="$0.00"
              className="input input-bordered w-full"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="form-control">
            <label className="label"><span className="label-text">Kilometraje</span></label>
            <input
              type="number"
              placeholder="123,456"
              className="input input-bordered w-full"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
            />
          </div>
          <DateInput
            label="Próxima fecha"
            value={nextDate}
            onChange={setNextDate}
          />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Notas (opcional)</span></label>
          <textarea
            placeholder="Detalles adicionales..."
            className="textarea textarea-bordered w-full"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={isLoading || !title.trim()}>
            {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
          </button>
        </div>
      </form>
    </MobileModal>
  );
}
