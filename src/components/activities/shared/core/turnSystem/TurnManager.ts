/**
 * TurnManager - Sistema de gestión de turnos genérico
 *
 * Este módulo maneja la lógica de turnos para cualquier juego basado en turnos.
 * Es completamente agnóstico al tipo de juego, usando TypeScript generics.
 */

import type {
  Player,
  TurnManagerConfig,
  TurnState,
  Move,
  ValidationResult,
} from './types';

export class TurnManager<T = any, M = any> {
  private currentPlayerIndex = 0;
  private turnCount = 0;
  private state: TurnState = 'waiting';
  private timer?: any;
  private moves: Move<M>[] = [];
  private winner: Player<T> | null = null;
  private startTime: number | null = null;
  private lastMoveTime: number | null = null;

  constructor(private config: TurnManagerConfig<T>) {
    this.validateConfig();
  }

  /**
   * Iniciar el juego
   */
  startGame(): void {
    if (this.state !== 'waiting') {
      throw new Error('Game already started');
    }

    this.state = 'playing';
    this.startTime = Date.now();
    this.config.onTurnChange(this.getCurrentPlayer());
    this.startTimerIfNeeded();
  }

  /**
   * Pasar al siguiente turno
   */
  nextTurn(): void {
    if (this.state !== 'playing') {
      return;
    }

    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.config.players.length;
    this.turnCount++;
    this.lastMoveTime = Date.now();

    // Verificar si se acabó el juego por máximo de turnos
    if (this.config.maxTurns && this.turnCount >= this.config.maxTurns) {
      this.endGame(null); // Empate o sin ganador
      return;
    }

    this.config.onTurnChange(this.getCurrentPlayer());
    this.resetTimer();
  }

  /**
   * Registrar un movimiento realizado por el jugador actual
   */
  makeMove(move: Omit<Move<M>, 'playerId' | 'timestamp' | 'turnNumber'>): void {
    if (this.state !== 'playing') {
      throw new Error('Cannot make move: game is not in playing state');
    }

    const currentPlayer = this.getCurrentPlayer();
    const completeMove: Move<M> = {
      playerId: currentPlayer.id,
      timestamp: Date.now(),
      turnNumber: this.turnCount,
      ...move,
    };

    this.moves.push(completeMove);
    this.lastMoveTime = Date.now();
  }

  /**
   * Pausar el juego
   */
  pause(): void {
    if (this.state !== 'playing') {
      return;
    }

    this.state = 'paused';
    this.clearTimer();
  }

  /**
   * Reanudar el juego
   */
  resume(): void {
    if (this.state !== 'paused') {
      return;
    }

    this.state = 'playing';
    this.startTimerIfNeeded();
  }

  /**
   * Finalizar el juego con un ganador
   */
  endGame(winner: Player<T> | null): void {
    this.state = 'finished';
    this.winner = winner;
    this.clearTimer();
    this.config.onGameOver(winner);
  }

  /**
   * Obtener el jugador actual
   */
  getCurrentPlayer(): Player<T> {
    return this.config.players[this.currentPlayerIndex];
  }

  /**
   * Obtener todos los jugadores
   */
  getPlayers(): Player<T>[] {
    return [...this.config.players];
  }

  /**
   * Obtener un jugador por ID
   */
  getPlayerById(id: string): Player<T> | undefined {
    return this.config.players.find((p) => p.id === id);
  }

  /**
   * Obtener el estado actual del juego
   */
  getState(): TurnState {
    return this.state;
  }

  /**
   * Obtener el número de turno actual
   */
  getTurnCount(): number {
    return this.turnCount;
  }

  /**
   * Obtener todos los movimientos realizados
   */
  getMoves(): Move<M>[] {
    return [...this.moves];
  }

  /**
   * Obtener movimientos de un jugador específico
   */
  getMovesByPlayer(playerId: string): Move<M>[] {
    return this.moves.filter((m) => m.playerId === playerId);
  }

  /**
   * Obtener el ganador (si el juego terminó)
   */
  getWinner(): Player<T> | null {
    return this.winner;
  }

  /**
   * Verificar si el juego ha terminado
   */
  isGameOver(): boolean {
    return this.state === 'finished';
  }

  /**
   * Verificar es el turno de un jugador específico
   */
  isPlayerTurn(playerId: string): boolean {
    return this.getCurrentPlayer().id === playerId;
  }

  /**
   * Saltar el turno del jugador actual (penalización)
   */
  skipTurn(): void {
    if (this.state !== 'playing') {
      return;
    }

    this.nextTurn();
  }

  /**
   * Reiniciar el juego con la misma configuración
   */
  restart(): void {
    this.clearTimer();
    this.currentPlayerIndex = 0;
    this.turnCount = 0;
    this.state = 'waiting';
    this.moves = [];
    this.winner = null;
    this.startTime = null;
    this.lastMoveTime = null;
  }

  /**
   * Obtener tiempo de juego en segundos
   */
  getGameDuration(): number {
    if (!this.startTime) return 0;
    const endTime = this.state === 'finished' ? this.lastMoveTime || Date.now() : Date.now();
    return Math.floor((endTime - this.startTime) / 1000);
  }

  /**
   * Validar si una acción es válida (para ser extendido por juegos específicos)
   */
  validateMove(_move: any): ValidationResult {
    // Validación base - puede ser sobreescrita
    // Prefijo _ para indicar que el parámetro se usa en extensiones
    return {
      isValid: true,
    };
  }

  /**
   * Iniciar el temporizador si está configurado
   */
  private startTimerIfNeeded(): void {
    if (this.config.turnTimeLimit && this.config.autoSkip !== false) {
      this.startTimer();
    }
  }

  /**
   * Iniciar el temporizador de turno
   */
  private startTimer(): void {
    this.clearTimer();
    this.timer = setTimeout(() => {
      if (this.state === 'playing') {
        if (this.config.autoSkip !== false) {
          this.nextTurn();
        }
      }
    }, this.config.turnTimeLimit! * 1000);
  }

  /**
   * Reiniciar el temporizador
   */
  private resetTimer(): void {
    this.clearTimer();
    this.startTimerIfNeeded();
  }

  /**
   * Limpiar el temporizador
   */
  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  /**
   * Validar la configuración inicial
   */
  private validateConfig(): void {
    if (!this.config.players || this.config.players.length < 1) {
      throw new Error('At least one player is required');
    }

    if (!this.config.onTurnChange || typeof this.config.onTurnChange !== 'function') {
      throw new Error('onTurnChange callback is required');
    }

    if (!this.config.onGameOver || typeof this.config.onGameOver !== 'function') {
      throw new Error('onGameOver callback is required');
    }

    // Validar IDs únicos
    const ids = this.config.players.map((p) => p.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      throw new Error('Player IDs must be unique');
    }
  }

  /**
   * Limpiar recursos
   */
  destroy(): void {
    this.clearTimer();
  }
}
