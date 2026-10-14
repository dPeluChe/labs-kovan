import { Heart } from "lucide-react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";
import { SkeletonText } from "../ui/Skeleton";
import { DashboardCard } from "./DashboardCard";

type HealthSummary = FunctionReturnType<typeof api.health.getHealthSummary>;

export function HealthSummaryCard({ summary }: { summary: HealthSummary | undefined }) {
  if (summary !== undefined && !(summary.profileCount > 0)) return null;

  return (
    <DashboardCard
      icon={Heart}
      title="Salud"
      to="/health"
      color="bg-pink-500/10 text-pink-600"
    >
      {summary === undefined ? (
        <div className="py-1"><SkeletonText lines={2} /></div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {summary.profiles.slice(0, 4).map((profile) => (
              <span key={profile._id} className="badge badge-sm badge-ghost">
                {profile.name}
              </span>
            ))}
            {summary.profileCount > 4 && (
              <span className="badge badge-sm badge-ghost">+{summary.profileCount - 4}</span>
            )}
          </div>
          {summary.activeMedications.length > 0 && (
            <div className="text-xs space-y-0.5">
              <span className="text-warning font-medium">💊 Medicaciones activas:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {summary.activeMedications.slice(0, 3).map((med, i) => (
                  <span key={i} className="text-body">
                    {med.medication.name} ({med.personName})
                    {i < Math.min(2, summary.activeMedications.length - 1) && ","}
                  </span>
                ))}
                {summary.activeMedications.length > 3 && (
                  <span className="text-subtle">+{summary.activeMedications.length - 3} más</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardCard>
  );
}
