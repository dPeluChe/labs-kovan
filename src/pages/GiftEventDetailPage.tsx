import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { useConfirmModal } from "../hooks/useConfirmModal";
import type { ConfirmOptions } from "../hooks/useConfirmModal";
import {
  ArrowLeft,
  Plus,
  User,
  ExternalLink,
  Trash2,
  Gift,
  CheckCircle2,
  MoreVertical,
  Edit2,
  Package,
  UserPlus
} from "lucide-react";
import type { Id, Doc } from "../../convex/_generated/dataModel";

const STATUS_CONFIG = {
  idea: { label: "Idea", color: "badge-ghost", icon: "💡", bg: "bg-base-200" },
  to_buy: { label: "Por comprar", color: "badge-warning", icon: "🛒", bg: "bg-yellow-500/10" },
  bought: { label: "Comprado", color: "badge-info", icon: "✅", bg: "bg-blue-500/10" },
  wrapped: { label: "Envuelto", color: "badge-secondary", icon: "🎁", bg: "bg-pink-500/10" },
  delivered: { label: "Entregado", color: "badge-success", icon: "🎉", bg: "bg-green-500/10" },
};

type GiftStatus = keyof typeof STATUS_CONFIG;
type FilterType = "all" | "pending" | "bought" | "gifts";

