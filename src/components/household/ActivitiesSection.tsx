import { Sparkles } from "lucide-react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { EmptyState } from "../ui/EmptyState";
import { SectionTitle } from "../ui/SectionTitle";

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  cleaning: { label: "Limpieza", emoji: "🧹" },
  cooking: { label: "Cocina", emoji: "🍳" },
  laundry: { label: "Ropa", emoji: "👕" },
  organization: { label: "Orden", emoji: "📦" },
  maintenance: { label: "Mantenimiento", emoji: "🔧" },
  pets: { label: "Mascotas", emoji: "🐾" },
  errands: { label: "Mandados", emoji: "🛒" },
  other: { label: "Otro", emoji: "✨" },
};

interface ActivitiesSectionProps {
  showManage: boolean;
  activities: Doc<"householdActivities">[];
  allActivities: Doc<"householdActivities">[] | undefined;
  onActivityClick: (activity: Doc<"householdActivities">) => void;
  onToggleActive: (activity: Doc<"householdActivities">) => void;
  onEdit: (activity: Doc<"householdActivities">) => void;
  onDelete: (activityId: Id<"householdActivities">) => void;
}

export function ActivitiesSection({
  showManage,
  activities,
  allActivities,
  onActivityClick,
  onToggleActive,
  onEdit,
  onDelete,
}: ActivitiesSectionProps) {
  if (showManage) {
    return (
      <ManageActivityList
        activities={allActivities ?? activities}
        onToggleActive={onToggleActive}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }
  return <ActivityGrid activities={activities} onActivityClick={onActivityClick} />;
}

interface ManageActivityListProps {
  activities: Doc<"householdActivities">[];
  onToggleActive: (activity: Doc<"householdActivities">) => void;
  onEdit: (activity: Doc<"householdActivities">) => void;
  onDelete: (activityId: Id<"householdActivities">) => void;
}

/* Manage mode: show all activities including inactive */
function ManageActivityList({
  activities,
  onToggleActive,
  onEdit,
  onDelete,
}: ManageActivityListProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted mb-3">
        Administra las actividades. Desactiva o elimina las que no necesites.
      </p>
      {activities.map((activity) => (
        <div
          key={activity._id}
          className={`flex items-center gap-3 p-3 rounded-xl border border-base-300 ${
            activity.isActive === false ? "opacity-50" : ""
          }`}
        >
          <span className="text-xl">{activity.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{activity.name}</p>
            <p className="text-xs text-subtle">{activity.points} pts</p>
          </div>
          <button
            onClick={() => onToggleActive(activity)}
            className={`btn btn-xs ${
              activity.isActive === false ? "btn-ghost" : "btn-success btn-outline"
            }`}
          >
            {activity.isActive === false ? "Inactiva" : "Activa"}
          </button>
          <button
            onClick={() => onEdit(activity)}
            className="btn btn-ghost btn-xs"
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(activity._id)}
            className="btn btn-ghost btn-xs text-error"
          >
            X
          </button>
        </div>
      ))}
    </div>
  );
}

/* Normal mode: tap to log */
function ActivityGrid({
  activities,
  onActivityClick,
}: {
  activities: Doc<"householdActivities">[];
  onActivityClick: (activity: Doc<"householdActivities">) => void;
}) {
  // Group activities by category
  const grouped = activities.reduce(
    (acc, activity) => {
      const cat = activity.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(activity);
      return acc;
    },
    {} as Record<string, Doc<"householdActivities">[]>
  );

  if (Object.keys(grouped).length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Sin actividades"
        description="Cargando actividades predeterminadas..."
      />
    );
  }

  return (
    <>
      {Object.entries(grouped).map(([category, acts]) => (
        <div key={category}>
          <SectionTitle
            icon={<span>{CATEGORY_LABELS[category]?.emoji}</span>}
          >
            {CATEGORY_LABELS[category]?.label ?? category}
          </SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            {acts.map((activity) => (
              <button
                key={activity._id}
                onClick={() => onActivityClick(activity)}
                className="btn btn-ghost h-auto py-3 flex flex-col items-center gap-1 surface-card hover:border-primary/30 hover:bg-primary/5 active:scale-95 transition"
              >
                <span className="text-2xl">{activity.emoji}</span>
                <span className="text-xs font-medium leading-tight text-center">
                  {activity.name}
                </span>
                <span className="badge badge-xs badge-ghost">
                  {activity.points} pts
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
