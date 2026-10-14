import type { FunctionReturnType } from "convex/server";
import { api } from "../../../convex/_generated/api";
import { SectionTitle } from "../ui/SectionTitle";
import { WeeklyPodium } from "./WeeklyPodium";

type WeeklyLeaderboard = FunctionReturnType<typeof api.household.getWeeklyLeaderboard>;

export function RankingSection({ leaderboard }: { leaderboard: WeeklyLeaderboard }) {
  return (
    <div className="space-y-6">
      <WeeklyPodium
        leaderboard={leaderboard.leaderboard}
        weekStart={leaderboard.weekStart}
      />

      {/* Weekly summary */}
      {leaderboard.totalActivities > 0 && (
        <div className="surface-muted p-4">
          <SectionTitle>Resumen de la semana</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {leaderboard.totalActivities}
              </p>
              <p className="text-xs text-muted">Actividades</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary">
                {leaderboard.totalPoints}
              </p>
              <p className="text-xs text-muted">Puntos totales</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
