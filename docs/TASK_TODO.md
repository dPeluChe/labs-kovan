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

### MCP-TOOLS-A: Lecturas faltantes para simetría del catálogo MCP `added: 2026-06-10`

El catálogo actual (27 tools) nació orientado a captura; varios módulos son
write-only o no están expuestos. Este lote son envolturas delgadas sobre
queries existentes (esfuerzo bajo, valor alto). Convenciones en
[`docs/MCP.md`](./MCP.md): fuzzy match con `findBestMatch`, errores
accionables que listan candidatos, nunca crear entidades sin confirmación.

- [ ] `searchContacts` + `addContact` — directorio ("dame el teléfono del veterinario")
- [ ] `getPlaces` (filtro por categoría) + `registerPlaceVisit` — lugares es write-only hoy
- [ ] `listRecipes` con búsqueda por título/categoría — recetas es write-only hoy
- [ ] `getExpiringDocuments` — SOLO metadata (título, tipo, fecha de vencimiento); nunca contenido de la bóveda
- [ ] `getVehicleReminders` — próximos mantenimientos vía `nextDate` de `vehicleEvents`
- [ ] `listFamilyMembers` — solo lectura, ayuda al agente a desambiguar nombres (regalos, salud, hogar)

### MCP-TOOLS-B: Escrituras que completan flujos `added: 2026-06-10`

- [ ] `addMedication` / `addMedicalRecord` — con fuzzy match del perfil (persona/mascota) vía `getPersonProfiles`
- [ ] `registerLoanPayment` — abonos a préstamos (`loanPayments` existe sin tool; debe actualizar `balance`)
- [ ] `addSubscription` + `recordSubscriptionPayment` — la mutation ya existe en `convex/subscriptions.ts`, solo exponerla
- [ ] `createCalendarEvent` — vía la action existente `calendar/orchestration.createEvent` (nota: requiere `ctx.runAction`, no `runQuery`)
- [ ] `getTripDetail` (itinerario + reservas) + `createTrip`
- [ ] `getDiaryEntries` — leer entradas propias (la query `diary.getEntries` ya filtra privacidad por autor)

> Criterio acordado: NO exponer vía MCP — contenido de documentos de la
> bóveda, administración de familia (invitar/expulsar), ni borrados en
> general. Esas acciones se quedan en la app.

### MCP-MISC: Ajustes menores del agente/MCP `added: 2026-06-10`

- [ ] Agente interno multi-familia: `agent.ts` usa `families[0]`; debería usar la familia activa del contexto (el MCP ya es explícito: una llave por familia)
- [ ] Rewrite `tudominio.com/api/mcp` → `*.convex.site/mcp` cuando se defina el hosting del frontend (ejemplos listos en `docs/MCP.md`)
- [ ] Candidato futuro: tools de nutrición ("registra que comí X" → `nutritionMeals`)

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
