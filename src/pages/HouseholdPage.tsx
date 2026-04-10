import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { useConfirmModal } from "../hooks/useConfirmModal";
import { AnimatedTabs } from "../components/ui/AnimatedTabs";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { LogActivityModal } from "../components/household/LogActivityModal";
import { CreateActivityModal } from "../components/household/CreateActivityModal";
import { WeeklyPodium } from "../components/household/WeeklyPodium";
import { ActivityFeed } from "../components/household/ActivityFeed";
import { Plus, Trophy, ClipboardList, Sparkles, Settings2 } from "lucide-react";
import type { Doc, Id } from "../../convex/_generated/dataModel";

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

export function HouseholdPage() {
  const { currentFamily } = useFamily();
  const { user } = useAuth();
  const { confirm, ConfirmModal } = useConfirmModal();
  const [activeTab, setActiveTab] = useState<"activities" | "feed" | "ranking">("activities");
  const [showLogModal, setShowLogModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Doc<"householdActivities"> | null>(null);
  const [editingActivity, setEditingActivity] = useState<Doc<"householdActivities"> | undefined>(undefined);
  const [showManage, setShowManage] = useState(false);

  // Queries
  const activities = useQuery(
    api.household.getActivities,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );
  const allActivities = useQuery(
    api.household.getAllActivities,
    currentFamily && showManage ? { familyId: currentFamily._id } : "skip"
  );
  const recentLogs = useQuery(
    api.household.getRecentLogs,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );
  const leaderboard = useQuery(
    api.household.getWeeklyLeaderboard,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  // Mutations
  const seedActivities = useMutation(api.household.seedDefaultActivities);
  const deleteActivity = useMutation(api.household.deleteActivity);
  const updateActivity = useMutation(api.household.updateActivity);
  const deleteLog = useMutation(api.household.deleteLog);

  // Auto-seed default activities on first visit
  useEffect(() => {
    if (activities && activities.length === 0 && currentFamily && user) {
      seedActivities({ familyId: currentFamily._id, userId: user._id });
    }
  }, [activities, currentFamily, user, seedActivities]);

  const handleActivityClick = (activity: Doc<"householdActivities">) => {
    setSelectedActivity(activity);
    setShowLogModal(true);
  };

  const handleDeleteActivity = async (activityId: Id<"householdActivities">) => {
    if (!currentFamily) return;
    const ok = await confirm({
      title: "Eliminar actividad",
      message: "Se eliminará esta actividad. Los registros existentes se mantienen.",
      confirmText: "Eliminar",
      variant: "danger",
      icon: "trash",
    });
    if (ok) {
      await deleteActivity({ activityId, familyId: currentFamily._id });
    }
  };

  const handleToggleActive = async (activity: Doc<"householdActivities">) => {
    if (!currentFamily) return;
    await updateActivity({
      activityId: activity._id,
      familyId: currentFamily._id,
      isActive: activity.isActive === false ? true : false,
    });
  };

  const handleDeleteLog = async (logId: Id<"householdActivityLogs">) => {
    if (!currentFamily) return;
    const ok = await confirm({
      title: "Eliminar registro",
      message: "Se eliminará este registro y se restarán los puntos.",
      confirmText: "Eliminar",
      variant: "danger",
      icon: "trash",
    });
    if (ok) {
      await deleteLog({ logId, familyId: currentFamily._id });
    }
  };

  if (activities === undefined) return <PageLoader />;

  const tabs = [
    {
      id: "activities" as const,
      label: "Actividades",
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: "feed" as const,
      label: "Registro",
      icon: <ClipboardList className="w-4 h-4" />,
      count: recentLogs?.length,
    },
    {
      id: "ranking" as const,
      label: "Ranking",
      icon: <Trophy className="w-4 h-4" />,
    },
  ];

  // Group activities by category
  const grouped = (activities ?? []).reduce(
    (acc, activity) => {
      const cat = activity.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(activity);
      return acc;
    },
    {} as Record<string, Doc<"householdActivities">[]>
  );

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-base-100/80 backdrop-blur-md pt-safe-top">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Hogar</h1>
            {leaderboard && leaderboard.totalPoints > 0 && (
              <p className="text-xs text-base-content/50">
                {leaderboard.totalPoints} pts esta semana
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {activeTab === "activities" && (
              <>
                <button
                  onClick={() => setShowManage(!showManage)}
                  className={`btn btn-sm btn-circle ${showManage ? "btn-secondary" : "btn-ghost"}`}
                >
                  <Settings2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingActivity(undefined);
                    setShowCreateModal(true);
                  }}
                  className="btn btn-primary btn-sm btn-circle"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="px-4 pb-2">
          <AnimatedTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id)}
            layoutId="householdTab"
          />
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Activities Tab */}
        {activeTab === "activities" && (
          <div className="space-y-6">
            {showManage ? (
              /* Manage mode: show all activities including inactive */
              <div className="space-y-2">
                <p className="text-sm text-base-content/60 mb-3">
                  Administra las actividades. Desactiva o elimina las que no necesites.
                </p>
                {(allActivities ?? activities ?? []).map((activity) => (
                  <div
                    key={activity._id}
                    className={`flex items-center gap-3 p-3 rounded-xl border border-base-300 ${
                      activity.isActive === false ? "opacity-50" : ""
                    }`}
                  >
                    <span className="text-xl">{activity.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{activity.name}</p>
                      <p className="text-xs text-base-content/50">{activity.points} pts</p>
                    </div>
                    <button
                      onClick={() => handleToggleActive(activity)}
                      className={`btn btn-xs ${
                        activity.isActive === false ? "btn-ghost" : "btn-success btn-outline"
                      }`}
                    >
                      {activity.isActive === false ? "Inactiva" : "Activa"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingActivity(activity);
                        setShowCreateModal(true);
                      }}
                      className="btn btn-ghost btn-xs"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteActivity(activity._id)}
                      className="btn btn-ghost btn-xs text-error"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              /* Normal mode: tap to log */
              <>
                {Object.keys(grouped).length === 0 ? (
                  <EmptyState
                    icon={Sparkles}
                    title="Sin actividades"
                    description="Cargando actividades predeterminadas..."
                  />
                ) : (
                  Object.entries(grouped).map(([category, acts]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-base-content/60 mb-2">
                        {CATEGORY_LABELS[category]?.emoji}{" "}
                        {CATEGORY_LABELS[category]?.label ?? category}
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {acts.map((activity) => (
                          <button
                            key={activity._id}
                            onClick={() => handleActivityClick(activity)}
                            className="btn btn-ghost h-auto py-3 flex flex-col items-center gap-1 border border-base-300 rounded-xl hover:border-primary/30 hover:bg-primary/5 active:scale-95 transition-all"
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
                  ))
                )}
              </>
            )}
          </div>
        )}

        {/* Feed Tab */}
        {activeTab === "feed" && (
          <ActivityFeed logs={recentLogs ?? []} onDelete={handleDeleteLog} />
        )}

        {/* Ranking Tab */}
        {activeTab === "ranking" && leaderboard && (
          <div className="space-y-6">
            <WeeklyPodium
              leaderboard={leaderboard.leaderboard}
              weekStart={leaderboard.weekStart}
            />

            {/* Weekly summary */}
            {leaderboard.totalActivities > 0 && (
              <div className="card bg-base-200/50 p-4">
                <h3 className="font-semibold text-sm mb-2">Resumen de la semana</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {leaderboard.totalActivities}
                    </p>
                    <p className="text-xs text-base-content/60">Actividades</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-secondary">
                      {leaderboard.totalPoints}
                    </p>
                    <p className="text-xs text-base-content/60">Puntos totales</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedActivity && (
        <LogActivityModal
          isOpen={showLogModal}
          onClose={() => {
            setShowLogModal(false);
            setSelectedActivity(null);
          }}
          activity={selectedActivity}
        />
      )}

      <CreateActivityModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingActivity(undefined);
        }}
        activityToEdit={editingActivity}
      />

      <ConfirmModal />
    </div>
  );
}
