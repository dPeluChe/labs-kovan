import {
  Dices,
  Ship,
  HelpCircle,
  Spade
} from "lucide-react";
import type { GameConfig } from "../types";

export const GAMES_CONFIG: Record<string, GameConfig> = {
  roulette: {
    id: "roulette",
    name: "Ruleta de la Suerte",
    description: "Elige un ganador al azar entre los participantes",
    icon: Dices,
    color: "text-primary",
    status: "available",
    minPlayers: 2,
  },
  headsup: {
    id: "headsup",
    name: "Heads Up!",
    description: "Adivina la palabra en tu frente con pistas de tu familia",
    icon: HelpCircle,
    color: "text-secondary",
    status: "available",
    minPlayers: 2,
  },
  high_card: {
    id: "high_card",
    name: "Carta Más Alta",
    description: "Reparte cartas y gana quien tenga la más valorada",
    icon: Spade,
    color: "text-accent",
    status: "available",
    minPlayers: 2,
  },
  battleship: {
    id: "battleship",
    name: "Batalla Naval",
    description: "Juego de estrategia - Próximamente",
    icon: Ship,
    color: "text-info",
    status: "coming_soon",
    minPlayers: 2,
  },
};

export const getAvailableGames = (): GameConfig[] => {
  return Object.values(GAMES_CONFIG).filter(
    (game) => game.status === "available"
  );
};

export const getComingSoonGames = (): GameConfig[] => {
  return Object.values(GAMES_CONFIG).filter(
    (game) => game.status === "coming_soon"
  );
};

export const getGameById = (id: string): GameConfig | undefined => {
  return GAMES_CONFIG[id];
};
