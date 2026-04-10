import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { useConfirmModal } from "../hooks/useConfirmModal";
import type { Id, Doc } from "../../convex/_generated/dataModel";

// Components
import { GiftEventHeader } from "../components/gifts/GiftEventHeader";
import { sortGifts } from "../components/gifts/GiftConstants";
import { GiftEventModals } from "../components/gifts/GiftEventModals";
import { GiftEventContent } from "../components/gifts/GiftEventContent";

type FilterType = "all" | "pending" | "bought" | "gifts";

export function GiftEventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { sessionToken } = useAuth();

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
    eventId && sessionToken ? { sessionToken, eventId: eventId as Id<"giftEvents"> } : "skip"
  );

  const recipientsWithItems = useQuery(
    api.gifts.getAllGiftItemsForEvent,
    eventId && sessionToken ? { sessionToken, eventId: eventId as Id<"giftEvents"> } : "skip"
  );

  const unassignedGifts = useQuery(
    api.gifts.getUnassignedGifts,
    eventId && sessionToken ? { sessionToken, eventId: eventId as Id<"giftEvents"> } : "skip"
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
      })
      .sort((a, b) => {
        // Sort by "Incomplete" first (people who exemplify "personas sin regalo" or pending gifts)
        // Incomplete = Has 0 items OR has pending items
        // Complete = Has items AND all are bought
        const isBought = (status: string) => ["bought", "wrapped", "delivered"].includes(status);

        const isCompleteA = a.items.length > 0 && a.items.every(i => isBought(i.status));
        const isCompleteB = b.items.length > 0 && b.items.every(i => isBought(i.status));

        if (isCompleteA !== isCompleteB) {
          // If A is complete (true) and B is incomplete (false), B comes first.
          // true > false in sort? 
          // We want A (complete) > B (incomplete) ? No, we want Incomplete first.
          // false (incomplete) < true (complete).
          return isCompleteA ? 1 : -1;
        }

        // Alphabetical
        return a.recipient.name.localeCompare(b.recipient.name);
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
    if (!recipientsWithItems) return { total: 0, bought: 0, pending: 0, approxCost: 0 };
    let total = 0;
    let bought = 0;
    let approxCost = 0;

    recipientsWithItems.forEach(({ items }: { items: Doc<"giftItems">[] }) => {
      total += items.length;
      bought += items.filter((i: Doc<"giftItems">) => ["bought", "wrapped", "delivered"].includes(i.status)).length;
      items.forEach((i) => {
        if (i.priceEstimate) approxCost += i.priceEstimate;
      });
    });

    if (unassignedGifts) {
      unassignedGifts.forEach((i: Doc<"giftItems">) => {
        total += 1;
        if (["bought", "wrapped", "delivered"].includes(i.status)) bought += 1;
        if (i.priceEstimate) approxCost += i.priceEstimate;
      });
    }

    return { total, bought, pending: total - bought, approxCost };
  }, [recipientsWithItems, unassignedGifts]);

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
      if (!sessionToken) return;
      await deleteEvent({ sessionToken, eventId: eventId as Id<"giftEvents"> });
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

    if (!sessionToken) return;
    await updateEvent({ sessionToken, eventId: eventId as Id<"giftEvents">, isCompleted: isNowCompleted });
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

      <GiftEventContent
        filter={filter}
        eventCompleted={!!event.isCompleted}
        allGifts={allGifts}
        recipientsWithItems={recipientsWithItems}
        unassignedGifts={unassignedGifts}
        filteredData={filteredData}
        confirmDialog={confirmDialog}
        onEditItem={(item) => setEditingItem(item)}
        onAddRecipient={() => setShowAddRecipient(true)}
        onAddToPool={() => setAddingToPool(true)}
        onAddItemToRecipient={(recipientId) => setAddingToRecipient(recipientId)}
      />

      <GiftEventModals
        eventId={eventId as Id<"giftEvents">}
        event={event}
        showAddRecipient={showAddRecipient}
        setShowAddRecipient={setShowAddRecipient}
        addingToRecipient={addingToRecipient}
        setAddingToRecipient={setAddingToRecipient}
        addingToPool={addingToPool}
        setAddingToPool={setAddingToPool}
        editingItem={editingItem}
        setEditingItem={setEditingItem}
        showEditEvent={showEditEvent}
        setShowEditEvent={setShowEditEvent}
        confirmDialog={confirmDialog}
      />

      {/* Confirm Modal */}
      <ConfirmModal />
    </div>
  );
}
