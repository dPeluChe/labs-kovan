/**
 * PlayerManager - Gestión de jugadores
 *
 * Maneja la creación, modificación y eliminación de jugadores
 */

import type { Player } from './types';

export class PlayerManager<T = any> {
  private players: Map<string, Player<T>> = new Map();

  /**
   * Agregar un nuevo jugador
   */
  addPlayer(player: Player<T>): void {
    if (this.players.has(player.id)) {
      throw new Error(`Player with id ${player.id} already exists`);
    }
    this.players.set(player.id, player);
  }

  /**
   * Remover un jugador por ID
   */
  removePlayer(playerId: string): boolean {
    return this.players.delete(playerId);
  }

  /**
   * Obtener un jugador por ID
   */
  getPlayer(playerId: string): Player<T> | undefined {
    return this.players.get(playerId);
  }

  /**
   * Obtener todos los jugadores
   */
  getAllPlayers(): Player<T>[] {
    return Array.from(this.players.values());
  }

  /**
   * Actualizar datos de un jugador
   */
  updatePlayer(playerId: string, updates: Partial<Player<T>>): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;

    this.players.set(playerId, {
      ...player,
      ...updates,
      id: player.id, // Mantener el ID original
    });
    return true;
  }

  /**
   * Actualizar score de un jugador
   */
  updateScore(playerId: string, score: number): boolean {
    return this.updatePlayer(playerId, { score });
  }

  /**
   * Incrementar score de un jugador
   */
  incrementScore(playerId: string, delta: number = 1): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;

    return this.updatePlayer(playerId, {
      score: (player.score || 0) + delta,
    });
  }

  /**
   * Obtener el jugador con mayor score
   */
  getWinnerByScore(): Player<T> | undefined {
    const players = this.getAllPlayers();
    return players.reduce((winner, player) => {
      if (!winner || (player.score || 0) > (winner.score || 0)) {
        return player;
      }
      return winner;
    }, undefined as Player<T> | undefined);
  }

  /**
   * Obtener jugadores ordenados por score (descendente)
   */
  getPlayersByScore(): Player<T>[] {
    return this.getAllPlayers().sort((a, b) => {
      return (b.score || 0) - (a.score || 0);
    });
  }

  /**
   * Verificar si existe un jugador
   */
  hasPlayer(playerId: string): boolean {
    return this.players.has(playerId);
  }

  /**
   * Obtener cantidad de jugadores
   */
  getPlayerCount(): number {
    return this.players.size;
  }

  /**
   * Limpiar todos los jugadores
   */
  clear(): void {
    this.players.clear();
  }

  /**
   * Crear jugadores desde un array (inicialización rápida)
   */
  fromArray(players: Player<T>[]): void {
    this.clear();
    players.forEach((player) => this.addPlayer(player));
  }

  /**
   * Exportar jugadores como array
   */
  toArray(): Player<T>[] {
    return this.getAllPlayers();
  }
}
