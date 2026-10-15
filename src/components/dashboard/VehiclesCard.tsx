import { Car } from "lucide-react";
import type { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";
import { SkeletonText } from "../ui/Skeleton";
import { DashboardCard } from "./DashboardCard";

type VehiclesSummary = FunctionReturnType<typeof api.vehicles.getVehiclesSummary>;

export function VehiclesCard({ summary }: { summary: VehiclesSummary | undefined }) {
  if (summary !== undefined && !(summary.vehicleCount > 0)) return null;

  return (
    <DashboardCard
      icon={Car}
      title="Autos"
      to="/vehicles"
      color="bg-green-500/10 text-green-600"
    >
      {summary === undefined ? (
        <div className="py-1"><SkeletonText lines={2} /></div>
      ) : (
        <div className="space-y-1">
          <div className="flex gap-4 text-sm">
            <div>
              <span className="font-semibold">{summary.vehicleCount}</span>
              <span className="text-muted ml-1">vehículos</span>
            </div>
            <div>
              <span className="font-semibold">{summary.totalSpentThisMonth.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}</span>
              <span className="text-muted ml-1">este mes</span>
            </div>
          </div>
          {summary.upcomingEvents.length > 0 && (
            <p className="text-xs text-warning">
              {summary.upcomingEvents.length} evento(s) próximo(s)
            </p>
          )}
        </div>
      )}
    </DashboardCard>
  );
}
