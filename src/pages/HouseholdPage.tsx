import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { useConfirmModal } from "../hooks/useConfirmModal";
import { AnimatedTabs } from "../components/ui/AnimatedTabs";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { StickyHeader } from "../components/ui/StickyHeader";
import { CircleAddButton } from "../components/ui/CircleAddButton";
import { LogActivityModal } from "../components/household/LogActivityModal";
import { CreateActivityModal } from "../components/household/CreateActivityModal";
import { ActivityFeed } from "../components/household/ActivityFeed";
import { ActivitiesSection } from "../components/household/ActivitiesSection";
import { RankingSection } from "../components/household/RankingSection";
import { Trophy, ClipboardList, Sparkles, Settings2 } from "lucide-react";
import type { Doc, Id } from "../../convex/_generated/dataModel";

function useHouseholdActions() {
  const { currentFamily } = useFamily();
  const { sessionToken } = useAuth();
  const { confirm, ConfirmModal } = useConfirmModal();
  const deleteActivity = useMutation(api.household.deleteActivity);
  const updateActivity = useMutation(api.household.updateActivity);
  const deleteLog = useMutation(api.household.deleteLog);

  const handleDeleteActivity = async (activityId: Id<"householdActivities">) => {
    if (!currentFamily || !sessionToken) return;
    const ok = await confirm({
      title: "Eliminar actividad",
      message: "Se eliminará esta actividad. Los registros existentes se mantienen.",
      confirmText: "Eliminar",
      variant: "danger",
      icon: "trash",
    });
    if (ok) {
      await deleteActivity({ sessionToken, activityId, familyId: currentFamily._id });
    }
  };

  const handleToggleActive = async (activity: Doc<"householdActivities">) => {
    if (!currentFamily || !sessionToken) return;
    await updateActivity({
      sessionToken,
      activityId: activity._id,
      familyId: currentFamily._id,
      isActive: activity.isActive === false ? true : false,
    });
  };

  const handleDeleteLog = async (logId: Id<"householdActivityLogs">) => {
    if (!currentFamily || !sessionToken) return;
    const ok = await confirm({
      title: "Eliminar registro",
      message: "Se eliminará este registro y se restarán los puntos.",
      confirmText: "Eliminar",
      variant: "danger",
      icon: "trash",
    });
    if (ok) {
      await deleteLog({ sessionToken, logId, familyId: currentFamily._id });
    }
  };

  return { handleDeleteActivity, handleToggleActive, handleDeleteLog, ConfirmModal };
}

export function HouseholdPage() {
  const { currentFamily } = useFamily();
  const { sessionToken } = useAuth();
  const { handleDeleteActivity, handleToggleActive, handleDeleteLog, ConfirmModal } = useHouseholdActions();
  const [activeTab, setActiveTab] = useState<"activities" | "feed" | "ranking">("activities");
  const [showLogModal, setShowLogModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Doc<"householdActivities"> | null>(null);
  const [editingActivity, setEditingActivity] = useState<Doc<"householdActivities"> | undefined>(undefined);
  const [showManage, setShowManage] = useState(false);

  // Queries
  const familyArgs =
    currentFamily && sessionToken
      ? { sessionToken, familyId: currentFamily._id }
      : "skip";
  const activities = useQuery(api.household.getActivities, familyArgs);
  const allActivities = useQuery(
    api.household.getAllActivities,
    showManage ? familyArgs : "skip"
  );
  const recentLogs = useQuery(api.household.getRecentLogs, familyArgs);
  const leaderboard = useQuery(api.household.getWeeklyLeaderboard, familyArgs);

  // Mutations
  const seedActivities = useMutation(api.household.seedDefaultActivities);

  // Auto-seed default activities on first visit
  useEffect(() => {
    if (activities && activities.length === 0 && currentFamily && sessionToken) {
      seedActivities({ sessionToken, familyId: currentFamily._id });
    }
  }, [activities, currentFamily, sessionToken, seedActivities]);

  const handleActivityClick = (activity: Doc<"householdActivities">) => {
    setSelectedActivity(activity);
    setShowLogModal(true);
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

  const weeklySubtitle =
    leaderboard && leaderboard.totalPoints > 0
      ? `${leaderboard.totalPoints} pts esta semana`
      : undefined;

  return (
    <div className="pb-20">
      <StickyHeader
        title="Hogar"
        subtitle={weeklySubtitle}
        action={
          activeTab === "activities" && (
            <>
              <CircleAddButton
                onClick={() => setShowManage(!showManage)}
                icon={<Settings2 className="w-4 h-4" />}
                variant={showManage ? "secondary" : "ghost"}
                label="Administrar actividades"
              />
              <CircleAddButton
                onClick={() => {
                  setEditingActivity(undefined);
                  setShowCreateModal(true);
                }}
                label="Nueva actividad"
              />
            </>
          )
        }
        tabs={
          <AnimatedTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id)}
            layoutId="householdTab"
          />
        }
      />

      <div className="px-4 py-4">
        {/* Activities Tab */}
        {activeTab === "activities" && (
          <div className="space-y-6">
            <ActivitiesSection
              showManage={showManage}
              activities={activities}
              allActivities={allActivities}
              onActivityClick={handleActivityClick}
              onToggleActive={handleToggleActive}
              onEdit={(activity) => {
                setEditingActivity(activity);
                setShowCreateModal(true);
              }}
              onDelete={handleDeleteActivity}
            />
          </div>
        )}

        {/* Feed Tab */}
        {activeTab === "feed" && (
          <ActivityFeed logs={recentLogs ?? []} onDelete={handleDeleteLog} />
        )}

        {/* Ranking Tab */}
        {activeTab === "ranking" && leaderboard && (
          <RankingSection leaderboard={leaderboard} />
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
