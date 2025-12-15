import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { useConfirmModal } from "../hooks/useConfirmModal";
import { User, Package, Gift, UserPlus } from "lucide-react";
import type { Id, Doc } from "../../convex/_generated/dataModel";

// Components
import { GiftEventHeader } from "../components/gifts/GiftEventHeader";
import { RecipientCard } from "../components/gifts/RecipientCard";
import { GiftItemForm } from "../components/gifts/GiftItemForm";
import { AddRecipientForm } from "../components/gifts/AddRecipientForm";
import { EditEventForm } from "../components/gifts/EditEventForm";
import { UnassignedGiftItem } from "../components/gifts/UnassignedGiftItem";
import { STATUS_CONFIG, type GiftStatus, sortGifts } from "../components/gifts/GiftConstants";

const STATUS_ICONS = STATUS_CONFIG; // Alias for compatibility if needed

type FilterType = "all" | "pending" | "bought" | "gifts";

export function GiftEventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { currentFamily } = useFamily();
  const { user } = useAuth();

  // Modals state
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [editingItem, setEditingItem] = useState<Doc<"giftItems"> | null>(null);
  const [addingToRecipient, setAddingToRecipient] = useState<Id<"giftRecipients"> | null>(null);
  const [addingToPool, setAddingToPool] = useState(false);

  const [filter, setFilter] = useState<FilterType>("all");
  const { confirm: confirmDialog, ConfirmModal } = useConfirmModal();

  // Queries
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

  // Mutations
  const deleteEvent = useMutation(api.gifts.deleteGiftEvent);
  const updateEvent = useMutation(api.gifts.updateGiftEvent);

  // Computed: Filter logic
  const filteredData = useMemo(() => {
    if (!recipientsWithItems || filter === "gifts") return [];

    return recipientsWithItems
      .map(({ recipient, items }: { recipient: Doc<"giftRecipients">, items: Doc<"giftItems">[] }) => {
        const filteredItems = items.filter((item: Doc<"giftItems">) => {
          const isBought = ["bought", "wrapped", "delivered"].includes(item.status);
          if (filter === "pending") return !isBought;
          if (filter === "bought") return isBought;
          return true;
        });
        return { recipient, items: filteredItems, totalItems: items.length };
      })
      .filter((group: { items: Doc<"giftItems">[] }) => {
        if (filter === "bought") return group.items.length > 0;
        if (filter === "pending") return group.items.length > 0;
        return true;
      });
  }, [recipientsWithItems, filter]);

  // Computed: Flat list of all gifts
  const allGifts = useMemo(() => {
    if (!recipientsWithItems) return [];

    const gifts: Array<{ item: Doc<"giftItems">; recipientName: string; recipientId: string }> = [];

    recipientsWithItems.forEach(({ recipient, items }: { recipient: Doc<"giftRecipients">, items: Doc<"giftItems">[] }) => {
      items.forEach((item: Doc<"giftItems">) => {
        gifts.push({ item, recipientName: recipient.name, recipientId: recipient._id });
      });
    });

    unassignedGifts?.forEach((item: Doc<"giftItems">) => {
      gifts.push({ item, recipientName: "Sin asignar", recipientId: "" });
    });

    // SORTING: Apply global sort logic (Incomplete first, then Alphabetical)
    return gifts.sort((a, b) => sortGifts(a.item, b.item));
  }, [recipientsWithItems, unassignedGifts]);

  // Computed: Stats
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

  const handleToggleComplete = async () => {
    const isNowCompleted = !event.isCompleted;
    if (isNowCompleted) {
      const confirmed = await confirmDialog({
        title: "Finalizar evento",
        message: "Al finalizar el evento, se marcará como archivado. Podrás seguir consultándolo pero se recomienda no editarlo. ¿Continuar?",
        confirmText: "Finalizar",
        cancelText: "Cancelar",
        variant: "info",
      });
      if (!confirmed) return;
    }

    await updateEvent({ eventId: eventId as Id<"giftEvents">, isCompleted: isNowCompleted });
    if (isNowCompleted) {
      navigate("/gifts"); // Return to list after archiving
    }
  };

  return (
    <div className="pb-20">
      <GiftEventHeader
        event={event}
        stats={stats}
        onBack={() => navigate("/gifts")}
        onEdit={() => setShowEditEvent(true)}
        onAddGiftPool={() => setAddingToPool(true)}
        onToggleComplete={handleToggleComplete}
        onDelete={handleDeleteEvent}
        filter={filter}
        setFilter={setFilter}
        pendingCount={stats.pending}
      />

      <div className="px-4 py-4 space-y-4">
        {/* GIFTS VIEW (Flat List) */}
        {filter === "gifts" ? (
          allGifts.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="Sin regalos"
              description="Agrega regalos a tus receptores"
            />
          ) : (
            <div className="space-y-4">
              {/* Gifts List */}
              <div className="space-y-1.5">
                {allGifts.map(({ item, recipientName, recipientId }) => {
                  const isBought = ["bought", "wrapped", "delivered"].includes(item.status);
                  const statusConfig = STATUS_ICONS[item.status as GiftStatus];

                  return (
                    <div
                      key={item._id}
                      onClick={() => !event.isCompleted && setEditingItem(item)}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-all animate-fade-in ${recipientId === "" ? "bg-warning/5 border-warning/20 hover:bg-warning/10" : "bg-base-100 border-base-200 hover:shadow-sm"
                        } ${event.isCompleted ? "opacity-75 cursor-default" : "cursor-pointer"}`}
                    >
                      <span>{statusConfig.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${isBought ? "line-through opacity-60" : ""}`}>
                          {item.title}
                        </p>
                        <p className="text-xs text-base-content/50">
                          {recipientName === "Sin asignar" ? <span className="text-warning">Sin asignar</span> : `→ ${recipientName}`}
                        </p>
                      </div>
                      {item.priceEstimate && <span className="text-xs text-base-content/50">${item.priceEstimate}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : recipientsWithItems.length === 0 ? (
          <EmptyState
            icon={User}
            title="Sin receptores"
            description="Agrega personas a tu lista para empezar"
            action={
              !event.isCompleted ? (
                <button onClick={() => setShowAddRecipient(true)} className="btn btn-primary btn-sm">
                  Agregar persona
                </button>
              ) : undefined
            }
          />
        ) : (
          /* RECIPIENTS VIEW */
          <>
            {/* Unassigned Pool */}
            {filter === "all" && unassignedGifts && unassignedGifts.length > 0 && (
              <div className="card card-compact bg-base-200/50 border border-dashed border-base-300">
                <div className="card-body p-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Sin asignar</span>
                    <span className="badge badge-xs badge-primary">{unassignedGifts.length}</span>
                    <div className="flex-1" />
                    {!event.isCompleted && (
                      <button onClick={() => setAddingToPool(true)} className="btn btn-ghost btn-xs">
                        <UserPlus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {unassignedGifts.map((item: Doc<"giftItems">) => (
                      <UnassignedGiftItem
                        key={item._id}
                        item={item}
                        recipients={recipientsWithItems?.map((r: { recipient: Doc<"giftRecipients"> }) => r.recipient) || []}
                        onEdit={() => setEditingItem(item)}
                        confirmDialog={confirmDialog}
                        isEventArchived={!!event.isCompleted}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recipients List */}
            {filteredData.length === 0 ? (
              <div className="text-center py-8 text-base-content/50 animate-fade-in">
                <p>No hay receptores con regalos {filter === "bought" ? "listos" : "pendientes"}</p>
              </div>
            ) : (
              <div className="space-y-3 stagger-children">
                {filteredData.map(({ recipient, items }: { recipient: Doc<"giftRecipients">, items: Doc<"giftItems">[] }) => (
                  <RecipientCard
                    key={recipient._id}
                    recipient={recipient}
                    items={items}
                    familyId={currentFamily?._id}
                    userId={user?._id}
                    onAddItem={() => setAddingToRecipient(recipient._id)}
                    onEditItem={(item) => setEditingItem(item)}
                    confirmDialog={confirmDialog}
                    isEventArchived={!!event.isCompleted}
                  />
                ))}
              </div>
            )}

            {/* Add Recipient Button */}
            {filter === "all" && !event.isCompleted && (
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

      {/* MODALS */}
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
