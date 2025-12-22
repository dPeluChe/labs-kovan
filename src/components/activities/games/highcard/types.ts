export interface PlayingCard {
  suit: CardSuit;
  rank: CardRank;
  value: number;
  id: string;
}

export type CardSuit = "hearts" | "diamonds" | "clubs" | "spades";

export type CardRank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";

export const CARD_SUITS: CardSuit[] = ["hearts", "diamonds", "clubs", "spades"];

export const CARD_RANKS: CardRank[] = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

export const CARD_VALUES: Record<CardRank, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  "J": 11,
  "Q": 12,
  "K": 13,
  "A": 14,
};

export const SUIT_SYMBOLS: Record<CardSuit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

export const SUIT_COLORS: Record<CardSuit, string> = {
  hearts: "text-red-500",
  diamonds: "text-red-500",
  clubs: "text-black",
  spades: "text-black",
};

export interface HighCardPlayer {
  name: string;
  card: PlayingCard | null;
  isFlipped?: boolean;
  isWinner: boolean;
  anonymousColor?: string;
}

// Helper para actualizar jugador con carta
export function updatePlayerCard(
  player: HighCardPlayer,
  card: PlayingCard
): HighCardPlayer {
  return {
    ...player,
    card,
  };
}

export interface HighCardGameState {
  phase: "setup" | "dealing" | "revealed" | "finished";
  players: HighCardPlayer[];
  round: number;
  winner: string | null;
}

export function createDeck(): PlayingCard[] {
  const deck: PlayingCard[] = [];
  let idCounter = 0;

  for (const suit of CARD_SUITS) {
    for (const rank of CARD_RANKS) {
      deck.push({
        suit,
        rank,
        value: CARD_VALUES[rank],
        id: `${suit}-${rank}-${idCounter++}`,
      });
    }
  }

  return deck;
}

export function getHigherCard(card1: PlayingCard, card2: PlayingCard): PlayingCard {
  return card1.value > card2.value ? card1 : card2;
}
