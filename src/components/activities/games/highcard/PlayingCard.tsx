import type { PlayingCard as PlayingCardType } from "./types";
import { SUIT_SYMBOLS } from "./types";

interface PlayingCardProps {
  card: PlayingCardType;
  isFaceDown?: boolean;
  isWinner?: boolean;
  size?: "sm" | "md" | "lg";
}

export function PlayingCard({
  card,
  isFaceDown = false,
  isWinner = false,
  size = "md",
}: PlayingCardProps) {
  const sizeClasses = {
    sm: "w-16 h-24 text-sm",
    md: "w-24 h-36 text-2xl",
    lg: "w-32 h-48 text-3xl",
  };

  // Ajustar colores según el theme
  const isRedSuit = card.suit === "hearts" || card.suit === "diamonds";
  const symbolColor = isRedSuit ? "text-red-500 dark:text-red-400" : "text-base-content dark:text-base-content";

  if (isFaceDown) {
    return (
      <div
        className={`${sizeClasses[size]} bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 rounded-xl shadow-lg border-2 border-blue-400/50 dark:border-blue-500/50 flex items-center justify-center`}
      >
        <div className="text-blue-300 dark:text-blue-200 opacity-50 text-4xl">🂠</div>
      </div>
    );
  }

  return (
    <div
      className={`
        ${sizeClasses[size]} bg-base-100 dark:bg-base-200 rounded-xl shadow-lg border-2
        flex flex-col items-center justify-center relative overflow-hidden
        transition-all duration-300
        ${isWinner 
          ? "border-success dark:border-success bg-success/10 dark:bg-success/20 shadow-success/20 dark:shadow-success/30 ring-4 ring-success/30 dark:ring-success/20 scale-105" 
          : "border-base-300 dark:border-base-content/20"
        }
      `}
    >
      {/* Corner top-left */}
      <div className={`absolute top-1 left-2 ${symbolColor} text-sm font-bold`}>
        {card.rank}
      </div>
      <div className={`absolute top-4 left-2 ${symbolColor} text-xs`}>
        {SUIT_SYMBOLS[card.suit]}
      </div>

      {/* Center */}
      <div className={`${symbolColor} text-5xl md:text-6xl`}>
        {SUIT_SYMBOLS[card.suit]}
      </div>

      {/* Corner bottom-right (inverted) */}
      <div
        className={`absolute bottom-1 right-2 ${symbolColor} text-sm font-bold rotate-180`}
      >
        {card.rank}
      </div>
      <div
        className={`absolute bottom-4 right-2 ${symbolColor} text-xs rotate-180`}
      >
        {SUIT_SYMBOLS[card.suit]}
      </div>

      {/* Winner overlay */}
      {isWinner && (
        <div className="absolute inset-0 bg-success/20 dark:bg-success/30 flex items-center justify-center rounded-xl">
          <div className="text-6xl drop-shadow-lg">👑</div>
        </div>
      )}
    </div>
  );
}
