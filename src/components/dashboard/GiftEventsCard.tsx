import { Gift } from "lucide-react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";
import { SkeletonText } from "../ui/Skeleton";
import { DashboardCard } from "./DashboardCard";

type GiftEvents = FunctionReturnType<typeof api.gifts.getGiftEvents>;

function getEventTiming(date: number | undefined) {
  const eventDate = new Date(date || 0);
  // Normalize dates for diff
  const nowDate = new Date();
  nowDate.setHours(0, 0, 0, 0);
  const targetDate = new Date(eventDate);
  targetDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((targetDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { diffDays, text: "¡¡ES HOY!!", className: "text-error font-bold animate-pulse" };
  }
  if (diffDays === 1) {
    return { diffDays, text: "¡¡ES MAÑANA!!", className: "text-warning font-bold" };
  }
  if (diffDays > 1) {
    return { diffDays, text: `en ${diffDays} días`, className: "text-primary" };
  }
  return { diffDays, text: "VENCIDO", className: "text-error font-bold" };
}

export function GiftEventsCard({ events }: { events: GiftEvents | undefined }) {
  if (events !== undefined && events.length === 0) return null;

  return (
    <DashboardCard
      icon={Gift}
      title="Regalos e Intercambios"
      to="/gifts"
      color="bg-red-500/10 text-red-600"
    >
      {events === undefined ? (
        <div className="py-1"><SkeletonText lines={1} /></div>
      ) : (
        <ul className="space-y-2">
          {[...events]
            .filter(e => !e.isCompleted) // Only show active
            .sort((a, b) => (a.date || 9999999999999) - (b.date || 9999999999999)) // Sort by date
            .slice(0, 3)
            .map((event) => {
              const eventDate = new Date(event.date || 0);
              const timing = getEventTiming(event.date);

              return (
                <li key={event._id} className="text-sm flex justify-between items-center">
                  <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                    <span className={`truncate font-medium ${timing.diffDays < 0 ? "text-body" : ""}`}>{event.name}</span>
                    {timing.text && (
                      <span className={`text-[10px] uppercase shrink-0 ${timing.className}`}>
                        {timing.text}
                      </span>
                    )}
                  </div>
                  {event.date && (
                    <span className="text-xs text-muted ml-2 whitespace-nowrap">
                      {eventDate.toLocaleDateString("es-MX", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </li>
              );
            })}
          {events.filter(e => !e.isCompleted).length > 3 && (
            <li className="text-xs text-subtle pt-1">+{events.filter(e => !e.isCompleted).length - 3} más</li>
          )}
        </ul>
      )}
    </DashboardCard>
  );
}
