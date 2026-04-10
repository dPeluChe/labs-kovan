import { MobileModal } from "../ui/MobileModal";
import { AddRecipientForm } from "./AddRecipientForm";
import { GiftItemForm } from "./GiftItemForm";
import { EditEventForm } from "./EditEventForm";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import type { ConfirmOptions } from "../../hooks/useConfirmModal";

interface GiftEventModalsProps {
  eventId: Id<"giftEvents">;
  event: Doc<"giftEvents"> | null;
  showAddRecipient: boolean;
  setShowAddRecipient: (value: boolean) => void;
  addingToRecipient: Id<"giftRecipients"> | null;
  setAddingToRecipient: (value: Id<"giftRecipients"> | null) => void;
  addingToPool: boolean;
  setAddingToPool: (value: boolean) => void;
  editingItem: Doc<"giftItems"> | null;
  setEditingItem: (value: Doc<"giftItems"> | null) => void;
  showEditEvent: boolean;
  setShowEditEvent: (value: boolean) => void;
  confirmDialog: (options: ConfirmOptions) => Promise<boolean>;
}

export function GiftEventModals({
  eventId,
  event,
  showAddRecipient,
  setShowAddRecipient,
  addingToRecipient,
  setAddingToRecipient,
  addingToPool,
  setAddingToPool,
  editingItem,
  setEditingItem,
  showEditEvent,
  setShowEditEvent,
  confirmDialog,
}: GiftEventModalsProps) {
  return (
    <>
      <MobileModal
        isOpen={showAddRecipient}
        onClose={() => setShowAddRecipient(false)}
        title="Agregar receptor"
      >
        <AddRecipientForm
          eventId={eventId}
          onClose={() => setShowAddRecipient(false)}
        />
      </MobileModal>

      <MobileModal
        isOpen={addingToRecipient !== null || editingItem !== null || addingToPool}
        onClose={() => { setAddingToRecipient(null); setEditingItem(null); setAddingToPool(false); }}
        title={editingItem ? "Editar regalo" : addingToPool ? "Agregar regalo al pool" : "Nuevo regalo"}
      >
        <GiftItemForm
          eventId={eventId}
          recipientId={addingToPool ? undefined : (addingToRecipient || editingItem?.giftRecipientId)}
          initialData={editingItem || undefined}
          onClose={() => { setAddingToRecipient(null); setEditingItem(null); setAddingToPool(false); }}
          confirmDialog={confirmDialog}
        />
      </MobileModal>

      {event && (
        <MobileModal
          isOpen={showEditEvent}
          onClose={() => setShowEditEvent(false)}
          title="Editar evento"
        >
          <EditEventForm
            event={event}
            onClose={() => setShowEditEvent(false)}
          />
        </MobileModal>
      )}
    </>
  );
}
