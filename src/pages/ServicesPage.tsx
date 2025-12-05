import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { SkeletonPageContent } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Zap, Plus, Car, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Id } from "../../convex/_generated/dataModel";

type TabType = "services" | "vehicles";

const SERVICE_TYPE_ICONS: Record<string, string> = {
  electricity: "⚡",
  water: "💧",
  internet: "📶",
  rent: "🏠",
  gas: "🔥",
  other: "📋",
};

export function ServicesPage() {
  const { currentFamily } = useFamily();
  const [activeTab, setActiveTab] = useState<TabType>("services");
  const [showNewService, setShowNewService] = useState(false);
  const [showNewVehicle, setShowNewVehicle] = useState(false);

  const services = useQuery(
    api.services.getServices,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const vehicles = useQuery(
    api.services.getVehicles,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  if (!currentFamily) return null;

  return (
    <div className="pb-4">
      <PageHeader
        title="Servicios y Autos"
        subtitle="Pagos y mantenimiento"
        action={
          <button
            onClick={() => activeTab === "services" ? setShowNewService(true) : setShowNewVehicle(true)}
            className="btn btn-primary btn-sm gap-1"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        }
      />

      <div className="tabs tabs-boxed bg-base-200 mx-4 mt-2 p-1">
        <button
          className={`tab flex-1 ${activeTab === "services" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("services")}
        >
          <Zap className="w-4 h-4 mr-1" /> Servicios
        </button>
        <button
          className={`tab flex-1 ${activeTab === "vehicles" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("vehicles")}
        >
          <Car className="w-4 h-4 mr-1" /> Vehículos
        </button>
      </div>

      <div className="px-4 py-4">
        {activeTab === "services" ? (
          <ServicesTab services={services} onAdd={() => setShowNewService(true)} />
        ) : (
          <VehiclesTab vehicles={vehicles} onAdd={() => setShowNewVehicle(true)} />
        )}
      </div>

      {showNewService && currentFamily && (
        <NewServiceModal
          familyId={currentFamily._id}
          onClose={() => setShowNewService(false)}
        />
      )}

      {showNewVehicle && currentFamily && (
        <NewVehicleModal
          familyId={currentFamily._id}
          onClose={() => setShowNewVehicle(false)}
        />
      )}
    </div>
  );
}

interface Service {
  _id: Id<"services">;
  type: string;
  name: string;
  billingCycle: string;
  dueDay?: string;
}

function ServicesTab({ 
  services, 
  onAdd 
}: { 
  services: Service[] | undefined; 
  onAdd: () => void;
}) {
  if (services === undefined) return <SkeletonPageContent cards={3} />;

  if (services.length === 0) {
    return (
      <EmptyState
        icon={Zap}
        title="Sin servicios"
        description="Agrega servicios como luz, agua, internet"
        action={
          <button onClick={onAdd} className="btn btn-primary btn-sm">
            Agregar servicio
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {services.map((service) => (
        <Link
          key={service._id}
          to={`/services/${service._id}`}
          className="card bg-base-100 shadow-sm border border-base-300"
        >
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {SERVICE_TYPE_ICONS[service.type] || "📋"}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{service.name}</h3>
                <p className="text-sm text-base-content/60">
                  {service.billingCycle === "monthly" ? "Mensual" : 
                   service.billingCycle === "bimonthly" ? "Bimestral" : 
                   service.billingCycle === "annual" ? "Anual" : "Otro"}
                  {service.dueDay && ` • Día ${service.dueDay}`}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-base-content/40" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

interface Vehicle {
  _id: Id<"vehicles">;
  name: string;
  plate?: string;
  brand?: string;
  model?: string;
  year?: number;
}

function VehiclesTab({ 
  vehicles, 
  onAdd 
}: { 
  vehicles: Vehicle[] | undefined; 
  onAdd: () => void;
}) {
  if (vehicles === undefined) return <SkeletonPageContent cards={2} />;

  if (vehicles.length === 0) {
    return (
      <EmptyState
        icon={Car}
        title="Sin vehículos"
        description="Agrega tus autos para registrar servicios y eventos"
        action={
          <button onClick={onAdd} className="btn btn-primary btn-sm">
            Agregar vehículo
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {vehicles.map((vehicle) => (
        <Link
          key={vehicle._id}
          to={`/vehicles/${vehicle._id}`}
          className="card bg-base-100 shadow-sm border border-base-300"
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
  );
}

function NewServiceModal({
  familyId,
  onClose,
}: {
  familyId: Id<"families">;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"electricity" | "water" | "internet" | "rent" | "gas" | "other">("electricity");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "bimonthly" | "annual" | "other">("monthly");
  const [dueDay, setDueDay] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createService = useMutation(api.services.createService);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await createService({
        familyId,
        name: name.trim(),
        type,
        billingCycle,
        dueDay: dueDay.trim() || undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Nuevo servicio</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Nombre *</span></label>
            <input
              type="text"
              placeholder="Ej: CFE, Telmex, Izzi"
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Tipo</span></label>
            <select className="select select-bordered w-full" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              <option value="electricity">⚡ Electricidad</option>
              <option value="water">💧 Agua</option>
              <option value="internet">📶 Internet</option>
              <option value="rent">🏠 Renta</option>
              <option value="gas">🔥 Gas</option>
              <option value="other">📋 Otro</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Ciclo de pago</span></label>
            <select className="select select-bordered w-full" value={billingCycle} onChange={(e) => setBillingCycle(e.target.value as typeof billingCycle)}>
              <option value="monthly">Mensual</option>
              <option value="bimonthly">Bimestral</option>
              <option value="annual">Anual</option>
              <option value="other">Otro</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Día de vencimiento</span></label>
            <input type="text" placeholder="Ej: 15, fin de mes" className="input input-bordered w-full" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
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
  const [isLoading, setIsLoading] = useState(false);

  const createVehicle = useMutation(api.services.createVehicle);

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
            <input type="text" placeholder="Ej: Mazda rojo, Camioneta" className="input input-bordered w-full" value={name} onChange={(e) => setName(e.target.value)} />
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
          <div className="grid grid-cols-2 gap-2">
            <div className="form-control">
              <label className="label"><span className="label-text">Año</span></label>
              <input type="number" placeholder="2024" className="input input-bordered w-full" value={year} onChange={(e) => setYear(e.target.value)} />
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
