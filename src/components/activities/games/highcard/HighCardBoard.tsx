import { Crown, RotateCcw, Sparkles } from "lucide-react";
import type { HighCardGameState } from "./types";
import { PlayingCard } from "./PlayingCard";

interface HighCardBoardProps {
  gameState: HighCardGameState;
  onFlipCard: (playerName: string) => void;
  onResetGame: () => void;
  onPlayAgain: () => void;
}

export function HighCardBoard({ gameState, onFlipCard, onResetGame, onPlayAgain }: HighCardBoardProps) {
  return (
    <div className="pb-4">
      <div className="px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            Ronda {gameState.round}
          </h2>
          <p className="text-base-content/60">
            {gameState.phase === "dealing" ? "¡Toca las cartas para voltearlas!" : "¡Resultados!"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {gameState.players.map((player) => (
            <div
              key={player.name}
              className={`card transition-all ${
                player.isWinner
                  ? "bg-success/10 dark:bg-success/20 shadow-2xl scale-105 ring-4 ring-success/30 dark:ring-success/20"
                  : player.anonymousColor || "bg-base-100 dark:bg-base-200"
              } shadow-xl border-2 ${
                player.isWinner ? "border-success dark:border-success" : "border-base-300 dark:border-base-content/20"
              }`}
            >
              <div className="card-body p-4 items-center">
                <div className="text-sm font-bold mb-2">{player.name}</div>

                <button
                  onClick={() => player.card && onFlipCard(player.name)}
                  disabled={!player.card || player.isFlipped || gameState.phase === "revealed"}
                  className={`
                    transition-all duration-300
                    ${
                      player.card && !player.isFlipped && gameState.phase !== "revealed"
                        ? "hover:scale-105 active:scale-95 cursor-pointer"
                        : "cursor-default"
                    }
                  `}
                >
                  {player.card ? (
                    <PlayingCard card={player.card} isFaceDown={!player.isFlipped} isWinner={player.isWinner} size="md" />
                  ) : (
                    <div className="w-24 h-36 bg-base-200 dark:bg-base-300 rounded-xl animate-pulse" />
                  )}
                </button>

                {!player.isFlipped && player.card && gameState.phase !== "revealed" && (
                  <div className="text-xs text-center mt-2 text-base-content/50 animate-pulse">Toca para voltear</div>
                )}

                {player.isWinner && gameState.phase === "revealed" && (
                  <div className="mt-2 badge badge-success dark:bg-success/80 gap-1">
                    <Crown className="w-3 h-3" />
                    Ganador
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {gameState.phase === "dealing" && (
          <div className="text-center mb-4">
            <p className="text-sm text-base-content/70">
              {gameState.players.filter((player) => player.isFlipped).length} de {gameState.players.length} cartas volteadas
            </p>
          </div>
        )}

        {gameState.phase === "revealed" && (
          <div className="flex gap-3">
            <button onClick={onResetGame} className="btn btn-ghost flex-1">
              Cambiar Jugadores
            </button>
            <button onClick={onPlayAgain} className="btn btn-primary flex-1 gap-2">
              <RotateCcw className="w-4 h-4" />
              Otra Ronda
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
