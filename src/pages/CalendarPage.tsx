import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { SkeletonList } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { Calendar, MapPin, Clock, Settings } from "lucide-react";
import { Link } from "react-router-dom";

export function CalendarPage() {
  const { currentFamily } = useFamily();

  const integration = useQuery(
    api.calendar.getCalendarIntegration,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const events = useQuery(
    api.calendar.getCachedEvents,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  if (!currentFamily) return <PageLoader />;

  const hasIntegration = integration !== undefined && integration !== null;

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
        subtitle={hasIntegration ? integration.displayName : "Eventos compartidos"}
        action={
          <Link to="/settings/calendar" className="btn btn-ghost btn-sm btn-circle">
            <Settings className="w-5 h-5" />
          </Link>
        }
      />

      <div className="px-4">
        {!hasIntegration ? (
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
                          className="card bg-base-100 shadow-sm border border-base-300 card-interactive group"
                        >
                          <div className="card-body p-3">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg flex flex-col items-center min-w-[3rem] ${
                                isToday ? "bg-primary/10 text-primary" : "bg-base-200 text-base-content/70"
                              }`}>
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
    </div>
  );
}
