# Core Compartido - Juegos por Turnos

Sistema modular y reutilizable para juegos basados en turnos.

## 📁 Estructura

```
core/
├── turnSystem/          # Sistema de turnos ✅
│   ├── TurnManager.ts   # Gestión de turnos genérica
│   ├── PlayerManager.ts # Gestión de jugadores
│   ├── types.ts         # Tipos base
│   └── index.ts         # Exportaciones
├── physics/             # Motor de física (Matter.js) 🚧
├── state/               # Gestión de estado 📋
└── ui/                  # Componentes UI genéricos 📋
```

## 🎯 Uso Básico

```typescript
import { TurnManager, Player } from './turnSystem';

// 1. Definir jugadores
const players: Player[] = [
  { id: '1', name: 'Jugador 1', color: '#3b82f6' },
  { id: '2', name: 'Jugador 2', color: '#ef4444' },
];

// 2. Crear TurnManager
const turnManager = new TurnManager({
  players,
  onTurnChange: (player) => {
    console.log('Turno de:', player.name);
  },
  onGameOver: (winner) => {
    console.log('Ganador:', winner?.name);
  },
  maxTurns: 100,
  turnTimeLimit: 30,
});

// 3. Iniciar juego
turnManager.startGame();

// 4. Realizar movimiento
turnManager.makeMove({
  from: { x: 0, y: 0 },
  to: { x: 5, y: 5 },
});

// 5. Pasar turno
turnManager.nextTurn();

// 6. Finalizar juego
turnManager.endGame(players[0]);
```

## 🔧 APIs Principales

### TurnManager

- `startGame()` - Iniciar el juego
- `nextTurn()` - Pasar al siguiente turno
- `makeMove(move)` - Registrar un movimiento
- `pause()` / `resume()` - Pausar/reanudar
- `endGame(winner)` - Finalizar con ganador
- `getCurrentPlayer()` - Obtener jugador actual
- `getState()` - Obtener estado del juego
- `getMoves()` - Obtener historial de movimientos

### PlayerManager

- `addPlayer(player)` - Agregar jugador
- `removePlayer(id)` - Remover jugador
- `updateScore(id, score)` - Actualizar score
- `getWinnerByScore()` - Obtener ganador por score
- `getPlayersByScore()` - Jugadores ordenados por score

## 📝 Ejemplo Completo

```typescript
import { TurnManager, PlayerManager, Player } from '../shared/core/turnSystem';

export function BattleshipGame() {
  // Inicializar jugadores
  const playerManager = new PlayerManager<BattleshipPlayer>();
  playerManager.fromArray([
    { id: '1', name: 'Jugador 1', color: '#3b82f6' },
    { id: '2', name: 'Jugador 2', color: '#ef4444' },
  ]);

  // Crear gestor de turnos
  const turnManager = new TurnManager({
    players: playerManager.toArray(),
    onTurnChange: (player) => {
      console.log('Turno de:', player.name);
      // Actualizar UI
    },
    onGameOver: (winner) => {
      console.log('¡Ganador:', winner?.name);
      // Mostrar pantalla de victoria
    },
    maxTurns: 100,
    turnTimeLimit: 30,
  });

  // Manejar ataque
  const handleAttack = (x: number, y: number) => {
    const currentPlayer = turnManager.getCurrentPlayer();

    // Registrar movimiento
    turnManager.makeMove({
      to: { x, y },
      data: { type: 'attack' },
    });

    // Procesar ataque...
    // ...

    // Pasar turno
    turnManager.nextTurn();
  };

  return { turnManager, playerManager, handleAttack };
}
```

## ✅ Checklist de Implementación

- [x] TurnManager genérico
- [x] PlayerManager genérico
- [x] Tipos base extensibles
- [ ] GameStateManager
- [ ] HistoryManager
- [ ] PhysicsEngine (Matter.js wrapper)
- [ ] ParticleSystem
- [ ] Componentes UI genéricos

## 🧪 Testing

```typescript
// Ejemplo de test
import { TurnManager } from './turnSystem';

describe('TurnManager', () => {
  it('should initialize with 2 players', () => {
    const manager = new TurnManager({
      players: [
        { id: '1', name: 'Player 1' },
        { id: '2', name: 'Player 2' },
      ],
      onTurnChange: () => {},
      onGameOver: () => {},
    });

    expect(manager.getPlayerCount()).toBe(2);
  });

  it('should switch turns correctly', () => {
    // Test implementation
  });
});
```
