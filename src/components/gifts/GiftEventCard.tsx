import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";
import { Gift, ChevronRight, CheckCircle2, Calendar } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";

interface GiftEventCardProps {
  event: Doc<"giftEvents">;
  isPendingClose?: boolean;
}

export function GiftEventCard({ event, isPendingClose }: GiftEventCardProps) {
  const { sessionToken } = useAuth();
  const summary = useQuery(
    api.gifts.getGiftEventSummary,
    sessionToken ? { sessionToken, eventId: event._id } : "skip"
  );

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
                  now.setHours(0, 0, 0, 0);
                  const target = new Date(evtDate);
                  target.setHours(0, 0, 0, 0);

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
                      <h3 className={`font-semibold truncate ${event.isCompleted ? "line-through text-muted" : ""}`}>
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
                        <span className="badge badge-sm badge-ghost gap-1 text-body pl-0">
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
            <ChevronRight className="w-5 h-5 text-faint" />
          </Link>
        </div>
      </div>
    </div>
  );
}
