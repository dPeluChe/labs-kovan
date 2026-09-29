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
import { useAuth } from "../contexts/AuthContext";

type CalendarEvent = Doc<"cachedCalendarEvents">;

function groupEventsByDate(events: CalendarEvent[] | undefined, viewDate: Date, showPastEvents: boolean) {
  const pendingThreshold = new Date();
  pendingThreshold.setDate(pendingThreshold.getDate() - 1);
  pendingThreshold.setHours(0, 0, 0, 0);

  const currentMonthEvents = events?.filter((e) => {
    const d = new Date(e.startDateTime);
    const isSameMonth = d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
    if (!isSameMonth) return false;
    if (!showPastEvents && e.endDateTime < pendingThreshold.getTime()) return false;
    return true;
  }) || [];

  const eventsByDate = new Map<string, CalendarEvent[]>();
  currentMonthEvents.forEach((event) => {
    const date = new Date(event.startDateTime);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const existing = eventsByDate.get(dateKey) || [];
    existing.push(event);
    eventsByDate.set(dateKey, existing);
  });

  return { eventsByDate, sortedDates: Array.from(eventsByDate.keys()).sort() };
}

function ConnectCalendarCard() {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 mt-4 animate-fade-in">
      <div className="card-body text-center">
        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-semibold text-lg">Conecta tu calendario</h3>
        <p className="text-sm text-muted mb-4 max-w-xs mx-auto">
          Vincula Google Calendar para ver tus eventos y citas en un solo lugar.
        </p>
        <Link to="/settings/calendar" className="btn btn-primary btn-sm w-fit mx-auto">
          Configurar integración
        </Link>
      </div>
    </div>
  );
}

function CalendarControls({
  viewDate,
  showPastEvents,
  onChangeMonth,
  onTogglePastEvents,
}: {
  viewDate: Date;
  showPastEvents: boolean;
  onChangeMonth: (delta: number) => void;
  onTogglePastEvents: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4 bg-base-100 p-2 rounded-xl border border-base-200 shadow-sm sticky top-0 z-20">
      <div className="flex items-center gap-1">
        <button onClick={() => onChangeMonth(-1)} className="btn btn-ghost btn-circle btn-sm" aria-label="Mes anterior">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-bold capitalize min-w-[140px] text-center select-none">
          {viewDate.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
        </span>
        <button onClick={() => onChangeMonth(1)} className="btn btn-ghost btn-circle btn-sm" aria-label="Mes siguiente">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <button
        onClick={onTogglePastEvents}
        className={`btn btn-sm gap-2 ${showPastEvents ? 'btn-ghost' : 'btn-soft btn-secondary'}`}
        title={showPastEvents ? "Ocultar eventos pasados" : "Mostrar eventos pasados"}
      >
        <Filter className="w-4 h-4" />
        <span className="hidden sm:inline">{showPastEvents ? "Todos" : "Pendientes"}</span>
      </button>
    </div>
  );
}

function CalendarEventCard({ event, isToday, onSelect }: { event: CalendarEvent; isToday: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="card bg-base-100 shadow-sm border border-base-300 card-interactive group cursor-pointer hover:border-primary/50 transition-colors w-full text-left"
    >
      <div className="card-body p-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg flex flex-col items-center min-w-[3rem] relative ${isToday ? "bg-primary/10 text-primary" : "bg-base-200 text-body"}`}>
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
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
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
    </button>
  );
}

function EventDayGroup({
  dateKey,
  events,
  now,
  onSelectEvent,
}: {
  dateKey: string;
  events: CalendarEvent[];
  now: Date;
  onSelectEvent: (event: CalendarEvent) => void;
}) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const isToday = y === now.getFullYear() && (m - 1) === now.getMonth() && d === now.getDate();

  return (
    <div>
      <div className="mb-2 px-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-sm font-bold uppercase tracking-wider ${isToday ? "text-secondary" : "text-body"}`}>
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
          {[...events]
            .sort((a, b) => a.startDateTime - b.startDateTime)
            .map((event) => (
              <CalendarEventCard key={event._id} event={event} isToday={isToday} onSelect={() => onSelectEvent(event)} />
            ))}
        </div>
      </div>
    </div>
  );
}

