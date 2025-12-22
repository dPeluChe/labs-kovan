# Activities Module

Módulo de juegos y dinámicas familiares para Kovan.

## 🎯 Arquitectura de Juegos (2025)

### Enfoque Modular por Categorías

El módulo está organizado en dos categorías principales:

#### 1. **Juegos Casuales** (Sin lógica compleja)
Juegos rápidos, sin estado persistente, ideales para momentos breves.
- **Ruleta de la Suerte** ✅ - Selección aleatoria
- **Heads Up!** ✅ - Adivinanzas con timer
- **Carta Más Alta** ✅ - Juego de cartas simple

#### 2. **Juegos por Turnos** (Con arquitectura compartida)
Juegos estratégicos con sistema de turnos, física opcional y estado de juego.
- **Batalla Naval** 🚧 (En desarrollo)
- **Damas Chinas** 📋 (Planeado)
- **Más juegos por definir** 📋

### Core de Juegos por Turnos

Sistema reutilizable para cualquier juego basado en turnos:

```
shared/core/
├── turnSystem/
│   ├── TurnManager.ts         # Gestión de turnos genérica
│   ├── PlayerManager.ts       # Gestión de jugadores
│   └── Timer.ts               # Temporizador por turnos
├── physics/
│   ├── PhysicsEngine.ts       # Wrapper de Matter.js
│   ├── GameObject.ts          # Clase base para objetos con física
│   └── ParticleSystem.ts      # Sistema de partículas
├── state/
│   ├── GameStateManager.ts    # Gestión de estado de juego
│   └── HistoryManager.ts      # Historial de movimientos
└── ui/
    ├── GameBoard.tsx          # Tablero genérico
    ├── PlayerCard.tsx         # Tarjeta de jugador
    └── ScoreBoard.tsx         # Marcador
```

## 📁 Estructura

```
activities/
├── README.md                   # Este archivo - documentación del módulo
├── constants/                  # Configuraciones y constantes
│   ├── GameConfig.ts          # Configuración de juegos (iconos, descripciones)
│   └── RoulettePresets.ts     # Presets predefinidos para la ruleta
├── games/                      # Componentes de cada juego
│   ├── roulette/              # Juego de Ruleta de la Suerte
│   ├── headsup/               # Juego de Heads Up!
│   ├── highcard/              # Juego de Carta Más Alta
│   ├── battleship/            # Juego de Batalla Naval (por turnos)
│   └── checkers/              # Juego de Damas Chinas (por turnos)
├── shared/                     # **NUEVO** - Core compartido para juegos por turnos
│   ├── core/                  # Lógica de juego reutilizable
│   │   ├── turnSystem/        # Sistema de turnos
│   │   ├── physics/           # Motor de física (Matter.js)
│   │   ├── state/             # Gestión de estado
│   │   └── ui/                # Componentes UI genéricos
│   └── utils/                 # Utilidades compartidas
│       ├── random.ts          # Utilidades de aleatoriedad
│       ├── timer.ts           # Utilidades de timer/countdown
│       └── animation.ts       # Utilidades de animaciones
└── types.ts                    # Tipos compartidos entre juegos
```

## 🎯 Juegos Disponibles

### 1. Ruleta de la Suerte (Roulette) ✅
Juego de azar para seleccionar un ganador entre opciones.

**Modos de juego:**
- `integrantes` - Miembros de la familia
- `numeros` - Números del 1 al 100
- `sino` - Opciones binarias (Sí/No)
- `custom` - Opciones personalizadas por el usuario
- `saved` - Presets guardados anteriormente

**Características:**
- Animación de giro de 2 segundos
- Agregar/remover participantes
- Guardar presets personalizados
- Historial de ganadores

### 2. Heads Up! ✅
Juego de adivinanzas donde un jugador debe adivinar la palabra en su frente.

**Categorías:**
- Películas
- Superhéroes
- Canciones
- Familiares
- Comida
- Animales

**Características:**
- Timer de 60 segundos
- Contador de aciertos
- Opción de pasar carta
- Multijugador local

## 🎯 Juegos Disponibles

