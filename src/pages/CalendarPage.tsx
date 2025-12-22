import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { SkeletonList } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Calendar, MapPin, Clock, Settings, Plus, RefreshCw, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { EventFormModal } from "../components/calendar/EventFormModal";
import { EventDetailModal } from "../components/calendar/EventDetailModal";

export function CalendarPage() {
  const { currentFamily } = useFamily();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Doc<"cachedCalendarEvents"> | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // View State
  const [viewDate, setViewDate] = useState(new Date());
  const [showPastEvents, setShowPastEvents] = useState(false);

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

  const changeMonth = (delta: number) => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + delta);
      return newDate;
    });
  };

  if (!currentFamily) return <PageLoader />;

  const hasIntegration = integration !== undefined && integration !== null;

  // Format Last Sync
  const lastSyncLabel = integration?.lastSync
    ? `Actualizado: ${new Date(integration.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : hasIntegration ? "Sincronización pendiente" : "Eventos compartidos";

  // Filter and Group Events
  const now = new Date();

  // "Pending" threshold: Allow events from yesterday onwards to avoid cutting off "today's" events too aggressively
  const pendingThreshold = new Date();
  pendingThreshold.setDate(pendingThreshold.getDate() - 1);
  pendingThreshold.setHours(0, 0, 0, 0);

  const currentMonthEvents = events?.filter(e => {
    const d = new Date(e.startDateTime);
    // Filter by Month View
    const isSameMonth = d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
    if (!isSameMonth) return false;

    // Filter Past Events if toggle is off
    if (!showPastEvents) {
      // Show if end time is after threshold (yesterday)
      if (e.endDateTime < pendingThreshold.getTime()) return false;
    }
    return true;
  }) || [];

  // Group by Date (Day)
  const eventsByDate = new Map<string, typeof events>();
  currentMonthEvents.forEach((event) => {
    const date = new Date(event.startDateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    const existing = eventsByDate.get(dateKey) || [];
    existing.push(event);
    eventsByDate.set(dateKey, existing);
  });

  const sortedDates = Array.from(eventsByDate.keys()).sort();

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
        ) : (
          <div className="mt-4">
            {/* Controls Bar */}
            <div className="flex items-center justify-between mb-4 bg-base-100 p-2 rounded-xl border border-base-200 shadow-sm sticky top-0 z-20">
              <div className="flex items-center gap-1">
                <button onClick={() => changeMonth(-1)} className="btn btn-ghost btn-circle btn-sm">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-lg font-bold capitalize min-w-[140px] text-center select-none">
                  {viewDate.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
                </span>
                <button onClick={() => changeMonth(1)} className="btn btn-ghost btn-circle btn-sm">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => setShowPastEvents(!showPastEvents)}
                className={`btn btn-sm gap-2 ${showPastEvents ? 'btn-ghost' : 'btn-soft btn-secondary'}`}
                title={showPastEvents ? "Ocultar eventos pasados" : "Mostrar eventos pasados"}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">{showPastEvents ? "Todos" : "Pendientes"}</span>
              </button>
            </div>

            {/* Event List */}
            {sortedDates.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Sin eventos"
                description={showPastEvents
                  ? "No hay eventos en este mes."
                  : "No hay eventos pendientes en este mes."
                }
                action={!showPastEvents && (
                  <button onClick={() => setShowPastEvents(true)} className="btn btn-link btn-sm text-secondary">
                    Ver eventos pasados
                  </button>
                )}
              />
            ) : (
              <div className="space-y-6 stagger-children">
                {sortedDates.map((dateKey) => {
                  const dateEvents = eventsByDate.get(dateKey) || [];
                  const [y, m, d] = dateKey.split('-').map(Number);
                  const date = new Date(y, m - 1, d);
                  const isToday = y === now.getFullYear() && (m - 1) === now.getMonth() && d === now.getDate();

                  return (
                    <div key={dateKey}>
                      <div className="mb-2 px-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-sm font-bold uppercase tracking-wider ${isToday ? "text-secondary" : "text-base-content/70"}`}>
                            {isToday
                              ? "Hoy"
                              : date.toLocaleDateString("es-MX", {
                                weekday: "long",
                                day: "numeric"
                              })}
                          </span>
                          {isToday && <span className="badge badge-xs badge-secondary">Actual</span>}
                        </div>

                        <div className="space-y-2">
                          {dateEvents
                            .sort((a, b) => a.startDateTime - b.startDateTime)
                            .map((event) => (
                              <div
                                key={event._id}
                                onClick={() => setSelectedEvent(event)}
                                className="card bg-base-100 shadow-sm border border-base-300 card-interactive group cursor-pointer hover:border-primary/50 transition-all"
                              >
                                <div className="card-body p-3">
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg flex flex-col items-center min-w-[3rem] relative ${isToday ? "bg-primary/10 text-primary" : "bg-base-200 text-base-content/70"
                                      }`}>
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
                    </div>
                  );
                })}
              </div>
            )}
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
