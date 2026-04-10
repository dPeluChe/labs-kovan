import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageHeader } from "../components/ui/PageHeader";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { SkeletonList } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Gift, Plus, CheckCircle2 } from "lucide-react";
import { useConfirmModal } from "../hooks/useConfirmModal";
import { EditEventForm } from "../components/gifts/EditEventForm";
import { MobileModal } from "../components/ui/MobileModal";
import type { Doc } from "../../convex/_generated/dataModel";
import { GiftEventCard } from "../components/gifts/GiftEventCard";
import { NewGiftEventForm } from "../components/gifts/NewGiftEventForm";

export function GiftsPage() {
  const { currentFamily } = useFamily();
  const { sessionToken } = useAuth();
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Doc<"giftEvents"> | null>(null);
  const [filter, setFilter] = useState<"active" | "pending_close" | "completed">("active");
  const { ConfirmModal } = useConfirmModal();

  const events = useQuery(
    api.gifts.getGiftEvents,
    currentFamily && sessionToken ? { sessionToken, familyId: currentFamily._id } : "skip"
  );

  if (!currentFamily) return <PageLoader />;

  const isPast = (timestamp?: number) => {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() < today.getTime();
  };

  const activeEvents = events?.filter((e: Doc<"giftEvents">) => !e.isCompleted && !isPast(e.date)) || [];
  const pendingClosureEvents = events?.filter((e: Doc<"giftEvents">) => !e.isCompleted && isPast(e.date)) || [];
  const completedEvents = events?.filter((e: Doc<"giftEvents">) => e.isCompleted) || [];

  let displayedEvents: Doc<"giftEvents">[] = [];
  if (filter === "active") displayedEvents = activeEvents;
  else if (filter === "pending_close") displayedEvents = pendingClosureEvents;
  else displayedEvents = completedEvents;

  return (
    <div className="pb-4">
      <PageHeader
        title="Regalos"
        subtitle="Eventos y listas de regalos"
        action={
          <button
            onClick={() => setShowNewEventModal(true)}
            className="btn btn-primary btn-sm gap-1"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        }
      />

      <div className="px-4">
        {events === undefined ? (
          <SkeletonList count={3} />
        ) : (activeEvents.length === 0 && pendingClosureEvents.length === 0 && completedEvents.length === 0) ? (
          <EmptyState
            icon={Gift}
            title="Sin eventos de regalos"
            description="Crea tu primer evento como Navidad o un cumpleaños"
            action={
              <button
                onClick={() => setShowNewEventModal(true)}
                className="btn btn-primary btn-sm"
              >
                Crear evento
              </button>
            }
          />
        ) : (
          <>
            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setFilter("active")}
                className={`btn btn-sm whitespace-nowrap ${filter === "active" ? "btn-primary" : "btn-ghost"}`}
              >
                Activos ({activeEvents.length})
              </button>
              {pendingClosureEvents.length > 0 && (
                <button
                  onClick={() => setFilter("pending_close")}
                  className={`btn btn-sm whitespace-nowrap ${filter === "pending_close" ? "btn-warning" : "btn-ghost text-warning"}`}
                >
                  Por cerrar ({pendingClosureEvents.length})
                </button>
              )}
              {completedEvents.length > 0 && (
                <button
                  onClick={() => setFilter("completed")}
                  className={`btn btn-sm whitespace-nowrap ${filter === "completed" ? "btn-success" : "btn-ghost"}`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Finalizados ({completedEvents.length})
                </button>
              )}
            </div>

            {displayedEvents.length === 0 ? (
              <EmptyState
                icon={filter === "completed" ? CheckCircle2 : Gift}
                title={
                  filter === "completed" ? "Sin eventos finalizados" :
                    filter === "pending_close" ? "Sin eventos por cerrar" :
                      "Sin eventos activos"
                }
                description={filter === "active" ? "Crea un nuevo evento para empezar" : "No hay eventos en esta categoría"}
              />
            ) : (
              <div className="space-y-3 stagger-children">
                {displayedEvents.map((event: Doc<"giftEvents">) => (
                  <GiftEventCard
                    key={event._id}
                    event={event}
                    isPendingClose={filter === "pending_close"}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {sessionToken && (
        <MobileModal
          isOpen={showNewEventModal}
          onClose={() => setShowNewEventModal(false)}
          title="Nuevo evento de regalos"
        >
          <NewGiftEventForm
            sessionToken={sessionToken}
            familyId={currentFamily._id}
            onClose={() => setShowNewEventModal(false)}
          />
        </MobileModal>
      )}

      {editingEvent && (
        <MobileModal
          isOpen={true}
          onClose={() => setEditingEvent(null)}
          title="Editar evento"
        >
          <EditEventForm
            event={editingEvent}
            onClose={() => setEditingEvent(null)}
          />
        </MobileModal>
      )}

      <ConfirmModal />
    </div>
  );
}
