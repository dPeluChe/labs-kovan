
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageHeader } from "../components/ui/PageHeader";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { SkeletonList } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Gift, Plus, ChevronRight, CheckCircle2, Calendar } from "lucide-react";
import { useConfirmModal } from "../hooks/useConfirmModal";
import { DateInput } from "../components/ui/DateInput";
import { Link } from "react-router-dom";
import { EditEventForm } from "../components/gifts/EditEventForm";
import type { Id, Doc } from "../../convex/_generated/dataModel";

export function GiftsPage() {
  const { currentFamily } = useFamily();
  const { user } = useAuth();
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Doc<"giftEvents"> | null>(null);
  const [filter, setFilter] = useState<"active" | "pending_close" | "completed">("active");
  const { ConfirmModal } = useConfirmModal();

  const events = useQuery(
    api.gifts.getGiftEvents,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  if (!currentFamily) return <PageLoader />;

  // Group events
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Normalize to start of day for comparison?
  // Actually, allow "today" events to be active until tomorrow.
  // Let's say if date < yesterday, it's pending closure.
  // If date is today, it's active "ES HOY".

  // Helper to check if date is strictly in the past (yesterday or before)
  const isPast = (timestamp?: number) => {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Compare dates only
    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() < today.getTime();
  };

  const activeEvents = events?.filter((e: Doc<"giftEvents">) => !e.isCompleted && !isPast(e.date)) || [];
  const pendingClosureEvents = events?.filter((e: Doc<"giftEvents">) => !e.isCompleted && isPast(e.date)) || [];
  const completedEvents = events?.filter((e: Doc<"giftEvents">) => e.isCompleted) || [];

  // Determine which list to show
  let displayedEvents: Doc<"giftEvents">[] = [];
  if (filter === "active") displayedEvents = activeEvents;
  else if (filter === "pending_close") displayedEvents = pendingClosureEvents;
  else displayedEvents = completedEvents;

  // Auto-switch filter if active is empty but pending_close has items? No, confusing. Stick to default "active".

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
            {/* Filter Tabs */}
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

      {user && showNewEventModal && (
        <div className="modal modal-open">
          <div className="modal-box max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">Nuevo evento de regalos</h3>
            <NewEventForm
              familyId={currentFamily._id}
              userId={user._id}
              onClose={() => setShowNewEventModal(false)}
            />
          </div>
          <div className="modal-backdrop" onClick={() => setShowNewEventModal(false)} />
        </div>
      )}

      {editingEvent && (
        <div className="modal modal-open">
          <div className="modal-box max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">Editar evento</h3>
            <EditEventForm
              event={editingEvent}
              onClose={() => setEditingEvent(null)}
            />
          </div>
          <div className="modal-backdrop" onClick={() => setEditingEvent(null)} />
        </div>
      )}

      <ConfirmModal />
    </div>
  );
}

function GiftEventCard({
  event,
  isPendingClose,
}: {
  event: Doc<"giftEvents">;
  isPendingClose?: boolean;
}) {
  const summary = useQuery(api.gifts.getGiftEventSummary, { eventId: event._id });

  return (
    <div className={`card bg-base-100 shadow-sm border animate-fade-in ${event.isCompleted ? "border-success/30 opacity-75" :
        isPendingClose ? "border-warning/50 bg-warning/5" :
          "border-base-300"
      }`}>
      <div className="card-body p-4">
        <div className="flex items-center gap-3">
          <Link to={`/gifts/${event._id}`} className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${event.isCompleted ? "bg-success/10" :
                isPendingClose ? "bg-warning/10" :
                  "bg-red-500/10"
              }`}>
              {event.isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : isPendingClose ? (
                <Calendar className="w-5 h-5 text-warning" />
              ) : (
                <Gift className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {(() => {
                const evtDate = event.date ? new Date(event.date) : null;
                let timeText = "";
                let timeClass = "text-primary";

                if (evtDate) {
                  const now = new Date();
                  now.setHours(0, 0, 0, 0); // Normalize today
                  const target = new Date(evtDate);
                  target.setHours(0, 0, 0, 0); // Normalize target

                  const diffTime = target.getTime() - now.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  if (!event.isCompleted) {
                    if (diffDays === 0) {
                      timeText = "¡¡ES HOY!!";
                      timeClass = "text-error font-bold animate-pulse";
                    } else if (diffDays === 1) {
                      timeText = "¡¡ES MAÑANA!!";
                      timeClass = "text-warning font-bold";
                    } else if (diffDays > 1) {
                      timeText = `(en ${diffDays} días)`;
                    } else if (diffDays < 0) {
                      timeText = "PENDIENTE DE CIERRE";
                      timeClass = "text-warning font-bold uppercase";
                    }
                  }
                }

                return (
                  <>
                    <div className="flex items-center justify-between gap-2 min-w-0 w-full">
                      <h3 className={`font-semibold truncate ${event.isCompleted ? "line-through text-base-content/60" : ""}`}>
                        {event.name}
                      </h3>
                      {timeText && !event.isCompleted && (
                        <span className={`text-[10px] uppercase font-bold shrink-0 whitespace-nowrap ${timeClass}`}>
                          {timeText}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-1 text-xs animate-fade-in items-center">
                      {evtDate && (
                        <span className="badge badge-sm badge-ghost gap-1 text-base-content/70 pl-0">
                          <Calendar className="w-3 h-3" />
                          {evtDate.toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
                        </span>
                      )}

                      {summary ? (
                        <>
                          <span className="badge badge-sm badge-ghost gap-1">
                            👥 {summary.recipientCount}
                          </span>
                          <span className="badge badge-sm badge-ghost gap-1">
                            🎁 {summary.totalItems}
                          </span>
                          {summary.byStatus.bought > 0 && (
                            <span className="badge badge-sm badge-success gap-1">
                              ✅ {summary.byStatus.bought}
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="h-5 w-24 bg-base-200 rounded animate-pulse" />
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
            <ChevronRight className="w-5 h-5 text-base-content/40" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function NewEventForm({
  familyId,
  userId,
  onClose,
}: {
  familyId: Id<"families">;
  userId: Id<"users">;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createEvent = useMutation(api.gifts.createGiftEvent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await createEvent({
        familyId,
        name: name.trim(),
        date: date ? new Date(date).getTime() : undefined,
        description: description.trim() || undefined,
        createdBy: userId,
      });
      onClose();
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Nombre del evento *</span>
        </label>
        <input
          type="text"
          placeholder="Ej: Navidad 2025, Cumple de mamá"
          className="input input-bordered w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          autoFocus
        />
      </div>

      <DateInput
        label="Fecha (opcional)"
        value={date}
        onChange={setDate}
        disabled={isLoading}
      />

      <div className="form-control">
        <label className="label">
          <span className="label-text">Descripción (opcional)</span>
        </label>
        <textarea
          placeholder="Notas adicionales..."
          className="textarea textarea-bordered w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn" onClick={onClose} disabled={isLoading}>
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading || !name.trim()}
        >
          {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Crear"}
        </button>
      </div>
    </form>
  );
}