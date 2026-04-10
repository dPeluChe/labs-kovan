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
} from "lucide-react";
import { CATEGORY_CONFIG, type ContactCategory } from "../components/contacts/constants";
import { NewContactModal } from "../components/contacts/NewContactModal";

export function ContactsPage() {
  const { currentFamily } = useFamily();
  const { sessionToken } = useAuth();
  const [showNewContact, setShowNewContact] = useState(false);
  const [filter, setFilter] = useState<ContactCategory | "all" | "favorites">("all");
  const { confirm, ConfirmModal } = useConfirmModal();

  const contacts = useQuery(
    api.contacts.getContacts,
    currentFamily && sessionToken ? { sessionToken, familyId: currentFamily._id } : "skip"
  );

  const toggleFavorite = useMutation(api.contacts.toggleFavorite);
  const deleteContact = useMutation(api.contacts.deleteContact);

  if (!currentFamily || !sessionToken) return null;

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
                          onClick={() => toggleFavorite({ sessionToken, contactId: contact._id })}
                          className={`btn btn-ghost btn-xs btn-circle ${contact.isFavorite ? "text-amber-500" : ""
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
                              await deleteContact({ sessionToken, contactId: contact._id });
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

      {showNewContact && currentFamily && sessionToken && (
        <NewContactModal
          sessionToken={sessionToken}
          familyId={currentFamily._id}
          onClose={() => setShowNewContact(false)}
        />
      )}

      <ConfirmModal />
    </div>
  );
}
