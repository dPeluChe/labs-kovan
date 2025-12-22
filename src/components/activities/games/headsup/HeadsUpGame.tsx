import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useFamily } from "../../../../contexts/FamilyContext";
import { Trophy, RotateCcw } from "lucide-react";
import type { HeadsUpCategory, HeadsUpCard } from "../../types";
import { HEADS_UP_CATEGORIES } from "./types";
import { CategorySelector } from "./CategorySelector";
import { GameScreen } from "./GameScreen";
import { getRandomItem } from "../../utils/random";
import { useCountdown } from "../../utils/timer";

type GameState = "category_select" | "playing" | "paused" | "summary";

interface HeadsUpGameProps {
  onComplete?: (score: number, skipped: number) => void;
}

const GAME_DURATION = 60; // 60 segundos

export function HeadsUpGame({ onComplete }: HeadsUpGameProps) {
  const { currentFamily } = useFamily();
  const members = useQuery(
    api.families.getFamilyMembers,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  // Estado del juego
  const [gameState, setGameState] = useState<GameState>("category_select");
  const [currentCategory, setCurrentCategory] = useState<HeadsUpCategory>("peliculas");
  const [cards, setCards] = useState<HeadsUpCard[]>([]);
  const [currentCard, setCurrentCard] = useState<HeadsUpCard | null>(null);
  const [score, setScore] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [usedCardIds, setUsedCardIds] = useState<Set<string>>(new Set());

  // Usamos ref para evitar closures stale
  const scoreRef = useRef(score);
  const skippedRef = useRef(skipped);

  // Actualizar refs
  useEffect(() => {
    scoreRef.current = score;
    skippedRef.current = skipped;
  }, [score, skipped]);

  // Timer hook
  const { secondsLeft: timeLeft, start, pause, reset } = useCountdown(
    GAME_DURATION,
    undefined,
    undefined,
    false
  );

  // Función para terminar el juego
  const endGame = useCallback(() => {
    setGameState("summary");
    pause();
    onComplete?.(scoreRef.current, skippedRef.current);
  }, [onComplete, pause]);

  // Preparar cartas según categoría
  const categoryCards = useCallback((category: HeadsUpCategory): HeadsUpCard[] => {
    if (category === "familiares" && members && members.length > 0) {
      return members
        .filter((member): member is NonNullable<typeof member> => member !== null)
        .map((member, idx: number) => ({
          id: `fam-${idx}`,
          word: member.name,
          category: "familiares" as const,
          guessed: false,
          skipped: false,
        }));
    } else if (category === "custom") {
      return [];
    } else {
      return HEADS_UP_CATEGORIES[category].cards.map((word: string, idx: number) => ({
        id: `${category}-${idx}`,
        word,
        category: category,
        guessed: false,
        skipped: false,
      }));
    }
  }, [members]);

  useEffect(() => {
    setCards(categoryCards(currentCategory));
  }, [currentCategory, categoryCards]);

  const getRandomCard = useCallback((): HeadsUpCard | null => {
    const availableCards = cards.filter(
      (card) => !usedCardIds.has(card.id)
    );

    if (availableCards.length === 0) {
      return null;
    }

    return getRandomItem(availableCards);
  }, [cards, usedCardIds]);

  const startGame = useCallback(() => {
    // Resetear estado
    setScore(0);
    setSkipped(0);
    setUsedCardIds(new Set());

    // Seleccionar primera carta
    const firstCard = getRandomCard();
    setCurrentCard(firstCard);

    setGameState("playing");
    start();
  }, [getRandomCard, start]);

  const handleCorrect = useCallback(() => {
    if (!currentCard) return;

    // Marcar como usada
    setUsedCardIds((prev) => new Set(prev).add(currentCard.id));
    setScore((prev) => prev + 1);

    // Siguiente carta
    const nextCard = getRandomCard();
    setCurrentCard(nextCard);

    // Si no hay más cartas, terminar juego
    if (!nextCard) {
      endGame();
    }
  }, [currentCard, getRandomCard, endGame]);

  const handleSkip = useCallback(() => {
    if (!currentCard) return;

    // Marcar como usada (pasada)
    setUsedCardIds((prev) => new Set(prev).add(currentCard.id));
    setSkipped((prev) => prev + 1);

    // Siguiente carta
    const nextCard = getRandomCard();
    setCurrentCard(nextCard);

    // Si no hay más cartas, terminar juego
    if (!nextCard) {
      endGame();
    }
  }, [currentCard, getRandomCard, endGame]);

  const pauseGame = useCallback(() => {
    setGameState("paused");
    pause();
  }, [pause]);

  const resumeGame = useCallback(() => {
    setGameState("playing");
    start();
  }, [start]);

  const playAgain = useCallback(() => {
    setGameState("category_select");
    reset();
  }, [reset]);

  const changeCategory = useCallback(() => {
    setGameState("category_select");
    reset();
  }, [reset]);

  // Render según estado del juego
  if (gameState === "category_select") {
    return (
      <div className="pb-4">
        <div className="px-4">
          <h2 className="text-2xl font-black text-center mb-2">Heads Up!</h2>
          <p className="text-center text-base-content/60 mb-6">
            Selecciona una categoría para comenzar
          </p>
          <CategorySelector
            currentCategory={currentCategory}
            onCategoryChange={setCurrentCategory}
          />
          <div className="mt-6">
            <button
              onClick={startGame}
              className="btn btn-primary btn-lg w-full"
              disabled={
                (currentCategory === "familiares" && !members) ||
                (HEADS_UP_CATEGORIES[currentCategory].cards.length === 0 &&
                  currentCategory !== "familiares" &&
                  currentCategory !== "custom")
              }
            >
              ¡Comenzar!
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "playing" || gameState === "paused") {
    return (
      <GameScreen
        currentCard={currentCard}
        score={score}
        skipped={skipped}
        timeLeft={timeLeft}
        totalTime={GAME_DURATION}
        isPaused={gameState === "paused"}
        onCorrect={handleCorrect}
        onSkip={handleSkip}
        onPause={pauseGame}
        onResume={resumeGame}
        onEnd={endGame}
      />
    );
  }

  // Summary
  const totalCards = score + skipped;
  const percentage = totalCards > 0 ? Math.round((score / totalCards) * 100) : 0;

  return (
    <div className="card bg-base-100 shadow-xl border border-base-300">
      <div className="card-body items-center text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Trophy className="w-10 h-10 text-primary" />
        </div>

        <h2 className="card-title justify-center text-2xl">¡Juego Terminado!</h2>

        <div className="stats stats-vertical shadow w-full max-w-xs mt-6">
          <div className="stat">
            <div className="stat-title">Aciertos</div>
            <div className="stat-value text-success">{score}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Pasadas</div>
            <div className="stat-value text-warning">{skipped}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Precisión</div>
            <div className="stat-value text-primary">{percentage}%</div>
          </div>
        </div>

        <div className="flex gap-3 mt-6 w-full max-w-xs">
          <button onClick={playAgain} className="btn btn-primary flex-1 gap-2">
            <RotateCcw className="w-4 h-4" />
            Jugar de Nuevo
          </button>
          <button onClick={changeCategory} className="btn btn-ghost flex-1">
            Cambiar Categoría
          </button>
        </div>
      </div>
    </div>
  );
}