function formatLastSync(integration: { lastSync?: number } | null | undefined, hasIntegration: boolean) {
  if (integration?.lastSync) {
    return `Actualizado: ${new Date(integration.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return hasIntegration ? "Sincronización pendiente" : "Eventos compartidos";
}

function CalendarEventList({
  sortedDates,
  eventsByDate,
  showPastEvents,
  now,
  onShowPastEvents,
  onSelectEvent,
}: {
  sortedDates: string[];
  eventsByDate: Map<string, CalendarEvent[]>;
  showPastEvents: boolean;
  now: Date;
  onShowPastEvents: () => void;
  onSelectEvent: (event: CalendarEvent) => void;
}) {
  if (sortedDates.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Sin eventos"
        description={showPastEvents
          ? "No hay eventos en este mes."
          : "No hay eventos pendientes en este mes."
        }
        action={!showPastEvents && (
          <button onClick={onShowPastEvents} className="btn btn-link btn-sm text-secondary">
            Ver eventos pasados
          </button>
        )}
      />
    );
  }
  return (
    <div className="space-y-6 stagger-children">
      {sortedDates.map((dateKey) => (
        <EventDayGroup
          key={dateKey}
          dateKey={dateKey}
          events={eventsByDate.get(dateKey) || []}
          now={now}
          onSelectEvent={onSelectEvent}
        />
      ))}
    </div>
  );
}

function ConnectedCalendarView({
  viewDate,
  showPastEvents,
  sortedDates,
  eventsByDate,
  now,
  onChangeMonth,
  onTogglePastEvents,
  onShowPastEvents,
  onSelectEvent,
}: {
  viewDate: Date;
  showPastEvents: boolean;
  sortedDates: string[];
  eventsByDate: Map<string, CalendarEvent[]>;
  now: Date;
  onChangeMonth: (delta: number) => void;
  onTogglePastEvents: () => void;
  onShowPastEvents: () => void;
  onSelectEvent: (event: CalendarEvent) => void;
}) {
  return (
    <div className="mt-4">
      <CalendarControls
        viewDate={viewDate}
        showPastEvents={showPastEvents}
        onChangeMonth={onChangeMonth}
        onTogglePastEvents={onTogglePastEvents}
      />
      <CalendarEventList
        sortedDates={sortedDates}
        eventsByDate={eventsByDate}
        showPastEvents={showPastEvents}
        now={now}
        onShowPastEvents={onShowPastEvents}
        onSelectEvent={onSelectEvent}
      />
    </div>
  );
}

export function CalendarPage() {
  const { currentFamily } = useFamily();
  const { sessionToken } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Doc<"cachedCalendarEvents"> | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // View State
  const [viewDate, setViewDate] = useState(new Date());
  const [showPastEvents, setShowPastEvents] = useState(false);

  const integration = useQuery(
    api.calendar.getCalendarIntegration,
    currentFamily && sessionToken ? { sessionToken, familyId: currentFamily._id } : "skip"
  );

  const events = useQuery(
    api.calendar.getCachedEvents,
    currentFamily && sessionToken ? { sessionToken, familyId: currentFamily._id } : "skip"
  );

  const syncCalendar = useAction(api.calendar.syncGoogleCalendar);

  const handleSync = async () => {
    if (!currentFamily || !sessionToken) return;
    setIsSyncing(true);
    try {
      await syncCalendar({ sessionToken, familyId: currentFamily._id });
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
  const lastSyncLabel = formatLastSync(integration, hasIntegration);

  // Filter and Group Events
  const now = new Date();
  const { eventsByDate, sortedDates } = groupEventsByDate(events, viewDate, showPastEvents);

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
          <ConnectCalendarCard />
        ) : (
          <ConnectedCalendarView
            viewDate={viewDate}
            showPastEvents={showPastEvents}
            sortedDates={sortedDates}
            eventsByDate={eventsByDate}
            now={now}
            onChangeMonth={changeMonth}
            onTogglePastEvents={() => setShowPastEvents(!showPastEvents)}
            onShowPastEvents={() => setShowPastEvents(true)}
            onSelectEvent={setSelectedEvent}
          />
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
