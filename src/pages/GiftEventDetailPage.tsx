import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import {
  ArrowLeft,
  Plus,
  User,
  ExternalLink,
  Trash2,
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

const STATUS_CONFIG = {
  idea: { label: "Idea", color: "badge-ghost", icon: "💡" },
  to_buy: { label: "Por comprar", color: "badge-warning", icon: "🛒" },
  bought: { label: "Comprado", color: "badge-info", icon: "✅" },
  wrapped: { label: "Envuelto", color: "badge-secondary", icon: "🎁" },
  delivered: { label: "Entregado", color: "badge-success", icon: "🎉" },
};

export function GiftEventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [showAddItem, setShowAddItem] = useState<Id<"giftRecipients"> | null>(null);

  const event = useQuery(
    api.gifts.getGiftEvent,
    eventId ? { eventId: eventId as Id<"giftEvents"> } : "skip"
  );

  const recipientsWithItems = useQuery(
    api.gifts.getAllGiftItemsForEvent,
    eventId ? { eventId: eventId as Id<"giftEvents"> } : "skip"
  );

  const deleteEvent = useMutation(api.gifts.deleteGiftEvent);

  if (!eventId) return null;
  if (event === undefined || recipientsWithItems === undefined) return <PageLoader />;
  if (event === null) {
    navigate("/gifts");
    return null;
  }

  const handleDeleteEvent = async () => {
    if (confirm("¿Eliminar este evento y todos sus regalos?")) {
      await deleteEvent({ eventId: eventId as Id<"giftEvents"> });
      navigate("/gifts");
    }
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-base-100 border-b border-base-300">
        <button onClick={() => navigate("/gifts")} className="btn btn-ghost btn-sm btn-circle">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{event.name}</h1>
          {event.date && (
            <p className="text-sm text-base-content/60">
              {new Date(event.date).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </div>
        <button onClick={handleDeleteEvent} className="btn btn-ghost btn-sm btn-circle text-error">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 py-4">
        {/* Add Recipient Button */}
        <button
          onClick={() => setShowAddRecipient(true)}
          className="btn btn-outline btn-sm w-full gap-2 mb-4"
        >
          <Plus className="w-4 h-4" />
          Agregar receptor
        </button>

        {recipientsWithItems.length === 0 ? (
          <EmptyState
            icon={User}
            title="Sin receptores"
            description="Agrega personas o familias para regalar"
          />
        ) : (
          <div className="space-y-4">
            {recipientsWithItems.map(({ recipient, items }) => (
              <RecipientCard
                key={recipient._id}
                recipient={recipient}
                items={items}
                onAddItem={() => setShowAddItem(recipient._id)}
              />
            ))}
          </div>
        )}
      </div>

      {showAddRecipient && (
        <AddRecipientModal
          eventId={eventId as Id<"giftEvents">}
          onClose={() => setShowAddRecipient(false)}
        />
      )}

      {showAddItem && (
        <AddItemModal
          recipientId={showAddItem}
          onClose={() => setShowAddItem(null)}
        />
      )}
    </div>
  );
}

function RecipientCard({
  recipient,
  items,
  onAddItem,
}: {
  recipient: { _id: Id<"giftRecipients">; name: string; notes?: string };
  items: Array<{
    _id: Id<"giftItems">;
    title: string;
    url?: string;
    priceEstimate?: number;
    status: keyof typeof STATUS_CONFIG;
  }>;
  onAddItem: () => void;
}) {
  const deleteRecipient = useMutation(api.gifts.deleteGiftRecipient);
  const updateItem = useMutation(api.gifts.updateGiftItem);
  const deleteItem = useMutation(api.gifts.deleteGiftItem);

  const handleDeleteRecipient = async () => {
    if (confirm(`¿Eliminar a ${recipient.name} y todos sus regalos?`)) {
      await deleteRecipient({ recipientId: recipient._id });
    }
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-base-content/60" />
            <h3 className="font-semibold">{recipient.name}</h3>
          </div>
          <div className="flex gap-1">
            <button onClick={onAddItem} className="btn btn-ghost btn-xs btn-circle">
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteRecipient}
              className="btn btn-ghost btn-xs btn-circle text-error"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-base-content/50 py-2">Sin regalos aún</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <GiftItemRow
                key={item._id}
                item={item}
                onUpdateStatus={(status) => updateItem({ itemId: item._id, status })}
                onDelete={() => deleteItem({ itemId: item._id })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type GiftStatus = keyof typeof STATUS_CONFIG;

function GiftItemRow({
  item,
  onUpdateStatus,
  onDelete,
}: {
  item: {
    _id: Id<"giftItems">;
    title: string;
    url?: string;
    priceEstimate?: number;
    status: GiftStatus;
  };
  onUpdateStatus: (status: GiftStatus) => void;
  onDelete: () => void;
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const config = STATUS_CONFIG[item.status];

  const allStatuses: GiftStatus[] = ["idea", "to_buy", "bought", "wrapped", "delivered"];

  const statusColors: Record<GiftStatus, string> = {
    idea: "from-slate-500/20 to-slate-600/10 border-slate-500/30",
    to_buy: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
    bought: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    wrapped: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    delivered: "from-green-500/20 to-green-600/10 border-green-500/30",
  };

  return (
    <div className={`relative p-3 rounded-xl border bg-gradient-to-r ${statusColors[item.status]} transition-all`}>
      <div className="flex items-start gap-3">
        {/* Status icon with dropdown */}
        <div className="dropdown dropdown-right dropdown-start">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className="btn btn-circle btn-sm bg-base-100/80 backdrop-blur border-0 shadow-sm"
          >
            <span className="text-xl">{config.icon}</span>
          </button>
          {showStatusMenu && (
            <ul className="dropdown-content menu bg-base-100 rounded-box z-50 w-44 p-2 shadow-xl border border-base-300 ml-2">
              <li className="menu-title text-xs">Cambiar estado</li>
              {allStatuses.map((status) => {
                const statusConfig = STATUS_CONFIG[status];
                return (
                  <li key={status}>
                    <button
                      onClick={() => {
                        onUpdateStatus(status);
                        setShowStatusMenu(false);
                      }}
                      className={`gap-3 ${item.status === status ? "active" : ""}`}
                    >
                      <span className="text-lg">{statusConfig.icon}</span>
                      <span>{statusConfig.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Item info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate">{item.title}</span>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-xs btn-circle text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge badge-sm ${config.color}`}>{config.label}</span>
            {item.priceEstimate && (
              <span className="text-sm font-medium text-base-content/70">
                ${item.priceEstimate.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={onDelete}
          className="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-error"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function AddRecipientModal({
  eventId,
  onClose,
}: {
  eventId: Id<"giftEvents">;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const createRecipient = useMutation(api.gifts.createGiftRecipient);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await createRecipient({
        giftEventId: eventId,
        name: name.trim(),
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Agregar receptor</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Nombre *</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Mamá, Los abuelos, Juan"
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Notas (opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ideas, preferencias..."
              className="input input-bordered w-full"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || !name.trim()}>
              {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Agregar"}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}

function AddItemModal({
  recipientId,
  onClose,
}: {
  recipientId: Id<"giftRecipients">;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const createItem = useMutation(api.gifts.createGiftItem);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await createItem({
        giftRecipientId: recipientId,
        title: title.trim(),
        url: url.trim() || undefined,
        priceEstimate: price ? parseFloat(price) : undefined,
        status: "idea",
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Agregar regalo</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Título *</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Lego Star Wars, Libro de cocina"
              className="input input-bordered w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">URL (opcional)</span>
            </label>
            <input
              type="url"
              placeholder="https://..."
              className="input input-bordered w-full"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Precio estimado (opcional)</span>
            </label>
            <input
              type="number"
              placeholder="0.00"
              className="input input-bordered w-full"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || !title.trim()}>
              {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Agregar"}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
