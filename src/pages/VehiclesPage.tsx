import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { SkeletonPageContent } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Plus, Car, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Id } from "../../convex/_generated/dataModel";

export function VehiclesPage() {
  const { currentFamily } = useFamily();
  const [showNewVehicle, setShowNewVehicle] = useState(false);

  const vehicles = useQuery(
    api.vehicles.getVehicles,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const summary = useQuery(
    api.vehicles.getVehiclesSummary,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  if (!currentFamily) return null;

  return (
    <div className="pb-4">
      <PageHeader
        title="Autos"
        subtitle="Vehículos y mantenimiento"
        action={
          <button
            onClick={() => setShowNewVehicle(true)}
            className="btn btn-primary btn-sm gap-1"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        }
      />

      {/* Summary Card */}
      {summary && summary.vehicleCount > 0 && (
        <div className="px-4 mb-4">
          <div className="card bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/30">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-base-content/60">Gastos del mes</div>
                  <div className="text-xl font-bold text-green-600">
                    ${summary.totalSpentThisMonth.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-base-content/60">Vehículos</div>
                  <div className="text-xl font-bold">{summary.vehicleCount}</div>
                </div>
              </div>
              {summary.upcomingEvents.length > 0 && (
                <div className="mt-3 pt-3 border-t border-base-content/10">
                  <div className="text-xs text-base-content/60 mb-1">Próximos eventos</div>
                  {summary.upcomingEvents.slice(0, 2).map((item, i) => (
                    <div key={i} className="text-sm flex justify-between">
                      <span>{item.event.title}</span>
                      <span className="text-base-content/60">
                        {new Date(item.event.date).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="px-4">
        {vehicles === undefined ? (
          <SkeletonPageContent cards={2} />
        ) : vehicles.length === 0 ? (
          <EmptyState
            icon={Car}
            title="Sin vehículos"
            description="Agrega tus autos para registrar mantenimiento y gastos"
            action={
              <button onClick={() => setShowNewVehicle(true)} className="btn btn-primary btn-sm">
                Agregar vehículo
              </button>
            }
          />
        ) : (
          <div className="space-y-3 stagger-children">
            {vehicles.map((vehicle) => (
              <Link
                key={vehicle._id}
                to={`/vehicles/${vehicle._id}`}
                className="card bg-base-100 shadow-sm border border-base-300 animate-fade-in"
              >
                <div className="card-body p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500/10 p-2 rounded-lg">
                      <Car className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{vehicle.name}</h3>
                      <p className="text-sm text-base-content/60">
                        {[vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(" ") || "Sin detalles"}
                        {vehicle.plate && ` • ${vehicle.plate}`}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-base-content/40" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showNewVehicle && currentFamily && (
        <NewVehicleModal
          familyId={currentFamily._id}
          onClose={() => setShowNewVehicle(false)}
        />
      )}
    </div>
  );
}

function NewVehicleModal({
  familyId,
  onClose,
}: {
  familyId: Id<"families">;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createVehicle = useMutation(api.vehicles.createVehicle);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await createVehicle({
        familyId,
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
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Nuevo vehículo</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Nombre *</span></label>
            <input 
              type="text" 
              placeholder="Ej: Mazda rojo, Camioneta" 
              className="input input-bordered w-full" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="form-control">
              <label className="label"><span className="label-text">Marca</span></label>
              <input type="text" placeholder="Ej: Mazda" className="input input-bordered w-full" value={brand} onChange={(e) => setBrand(e.target.value)} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Modelo</span></label>
              <input type="text" placeholder="Ej: 3" className="input input-bordered w-full" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="form-control">
              <label className="label"><span className="label-text">Año</span></label>
              <input type="number" placeholder="2024" className="input input-bordered w-full" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Color</span></label>
              <input type="text" placeholder="Rojo" className="input input-bordered w-full" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Placa</span></label>
              <input type="text" placeholder="ABC-123" className="input input-bordered w-full" value={plate} onChange={(e) => setPlate(e.target.value)} />
            </div>
          </div>
          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || !name.trim()}>
              {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Crear"}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
