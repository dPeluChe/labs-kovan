import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { useConfirmModal } from "../hooks/useConfirmModal";
import {
  ArrowLeft,
  Plus,
  Car,
  MoreVertical,
  Edit2,
  Trash2,
  Calendar,
  Gauge,
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";
import { AddVehicleEventModal } from "../components/vehicles/modals/AddVehicleEventModal";
import { EditVehicleModal } from "../components/vehicles/modals/EditVehicleModal";
import { EVENT_TYPE_CONFIG, type EventType } from "../components/vehicles/constants";

export function VehicleDetailPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const { currentFamily } = useFamily();
  const { sessionToken } = useAuth();
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(false);
  const { confirm, ConfirmModal } = useConfirmModal();

  const vehicle = useQuery(
    api.vehicles.getVehicle,
    vehicleId && sessionToken ? { sessionToken, vehicleId: vehicleId as Id<"vehicles"> } : "skip"
  );

  const events = useQuery(
    api.vehicles.getVehicleEvents,
    vehicleId && sessionToken ? { sessionToken, vehicleId: vehicleId as Id<"vehicles"> } : "skip"
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
      if (!sessionToken) return;
      await deleteVehicle({ sessionToken, vehicleId: vehicle._id });
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
      if (!sessionToken) return;
      await deleteEvent({ sessionToken, eventId });
    }
  };

  const totalSpent = events.reduce((sum, e) => sum + (e.amount || 0), 0);
  const sortedEvents = [...events].sort((a, b) => b.date - a.date);

  return (
    <div className="pb-4">
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

      <div className="px-4 mb-4">
        <button
          onClick={() => setShowAddEvent(true)}
          className="btn btn-primary btn-block gap-2"
        >
          <Plus className="w-5 h-5" />
          Agregar evento / gasto
        </button>
      </div>

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

      {showAddEvent && currentFamily && sessionToken && (
        <AddVehicleEventModal
          sessionToken={sessionToken}
          vehicleId={vehicle._id}
          vehicleName={vehicle.name}
          onClose={() => setShowAddEvent(false)}
        />
      )}

      {editingVehicle && (
        <EditVehicleModal
          sessionToken={sessionToken ?? ""}
          vehicle={vehicle}
          onClose={() => setEditingVehicle(false)}
        />
      )}

      <ConfirmModal />
    </div>
  );
}
