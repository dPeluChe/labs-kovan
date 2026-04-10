import { Calendar, Plus, MapPin, CheckCircle2, Circle, Building, Car, Ticket, FileText, Plane } from "lucide-react";
import { SwipeableCard } from "../../ui/SwipeableCard";
import { Timeline, TimelineItem } from "../../ui/Timeline";
import { IconBadge } from "../../ui/IconBadge";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";

type ItineraryItemType =
  | (Doc<"tripPlans"> & { kind: "plan"; placeName?: string })
  | (Doc<"tripBookings"> & { kind: "booking" });

interface TripItineraryTabProps {
  trip: Doc<"trips">;
  plans: Doc<"tripPlans">[];
  bookings: Doc<"tripBookings">[];
  onDeletePlan: (planId: Id<"tripPlans">) => void;
  onTogglePlan: (planId: Id<"tripPlans">) => void;
  onSelectPlan: (planId: Id<"tripPlans">) => void;
  onOpenAddPlan: () => void;
  onOpenEditTrip: () => void;
}

export function TripItineraryTab({
  trip,
  plans,
  bookings,
  onDeletePlan,
  onTogglePlan,
  onSelectPlan,
  onOpenAddPlan,
  onOpenEditTrip,
}: TripItineraryTabProps) {
  if (!trip.startDate || !trip.endDate) {
    return (
      <div className="text-center py-10 space-y-4">
        <Calendar className="w-12 h-12 mx-auto text-faint" />
        <div>
          <h3 className="font-bold">Sin fechas definidas</h3>
          <p className="text-sm text-muted">Configura las fechas de tu viaje para poder armar un itinerario detallado.</p>
        </div>
        <button onClick={onOpenEditTrip} className="btn btn-primary btn-sm">Configurar fechas</button>
      </div>
    );
  }

  const mixedItems: ItineraryItemType[] = [
    ...plans.map((p) => ({ ...p, kind: "plan" as const })),
    ...bookings.filter((b) => b.startDate).map((b) => ({ ...b, kind: "booking" as const })),
  ];

  const groupedItems = mixedItems.reduce((acc, item) => {
    const dateKey = item.kind === "plan"
      ? (item.dayDate ? new Date(item.dayDate).toDateString() : "unscheduled")
      : (item.startDate ? new Date(item.startDate).toDateString() : "unscheduled");

    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, ItineraryItemType[]>);

  Object.keys(groupedItems).forEach((key) => {
    groupedItems[key].sort((a, b) => {
      const getTime = (item: ItineraryItemType) => {
        if (item.kind === "booking") return new Date(item.startDate).getHours() * 60 + new Date(item.startDate).getMinutes();
        if (item.kind === "plan" && item.time) {
          const [h, m] = item.time.split(":").map(Number);
          return h * 60 + m;
        }
        return 0;
      };
      return getTime(a) - getTime(b);
    });
  });

  const days = [];
  const current = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const sortedDates = [
    ...days.map((d) => d.toDateString()),
    ...(groupedItems.unscheduled ? ["unscheduled"] : []),
  ].filter((value, index, self) => self.indexOf(value) === index);

  return (
    <Timeline>
      {sortedDates.map((dateKey) => {
        const dayItems = groupedItems[dateKey] || [];
        const isUnscheduled = dateKey === "unscheduled";
        const displayDate = isUnscheduled ? "Sin fecha" : new Date(dateKey).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

        return (
          <TimelineItem key={dateKey} variant="primary">
            <h3 className="font-bold text-lg mb-3 capitalize text-primary">{displayDate}</h3>
            <div className="space-y-3">
              {dayItems.length === 0 ? (
                <div className="text-sm text-faint italic py-2">
                  Nada planeado para este día
                </div>
              ) : (
                dayItems.map((item) => {
                  if (item.kind === "booking") {
                    const Icon = BOOKING_ICONS[item.type as keyof typeof BOOKING_ICONS] || Plane;
                    return (
                      <div key={item._id} className="card surface-muted p-3 flex flex-row gap-3 items-center">
                        <IconBadge color="bg-base-100 text-body" size="sm">
                          <Icon className="w-4 h-4" />
                        </IconBadge>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">{item.provider}</div>
                          <div className="text-xs text-muted flex gap-2">
                            <span className="capitalize font-medium">{item.type}</span>
                            <span>{new Date(item.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <PlanItem
                      key={item._id}
                      plan={item}
                      onDelete={() => onDeletePlan(item._id)}
                      onCheckIn={() => onTogglePlan(item._id)}
                      onSelect={() => onSelectPlan(item._id)}
                    />
                  );
                })
              )}
            </div>
            <button
              onClick={onOpenAddPlan}
              className="btn btn-xs btn-ghost text-primary gap-1 pl-0 opacity-50 hover:opacity-100 mt-2"
            >
              <Plus className="w-3 h-3" /> Agregar actividad
            </button>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}

function PlanItem({ plan, onDelete, onCheckIn, onSelect }: {
  plan: Doc<"tripPlans"> & { placeName?: string };
  onDelete?: () => void;
  onCheckIn: () => void;
  onSelect: () => void;
}) {
  return (
    <SwipeableCard
      className="mb-1"
      contentClassName={`relative bg-base-100 p-3 border border-base-200 rounded-xl shadow-sm z-10 select-none ${plan.isCompleted ? "bg-base-200 opacity-60" : ""}`}
      actionWidth={100}
      onClick={onSelect}
      actions={({ close }) => (
        <>
          <button
            className={`btn btn-sm btn-circle shadow-sm ${plan.isCompleted ? "btn-warning text-white" : "btn-success text-white"}`}
            onClick={(e) => {
              e.stopPropagation();
              close();
              onCheckIn();
            }}
          >
            {plan.isCompleted ? <Circle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          </button>
          {onDelete && (
            <button
              className="btn btn-sm btn-circle btn-error text-white shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                close();
                onDelete();
              }}
            >
              <span className="text-lg">×</span>
            </button>
          )}
        </>
      )}
    >
      <div className="flex gap-3 items-start">
        {plan.time ? (
          <div className="pt-0.5 flex flex-col items-center min-w-[3rem] border-r border-base-content/10 pr-2 mr-1">
            <span className="font-mono text-sm font-bold text-primary">{plan.time}</span>
            {plan.isCompleted && <span className="text-[10px] text-success font-bold uppercase mt-1">Listo</span>}
          </div>
        ) : (
          <div className="pt-1.5 flex flex-col items-center min-w-[1rem] mr-2">
            <div className={`w-2 h-2 rounded-full ${plan.isCompleted ? "bg-success" : "bg-primary/20"}`} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className={`font-medium leading-tight ${plan.isCompleted ? "line-through text-subtle" : "text-base-content"}`}>
            {plan.activity}
          </div>

          {plan.placeName && (
            <div className="text-xs text-primary/80 mt-0.5 flex items-center gap-1 font-medium">
              <MapPin className="w-3 h-3" /> {plan.placeName}
            </div>
          )}

          {plan.notes && (
            <p className="text-xs text-muted mt-1 line-clamp-2">
              {plan.notes}
            </p>
          )}
        </div>

        <div className="w-1 h-8 rounded-full bg-base-200 ml-1 self-center shrink-0 opacity-50" />
      </div>
    </SwipeableCard>
  );
}

const BOOKING_ICONS = {
  flight: Plane,
  hotel: Building,
  transport: Car,
  rental: Car,
  activity: Ticket,
  other: FileText,
};
