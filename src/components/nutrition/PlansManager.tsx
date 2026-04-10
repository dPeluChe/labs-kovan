import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PlusCircle, FileText } from "lucide-react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { EmptyState } from "../ui/EmptyState";

interface PlansManagerProps {
  sessionToken: string;
  familyId: Id<"families">;
  onCreate: () => void;
  onAssign: (plan: Doc<"nutritionPlans">) => void;
  onEdit: (plan: Doc<"nutritionPlans">) => void;
}

export function PlansManager({ sessionToken, familyId, onCreate, onAssign, onEdit }: PlansManagerProps) {
  const plans = useQuery(api.nutrition.getPlans, { sessionToken, familyId });

  return (
    <div className="px-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">Planes Guardados</h3>
        <button
          onClick={onCreate}
          className="btn btn-sm btn-primary rounded-full"
        >
          <PlusCircle className="w-4 h-4" />
          Nuevo Plan
        </button>
      </div>

      <div className="grid gap-3">
        {plans?.map((plan: Doc<"nutritionPlans">) => (
          <div key={plan._id} className="surface-card relative group">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(plan); }}
              className="absolute top-3 right-3 btn btn-xs btn-ghost btn-circle opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <FileText className="w-3 h-3" />
            </button>

            <div className="card-body p-4">
              <div className="flex justify-between items-start">
                <div className="cursor-pointer flex-1" onClick={() => onEdit(plan)}>
                  <h3 className="font-bold">{plan.name}</h3>
                  <p className="text-xs text-muted mb-2 line-clamp-2">{plan.description || "Sin descripción"}</p>
                  <div className="flex flex-wrap gap-2">
                    {plan.targets?.calories ? (
                      <span className="badge badge-xs badge-neutral text-neutral-content">
                        {plan.targets.calories} kcal
                      </span>
                    ) : null}
                    {plan.targets?.protein ? <span className="badge badge-xs badge-ghost">AOA: {plan.targets.protein}</span> : null}
                  </div>
                </div>
                <button
                  onClick={() => onAssign(plan)}
                  className="btn btn-sm btn-outline btn-primary shrink-0 ml-2"
                >
                  Asignar
                </button>
              </div>
            </div>
          </div>
        ))}
        {plans?.length === 0 && (
          <EmptyState
            icon={FileText}
            title="Sin planes"
            description="Crea tu primer plan alimenticio para empezar."
            action={
              <button onClick={onCreate} className="btn btn-sm btn-primary">
                <PlusCircle className="w-4 h-4" /> Nuevo plan
              </button>
            }
          />
        )}
      </div>
    </div>
  );
}
