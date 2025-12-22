import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { SkeletonList } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Calendar, MapPin, Clock, Settings, Plus, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { EventFormModal } from "../components/calendar/EventFormModal";
import { EventDetailModal } from "../components/calendar/EventDetailModal";

export function CalendarPage() {
  const { currentFamily } = useFamily();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Doc<"cachedCalendarEvents"> | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const integration = useQuery(
    api.calendar.getCalendarIntegration,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const events = useQuery(
    api.calendar.getCachedEvents,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const syncCalendar = useAction(api.calendar.syncGoogleCalendar);

  const handleSync = async () => {
    if (!currentFamily) return;
    setIsSyncing(true);
    try {
      await syncCalendar({ familyId: currentFamily._id });
    } catch (err) {
      console.error("Sync failed", err);
      alert("Error al sincronizar calendario");
    } finally {
      setIsSyncing(false);
    }
  };

  if (!currentFamily) return <PageLoader />;

  const hasIntegration = integration !== undefined && integration !== null;

  // Format Last Sync
  const lastSyncLabel = integration?.lastSync
    ? `Actualizado: ${new Date(integration.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : hasIntegration ? "Sincronización pendiente" : "Eventos compartidos";

  // Group events by date
  const eventsByDate = new Map<string, typeof events>();
  if (events) {
    events.forEach((event) => {
      const dateKey = new Date(event.startDateTime).toDateString();
      const existing = eventsByDate.get(dateKey) || [];
      existing.push(event);
      eventsByDate.set(dateKey, existing);
    });
  }

  const sortedDates = Array.from(eventsByDate.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="pb-4">
      <PageHeader
        title="Calendario"
        subtitle={lastSyncLabel}
        action={
          <div className="flex gap-2">
            {hasIntegration && (
              <button
                onClick={handleSync}
                className={`btn btn-ghost btn-sm btn-circle ${isSyncing ? "animate-spin" : ""}`}
                disabled={isSyncing}
                title="Sincronizar ahora"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            )}
            <Link to="/settings/calendar" className="btn btn-ghost btn-sm btn-circle">
              <Settings className="w-5 h-5" />
            </Link>
            {hasIntegration && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary btn-sm btn-square"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        }
      />

      <div className="px-4">
        {integration === undefined ? (
          <div className="mt-4">
            <SkeletonList count={1} />
          </div>
        ) : !hasIntegration ? (
          <div className="card bg-base-100 shadow-sm border border-base-300 mt-4 animate-fade-in">
            <div className="card-body text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Conecta tu calendario</h3>
              <p className="text-sm text-base-content/60 mb-4 max-w-xs mx-auto">
                Vincula Google Calendar para ver tus eventos y citas en un solo lugar.
              </p>
              <Link to="/settings/calendar" className="btn btn-primary btn-sm w-fit mx-auto">
                Configurar integración
              </Link>
            </div>
          </div>
        ) : events === undefined ? (
          <div className="mt-4">
            <SkeletonList count={4} />
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Sin eventos"
            description="No hay eventos próximos en tu calendario"
          />
        ) : (
          <div className="space-y-6 mt-4 stagger-children">
            {sortedDates.map((dateKey) => {
              const dateEvents = eventsByDate.get(dateKey) || [];
              const date = new Date(dateKey);
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div key={dateKey}>
                  <div className="flex items-center gap-2 mb-2 sticky top-[calc(var(--nav-height)/1.5)] bg-base-100/95 backdrop-blur-sm py-2 z-10 -mx-4 px-4 border-b border-base-100">
                    <span className={`text-sm font-bold uppercase tracking-wider ${isToday ? "text-primary" : "text-base-content/70"}`}>
                      {isToday
                        ? "Hoy"
                        : date.toLocaleDateString("es-MX", {
                          weekday: "long",
                          day: "numeric",
                          month: "short"
                        })}
                    </span>
                    {isToday && <span className="badge badge-xs badge-primary">Actual</span>}
                  </div>

                  <div className="space-y-2">
                    {dateEvents
                      .sort((a, b) => a.startDateTime - b.startDateTime)
                      .map((event) => (
                        <div
                          key={event._id}
                          onClick={() => setSelectedEvent(event)}
                          className="card bg-base-100 shadow-sm border border-base-300 card-interactive group cursor-pointer"
                        >
                          <div className="card-body p-3">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg flex flex-col items-center min-w-[3rem] relative ${isToday ? "bg-primary/10 text-primary" : "bg-base-200 text-base-content/70"
                                }`}>
                                {/* Calendar Indicator (Color/Dot) */}
                                {event.calendarId && (
                                  <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-secondary" title="Sincronizado" />
                                )}
                                <span className="text-xs font-bold">
                                  {new Date(event.startDateTime).toLocaleTimeString("es-MX", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              <div className="flex-1 min-w-0 py-0.5">
                                <h4 className="font-semibold text-sm leading-tight mb-1">{event.title}</h4>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-base-content/60">
                                  {!event.allDay && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {new Date(event.endDateTime).toLocaleTimeString("es-MX", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  )}
                                  {event.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      <span className="truncate max-w-[150px]">{event.location}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <EventFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <EventDetailModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
      />
    </div>
  );
}