export function GiftEventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { currentFamily } = useFamily();
  const { user } = useAuth();
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [editingItem, setEditingItem] = useState<Doc<"giftItems"> | null>(null); // Item to edit or null
  const [addingToRecipient, setAddingToRecipient] = useState<Id<"giftRecipients"> | null>(null);
  const [addingToPool, setAddingToPool] = useState(false); // For unassigned gifts
  const [filter, setFilter] = useState<FilterType>("all");
  const { confirm: confirmDialog, ConfirmModal } = useConfirmModal();

  const event = useQuery(
    api.gifts.getGiftEvent,
    eventId ? { eventId: eventId as Id<"giftEvents"> } : "skip"
  );

  const recipientsWithItems = useQuery(
    api.gifts.getAllGiftItemsForEvent,
    eventId ? { eventId: eventId as Id<"giftEvents"> } : "skip"
  );

  const unassignedGifts = useQuery(
    api.gifts.getUnassignedGifts,
    eventId ? { eventId: eventId as Id<"giftEvents"> } : "skip"
  );

  const deleteEvent = useMutation(api.gifts.deleteGiftEvent);
  const updateEvent = useMutation(api.gifts.updateGiftEvent);

  // Filter logic - for recipient view
  const filteredData = useMemo(() => {
    if (!recipientsWithItems || filter === "gifts") return [];

    return recipientsWithItems.map(({ recipient, items }: { recipient: Doc<"giftRecipients">, items: Doc<"giftItems">[] }) => {
      const filteredItems = items.filter((item: Doc<"giftItems">) => {
        const isBought = ["bought", "wrapped", "delivered"].includes(item.status);
        if (filter === "pending") return !isBought;
        if (filter === "bought") return isBought;
        return true;
      });
      return { recipient, items: filteredItems, totalItems: items.length };
    }).filter((group: { items: Doc<"giftItems">[] }) => {
      // For "bought" filter, only show recipients that have bought items
      if (filter === "bought") return group.items.length > 0;
      // For "pending", only show recipients with pending items
      if (filter === "pending") return group.items.length > 0;
      // For "all", show everyone (even empty, so they can add)
      return true;
    });
  }, [recipientsWithItems, filter]);

  // Flat list of all gifts for "gifts" view
  const allGifts = useMemo(() => {
    if (!recipientsWithItems) return [];
    const gifts: Array<{ item: Doc<"giftItems">; recipientName: string; recipientId: string }> = [];
    recipientsWithItems.forEach(({ recipient, items }: { recipient: Doc<"giftRecipients">, items: Doc<"giftItems">[] }) => {
      items.forEach((item: Doc<"giftItems">) => {
        gifts.push({ item, recipientName: recipient.name, recipientId: recipient._id });
      });
    });
    // Add unassigned gifts
    unassignedGifts?.forEach((item: Doc<"giftItems">) => {
      gifts.push({ item, recipientName: "Sin asignar", recipientId: "" });
    });
    return gifts;
  }, [recipientsWithItems, unassignedGifts]);

  const stats = useMemo(() => {
    if (!recipientsWithItems) return { total: 0, bought: 0, pending: 0 };
    let total = 0;
    let bought = 0;
    recipientsWithItems.forEach(({ items }: { items: Doc<"giftItems">[] }) => {
      total += items.length;
      bought += items.filter((i: Doc<"giftItems">) => ["bought", "wrapped", "delivered"].includes(i.status)).length;
    });
    return { total, bought, pending: total - bought };
  }, [recipientsWithItems]);

  if (!eventId) return null;
  if (event === undefined || recipientsWithItems === undefined) return <PageLoader />;
  if (event === null) {
    navigate("/gifts");
    return null;
  }

  const handleDeleteEvent = async () => {
    const confirmed = await confirmDialog({
      title: "Eliminar evento",
      message: "¿Estás seguro de que quieres eliminar este evento y todos sus regalos? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "danger",
      icon: "trash",
    });

    if (confirmed) {
      await deleteEvent({ eventId: eventId as Id<"giftEvents"> });
      navigate("/gifts");
    }
  };

  return (
    <div className="pb-20"> {/* Extra padding for bottom nav */}
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-base-100/95 backdrop-blur-md border-b border-base-300 shadow-sm">
        <div className="flex items-center gap-2 px-4 py-3">
          <button onClick={() => navigate("/gifts")} className="btn btn-ghost btn-sm btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate leading-tight">{event.name}</h1>
            <div className="flex items-center gap-2 text-xs text-base-content/60">
              <span>{stats.total} regalos</span>
              <span>•</span>
              <span className="text-success">{stats.bought} listos</span>
            </div>
          </div>
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
              <MoreVertical className="w-5 h-5" />
            </button>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 border border-base-300 z-50">
              <li><button onClick={() => setShowEditEvent(true)}><Edit2 className="w-4 h-4" /> Editar evento</button></li>
              <li><button onClick={() => setAddingToPool(true)}><Package className="w-4 h-4" /> Agregar regalo</button></li>
              <li>
                <button onClick={async () => {
                  await updateEvent({ eventId: eventId as Id<"giftEvents">, isCompleted: !event.isCompleted });
                }}>
                  <CheckCircle2 className="w-4 h-4" />
                  {event.isCompleted ? "Reactivar" : "Marcar finalizado"}
                </button>
              </li>
              <li><button onClick={handleDeleteEvent} className="text-error"><Trash2 className="w-4 h-4" /> Eliminar evento</button></li>
            </ul>
          </div>
        </div>

        {/* Event Description/Notes - if any */}
        {event.description && (
          <div className="px-4 pb-2">
            <div className="bg-base-200 border border-base-300 rounded-lg px-3 py-2">
              <p className="text-sm text-base-content/70 whitespace-pre-wrap">{event.description}</p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilter("all")}
            className={`btn btn-xs rounded-full ${filter === "all" ? "btn-neutral" : "btn-ghost"}`}
          >
            Personas
          </button>
          <button
            onClick={() => setFilter("gifts")}
            className={`btn btn-xs rounded-full ${filter === "gifts" ? "btn-primary" : "btn-ghost"}`}
          >
            Regalos ({stats.total})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`btn btn-xs rounded-full ${filter === "pending" ? "btn-warning" : "btn-ghost"}`}
          >
            Pendientes ({stats.pending})
          </button>
          <button
            onClick={() => setFilter("bought")}
            className={`btn btn-xs rounded-full ${filter === "bought" ? "btn-success text-white" : "btn-ghost"}`}
          >
            Listos ({stats.bought})
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Vista de Regalos (flat list) */}
        {filter === "gifts" ? (
          allGifts.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="Sin regalos"
              description="Agrega regalos a tus receptores"
            />
          ) : (
            <div className="space-y-4">
              {/* Regalos sin asignar */}
              {unassignedGifts && unassignedGifts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium text-warning">Sin asignar ({unassignedGifts.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {unassignedGifts.map((item: Doc<"giftItems">) => {
                      const statusConfig = STATUS_CONFIG[item.status as GiftStatus];
                      return (
                        <div
                          key={item._id}
                          onClick={() => setEditingItem(item)}
                          className="flex items-center gap-2 p-2 bg-warning/5 border border-warning/20 rounded-lg cursor-pointer hover:bg-warning/10 transition-colors animate-fade-in"
                        >
                          <span>{statusConfig.icon}</span>
                          <span className="flex-1 truncate text-sm">{item.title}</span>
                          {item.priceEstimate && <span className="text-xs text-base-content/50">${item.priceEstimate}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Regalos asignados */}
              {allGifts.filter(g => g.recipientId).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Asignados ({allGifts.filter(g => g.recipientId).length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {allGifts.filter(g => g.recipientId).map(({ item, recipientName }) => {
                      const isBought = ["bought", "wrapped", "delivered"].includes(item.status);
                      const statusConfig = STATUS_CONFIG[item.status as GiftStatus];
                      return (
                        <div
                          key={item._id}
                          onClick={() => setEditingItem(item)}
                          className="flex items-center gap-2 p-2 bg-base-100 border border-base-200 rounded-lg cursor-pointer hover:shadow-sm transition-all animate-fade-in"
                        >
                          <span>{statusConfig.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${isBought ? "line-through opacity-60" : ""}`}>
                              {item.title}
                            </p>
                            <p className="text-xs text-base-content/50">→ {recipientName}</p>
                          </div>
                          {item.priceEstimate && <span className="text-xs text-base-content/50">${item.priceEstimate}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        ) : recipientsWithItems.length === 0 ? (
          <EmptyState
            icon={User}
            title="Sin receptores"
            description="Agrega personas a tu lista para empezar"
            action={
              <button onClick={() => setShowAddRecipient(true)} className="btn btn-primary btn-sm">
                Agregar persona
              </button>
            }
          />
        ) : (
          <>
            {/* Unassigned Gifts Pool - solo en vista "all" */}
            {filter === "all" && unassignedGifts && unassignedGifts.length > 0 && (
              <div className="card card-compact bg-base-200/50 border border-dashed border-base-300">
                <div className="card-body p-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Sin asignar</span>
                    <span className="badge badge-xs badge-primary">{unassignedGifts.length}</span>
                    <div className="flex-1" />
                    <button onClick={() => setAddingToPool(true)} className="btn btn-ghost btn-xs">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {unassignedGifts.map((item: Doc<"giftItems">) => (
                      <UnassignedGiftItem
                        key={item._id}
                        item={item}
                        recipients={recipientsWithItems?.map((r: { recipient: Doc<"giftRecipients"> }) => r.recipient) || []}
                        onEdit={() => setEditingItem(item)}
                        confirmDialog={confirmDialog}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recipients */}
            {filteredData.length === 0 ? (
              <div className="text-center py-8 text-base-content/50 animate-fade-in">
                <p>No hay receptores con regalos {filter === "bought" ? "listos" : "pendientes"}</p>
              </div>
            ) : (
              <div className="space-y-3 stagger-children">
                {filteredData.map(({ recipient, items }: { recipient: Doc<"giftRecipients">, items: Doc<"giftItems">[] }) => (
                  <RecipientSection
                    key={recipient._id}
                    recipient={recipient}
                    items={items}
                    familyId={currentFamily?._id}
                    userId={user?._id}
                    onAddItem={() => setAddingToRecipient(recipient._id)}
                    onEditItem={(item) => setEditingItem(item)}
                    confirmDialog={confirmDialog}
                  />
                ))}
              </div>
            )}

            {/* Add Recipient Button - solo en vista "all" */}
            {filter === "all" && (
              <button
                onClick={() => setShowAddRecipient(true)}
                className="btn btn-ghost btn-sm btn-block border-dashed border mt-2 text-base-content/50"
              >
                <UserPlus className="w-4 h-4" /> Agregar persona
              </button>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showAddRecipient && (
        <div className="modal modal-open">
          <div className="modal-box max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">Agregar receptor</h3>
            <AddRecipientForm
              eventId={eventId as Id<"giftEvents">}
              onClose={() => setShowAddRecipient(false)}
            />
          </div>
          <div className="modal-backdrop" onClick={() => setShowAddRecipient(false)} />
        </div>
      )}

      {(addingToRecipient !== null || editingItem !== null || addingToPool) && (
        <div className="modal modal-open">
          <div className="modal-box max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">
              {editingItem ? "Editar regalo" : addingToPool ? "Agregar regalo al pool" : "Nuevo regalo"}
            </h3>
            <GiftItemForm
              eventId={eventId as Id<"giftEvents">}
              recipientId={addingToPool ? undefined : (addingToRecipient || editingItem?.giftRecipientId)}
              initialData={editingItem || undefined}
              onClose={() => { setAddingToRecipient(null); setEditingItem(null); setAddingToPool(false); }}
              confirmDialog={confirmDialog}
            />
          </div>
          <div className="modal-backdrop" onClick={() => { setAddingToRecipient(null); setEditingItem(null); setAddingToPool(false); }} />
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditEvent && event && (
        <div className="modal modal-open">
          <div className="modal-box max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">Editar evento</h3>
            <EditEventForm
              event={event}
              onClose={() => setShowEditEvent(false)}
            />
          </div>
          <div className="modal-backdrop" onClick={() => setShowEditEvent(false)} />
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal />
    </div>
  );
}

function RecipientSection({
  recipient,
  items,
  familyId,
  userId,
  onAddItem,
  onEditItem,
  confirmDialog,
}: {
  recipient: Doc<"giftRecipients">;
  items: Doc<"giftItems">[];
  familyId?: Id<"families">;
  userId?: Id<"users">;
  onAddItem: () => void;
  onEditItem: (item: Doc<"giftItems">) => void;
  confirmDialog: (options: ConfirmOptions) => Promise<boolean>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(recipient.name);
  const [editNotes, setEditNotes] = useState(recipient.notes || "");
  const deleteRecipient = useMutation(api.gifts.deleteGiftRecipient);
  const updateRecipient = useMutation(api.gifts.updateGiftRecipient);
  const updateItem = useMutation(api.gifts.updateGiftItem);

  const handleSave = async () => {
    const updates: { name?: string; notes?: string } = {};
    if (editName.trim() && editName.trim() !== recipient.name) {
      updates.name = editName.trim();
    }
    if (editNotes !== (recipient.notes || "")) {
      updates.notes = editNotes;
    }
    if (Object.keys(updates).length > 0) {
      await updateRecipient({ recipientId: recipient._id, ...updates });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(recipient.name);
    setEditNotes(recipient.notes || "");
    setIsEditing(false);
  };

  // Stats for this recipient
  const total = items.length;
  const boughtCount = items.filter(i => ["bought", "wrapped", "delivered"].includes(i.status)).length;
  const hasIdeas = items.some(i => i.status === "idea" || i.status === "to_buy");

  // Semáforo: verde = todo comprado, amarillo = tiene ideas/pendientes, gris = vacío
  const statusColor = total === 0
    ? "bg-base-300"
    : boughtCount === total
      ? "bg-success"
      : hasIdeas
        ? "bg-warning"
        : "bg-base-300";

  const handleDelete = async () => {
    const confirmed = await confirmDialog({
      title: "Eliminar destinatario",
      message: `¿Estás seguro de que quieres eliminar a ${recipient.name} y todos sus regalos? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "danger",
      icon: "trash",
    });

    if (confirmed) {
      await deleteRecipient({ recipientId: recipient._id });
    }
  };

  return (
    <div className="card card-compact bg-base-100 shadow-sm border border-base-200 animate-fade-in">
      {/* Compact Header */}
      <div className="card-body p-3">
        <div className="flex items-center gap-2">
          {/* Avatar con semáforo integrado */}
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center text-base-content/70 font-semibold text-sm">
              {recipient.name.charAt(0).toUpperCase()}
            </div>
            {/* Indicador semáforo */}
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-base-100 ${statusColor}`} />
          </div>

          {/* Nombre + contador */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <h3 className="font-semibold truncate">{recipient.name}</h3>
            {total > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${boughtCount === total
                ? "bg-success/20 text-success"
                : hasIdeas
                  ? "bg-warning/20 text-warning"
                  : "bg-base-200 text-base-content/50"
                }`}>
                {boughtCount}/{total}
              </span>
            )}
          </div>

          {/* Botón agregar inline */}
          <button
            onClick={onAddItem}
            className="btn btn-ghost btn-xs btn-circle"
            title="Agregar regalo"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Menú */}
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost btn-xs btn-circle">
              <MoreVertical className="w-4 h-4" />
            </button>
            <ul tabIndex={0} className="dropdown-content menu p-1 shadow-lg bg-base-100 rounded-lg w-40 z-50 border border-base-200 text-sm">
              <li><button onClick={() => setIsEditing(true)} className="py-1.5"><Edit2 className="w-3.5 h-3.5" /> Editar</button></li>
              <li><button onClick={handleDelete} className="text-error py-1.5"><Trash2 className="w-3.5 h-3.5" /> Eliminar</button></li>
            </ul>
          </div>
        </div>

        {/* Notas del receptor - si existen */}
        {recipient.notes && !isEditing && (
          <p className="text-xs text-base-content/60 mt-1 italic px-1">📝 {recipient.notes}</p>
        )}

        {/* Modal de edición inline - mobile friendly */}
        {isEditing && (
          <div className="mt-2 p-3 bg-base-200 rounded-lg space-y-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nombre"
              className="input input-sm input-bordered w-full"
              autoFocus
            />
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Notas (ej: alérgico a perfumes, talla M...)"
              className="textarea textarea-bordered textarea-sm w-full h-16"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={handleCancelEdit} className="btn btn-ghost btn-xs">Cancelar</button>
              <button onClick={handleSave} className="btn btn-primary btn-xs">Guardar</button>
            </div>
          </div>
        )}

        {/* Regalos como chips/badges */}
        {items.length === 0 ? (
          <button
            onClick={onAddItem}
            className="btn btn-ghost btn-xs text-base-content/40 gap-1 mt-1"
          >
            <Gift className="w-3 h-3" /> Agregar primer regalo
          </button>
        ) : (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {items.map((item) => {
              const isBought = ["bought", "wrapped", "delivered"].includes(item.status);

              return (
                <div
                  key={item._id}
                  onClick={() => onEditItem(item)}
                  className={`badge gap-1.5 cursor-pointer hover:shadow-sm transition-all ${isBought
                    ? "bg-success/20 text-success border border-success/30"
                    : "bg-base-200 text-base-content border border-base-300"
                    }`}
                >
                  {/* Toggle comprado */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newStatus = isBought ? "idea" : "bought";
                      updateItem({
                        itemId: item._id,
                        status: newStatus,
                        // Pass familyId and paidBy to create expense when marking as bought
                        familyId: newStatus === "bought" ? familyId : undefined,
                        paidBy: newStatus === "bought" ? userId : undefined,
                      });
                    }}
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isBought
                      ? "bg-success border-success text-white"
                      : "border-base-300 hover:border-success"
                      }`}
                  >
                    {isBought && <CheckCircle2 className="w-2.5 h-2.5" />}
                  </button>

                  <span className={`text-xs ${isBought ? "line-through opacity-60" : ""}`}>
                    {item.title}
                  </span>

                  {item.priceEstimate && (
                    <span className="text-[10px] opacity-50">${item.priceEstimate}</span>
                  )}

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="opacity-40 hover:opacity-100"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function GiftItemForm({
  eventId,
  recipientId,
  initialData,
  onClose,
  confirmDialog,
}: {
  eventId: Id<"giftEvents">;
  recipientId?: Id<"giftRecipients">;
  initialData?: Doc<"giftItems">;
  onClose: () => void;
  confirmDialog: (options: ConfirmOptions) => Promise<boolean>;
}) {
  const createItem = useMutation(api.gifts.createGiftItem);
  const updateItem = useMutation(api.gifts.updateGiftItem);
  const deleteItem = useMutation(api.gifts.deleteGiftItem);

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    url: initialData?.url || "",
    priceEstimate: initialData?.priceEstimate?.toString() || "",
    status: initialData?.status || "idea",
    notes: initialData?.notes || "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsLoading(true);
    try {
      if (initialData) {
        await updateItem({
          itemId: initialData._id,
          title: formData.title.trim(),
          url: formData.url.trim() || undefined,
          priceEstimate: formData.priceEstimate ? parseFloat(formData.priceEstimate) : undefined,
          status: formData.status,
          notes: formData.notes.trim() || undefined,
        });
      } else {
        await createItem({
          giftEventId: eventId,
          giftRecipientId: recipientId,
          title: formData.title.trim(),
          url: formData.url.trim() || undefined,
          priceEstimate: formData.priceEstimate ? parseFloat(formData.priceEstimate) : undefined,
          status: formData.status,
          notes: formData.notes.trim() || undefined,
        });
      }
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDialog({
      title: "Eliminar regalo",
      message: "¿Estás seguro de que quieres eliminar este regalo? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "danger",
      icon: "trash",
    });

    if (confirmed && initialData) {
      await deleteItem({ itemId: initialData._id });
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Título *"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Ej: Lego Star Wars"
        autoFocus
      />

      <Input
        label="URL Link"
        value={formData.url}
        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
        placeholder="https://amazon.com/..."
        type="url"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Precio estimado"
          value={formData.priceEstimate}
          onChange={(e) => setFormData({ ...formData, priceEstimate: e.target.value })}
          placeholder="0.00"
          type="number"
          step="0.01"
        />

        <div className="form-control w-full">
          <label className="label"><span className="label-text font-medium">Estado</span></label>
          <select
            className="select select-bordered w-full"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as GiftStatus })}
          >
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.icon} {config.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-control">
        <label className="label"><span className="label-text font-medium">Notas</span></label>
        <textarea
          className="textarea textarea-bordered h-20"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Talla, color, detalles..."
        ></textarea>
      </div>

      <div className="modal-action justify-between items-center mt-6">
        {initialData ? (
          <button type="button" onClick={handleDelete} className="btn btn-ghost text-error">
            <Trash2 className="w-4 h-4" /> Borrar
          </button>
        ) : (
          <div></div> // Spacer
        )}
        <div className="flex gap-2">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={isLoading || !formData.title.trim()}>
            {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
          </button>
        </div>
      </div>
    </form>
  );
}

function AddRecipientForm({
  eventId,
  onClose,
}: {
  eventId: Id<"giftEvents">;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
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
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nombre *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ej: Mamá, Juan"
        autoFocus
      />
      <div className="modal-action">
        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={isLoading || !name.trim()}>
          Guardar
        </button>
      </div>
    </form>
  );
}

// Component for unassigned gift items with assign dropdown
function UnassignedGiftItem({
  item,
  recipients,
  onEdit,
  confirmDialog,
}: {
  item: Doc<"giftItems">;
  recipients: Doc<"giftRecipients">[];
  onEdit: () => void;
  confirmDialog: (options: ConfirmOptions) => Promise<boolean>;
}) {
  const assignItem = useMutation(api.gifts.assignGiftItem);
  const deleteItem = useMutation(api.gifts.deleteGiftItem);
  const statusConfig = STATUS_CONFIG[item.status as GiftStatus];

  const handleDelete = async () => {
    const confirmed = await confirmDialog({
      title: "Eliminar regalo",
      message: "¿Eliminar este regalo?",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      variant: "danger",
      icon: "trash",
    });
    if (confirmed) {
      await deleteItem({ itemId: item._id });
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-base-100 rounded-lg border border-base-300">
      <span className="text-lg">{statusConfig.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.title}</p>
        {item.priceEstimate && (
          <p className="text-xs text-base-content/60">${item.priceEstimate}</p>
        )}
      </div>

      {/* Assign Dropdown */}
      <div className="dropdown dropdown-end">
        <button tabIndex={0} className="btn btn-ghost btn-xs gap-1">
          <UserPlus className="w-3 h-3" /> Asignar
        </button>
        <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40 border border-base-300 z-50">
          {recipients.map((recipient) => (
            <li key={recipient._id}>
              <button onClick={() => assignItem({ itemId: item._id, giftRecipientId: recipient._id })}>
                {recipient.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button onClick={onEdit} className="btn btn-ghost btn-xs btn-circle">
        <Edit2 className="w-3 h-3" />
      </button>
      <button onClick={handleDelete} className="btn btn-ghost btn-xs btn-circle text-error">
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// Edit Event Form component
function EditEventForm({
  event,
  onClose,
}: {
  event: { _id: Id<"giftEvents">; name: string; date?: number; description?: string };
  onClose: () => void;
}) {
  const [name, setName] = useState(event.name);
  const [date, setDate] = useState(
    event.date ? new Date(event.date).toISOString().split("T")[0] : ""
  );
  const [description, setDescription] = useState(event.description || "");
  const [isLoading, setIsLoading] = useState(false);

  const updateEvent = useMutation(api.gifts.updateGiftEvent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await updateEvent({
        eventId: event._id,
        name: name.trim(),
        date: date ? new Date(date).getTime() : undefined,
        description: description.trim() || undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nombre del evento *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ej: Navidad 2025"
        autoFocus
      />

      <div className="form-control">
        <label className="label"><span className="label-text">Fecha (opcional)</span></label>
        <input
          type="date"
          className="input input-bordered w-full"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="form-control">
        <label className="label"><span className="label-text">Descripción (opcional)</span></label>
        <textarea
          className="textarea textarea-bordered w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Notas adicionales..."
          rows={3}
        />
      </div>

      <div className="modal-action">
        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={isLoading || !name.trim()}>
          {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
        </button>
      </div>
    </form>
  );
}