### 1. Ruleta de la Suerte (Roulette) ✅
Juego de azar para seleccionar un ganador entre opciones.

**Modos de juego:**
- `integrantes` - Miembros de la familia
- `numeros` - Números del 1 al 100
- `sino` - Opciones binarias (Sí/No)
- `custom` - Opciones personalizadas por el usuario
- `saved` - Presets guardados anteriormente

**Características:**
- Animación de giro de 2 segundos
- Agregar/remover participantes
- Guardar presets personalizados
- Historial de ganadores
- Área de juego ampliada y vistosa (mobile first)

### 2. Heads Up! ✅
Juego de adivinanzas donde un jugador debe adivinar la palabra en su frente.

**Categorías:**
- Películas
- Superhéroes
- Canciones
- Familiares
- Comida
- Animales

**Características:**
- Timer de 60 segundos
- Contador de aciertos
- Opción de pasar carta
- Multijugador local

### 3. Carta Más Alta (High Card) ✅🃏
Juego de cartas simple donde cada jugador recibe una carta y gana quien tenga la más alta.

**Cómo funciona:**
- Seleccionar 2+ jugadores (familiares o anónimos)
- Cada jugador toca su carta para voltearla (no automático)
- Solo cuando TODAS las cartas están volteadas se revela el ganador
- Gana la carta más valorada (A > K > Q > J > 10 > ... > 2)

**Características:**
- **Jugadores anónimos disponibles**: 🦸 Superhéroe, 🧙 Mago, 🤖 Robot, etc.
- **Sistema manual**: Cada jugador voltea su carta al tocarla
- **8 colores únicos** para jugadores anónimos
- **Múltiples rondas** con los mismos jugadores
- **Sin persistencia en DB** (juego local)
- Responsive y optimizado para móvil
- Dark mode completo

**Flujo del juego:**
1. Seleccionar jugadores (familiares y/o anónimos)
2. Repartir cartas (boca abajo)
3. Cada jugador toca su carta para voltearla
4. Cuando TODAS están volteadas → Sistema evalúa ganador
5. Se muestra el ganador con animación

---

## 🎮 Juegos Propuestos (Backlog)

### 1. Carta Más Alta (High Card) 🃏
Juego de cartas simple donde los jugadores reciben una carta y gana quien tenga la más alta.

**Cómo funciona:**
- Seleccionar 2+ jugadores de la familia
- "El repartidor" (dealer) da una carta a cada jugador
- Las cartas se revelan simultáneamente
- Gana la carta más valorada (A > K > Q > J > 10 > ... > 2)
- Mostrar animación de reparto y revelación

**Características:**
- Sin persistencia en DB (juego local)
- Usar `getRandomNumber` y utilidades de random
- Animaciones de cartas usando `animation.ts`
- Múltiples rondas opcionales

**Complexidad:** Baja - Ideal para implementar rápidamente

---

### 2. Gato (Tic-Tac-Toe) ⭕❌
Juego clásico de estrategia para 2 jugadores.

**Cómo funciona:**
- Tablero 3x3
- 2 jugadores locales (X y O)
- Detectar ganador o empate
- Contador de victorias por sesión

**Características:**
- Sin persistencia en DB (juego local)
- Grid responsive
- Animación de marcas
- Detector de líneas ganadoras

**Complexidad:** Baja - Excelente para empezar

---

### 3. Memory Match (Memorama) 🧠
Juego de encontrar pares de cartas.

**Cómo funciona:**
- Grid de cartas (4x4, 6x6)
- Voltear 2 cartas por turno
- Encontrar pares
- Contador de movimientos y tiempo

**Características:**
- Usar emojis como iconos
- Niveles de dificultad
- Modo contrarreloj
- Usar `shuffleArray` y `getRandomItems`

**Complexidad:** Media

---

### 4. Stop! (Tutti Frutti/Basta) ✏️
Juego clásico de completar categorías con una letra.

**Cómo funciona:**
- Ruleta selecciona una letra al azar
- Timer de 30-60 segundos
- Completar categorías: Nombre, Ciudad, Animal, Comida, etc.
- Validación de palabras únicas por jugador

