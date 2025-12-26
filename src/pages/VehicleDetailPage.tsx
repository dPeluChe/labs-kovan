import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { useConfirmModal } from "../hooks/useConfirmModal";
import { DateInput } from "../components/ui/DateInput";
import {
  ArrowLeft,
  Plus,
  Car,
  Fuel,
  Wrench,
  Shield,
  FileCheck,
  MoreVertical,
  Edit2,
  Trash2,
  Calendar,
  Gauge,
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";
import { MobileModal } from "../components/ui/MobileModal";

const EVENT_TYPE_CONFIG = {
  verification: { label: "Verificación", icon: FileCheck, color: "text-blue-600 bg-blue-500/10" },
  service: { label: "Servicio", icon: Wrench, color: "text-orange-600 bg-orange-500/10" },
  insurance: { label: "Seguro", icon: Shield, color: "text-purple-600 bg-purple-500/10" },
  fuel: { label: "Gasolina", icon: Fuel, color: "text-yellow-600 bg-yellow-500/10" },
  repair: { label: "Reparación", icon: Wrench, color: "text-red-600 bg-red-500/10" },
  other: { label: "Otro", icon: Car, color: "text-gray-600 bg-gray-500/10" },
};

type EventType = keyof typeof EVENT_TYPE_CONFIG;

export function VehicleDetailPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { currentFamily } = useFamily();
  const { user } = useAuth();
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(false);
  const { confirm, ConfirmModal } = useConfirmModal();

  const vehicle = useQuery(
    api.vehicles.getVehicle,
    vehicleId ? { vehicleId: vehicleId as Id<"vehicles"> } : "skip"
  );

  const events = useQuery(
    api.vehicles.getVehicleEvents,
    vehicleId ? { vehicleId: vehicleId as Id<"vehicles"> } : "skip"
  );

  const deleteVehicle = useMutation(api.vehicles.deleteVehicle);
  const deleteEvent = useMutation(api.vehicles.deleteVehicleEvent);

  if (vehicle === undefined || events === undefined) {
    return <PageLoader />;
  }

  if (!vehicle) {
    return (
      <div className="p-4">
        <EmptyState
          icon={Car}
          title="Vehículo no encontrado"
          description="Este vehículo no existe o fue eliminado"
          action={
            <button onClick={() => navigate("/vehicles")} className="btn btn-primary btn-sm">
              Volver a Autos
            </button>
          }
        />
      </div>
    );
  }

  const handleDeleteVehicle = async () => {
    const confirmed = await confirm({
      title: "Eliminar vehículo",
      message: `¿Eliminar "${vehicle.name}" y todos sus eventos? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      variant: "danger",
      icon: "trash",
    });
    if (confirmed) {
      await deleteVehicle({ vehicleId: vehicle._id });
      navigate("/vehicles");
    }
  };

  const handleDeleteEvent = async (eventId: Id<"vehicleEvents">, title: string) => {
    const confirmed = await confirm({
      title: "Eliminar evento",
      message: `¿Eliminar "${title}"?`,
      confirmText: "Eliminar",
      variant: "danger",
    });
    if (confirmed) {
      await deleteEvent({ eventId });
    }
  };

  // Calculate total spent
  const totalSpent = events.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Sort events by date (most recent first)
  const sortedEvents = [...events].sort((a, b) => b.date - a.date);

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-base-100 border-b border-base-300 sticky top-0 z-10">
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => navigate("/vehicles")} className="btn btn-ghost btn-sm btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{vehicle.name}</h1>
            <p className="text-sm text-base-content/60">
              {[vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(" ")}
              {vehicle.plate && ` • ${vehicle.plate}`}
            </p>
          </div>
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
              <MoreVertical className="w-5 h-5" />
            </button>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-48">
              <li><a onClick={() => setEditingVehicle(true)}><Edit2 className="w-4 h-4" /> Editar</a></li>
              <li><a onClick={handleDeleteVehicle} className="text-error"><Trash2 className="w-4 h-4" /> Eliminar</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="px-4 py-4">
        <div className="card bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/30">
          <div className="card-body p-4">
            <div className="flex items-center gap-4">
              <div className="bg-green-500/20 p-3 rounded-xl">
                <Car className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-base-content/60">Total gastado</div>
                    <div className="text-xl font-bold text-green-600">
                      ${totalSpent.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-base-content/60">Eventos</div>
                    <div className="text-xl font-bold">{events.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Button */}
      <div className="px-4 mb-4">
        <button
          onClick={() => setShowAddEvent(true)}
          className="btn btn-primary btn-block gap-2"
        >
          <Plus className="w-5 h-5" />
          Agregar evento / gasto
        </button>
      </div>

      {/* Events List */}
      <div className="px-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Historial
        </h3>

        {sortedEvents.length === 0 ? (
          <EmptyState
            icon={Car}
            title="Sin eventos"
            description="Agrega servicios, verificaciones, gasolina y más"
          />
        ) : (
          <div className="space-y-2 stagger-children">
            {sortedEvents.map((event) => {
              const config = EVENT_TYPE_CONFIG[event.type as EventType] || EVENT_TYPE_CONFIG.other;
              const Icon = config.icon;
              return (
                <div
                  key={event._id}
                  className="card bg-base-100 border border-base-300 animate-fade-in"
                >
                  <div className="card-body p-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{event.title}</div>
                        <div className="flex items-center gap-2 text-xs text-base-content/60">
                          <span className="badge badge-sm badge-ghost">{config.label}</span>
                          <span>{new Date(event.date).toLocaleDateString("es-MX")}</span>
                          {event.odometer && (
                            <span className="flex items-center gap-0.5">
                              <Gauge className="w-3 h-3" /> {event.odometer.toLocaleString()} km
                            </span>
                          )}
                        </div>
                      </div>
                      {event.amount && event.amount > 0 && (
                        <div className="text-right">
                          <div className="font-bold text-green-600">${event.amount.toLocaleString()}</div>
                        </div>
                      )}
                      <button
                        onClick={() => handleDeleteEvent(event._id, event.title)}
                        className="btn btn-ghost btn-xs btn-circle text-error"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {event.notes && (
                      <p className="text-xs text-base-content/60 mt-1 pl-12">{event.notes}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showAddEvent && currentFamily && user && (
        <AddEventModal
          vehicleId={vehicle._id}
          vehicleName={vehicle.name}
          familyId={currentFamily._id}
          userId={user._id}
          onClose={() => setShowAddEvent(false)}
        />
      )}

      {/* Edit Vehicle Modal */}
      {editingVehicle && (
        <EditVehicleModal
          vehicle={vehicle}
          onClose={() => setEditingVehicle(false)}
        />
      )}

      <ConfirmModal />
    </div>
  );
}

function AddEventModal({
  vehicleId,
  vehicleName,
  familyId,
  userId,
  onClose,
}: {
  vehicleId: Id<"vehicles">;
  vehicleName: string;
  familyId: Id<"families">;
  userId: Id<"users">;
  onClose: () => void;
}) {
  const [type, setType] = useState<EventType>("service");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [odometer, setOdometer] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createEvent = useMutation(api.vehicles.createVehicleEvent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await createEvent({
        vehicleId,
        familyId,
        type,
        title: title.trim(),
        date: new Date(date).getTime(),
        amount: amount ? parseFloat(amount) : undefined,
        odometer: odometer ? parseInt(odometer) : undefined,
        nextDate: nextDate ? new Date(nextDate).getTime() : undefined,
        notes: notes.trim() || undefined,
        paidBy: amount ? userId : undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fill title based on type
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
        {/* Event Type */}
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

        {/* Title */}
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

        {/* Date and Amount */}
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

        {/* Odometer and Next Date */}
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

        {/* Notes */}
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

function EditVehicleModal({
  vehicle,
  onClose,
}: {
  vehicle: {
    _id: Id<"vehicles">;
    name: string;
    plate?: string;
    brand?: string;
    model?: string;
    year?: number;
    color?: string;
    notes?: string;
  };
  onClose: () => void;
}) {
  const [name, setName] = useState(vehicle.name);
  const [plate, setPlate] = useState(vehicle.plate || "");
  const [brand, setBrand] = useState(vehicle.brand || "");
  const [model, setModel] = useState(vehicle.model || "");
  const [year, setYear] = useState(vehicle.year?.toString() || "");
  const [color, setColor] = useState(vehicle.color || "");
  const [isLoading, setIsLoading] = useState(false);

  const updateVehicle = useMutation(api.vehicles.updateVehicle);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await updateVehicle({
        vehicleId: vehicle._id,
        name: name.trim(),
        plate: plate.trim() || undefined,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        year: year ? parseInt(year) : undefined,
        color: color.trim() || undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileModal isOpen={true} onClose={onClose} title="Editar vehículo">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label"><span className="label-text">Nombre *</span></label>
          <input
            type="text"
            className="input input-bordered w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="form-control">
            <label className="label"><span className="label-text">Marca</span></label>
            <input type="text" className="input input-bordered w-full" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Modelo</span></label>
            <input type="text" className="input input-bordered w-full" value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="form-control">
            <label className="label"><span className="label-text">Año</span></label>
            <input type="number" className="input input-bordered w-full" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Color</span></label>
            <input type="text" className="input input-bordered w-full" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Placa</span></label>
            <input type="text" className="input input-bordered w-full" value={plate} onChange={(e) => setPlate(e.target.value)} />
          </div>
        </div>
        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={isLoading || !name.trim()}>
            {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
          </button>
        </div>
      </form>
    </MobileModal>
  );
}
