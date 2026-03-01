# Activities Module

Módulo de juegos y dinámicas familiares para Kovan.

## Objetivo

Ofrecer juegos rápidos, mobile-first, para convivencia familiar dentro de la app.

## Juegos implementados

1. Ruleta de la Suerte (`roulette`)
- Modos: `integrantes`, `numeros`, `sino`, `custom`.
- Uso típico: decidir turnos, actividades o elecciones rápidas.

2. Heads Up! (`headsup`)
- Categorías predefinidas.
- Temporizador y conteo de aciertos/pasadas.

3. Carta Más Alta (`highcard`)
- 2+ jugadores (familiares o anónimos).
- Revelado manual por jugador.
- Ganador al finalizar revelado completo.

## Estructura

```
activities/
├── constants/
├── games/
│   ├── roulette/
│   ├── headsup/
│   └── highcard/
├── shared/
│   ├── core/
│   └── utils/
└── types.ts
```

## Integración con datos familiares

- Los juegos que consumen miembros de familia dependen del `currentFamily` activo.
- Cualquier consulta/mutación persistente debe enviar `sessionToken` y validar acceso familiar en backend.

## Estado actual

- Enfoque principal: juegos casuales de uso inmediato.
- Se mantiene espacio para juegos por turnos futuros (sin compromiso de fecha en este documento).
