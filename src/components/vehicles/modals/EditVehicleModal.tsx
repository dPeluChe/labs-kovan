import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { MobileModal } from "../../ui/MobileModal";

interface EditVehicleModalProps {
  sessionToken: string;
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
}

export function EditVehicleModal({
  sessionToken,
  vehicle,
  onClose,
}: EditVehicleModalProps) {
  const [name, setName] = useState(vehicle.name);
  const [plate, setPlate] = useState(vehicle.plate || "");
  const [brand, setBrand] = useState(vehicle.brand || "");
  const [model, setModel] = useState(vehicle.model || "");
  const [year, setYear] = useState(vehicle.year?.toString() || "");
  const [color, setColor] = useState(vehicle.color || "");
  const [isLoading, setIsLoading] = useState(false);

  const updateVehicle = useMutation(api.vehicles.updateVehicle);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      if (!sessionToken) return;
      await updateVehicle({
        sessionToken,
        vehicleId: vehicle._id,
        name: name.trim(),
        plate: plate.trim() || undefined,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        year: year ? parseInt(year, 10) : undefined,
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
