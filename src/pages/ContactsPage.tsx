import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageHeader } from "../components/ui/PageHeader";
import { SkeletonPageContent } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { useConfirmModal } from "../hooks/useConfirmModal";
import {
  Users,
  Plus,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Star,
  Stethoscope,
  Cat,
  Wrench,
  Droplets,
  Zap,
  Heart,
  AlertTriangle,
  MoreHorizontal,
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";
import type { LucideIcon } from "lucide-react";

type ContactCategory = "doctor" | "veterinarian" | "mechanic" | "plumber" | "electrician" | "dentist" | "emergency" | "other";

const CATEGORY_CONFIG: Record<ContactCategory, { label: string; icon: LucideIcon; color: string }> = {
  doctor: { label: "Doctor", icon: Stethoscope, color: "text-blue-600 bg-blue-500/10" },
  veterinarian: { label: "Veterinario", icon: Cat, color: "text-amber-600 bg-amber-500/10" },
  mechanic: { label: "Mecánico", icon: Wrench, color: "text-gray-600 bg-gray-500/10" },
  plumber: { label: "Plomero", icon: Droplets, color: "text-cyan-600 bg-cyan-500/10" },
  electrician: { label: "Electricista", icon: Zap, color: "text-yellow-600 bg-yellow-500/10" },
  dentist: { label: "Dentista", icon: Heart, color: "text-pink-600 bg-pink-500/10" },
  emergency: { label: "Emergencia", icon: AlertTriangle, color: "text-red-600 bg-red-500/10" },
  other: { label: "Otro", icon: MoreHorizontal, color: "text-gray-600 bg-gray-500/10" },
};

export function ContactsPage() {
  const { currentFamily } = useFamily();
  const { user } = useAuth();
  const [showNewContact, setShowNewContact] = useState(false);
  const [filter, setFilter] = useState<ContactCategory | "all" | "favorites">("all");
  const { confirm, ConfirmModal } = useConfirmModal();

  const contacts = useQuery(
    api.contacts.getContacts,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const toggleFavorite = useMutation(api.contacts.toggleFavorite);
  const deleteContact = useMutation(api.contacts.deleteContact);

  if (!currentFamily || !user) return null;

  const filteredContacts = contacts?.filter((c) => {
    if (filter === "all") return true;
    if (filter === "favorites") return c.isFavorite;
    return c.category === filter;
  });

  const favoriteCount = contacts?.filter((c) => c.isFavorite).length || 0;

  return (
    <div className="pb-4">
      <PageHeader
        title="Directorio"
        subtitle="Contactos importantes"
        action={
          <button
            onClick={() => setShowNewContact(true)}
            className="btn btn-primary btn-sm gap-1"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        }
      />

      {/* Filter tabs */}
      <div className="px-4 mb-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setFilter("all")}
            className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-ghost"}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter("favorites")}
            className={`btn btn-sm gap-1 ${filter === "favorites" ? "btn-primary" : "btn-ghost"}`}
          >
            <Star className="w-3 h-3" /> {favoriteCount}
          </button>
          {(Object.entries(CATEGORY_CONFIG) as [ContactCategory, typeof CATEGORY_CONFIG[ContactCategory]][]).map(
            ([key, config]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`btn btn-sm gap-1 ${filter === key ? "btn-primary" : "btn-ghost"}`}
              >
                <config.icon className="w-3 h-3" />
                {config.label}
              </button>
            )
          )}
        </div>
      </div>

      <div className="px-4">
        {contacts === undefined ? (
          <SkeletonPageContent cards={4} />
        ) : contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin contactos"
            description="Agrega doctores, veterinarios, mecánicos y más"
            action={
              <button
                onClick={() => setShowNewContact(true)}
                className="btn btn-primary btn-sm"
              >
                Agregar contacto
              </button>
            }
          />
        ) : filteredContacts?.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin resultados"
            description="No hay contactos en esta categoría"
          />
        ) : (
          <div className="space-y-2 stagger-children">
            {filteredContacts?.map((contact) => {
              const config = CATEGORY_CONFIG[contact.category as ContactCategory];
              const Icon = config.icon;
              return (
                <div
                  key={contact._id}
                  className="card bg-base-100 shadow-sm border border-base-300"
                >
                  <div className="card-body p-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">{contact.name}</span>
                          {contact.isFavorite && (
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        {contact.specialty && (
                          <p className="text-xs text-base-content/60">{contact.specialty}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {contact.phone && (
                            <a
                              href={`tel:${contact.phone}`}
                              className="btn btn-xs btn-ghost gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              {contact.phone}
                            </a>
                          )}
                          {contact.email && (
                            <a
                              href={`mailto:${contact.email}`}
                              className="btn btn-xs btn-ghost gap-1"
                            >
                              <Mail className="w-3 h-3" />
                              Email
                            </a>
                          )}
                        </div>
                        {contact.address && (
                          <p className="text-xs text-base-content/50 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {contact.address}
                          </p>
                        )}
                        {contact.notes && (
                          <p className="text-xs text-base-content/60 mt-1 italic">
                            {contact.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => toggleFavorite({ contactId: contact._id })}
                          className={`btn btn-ghost btn-xs btn-circle ${
                            contact.isFavorite ? "text-amber-500" : ""
                          }`}
                        >
                          <Star className={`w-4 h-4 ${contact.isFavorite ? "fill-current" : ""}`} />
                        </button>
                        <button
                          onClick={async () => {
                            const confirmed = await confirm({
                              title: "Eliminar contacto",
                              message: `¿Estás seguro de que quieres eliminar a "${contact.name}"?`,
                              confirmText: "Eliminar",
                              cancelText: "Cancelar",
                              variant: "danger",
                              icon: "trash",
                            });
                            if (confirmed) {
                              await deleteContact({ contactId: contact._id });
                            }
                          }}
                          className="btn btn-ghost btn-xs btn-circle text-error"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNewContact && currentFamily && user && (
        <NewContactModal
          familyId={currentFamily._id}
          userId={user._id}
          onClose={() => setShowNewContact(false)}
        />
      )}

      <ConfirmModal />
    </div>
  );
}

function NewContactModal({
  familyId,
  userId,
  onClose,
}: {
  familyId: Id<"families">;
  userId: Id<"users">;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ContactCategory>("doctor");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createContact = useMutation(api.contacts.createContact);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await createContact({
        familyId,
        name: name.trim(),
        category,
        specialty: specialty.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        addedBy: userId,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg mb-4">Nuevo contacto</h3>
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
                      className={`btn btn-sm flex-col h-auto py-2 ${
                        category === key ? "btn-primary" : "btn-ghost"
                      }`}
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
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
