# Kovan — Task Backlog

> Seguimiento activo de tareas pendientes para Kovan.
>
> - **Tareas completadas**: se archivan en [`TASK_COMPLETED/`](./TASK_COMPLETED/) por mes (formato `YYMM.md`).
> - **Historial de releases**: ver [`../CHANGELOG.md`](../CHANGELOG.md).
> - **Docs históricas y post-mortems**: ver [`archived/`](./archived/).
>
> Reglas: toda tarea nueva se agrega aquí con su `added: YYYY-MM-DD`. Las zonas protegidas (`README.md`, `CHANGELOG.md`, READMEs de módulos en `src/` y `convex/`) nunca deben contener listas de tareas — solo documentación de contexto. Si necesitas trackear algo, va en este archivo.

---

## Priority 1 — En progreso

_(vacío — agregar aquí lo que está activamente en trabajo)_

## Priority 2 — Siguiente

### ACTIVITIES-CORE: Core compartido para juegos por turnos `added: 2026-04-10`

Sistema modular y reutilizable para juegos basados en turnos. Vive en `src/components/activities/shared/core/`. Ya están listos `TurnManager`, `PlayerManager` y los tipos base (ver el README local del módulo para la API y ejemplos de uso). Las siguientes piezas están pendientes:

- [ ] `GameStateManager` — gestor genérico de estado de juego
- [ ] `HistoryManager` — historial de movimientos con undo/redo
- [ ] `PhysicsEngine` — wrapper de Matter.js para juegos con física
- [ ] `ParticleSystem` — sistema de partículas reusable
- [ ] Componentes UI genéricos — tableros, controles, overlays reutilizables entre juegos

> Motivación: todos los juegos nuevos por turnos deberían consumir este core en vez de reimplementar lógica de estado, historial y física. Las carpetas `physics/`, `state/`, `ui/` ya existen vacías como placeholders.

## Priority 3 — Backlog

### DOCS-NITS: Doc nits menores identificados en post-merge review `added: 2026-04-10`

Pequeños ajustes de documentación identificados durante la sesión de cierre de Phase 3 pero postergados para mantener el scope del PR #3 acotado.

- [ ] Agregar subsección "Phase 3.1 — Testing & CI infrastructure" al `CHANGELOG.md` documentando el PR #3 (vitest + smoke tests + GitHub Actions CI)
- [ ] Mencionar el split de `HighCardGame` en Board / Setup / `useHighCardGame` hook / constants en `src/components/activities/README.md` (commit `c8bb506`)

## Research & Ideas

_(vacío — sugerencias y exploraciones que no son todavía tareas accionables)_
