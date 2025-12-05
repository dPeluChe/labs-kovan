import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageHeader } from "../components/ui/PageHeader";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { Gift, Plus, ChevronRight } from "lucide-react";
import { DateInput } from "../components/ui/DateInput";
import { Link } from "react-router-dom";
import type { Id } from "../../convex/_generated/dataModel";

export function GiftsPage() {
  const { currentFamily } = useFamily();
  const { user } = useAuth();
  const [showNewEventModal, setShowNewEventModal] = useState(false);

  const events = useQuery(
    api.gifts.getGiftEvents,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  if (!currentFamily) return <PageLoader />;

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
          <PageLoader />
        ) : events.length === 0 ? (
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
          <div className="space-y-3">
            {events.map((event) => (
              <GiftEventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>

      {showNewEventModal && user && (
        <NewEventModal
          familyId={currentFamily._id}
          userId={user._id}
          onClose={() => setShowNewEventModal(false)}
        />
      )}
    </div>
  );
}

function GiftEventCard({
  event,
}: {
  event: { _id: Id<"giftEvents">; name: string; date?: number; description?: string };
}) {
  const summary = useQuery(api.gifts.getGiftEventSummary, { eventId: event._id });

  return (
    <Link
      to={`/gifts/${event._id}`}
      className="card bg-base-100 shadow-sm border border-base-300"
    >
      <div className="card-body p-4">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/10 p-2 rounded-lg">
            <Gift className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">{event.name}</h3>
            {event.date && (
              <p className="text-sm text-base-content/60">
                {new Date(event.date).toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
            {summary && (
              <div className="flex gap-2 mt-1 text-xs">
                <span className="badge badge-sm badge-ghost">
                  {summary.recipientCount} receptores
                </span>
                <span className="badge badge-sm badge-ghost">
                  {summary.totalItems} regalos
                </span>
                {summary.byStatus.bought > 0 && (
                  <span className="badge badge-sm badge-success">
                    {summary.byStatus.bought} comprados
                  </span>
                )}
              </div>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-base-content/40" />
        </div>
      </div>
    </Link>
  );
}

function NewEventModal({
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
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Nuevo evento de regalos</h3>

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
              rows={2}
            />
          </div>

          <div className="modal-action">
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
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
