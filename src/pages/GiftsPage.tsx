import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageHeader } from "../components/ui/PageHeader";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { SkeletonList } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Gift, Plus, ChevronRight, CheckCircle2, Edit2, Trash2, MoreVertical } from "lucide-react";
import { useConfirmModal } from "../components/ui/ConfirmModal";
import { DateInput } from "../components/ui/DateInput";
import { Link } from "react-router-dom";
import type { Id } from "../../convex/_generated/dataModel";

export function GiftsPage() {
  const { currentFamily } = useFamily();
  const { user } = useAuth();
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const { confirm, ConfirmModal } = useConfirmModal();

  const events = useQuery(
    api.gifts.getGiftEvents,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const deleteEvent = useMutation(api.gifts.deleteGiftEvent);
  const updateEvent = useMutation(api.gifts.updateGiftEvent);

  if (!currentFamily) return <PageLoader />;

  const activeEvents = events?.filter(e => !e.isCompleted) || [];
  const completedEvents = events?.filter(e => e.isCompleted) || [];
  const displayedEvents = showCompleted ? completedEvents : activeEvents;

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
        ) : activeEvents.length === 0 && completedEvents.length === 0 ? (
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
            {(activeEvents.length > 0 || completedEvents.length > 0) && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setShowCompleted(false)}
                  className={`btn btn-sm ${!showCompleted ? "btn-primary" : "btn-ghost"}`}
                >
                  Activos ({activeEvents.length})
                </button>
                {completedEvents.length > 0 && (
                  <button
                    onClick={() => setShowCompleted(true)}
                    className={`btn btn-sm ${showCompleted ? "btn-success" : "btn-ghost"}`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Finalizados ({completedEvents.length})
                  </button>
                )}
              </div>
            )}

            {displayedEvents.length === 0 ? (
              <EmptyState
                icon={showCompleted ? CheckCircle2 : Gift}
                title={showCompleted ? "Sin eventos finalizados" : "Sin eventos activos"}
                description={showCompleted ? "Los eventos finalizados aparecerán aquí" : "Crea un nuevo evento para empezar"}
              />
            ) : (
              <div className="space-y-3 stagger-children">
                {displayedEvents.map((event) => (
                  <GiftEventCard
                    key={event._id}
                    event={event}
                    onEdit={() => setEditingEvent(event)}
                    onDelete={async () => {
                      const confirmed = await confirm({
                        title: "Eliminar evento",
                        message: `¿Eliminar "${event.name}" y todos sus regalos?`,
                        confirmText: "Eliminar",
                        cancelText: "Cancelar",
                        variant: "danger",
                        icon: "trash",
                      });
                      if (confirmed) {
                        await deleteEvent({ eventId: event._id });
                      }
                    }}
                    onToggleComplete={async () => {
                      await updateEvent({
                        eventId: event._id,
                        isCompleted: !event.isCompleted,
                      });
                    }}
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
  onEdit,
  onDelete,
  onToggleComplete,
}: {
  event: { _id: Id<"giftEvents">; name: string; date?: number; description?: string; isCompleted?: boolean };
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
}) {
  const summary = useQuery(api.gifts.getGiftEventSummary, { eventId: event._id });

  return (
    <div className={`card bg-base-100 shadow-sm border ${event.isCompleted ? "border-success/30 opacity-75" : "border-base-300"}`}>
      <div className="card-body p-4">
        <div className="flex items-center gap-3">
          <Link to={`/gifts/${event._id}`} className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${event.isCompleted ? "bg-success/10" : "bg-red-500/10"}`}>
              {event.isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <Gift className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold ${event.isCompleted ? "line-through text-base-content/60" : ""}`}>
                {event.name}
              </h3>
              {event.date && (
                <p className="text-sm text-base-content/60">
                  {new Date(event.date + 86400000 / 2).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              )}
              {summary ? (
                <div className="flex flex-wrap gap-1.5 mt-1 text-xs animate-fade-in">
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
                </div>
              ) : (
                <div className="h-5 w-24 bg-base-200 rounded animate-pulse mt-1" />
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-base-content/40" />
          </Link>
          
          {/* Actions Dropdown */}
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost btn-sm btn-circle" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="w-4 h-4" />
            </button>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-48 border border-base-300 z-50">
              <li>
                <button onClick={onEdit}>
                  <Edit2 className="w-4 h-4" /> Editar
                </button>
              </li>
              <li>
                <button onClick={onToggleComplete}>
                  <CheckCircle2 className="w-4 h-4" />
                  {event.isCompleted ? "Reactivar" : "Marcar finalizado"}
                </button>
              </li>
              <li>
                <button onClick={onDelete} className="text-error">
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </li>
            </ul>
          </div>
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
    } catch (error) {
      console.error("Error updating event:", error);
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
          {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
        </button>
      </div>
    </form>
  );
}