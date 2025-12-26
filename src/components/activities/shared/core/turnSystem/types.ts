/**
 * Tipos base para el sistema de juegos por turnos
 *
 * Estos tipos son genéricos y pueden ser extendidos por juegos específicos.
 */

export type TurnState = 'waiting' | 'playing' | 'paused' | 'finished';

/**
 * Jugador genérico con datos específicos del juego
 */
export interface Player<T = unknown> {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
  score?: number;
  isHuman?: boolean; // Para distinguir jugadores humanos de IA
  data?: T; // Datos específicos del juego (extensible)
}

/**
 * Configuración inicial del TurnManager
 */
export interface TurnManagerConfig<T = unknown> {
  players: Player<T>[];
  onTurnChange: (player: Player<T>) => void;
  onGameOver: (winner: Player<T> | null) => void;
  maxTurns?: number;
  turnTimeLimit?: number; // segundos por turno
  autoSkip?: boolean; // saltar turno automáticamente si se acaba el tiempo
}

/**
 * Estado completo del juego
 */
export interface GameState<T = unknown, M = unknown> {
  status: TurnState;
  currentPlayer: Player<T>;
  turnCount: number;
  moves: Move<M>[];
  winner?: Player<T>;
  startTime?: number;
  lastMoveTime?: number;
}

/**
 * Movimiento o acción realizada por un jugador
 */
export interface Move<T = unknown> {
  playerId: string;
  timestamp: number;
  turnNumber: number;
  from?: { x: number; y: number };
  to?: { x: number; y: number };
  data?: T; // Datos específicos del movimiento
}

/**
 * Resultado de validar una acción
 */
export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  error?: string;
}

/**
 * Opciones para inicializar un juego
 */
export interface GameInitOptions<T = unknown> {
  players: Player<T>[];
  turnTimeLimit?: number;
  maxTurns?: number;
}
