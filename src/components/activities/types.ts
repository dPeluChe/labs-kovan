import type { LucideIcon } from "lucide-react";

// ==================== GAME TYPES ====================

export type GameType = "roulette" | "headsup" | "high_card" | "battleship";

export type GameStatus = "idle" | "playing" | "paused" | "finished";

export interface GameConfig<T extends GameType = GameType> {
  id: T;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  status: "available" | "coming_soon";
  minPlayers: number;
  maxPlayers?: number;
}

export interface GameSession {
  gameType: GameType;
  presetId?: string;
  winner?: string;
  participants: string[];
  playedAt: number;
  playedBy: string;
}

// ==================== ROULETTE TYPES ====================

export type RoulettePresetType =
  | "integrantes"
  | "numeros"
  | "sino"
  | "custom"
  | "saved";

export interface RoulettePreset {
  id: string;
  type: RoulettePresetType;
  name: string;
  items: string[];
  isDefault?: boolean;
  icon?: string;
}

export interface RouletteState {
  options: string[];
  winner: string | null;
  isSpinning: boolean;
  currentPreset: RoulettePresetType;
}

// ==================== HEADS UP TYPES ====================

export type HeadsUpCategory =
  | "peliculas"
  | "superheroes"
  | "canciones"
  | "familiares"
  | "comida"
  | "animales"
  | "custom";

export interface HeadsUpCard {
  id: string;
  word: string;
  category: HeadsUpCategory;
  guessed: boolean;
  skipped: boolean;
}

export interface HeadsUpCategoryConfig {
  id: HeadsUpCategory;
  name: string;
  icon: string;
  cards: string[];
}

export interface HeadsUpState {
  currentCard: HeadsUpCard | null;
  score: number;
  skipped: number;
  timeLeft: number;
  isPlaying: boolean;
  isPaused: boolean;
  category: HeadsUpCategory;
  usedCards: Set<string>;
}
