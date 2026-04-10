import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useFamily } from "../../../../contexts/FamilyContext";
import { Crown, RotateCcw, Sparkles, UserPlus, UserMinus } from "lucide-react";
import type { HighCardPlayer, HighCardGameState } from "./types";
import { createDeck, getHigherCard } from "./types";
import { PlayingCard } from "./PlayingCard";
import { getRandomItem } from "../../utils/random";

interface HighCardGameProps {
  onComplete?: (winner: string) => void;
}

// Lista de personajes/anónimos para jugadores aleatorios
const ANONYMOUS_NAMES = [
  "🦸 Superhéroe",
  "🧙 Mago",
  "🧚 Princesa",
  "🤖 Robot",
  "👨‍🚶 Astronauta",
  "🧟 Zombi",
  "🧛 Pirata",
  "🧜 Ninja",
  "🧚‍♀️ Hada",
  "🦹‍♂️ Bombón",
  "🎭 Payaso",
  "🤡 Villano",
  "🧞‍♂️ Genio",
  "🦸‍♀️ Heroína",
];

// Colores para asignar a jugadores anónimos
const ANONYMOUS_COLORS = [
  "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700",
  "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700",
  "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700",
  "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700",
  "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700",
  "bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700",
  "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700",
  "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700",
];

export function HighCardGame({ onComplete }: HighCardGameProps) {
  const { currentFamily } = useFamily();
  const members = useQuery(
    api.families.getFamilyMembers,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  // Estados del juego
  const [gameState, setGameState] = useState<HighCardGameState>({
    phase: "setup",
    players: [],
    round: 1,
    winner: null,
  });

  // Jugadores seleccionados + anónimos
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [anonymousCount, setAnonymousCount] = useState(0);

  // Crear lista de jugadores para la ronda (incluye anónimos)
  const createPlayersList = useCallback((familyMembers: Set<string>, anonCount: number): HighCardPlayer[] => {
    const players: HighCardPlayer[] = [];
    const deck = createDeck();
    const usedNames = new Set<string>();
    const usedColors = new Set<number>();

    // Agregar miembros de familia
    familyMembers.forEach((name) => {
      players.push({
        name,
        card: getRandomItem(deck),
        isWinner: false,
        isFlipped: false,
      });
      usedNames.add(name);
    });

    // Agregar jugadores anónimos
    for (let i = 0; i < anonCount; i++) {
      let name: string;
      let nameIndex: number;

      // Encontrar nombre no usado
      do {
        nameIndex = Math.floor(Math.random() * ANONYMOUS_NAMES.length);
        name = ANONYMOUS_NAMES[nameIndex];
      } while (usedNames.has(name) && usedNames.size < ANONYMOUS_NAMES.length);

      usedNames.add(name);

      // Asignar color único
      let colorIndex: number;
      do {
        colorIndex = Math.floor(Math.random() * ANONYMOUS_COLORS.length);
      } while (usedColors.has(colorIndex) && usedColors.size < ANONYMOUS_COLORS.length);

      usedColors.add(colorIndex);

      players.push({
        name,
        card: getRandomItem(deck),
        isWinner: false,
        isFlipped: false,
        anonymousColor: ANONYMOUS_COLORS[colorIndex],
      });
    }

    return players;
  }, []);

  // Toggle selección de jugador
  const togglePlayer = useCallback((name: string) => {
    setSelectedPlayers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  }, []);

  // Agregar jugador anónimo
  const addAnonymousPlayer = useCallback(() => {
    if (selectedPlayers.size + anonymousCount >= 8) return;
    setAnonymousCount((prev) => prev + 1);
  }, [selectedPlayers, anonymousCount]);

  // Quitar jugador anónimo
  const removeAnonymousPlayer = useCallback(() => {
    setAnonymousCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Iniciar ronda
  const startRound = useCallback(() => {
    const totalPlayers = selectedPlayers.size + anonymousCount;
    if (totalPlayers < 2) return;

    const players = createPlayersList(selectedPlayers, anonymousCount);
    setGameState({ phase: "dealing", players, round: 1, winner: null });
  }, [selectedPlayers, anonymousCount, createPlayersList]);

  // Reiniciar juego
  const resetGame = useCallback(() => {
    setGameState({
      phase: "setup",
      players: [],
      round: 1,
      winner: null,
    });
    setSelectedPlayers(new Set());
    setAnonymousCount(0);
  }, []);

  // Jugar otra ronda con mismos jugadores
  const playAgain = useCallback(() => {
    const totalPlayers = gameState.players.length;
    if (totalPlayers < 2) return;

    // Usar los mismos jugadores (familiares + anónimos)
    const familyMembers = new Set<string>();
    let anonCount = 0;

    gameState.players.forEach((p) => {
      if (!p.anonymousColor) {
        familyMembers.add(p.name);
      } else {
        anonCount++;
      }
    });

    const players = createPlayersList(familyMembers, anonCount);

    setGameState({
      phase: "dealing",
      players,
      round: gameState.round + 1,
      winner: null,
    });
  }, [gameState.players, gameState.round, createPlayersList]);

  // Voltear carta de un jugador
  const flipCard = useCallback((playerName: string) => {
    setGameState((prev) => {
      const updatedPlayers = [...prev.players];
      const playerIndex = updatedPlayers.findIndex((p) => p.name === playerName);

      if (playerIndex === -1) return prev;

      const player = updatedPlayers[playerIndex];
      const newFlippedState = !player.isFlipped;

      updatedPlayers[playerIndex] = {
        ...player,
        isFlipped: newFlippedState,
      };

      // IMPORTANTE: Solo evaluar ganador si TODAS las cartas están volteadas
      const allFlipped = updatedPlayers.every((p) => p.isFlipped);

      if (allFlipped) {
        // AHORA sí: todas las cartas visibles, podemos evaluar el ganador
        const playersWithCards = updatedPlayers.filter((p) => p.card !== null) as Array<
          HighCardPlayer & { card: NonNullable<HighCardPlayer["card"]> }
        >;

        let highestCard = playersWithCards[0].card;
        let winner = playersWithCards[0];

        for (const p of playersWithCards) {
          const higher = getHigherCard(highestCard, p.card);
          if (higher === p.card) {
            highestCard = p.card;
            winner = p;
          }
        }

        // Marcar ganador en todos los players
        updatedPlayers.forEach((p, idx) => {
          if (p.name === winner.name) {
            updatedPlayers[idx] = { ...p, isWinner: true };
          }
        });

        onComplete?.(winner.name);

        return {
          ...prev,
          phase: "revealed" as const,
          players: updatedPlayers,
          winner: winner.name,
        };
      }

      return {
        ...prev,
        players: updatedPlayers,
      };
    });
  }, [onComplete]);

  // Render: Setup phase
  if (gameState.phase === "setup") {
    return (
      <div className="pb-4">
        <div className="px-4">
          <h2 className="text-2xl font-black text-center mb-2">Carta Más Alta</h2>
          <p className="text-center text-muted mb-6">
            ¡Compite y descubre quién tiene la carta más alta!
          </p>

          {/* Seleccionar miembros de familia */}
          {members && members.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3">Familiares</h3>
              <div className="grid grid-cols-2 gap-2">
                {members
                  .filter((m): m is NonNullable<typeof m> => m !== null)
                  .map((member) => {
                    const isSelected = selectedPlayers.has(member.name);
                    return (
                      <button
                        key={member._id}
                        onClick={() => togglePlayer(member.name)}
                        className={`card transition-all ${
                          isSelected
                            ? "card-primary border-2 border-primary"
                            : "card-compact bg-base-100 border border-base-300 hover:border-primary/50"
                        }`}
                      >
                        <div className="card-body p-3 items-center text-center">
                          <div className="text-lg mb-1">
                            {isSelected ? "✅" : "⭕"}
                          </div>
                          <div className="font-bold text-sm">{member.name}</div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Jugadores anónimos */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 flex justify-between items-center">
              <span>Jugadores Anónimos</span>
              <span className="badge badge-ghost">{anonymousCount}</span>
            </h3>
            <div className="flex gap-2 mb-3">
              <button
                onClick={addAnonymousPlayer}
                className="btn btn-sm btn-outline flex-1 gap-1"
                disabled={selectedPlayers.size + anonymousCount >= 8}
              >
                <UserPlus className="w-4 h-4" />
                Agregar
              </button>
              <button
                onClick={removeAnonymousPlayer}
                className="btn btn-sm btn-ghost btn-square"
                disabled={anonymousCount === 0}
              >
                <UserMinus className="w-4 h-4" />
              </button>
            </div>

            {anonymousCount > 0 && (
              <div className="text-xs text-center text-muted">
                {anonymousCount} jugador{anonymousCount > 1 ? "es" : ""} añadido{anonymousCount > 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Botón iniciar */}
          <div className="text-center">
            <button
              onClick={startRound}
              className="btn btn-primary btn-lg w-full"
              disabled={selectedPlayers.size + anonymousCount < 2}
            >
              {selectedPlayers.size + anonymousCount < 2
                ? `Selecciona jugadores (${selectedPlayers.size + anonymousCount}/2+)`
                : `¡Comenzar!`}
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-muted">
            Ronda {gameState.round}
          </div>
        </div>
      </div>
    );
  }

  // Render: Game phase (dealing or revealed)
  return (
    <div className="pb-4">
      <div className="px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            Ronda {gameState.round}
          </h2>
          <p className="text-muted">
            {gameState.phase === "dealing" ? "¡Toca las cartas para voltearlas!" : "¡Resultados!"}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {gameState.players.map((player) => (
            <div
              key={player.name}
              className={`card transition-all ${
                player.isWinner
                  ? "bg-success/10 dark:bg-success/20 shadow-2xl scale-105 ring-4 ring-success/30 dark:ring-success/20"
                  : player.anonymousColor || "bg-base-100 dark:bg-base-200"
              } shadow-xl border-2 ${
                player.isWinner
                  ? "border-success dark:border-success"
                  : "border-base-300 dark:border-base-content/20"
              }`}
            >
              <div className="card-body p-4 items-center">
                <div className="text-sm font-bold mb-2">{player.name}</div>

                {/* Carta clickeable */}
                <button
                  onClick={() => player.card && flipCard(player.name)}
                  disabled={!player.card || player.isFlipped || gameState.phase === "revealed"}
                  className={`
                    transition-all duration-300
                    ${player.card && !player.isFlipped && gameState.phase !== "revealed"
                      ? "hover:scale-105 active:scale-95 cursor-pointer"
                      : "cursor-default"
                    }
                  `}
                >
                  {player.card ? (
                    <PlayingCard
                      card={player.card}
                      isFaceDown={!player.isFlipped}
                      isWinner={player.isWinner}
                      size="md"
                    />
                  ) : (
                    <div className="w-24 h-36 bg-base-200 dark:bg-base-300 rounded-xl animate-pulse" />
                  )}
                </button>

                {/* Instrucción si no está volteada */}
                {!player.isFlipped && player.card && gameState.phase !== "revealed" && (
                  <div className="text-xs text-center mt-2 text-subtle animate-pulse">
                    Toca para voltear
                  </div>
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

        {/* Mensaje de estado */}
        {gameState.phase === "dealing" && (
          <div className="text-center mb-4">
            <p className="text-sm text-body">
              {gameState.players.filter((p) => p.isFlipped).length} de {gameState.players.length} cartas volteadas
            </p>
          </div>
        )}

        {/* Actions */}
        {gameState.phase === "revealed" && (
          <div className="flex gap-3">
            <button onClick={resetGame} className="btn btn-ghost flex-1">
              Cambiar Jugadores
            </button>
            <button onClick={playAgain} className="btn btn-primary flex-1 gap-2">
              <RotateCcw className="w-4 h-4" />
              Otra Ronda
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
