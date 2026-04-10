import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { Avatar } from "../components/ui/Avatar";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { Activity, ClipboardList, FileText, Utensils } from "lucide-react";
import { DailyTracker } from "../components/nutrition/DailyTracker";
import { PlansManager } from "../components/nutrition/PlansManager";
import { PlanEditor } from "../components/nutrition/PlanEditor";
import { AssignPlanModal } from "../components/nutrition/AssignPlanModal";

type ViewMode = "tracker" | "plans" | "create-plan" | "edit-plan";

interface Participant {
  id: string;
  name: string;
  imageUrl?: string;
  userId: Id<"users">;
  personId?: Id<"personProfiles">;
}

export function NutritionPage() {
  const { currentFamily } = useFamily();
  const { sessionToken } = useAuth();
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("tracker");
  const [editingPlan, setEditingPlan] = useState<Doc<"nutritionPlans"> | null>(null);
  const [assigningPlan, setAssigningPlan] = useState<Doc<"nutritionPlans"> | null>(null);
  const [targetPersonId, setTargetPersonId] = useState<Id<"personProfiles"> | null>(null);

  const familyMembers = useQuery(
    api.families.getFamilyMembers,
    currentFamily && sessionToken ? { familyId: currentFamily._id, sessionToken } : "skip"
  );

  const healthProfiles = useQuery(
    api.health.getPersonProfiles,
    currentFamily && sessionToken ? { sessionToken, familyId: currentFamily._id } : "skip"
  );

  const createProfile = useMutation(api.health.createPersonProfile);

  const participants = useMemo<Participant[]>(() => {
    if (!familyMembers) return [];

    const list: Participant[] = [];
    familyMembers.forEach((member) => {
      if (!member) return;
      const matchingProfile = healthProfiles?.find((p) =>
        p.name.trim().toLowerCase() === member.name.trim().toLowerCase() && p.type === "human"
      );

      list.push({
        id: member._id,
        name: member.name,
        imageUrl: member.photoUrl,
        userId: member._id,
        personId: matchingProfile?._id,
      });
    });

    return list;
  }, [familyMembers, healthProfiles]);

  const effectiveParticipantId = selectedParticipantId ?? participants[0]?.id ?? null;
  const activeParticipant = participants.find((p) => p.id === effectiveParticipantId);

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setView("create-plan");
  };

  const handleEditPlan = (plan: Doc<"nutritionPlans">) => {
    setEditingPlan(plan);
    setView("edit-plan");
  };

  const handleCloseEditor = () => {
    setEditingPlan(null);
    setView("plans");
  };

  const handleInitiateAssign = async (plan: Doc<"nutritionPlans">) => {
    if (!activeParticipant || !currentFamily || !sessionToken) return;

    let pid = activeParticipant.personId;
    if (!pid) {
      try {
        pid = await createProfile({
          sessionToken,
          familyId: currentFamily._id,
          type: "human",
          name: activeParticipant.name,
          relation: "Family Member",
        });
      } catch (e) {
        console.error("Failed to auto-create profile for assignment", e);
        return;
      }
    }

    setTargetPersonId(pid);
    setAssigningPlan(plan);
  };

  return (
    <div className="pb-20 min-h-screen bg-base-100">
      {(view === "create-plan" || view === "edit-plan") && currentFamily && (
        <PlanEditor
          familyId={currentFamily._id}
          plan={editingPlan}
          onClose={handleCloseEditor}
        />
      )}

      {assigningPlan && targetPersonId && currentFamily && (
        <AssignPlanModal
          familyId={currentFamily._id}
          personId={targetPersonId}
          plan={assigningPlan}
          onClose={() => setAssigningPlan(null)}
        />
      )}

      <PageHeader
        title="Nutrición"
        subtitle={currentFamily?.name}
        action={
          <button
            onClick={() => setView(view === "tracker" ? "plans" : "tracker")}
            className="btn btn-sm btn-ghost gap-2"
          >
            {view === "tracker" ? <FileText className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            {view === "tracker" ? "Ver Planes" : "Ver Diario"}
          </button>
        }
      />

      {participants.length > 0 && (
        <div className="px-4 mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {participants.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedParticipantId(p.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all
                  ${effectiveParticipantId === p.id
                    ? "bg-primary text-primary-content border-primary shadow-md"
                    : "bg-base-100 border-base-300 hover:bg-base-200"
                  }
                `}
              >
                <Avatar src={p.imageUrl} name={p.name} size="xs" />
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeParticipant && currentFamily ? (
        <>
          {view === "tracker" ? (
            activeParticipant.personId ? (
              <DailyTracker
                sessionToken={sessionToken ?? ""}
                familyId={currentFamily._id}
                personId={activeParticipant.personId}
              />
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="Sin plan asignado"
                description="Asigna un plan de nutrición a este participante."
                action={
                  <button
                    onClick={() => setView("plans")}
                    className="btn btn-sm btn-primary"
                  >
                    Ir a Planes
                  </button>
                }
              />
            )
          ) : (
            <PlansManager
              sessionToken={sessionToken ?? ""}
              familyId={currentFamily._id}
              onAssign={handleInitiateAssign}
              onCreate={handleCreatePlan}
              onEdit={handleEditPlan}
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={Utensils}
          title="Selecciona un miembro"
          description="Elige un miembro de la familia para ver su nutrición."
        />
      )}
    </div>
  );
}