**Características:**
- Formularios controlados
- Reutilizar lógica de Roulette para la letra
- Algoritmo de validación de palabras únicas
- Sistema de puntos configurable

**Complexity:** Media - Requiere más lógica de validación

---

### 5. Verdad o Reto ⚖️
Juego clásico de preguntas y retos familiares.

**Cómo funciona:**
- Ruleta selecciona jugador
- Ruleta elige Verdad o Reto
- Banco de preguntas predefinidas
- Posibilidad de agregar personalizadas

**Características:**
- Reutilizar lógica de Roulette
- Base de datos de preguntas/retos
- Presets personalizables
- Sin persistencia de sesiones

**Complexity:** Media - Principalmente contenido

---

### 6. ¿Quién Soy? (Charadas con Dibujos) 🎨
Similar a Heads Up pero dibujando en lugar de adivinar con palabras.

**Cómo funciona:**
- Canvas para dibujar con el dedo
- Categorías: Objetos, Animales, Profesiones
- Los demás adivinan qué es
- Timer de 60s

**Características:**
- Canvas API para dibujar
- Similar estructura a HeadsUp
- Guardar dibujos como imágenes
- Animación de revelación

**Complexity:** Alta - Requiere manejo de canvas

---

## 📊 Prioridad de Implementación Sugerida

### Juegos Casuales (Sin turnos)
1. **Carta Más Alta** 🃏 - ✅ COMPLETADO - Juego de cartas con anónimos
2. **Gato** ⭕❌ - Más simple, excelente para testing
3. **Memory Match** 🧠 - Popular y visualmente atractivo
4. **Stop!** ✏️ - Muy replayable, engage familiar
5. **Verdad o Reto** ⚖️ - Bueno para eventos familiares
6. **¿Quién Soy?** 🎨 - Más complejo, para después

### Juegos por Turnos (Nueva arquitectura)
1. **Batalla Naval** ⚓ - 🚧 EN DESARROLLO - Próximo juego con física
2. **Damas Chinas** ♟️ - Planeado - Reutilizará core compartido
3. **Ajedrez** ♟️ - Planeado - Más complejo, mismo core
4. **Más juegos** - Por definir - El core permitirá agregarlos rápidamente

## 🏗️ Convex Schema

Tablas en `convex/schema.ts`:

```typescript
gamePresets: defineTable({
  familyId: v.id("families"),
  gameType: v.union(v.literal("roulette"), v.literal("headsup")),
  name: v.string(),
  items: v.array(v.string()),
  isDefault: v.optional(v.boolean()),
  createdBy: v.id("users"),
})

gameSessions: defineTable({
  familyId: v.id("families"),
  gameType: v.union(v.literal("roulette"), v.literal("headsup")),
  presetId: v.optional(v.id("gamePresets")),
  winner: v.optional(v.string()),
  participants: v.array(v.string()),
  playedAt: v.number(),
  playedBy: v.id("users"),
})
```

## 🛠️ Utils Compartidas

Funciones en `utils/` que pueden ser usadas por cualquier juego:

### `random.ts`
- `getRandomItem<T>(array: T[]): T` - Obtener elemento aleatorio
- `getRandomItems<T>(array: T[], count: number): T[]` - Obtener N elementos aleatorios
- `shuffleArray<T>(array: T[]): T[]` - Mezclar array
- `getRandomNumber(min: number, max: number): number` - Número aleatorio en rango

### `timer.ts`
- `useCountdown(seconds: number, onComplete: () => void)` - Hook de countdown
- `formatTime(seconds: number): string` - Formatear segundos a MM:SS
- `CountdownTimer` - Componente reutilizable de timer

### `animation.ts`
- `animateValue(from: number, to: number, duration: number, callback: (value: number) => void)` - Animación de valores numéricos
- `staggerAnimation(items: any[], delay: number)` - Animación escalonada

## 📝 Reglas de Desarrollo

