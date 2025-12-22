# Activities Module

Módulo de juegos y dinámicas familiares para Kovan.

## 📁 Estructura

```
activities/
├── README.md                   # Este archivo - documentación del módulo
├── constants/                  # Configuraciones y constantes
│   ├── GameConfig.ts          # Configuración de juegos (iconos, descripciones)
│   └── RoulettePresets.ts     # Presets predefinidos para la ruleta
├── games/                      # Componentes de cada juego
│   ├── roulette/              # Juego de Ruleta de la Suerte
│   │   ├── RouletteGame.tsx   # Componente principal del juego
│   │   ├── PresetSelector.tsx # Selector de tipo de preset
│   │   └── types.ts           # Tipos específicos de Roulette
│   └── headsup/               # Juego de Heads Up!
│       ├── HeadsUpGame.tsx    # Componente principal del juego
│       ├── CategorySelector.tsx # Selector de categoría
│       ├── GameScreen.tsx     # Pantalla de juego
│       └── types.ts           # Tipos específicos de HeadsUp
├── utils/                      # Funciones compartidas entre juegos
│   ├── random.ts              # Utilidades de aleatoriedad
│   ├── timer.ts               # Utilidades de timer/countdown
│   └── animation.ts           # Utilidades de animaciones
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

1. **Carta Más Alta** 🃏 - ✅ COMPLETADO - Juego de cartas con anónimos
2. **Gato** ⭕❌ - Más simple, excelente para testing
3. **Memory Match** 🧠 - Popular y visualmente atractivo
4. **Stop!** ✏️ - Muy replayable, engage familiar
5. **Verdad o Reto** ⚖️ - Bueno para eventos familiares
6. **¿Quién Soy?** 🎨 - Más complejo, para después

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
