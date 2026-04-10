import { useCallback, useState } from "react";
import { getRandomItem } from "../../utils/random";
import { ANONYMOUS_COLORS, ANONYMOUS_NAMES, MAX_HIGH_CARD_PLAYERS } from "./constants";
import { createDeck, getHigherCard, type HighCardGameState, type HighCardPlayer } from "./types";

interface UseHighCardGameParams {
  onComplete?: (winner: string) => void;
}

function createPlayersList(familyMembers: Set<string>, anonymousCount: number): HighCardPlayer[] {
  const players: HighCardPlayer[] = [];
  const deck = createDeck();
  const usedNames = new Set<string>();
  const usedColors = new Set<number>();

  familyMembers.forEach((name) => {
    players.push({ name, card: getRandomItem(deck), isWinner: false, isFlipped: false });
    usedNames.add(name);
  });

  for (let i = 0; i < anonymousCount; i++) {
    let name: string;
    let nameIndex: number;

    do {
      nameIndex = Math.floor(Math.random() * ANONYMOUS_NAMES.length);
      name = ANONYMOUS_NAMES[nameIndex];
    } while (usedNames.has(name) && usedNames.size < ANONYMOUS_NAMES.length);

    usedNames.add(name);

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
}

export function useHighCardGame({ onComplete }: UseHighCardGameParams = {}) {
  const [gameState, setGameState] = useState<HighCardGameState>({
    phase: "setup",
    players: [],
    round: 1,
    winner: null,
  });
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [anonymousCount, setAnonymousCount] = useState(0);

  const totalPlayers = selectedPlayers.size + anonymousCount;

  const togglePlayer = useCallback((name: string) => {
    setSelectedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const addAnonymousPlayer = useCallback(() => {
    if (totalPlayers >= MAX_HIGH_CARD_PLAYERS) return;
    setAnonymousCount((prev) => prev + 1);
  }, [totalPlayers]);

  const removeAnonymousPlayer = useCallback(() => {
    setAnonymousCount((prev) => Math.max(0, prev - 1));
  }, []);

  const startRound = useCallback(() => {
    if (totalPlayers < 2) return;
    const players = createPlayersList(selectedPlayers, anonymousCount);
    setGameState({ phase: "dealing", players, round: 1, winner: null });
  }, [totalPlayers, selectedPlayers, anonymousCount]);

  const resetGame = useCallback(() => {
    setGameState({ phase: "setup", players: [], round: 1, winner: null });
    setSelectedPlayers(new Set());
    setAnonymousCount(0);
  }, []);

  const playAgain = useCallback(() => {
    if (gameState.players.length < 2) return;

    const familyMembers = new Set<string>();
    let anonCount = 0;

    gameState.players.forEach((player) => {
      if (player.anonymousColor) anonCount += 1;
      else familyMembers.add(player.name);
    });

    const players = createPlayersList(familyMembers, anonCount);
    setGameState({ phase: "dealing", players, round: gameState.round + 1, winner: null });
  }, [gameState.players, gameState.round]);

  const flipCard = useCallback(
    (playerName: string) => {
      setGameState((prev) => {
        const updatedPlayers = [...prev.players];
        const playerIndex = updatedPlayers.findIndex((player) => player.name === playerName);
        if (playerIndex === -1) return prev;

        const player = updatedPlayers[playerIndex];
        updatedPlayers[playerIndex] = { ...player, isFlipped: !player.isFlipped };

        const allFlipped = updatedPlayers.every((currentPlayer) => currentPlayer.isFlipped);
        if (!allFlipped) return { ...prev, players: updatedPlayers };

        const playersWithCards = updatedPlayers.filter((currentPlayer) => currentPlayer.card !== null) as Array<
          HighCardPlayer & { card: NonNullable<HighCardPlayer["card"]> }
        >;

        let highestCard = playersWithCards[0].card;
        let winner = playersWithCards[0];

        for (const currentPlayer of playersWithCards) {
          const higherCard = getHigherCard(highestCard, currentPlayer.card);
          if (higherCard === currentPlayer.card) {
            highestCard = currentPlayer.card;
            winner = currentPlayer;
          }
        }

        const playersWithWinner = updatedPlayers.map((currentPlayer) =>
          currentPlayer.name === winner.name ? { ...currentPlayer, isWinner: true } : currentPlayer
        );

        onComplete?.(winner.name);

        return {
          ...prev,
          phase: "revealed",
          players: playersWithWinner,
          winner: winner.name,
        };
      });
    },
    [onComplete]
  );

  return {
    gameState,
    selectedPlayers,
    anonymousCount,
    totalPlayers,
    maxPlayers: MAX_HIGH_CARD_PLAYERS,
    togglePlayer,
    addAnonymousPlayer,
    removeAnonymousPlayer,
    startRound,
    resetGame,
    playAgain,
    flipCard,
  };
}
