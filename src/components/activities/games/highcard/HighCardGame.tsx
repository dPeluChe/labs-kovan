import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAuth } from "../../../../contexts/AuthContext";
import { useFamily } from "../../../../contexts/FamilyContext";
import { HighCardBoard } from "./HighCardBoard";
import { HighCardSetup } from "./HighCardSetup";
import { useHighCardGame } from "./useHighCardGame";

interface HighCardGameProps {
  onComplete?: (winner: string) => void;
}

export function HighCardGame({ onComplete }: HighCardGameProps) {
  const { currentFamily } = useFamily();
  const { sessionToken } = useAuth();
  const members = useQuery(
    api.families.getFamilyMembers,
    currentFamily && sessionToken ? { familyId: currentFamily._id, sessionToken } : "skip"
  );

  const {
    gameState,
    selectedPlayers,
    anonymousCount,
    totalPlayers,
    maxPlayers,
    togglePlayer,
    addAnonymousPlayer,
    removeAnonymousPlayer,
    startRound,
    resetGame,
    playAgain,
    flipCard,
  } = useHighCardGame({ onComplete });

  const validMembers = (members ?? [])
    .filter((member) => member !== null)
    .map((member) => ({ _id: member._id, name: member.name }));

  if (gameState.phase === "setup") {
    return (
      <HighCardSetup
        members={validMembers}
        selectedPlayers={selectedPlayers}
        anonymousCount={anonymousCount}
        totalPlayers={totalPlayers}
        maxPlayers={maxPlayers}
        round={gameState.round}
        onTogglePlayer={togglePlayer}
        onAddAnonymous={addAnonymousPlayer}
        onRemoveAnonymous={removeAnonymousPlayer}
        onStartRound={startRound}
      />
    );
  }

  return <HighCardBoard gameState={gameState} onFlipCard={flipCard} onResetGame={resetGame} onPlayAgain={playAgain} />;
}