1. **Sin `any`**: Usar tipos explícitos de TypeScript
2. **Límite de líneas**: Máximo 400-500 líneas por archivo
3. **Componentes modulares**: Separar lógica en componentes pequeños
4. **Types centralizados**: Usar `types.ts` para tipos compartidos
5. **Constants separadas**: Configuraciones en `constants/`
6. **Icons de Lucide**: Importar desde `lucide-react`
7. **Utils compartidas**: Reutilizar funciones de `utils/` antes de crear nuevas

## 🔧 Agregar un Nuevo Juego

1. Crear carpeta en `games/nuevo-juego/`
2. Crear `types.ts` con tipos específicos
3. Crear componente principal `NuevoJuegoGame.tsx`
4. Actualizar `GameConfig.ts` con metadata del juego
5. Actualizar `ActivitiesPage.tsx` para incluir el juego
6. Si necesita persistencia, actualizar Convex schema

## 🎨 UI/UX Guidelines

- Usar componentes de DaisyUI
- Iconos de Lucide React
- Colores del tema (primary, secondary, etc.)
- Animaciones con CSS o Framer Motion
- Responsive para móviles

## 📊 Estados de Juego

Los juegos pueden tener los siguientes estados:
- `idle` - Esperando inicio
- `playing` - Juego en curso
- `paused` - Pausado
- `finished` - Terminado con resultado

---

## 🚀 Nueva Arquitectura: Juegos por Turnos (2025)

### Decisión Técnica: Matter.js + Core Compartido

**Fecha:** Diciembre 2025  
**Stack:** React + Vite + TypeScript + Matter.js

#### ¿Por qué Matter.js?

- ✅ **Lightweight**: ~927 KB bundle (vs 147 MB Phaser, 63 MB Pixi.js)
- ✅ **Física 2D realista**: Colisiones, gravedad, fricción
- ✅ **Perfecto para mini-juegos**: No es un motor completo como Phaser
- ✅ **Compatible con React**: Hooks directos, sin adaptadores complejos
- ✅ **Multi-touch nativo**: Ideal para juegos en el mismo celular
- ✅ **TypeScript types**: `@types/matter-js` disponible

#### Comparativo de Librerías 2025

| Librería | Bundle Size | Para Kovan | Veredicto |
|----------|-------------|------------|-----------|
| **Matter.js** | ~1 MB | ⭐⭐⭐⭐⭐ | ✅ **ELEGIDO** |
| Pixi.js | ~63 MB | ⭐⭐ | ❌ Overkill (solo render) |
| Phaser | ~147 MB | ⭐ | ❌ Overkill (motor completo) |

### Roadmap de Implementación

#### Fase 1: Core Compartido ✅ (En progreso)
- [ ] Sistema de turnos genérico (`TurnManager`)
- [ ] Gestión de jugadores (`PlayerManager`)
- [ ] Gestión de estado (`GameStateManager`)
- [ ] Wrapper de Matter.js (`PhysicsEngine`)
- [ ] Sistema de partículas (`ParticleSystem`)
- [ ] Componentes UI genéricos (`GameBoard`, `PlayerCard`, `ScoreBoard`)

#### Fase 2: Batalla Naval 🚧 (Siguiente)
- [ ] Tablero 10x10 interactivo
- [ ] Colocación de barcos (drag & drop)
- [ ] Sistema de turnos (usando core)
- [ ] Disparos con física (proyectiles)
- [ ] Explosiones con partículas
- [ ] Detección de hundimiento
- [ ] IA para jugar contra CPU

#### Fase 3: Damas Chinas 📋
- [ ] Tablero 8x8
- [ ] Fichas con física
- [ ] Validación de movimientos
- [ ] Sistema de capturas con física
- [ ] IA básica

### Estructura de Tipos para Juegos por Turnos

