import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { useAuth } from "../../contexts/AuthContext";
import { MobileModal } from "../ui/MobileModal";
import { DateInput } from "../ui/DateInput";
import { getLocalDateString } from "./utils";

interface AssignPlanModalProps {
  familyId: Id<"families">;
  personId: Id<"personProfiles">;
  plan: Doc<"nutritionPlans">;
  onClose: () => void;
}

export function AssignPlanModal({ familyId, personId, plan, onClose }: AssignPlanModalProps) {
  const { sessionToken } = useAuth();
  const assignPlan = useMutation(api.nutrition.assignPlan);
  const [dates, setDates] = useState({
    start: getLocalDateString(),
    end: getLocalDateString(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)),
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAssign = async () => {
    setIsLoading(true);
    setError("");
    try {
      const startTs = new Date(dates.start + "T00:00:00").getTime();
      const endTs = new Date(dates.end + "T23:59:59.999").getTime();

      await assignPlan({
        sessionToken: sessionToken ?? "",
        familyId,
        personId,
        planId: plan._id,
        startDate: startTs,
        endDate: endTs,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al asignar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileModal title={`Asignar ${plan.name}`} onClose={onClose}>
      <div className="space-y-6">
        <p className="text-sm opacity-60">Selecciona el rango de fechas para aplicar este plan alimenticio.</p>

        {error && <div className="alert alert-error text-xs">{error}</div>}

        <div className="space-y-4">
          <DateInput
            label="Fecha de inicio"
            value={dates.start}
            onChange={(val) => setDates((prev) => ({ ...prev, start: val }))}
          />

          <DateInput
            label="Fecha de término (opcional)"
            value={dates.end}
            onChange={(val) => setDates((prev) => ({ ...prev, end: val }))}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button onClick={onClose} className="btn btn-ghost flex-1">Cancelar</button>
          <button onClick={handleAssign} disabled={isLoading} className="btn btn-primary flex-1">
            {isLoading ? <span className="loading loading-spinner loading-xs"></span> : "Confirmar"}
          </button>
        </div>
      </div>
    </MobileModal>
  );
}
