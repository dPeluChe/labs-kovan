import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { PageLoader } from "../components/ui/LoadingSpinner";
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
          <div className="card bg-base-100 shadow-sm border border-base-300 mt-4">
            <div className="card-body text-center">
              <Calendar className="w-12 h-12 mx-auto text-base-content/30 mb-2" />
              <h3 className="font-semibold">Conecta tu calendario</h3>
              <p className="text-sm text-base-content/60 mb-4">
                Vincula Google Calendar para ver tus eventos aquí
              </p>
              <Link to="/settings/calendar" className="btn btn-primary btn-sm">
                Configurar
              </Link>
            </div>
          </div>
        ) : events === undefined ? (
          <PageLoader />
        ) : events.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Sin eventos"
            description="No hay eventos en tu calendario"
          />
        ) : (
          <div className="space-y-4 mt-4">
            {sortedDates.map((dateKey) => {
              const dateEvents = eventsByDate.get(dateKey) || [];
              const date = new Date(dateKey);
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div key={dateKey}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-sm font-semibold ${isToday ? "text-primary" : ""}`}>
                      {isToday
                        ? "Hoy"
                        : date.toLocaleDateString("es-MX", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {dateEvents
                      .sort((a, b) => a.startDateTime - b.startDateTime)
                      .map((event) => (
                        <div
                          key={event._id}
                          className="card bg-base-100 shadow-sm border border-base-300"
                        >
                          <div className="card-body p-3">
                            <div className="flex items-start gap-3">
                              <div className="bg-purple-500/10 p-2 rounded-lg">
                                <Calendar className="w-4 h-4 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm">{event.title}</h4>
                                <div className="flex flex-wrap gap-2 mt-1 text-xs text-base-content/60">
                                  {!event.allDay && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {new Date(event.startDateTime).toLocaleTimeString("es-MX", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                      {" - "}
                                      {new Date(event.endDateTime).toLocaleTimeString("es-MX", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  )}
                                  {event.allDay && <span className="badge badge-xs">Todo el día</span>}
                                  {event.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {event.location}
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
