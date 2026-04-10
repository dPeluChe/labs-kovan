import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { MobileModal } from "../ui/MobileModal";
import { CATEGORY_CONFIG, type ContactCategory } from "./constants";

interface NewContactModalProps {
  sessionToken: string;
  familyId: Id<"families">;
  onClose: () => void;
}

export function NewContactModal({
  sessionToken,
  familyId,
  onClose,
}: NewContactModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ContactCategory>("doctor");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createContact = useMutation(api.contacts.createContact);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      if (!sessionToken) return;
      await createContact({
        sessionToken,
        familyId,
        name: name.trim(),
        category,
        specialty: specialty.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileModal isOpen={true} onClose={onClose} title="Nuevo contacto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label"><span className="label-text">Nombre *</span></label>
          <input
            type="text"
            placeholder="Ej: Dr. Juan Pérez"
            className="input input-bordered w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Categoría</span></label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(CATEGORY_CONFIG) as [ContactCategory, typeof CATEGORY_CONFIG[ContactCategory]][]).map(
              ([key, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={`btn btn-sm flex-col h-auto py-2 ${category === key ? "btn-primary" : "btn-ghost"}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs mt-1">{config.label}</span>
                  </button>
                );
              }
            )}
          </div>
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Especialidad</span></label>
          <input
            type="text"
            placeholder="Ej: Cardiólogo, Pediatra"
            className="input input-bordered w-full"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="form-control">
            <label className="label"><span className="label-text">Teléfono</span></label>
            <input
              type="tel"
              placeholder="55 1234 5678"
              className="input input-bordered w-full"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Email</span></label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Dirección</span></label>
          <input
            type="text"
            placeholder="Calle, número, colonia..."
            className="input input-bordered w-full"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Notas</span></label>
          <textarea
            placeholder="Horarios, recomendaciones..."
            className="textarea textarea-bordered w-full"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
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
