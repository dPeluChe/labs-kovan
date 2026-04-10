import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageHeader } from "../components/ui/PageHeader";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import { Activity, ClipboardList, FileText, User, Utensils } from "lucide-react";
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
                <div className="w-6 h-6 rounded-full bg-base-300 flex items-center justify-center overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-3 h-3 opacity-50" />
                  )}
                </div>
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
              <div className="p-8 text-center opacity-60">
                <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">No hay plan asignado.</p>
                <button
                  onClick={() => setView("plans")}
                  className="btn btn-sm btn-link text-primary no-underline mt-2"
                >
                  Ir a Planes
                </button>
              </div>
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
        <div className="p-8 text-center text-base-content/50">
          <Utensils className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>Selecciona un miembro de la familia</p>
        </div>
      )}
    </div>
  );
}