```typescript
// shared/core/turnSystem/types.ts

export interface Player<T = any> {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
  score?: number;
  data?: T; // Datos específicos del juego
}

export type TurnState = 'waiting' | 'playing' | 'paused' | 'finished';

export interface TurnManagerConfig<T = any> {
  players: Player<T>[];
  onTurnChange: (player: Player<T>) => void;
  onGameOver: (winner: Player<T>) => void;
  maxTurns?: number;
  turnTimeLimit?: number; // segundos
}

export interface GameState<T = any> {
  status: TurnState;
  currentPlayer: Player<T>;
  turnCount: number;
  moves: Move<T>[];
  winner?: Player<T>;
}

export interface Move<T = any> {
  playerId: string;
  timestamp: number;
  from?: { x: number; y: number };
  to?: { x: number; y: number };
  data?: T; // Datos específicos del movimiento
}
```

### Ejemplo de Uso del Core

```typescript
// battleship/BattleshipGame.tsx

import { TurnManager } from '../shared/core/turnSystem/TurnManager';
import { PhysicsEngine } from '../shared/core/physics/PhysicsEngine';

export function BattleshipGame() {
  const [turnManager] = useState(() => new TurnManager<BattleshipPlayer>({
    players: [
      { id: '1', name: 'Jugador 1', color: '#3b82f6' },
      { id: '2', name: 'Jugador 2', color: '#ef4444' }
    ],
    onTurnChange: (player) => {
      console.log('Turno de:', player.name);
    },
    onGameOver: (winner) => {
      console.log('¡Ganador:', winner.name);
    },
    maxTurns: 100,
    turnTimeLimit: 30,
  }));
  
  const handleAttack = (x: number, y: number) => {
    // Lógica de ataque usando el core
    turnManager.nextTurn();
  };
  
  return <div>...</div>;
}
```

### Principios de Diseño del Core

1. **Reutilizable**: El core debe servir para ANY juego por turnos
2. **Modular**: Cada módulo es independiente y puede usarse por separado
3. **Tipos Genéricos**: Uso de TypeScript generics para máxima flexibilidad
4. **Sin dependencias**: El core NO depende de Matter.js directamente (física es opcional)
5. **Testeable**: Cada módulo debe poder probarse unitariamente
6. **React-friendly**: Hooks-first, compatible con el ecosistema React

### Archivos a Crear (Próximos pasos)

```
src/components/activities/shared/core/
├── turnSystem/
│   ├── TurnManager.ts        # Prioridad 1
│   ├── PlayerManager.ts      # Prioridad 1
│   └── types.ts              # Prioridad 1
├── state/
│   ├── GameStateManager.ts   # Prioridad 2
│   └── HistoryManager.ts     # Prioridad 2
└── ui/
    ├── GameBoard.tsx         # Prioridad 3
    ├── PlayerCard.tsx        # Prioridad 3
    └── ScoreBoard.tsx        # Prioridad 3
```

### Testing Strategy

1. **Unit Tests**: Para cada módulo del core (Jest + React Testing Library)
2. **Integration Tests**: Para flujos completos de juego
3. **E2E Tests**: Para juegos completos (Playwright)

---

## 📝 Reglas de Desarrollo

1. **Sin `any`**: Usar tipos explícitos de TypeScript
2. **Límite de líneas**: Máximo 400-500 líneas por archivo
3. **Componentes modulares**: Separar lógica en componentes pequeños
4. **Types centralizados**: Usar `types.ts` para tipos compartidos
5. **Constants separadas**: Configuraciones en `constants/`
6. **Icons de Lucide**: Importar desde `lucide-react`
7. **Utils compartidas**: Reutilizar funciones de `utils/` antes de crear nuevas
8. **Core-first**: Para juegos por turnos, SIEMPRE usar el core compartido

## 🔧 Agregar un Nuevo Juego Por Turnos

1. Usar el core compartido (`TurnManager`, `PlayerManager`, etc.)
2. Crear carpeta en `games/nuevo-juego/`
3. Crear `types.ts` con tipos específicos (extender tipos base)
4. Crear componente principal `NuevoJuegoGame.tsx`
5. Usar componentes UI genéricos del core (`GameBoard`, `PlayerCard`)
6. Agregar física opcionalmente con `PhysicsEngine`
7. Actualizar `GameConfig.ts` con metadata del juego
8. Actualizar `ActivitiesPage.tsx` para incluir el juego
