import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { SkeletonPageContent } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Plus, Car } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";
import { MobileModal } from "../components/ui/MobileModal";
import { Input } from "../components/ui/Input";
import { ResourceCard } from "../components/ui/ResourceCard";

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
              <ResourceCard
                key={vehicle._id}
                to={`/vehicles/${vehicle._id}`}
                title={vehicle.name}
                subtitle={[vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(" ") || "Sin detalles"}
                icon={
                  <div className="bg-green-500/10 p-2 rounded-lg">
                    <Car className="w-5 h-5 text-green-600" />
                  </div>
                }
              />
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
    <MobileModal
      isOpen={true}
      onClose={onClose}
      title="Nuevo vehículo"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre *"
          placeholder="Ej: Mazda rojo, Camioneta"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Marca"
            placeholder="Ej: Mazda"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
          <Input
            label="Modelo"
            placeholder="Ej: 3"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Input
            label="Año"
            type="number"
            placeholder="2024"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
          <Input
            label="Color"
            placeholder="Rojo"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <Input
            label="Placa"
            placeholder="ABC-123"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
          />
        </div>
        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={isLoading || !name.trim()}>
            {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Crear"}
          </button>
        </div>
      </form>
    </MobileModal>
  );
}
