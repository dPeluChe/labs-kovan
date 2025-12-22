import { useState } from "react";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { getAvailableGames, getComingSoonGames } from "../components/activities/constants/GameConfig";
import { RouletteGame } from "../components/activities/games/roulette/RouletteGame";
import { HeadsUpGame } from "../components/activities/games/headsup/HeadsUpGame";
import { HighCardGame } from "../components/activities/games/highcard/HighCardGame";
import type { GameType } from "../components/activities/types";

export function ActivitiesPage() {
  const { currentFamily } = useFamily();
  const [activeGame, setActiveGame] = useState<GameType | "none">("none");

  if (!currentFamily) return null;

  const availableGames = getAvailableGames();
  const comingSoonGames = getComingSoonGames();

  return (
    <div className="pb-4">
      <PageHeader
        title="Actividades"
        subtitle="Juegos y dinámicas familiares"
      />

      <div className="px-4">
        {activeGame === "none" ? (
          <div className="grid grid-cols-2 gap-4">
            {/* Juegos Disponibles */}
            {availableGames.map((game) => {
              const Icon = game.icon;
              return (
                <button
                  key={game.id}
                  onClick={() => setActiveGame(game.id)}
                  className="card bg-base-100 shadow-sm border border-base-300 hover:border-primary transition-all text-left"
                >
                  <div className="card-body p-4 flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold">{game.name}</h3>
                      <p className="text-xs text-base-content/60">
                        {game.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Juegos Próximamente */}
            {comingSoonGames.map((game) => {
              const Icon = game.icon;
              return (
                <button
                  key={game.id}
                  disabled
                  className="card bg-base-100 shadow-sm border border-base-300 opacity-60 cursor-not-allowed text-left"
                >
                  <div className="card-body p-4 flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-base-content/5 flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold">{game.name}</h3>
                      <p className="text-xs text-base-content/60">Próximamente</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <button
              onClick={() => setActiveGame("none")}
              className="btn btn-ghost btn-sm mb-4"
            >
              ← Volver
            </button>

            {activeGame === "roulette" && <RouletteGame />}
            {activeGame === "headsup" && <HeadsUpGame />}
            {activeGame === "high_card" && <HighCardGame />}
          </div>
        )}
      </div>
    </div>
  );
}
