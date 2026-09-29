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

> Revisión 2026-09-29 (`docs/JOURNAL/REVIEW_2609.md`): ningún gate en rojo —
> install, typecheck, lint, tests y build pasan. Los items `REVIEW-*` de
> abajo vienen de esa revisión.

## Priority 2 — Siguiente

### REVIEW-AUTH: funciones públicas sin validación de sesión `added: 2026-09-29`

13 de 220 funciones públicas de `convex/` no validan sesión ni membresía
(la excepción documentada `getFamilyByInviteToken` no cuenta). Detalle y
evaluación por función en `docs/JOURNAL/REVIEW_2609.md` §4.

- [ ] `featureRequests.list` — expone todos los requests (con emails) sin auth y sin callers; proteger como admin o eliminar
- [ ] `files.generateUploadUrl` — minta URLs de upload sin sesión; agregar `sessionToken`
- [ ] `cloudinary.deleteImage` — sin sesión; agregar guardia al cablear credenciales (ver `REVIEW-CLOUDINARY`)
- [ ] `calendar/googleActions.ts` ×7 — actions públicas (`getGoogleAuthUrl`, `exchangeGoogleAuthCode`, `provisionKovanCalendar`, `fetchGoogleEventsAction`, `createGoogleEventAction`, `updateGoogleEventAction`, `deleteGoogleEventAction`); validar sesión o convertir a `internalAction` las que solo se llaman server-side
- [ ] `featureRequests.submit` — pública por diseño (modal en Landing); considerar rate-limit/captcha básico

### REVIEW-CLOUDINARY: `deleteImage` es un no-op silencioso `added: 2026-09-29`

`convex/cloudinary.ts:6-10` usa un `CLOUDINARY_CONFIG` hardcodeado con
strings vacíos — nunca lee `process.env.CLOUDINARY_*`. La action siempre
retorna `{ success: true, skipped: true }` y `useCloudinary` la llama al
reemplazar/borrar imágenes: los assets viejos se acumulan en Cloudinary.

- [ ] Leer `process.env.CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` en vez del objeto hardcodeado
- [ ] Agregar validación de sesión (ver `REVIEW-AUTH`)

> Criterio acordado para tools MCP: NO exponer — contenido de documentos
> de la bóveda, administración de familia (invitar/expulsar), ni borrados
> en general. Esas acciones se quedan en la app.

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

### REVIEW-DEADCODE: funciones y deps muertas `added: 2026-09-29`

- [ ] Eliminar `users.getCurrentUser` y `users.getOrCreateUser` (`convex/users.ts:14,29`) — usan `ctx.auth.getUserIdentity()` sin `auth.config.*`; identidad siempre `null`, sin callers en `src/`
- [ ] `featureRequests.list` (`convex/featureRequests.ts:35`) — sin callers; decidir entre borrarla o protegerla con admin (ver `REVIEW-AUTH`)
- [ ] Quitar dependencias sin un solo import: `ai`, `@ai-sdk/google`, `langchain`, `@langchain/core`, `@langchain/google-genai`, `matter-js`, `@types/react-router-dom` (v5 muerta — `react-router-dom` v7 trae sus tipos). El chunk `ai-vendor` de `vite.config.ts` queda obsoleto con ellas

### REVIEW-DEPS: dependencias y vulnerabilidades `added: 2026-09-29`

- [ ] `npm audit fix` — 31 vulns (1 critical, 17 high); la mayoría transitivas/dev-only o en deps muertas (langchain/langsmith)
- [ ] Actualizaciones menores seguras: `react-router-dom` → 7.18.x (advisories de XSS/open-redirect), `convex` → 1.46
- [ ] Evaluar majors: `vite` 8, `vitest` 5, `eslint` 10, `typescript` 7

### REVIEW-HEALTH: cobertura de typecheck en CI `added: 2026-09-29`

- [ ] `convex/` no lo typecheckea ningún gate: `tsc -b` solo cubre `tsconfig.app.json` + `tsconfig.node.json`. Agregar `npx tsc --noEmit -p convex/tsconfig.json` al CI (o un script `typecheck` en `package.json`)

### REVIEW-DOCS: correcciones de README `added: 2026-09-29`

- [ ] Stack: la IA del agente usa `@google/generative-ai`, no `@ai-sdk/google` + LangChain (esas deps están muertas — ver `REVIEW-DEADCODE`)
- [ ] Setup: aclarar que las vars de backend (`GEMINI_API_KEY`, `GOOGLE_CLIENT_*`, `CLOUDINARY_*`) van en Convex Dashboard, no en `.env.local` — `.env.example` ya quedó corregido en el PR de la revisión

### DOCS-NITS: Doc nits menores identificados en post-merge review `added: 2026-04-10`

Pequeños ajustes de documentación identificados durante la sesión de cierre de Phase 3 pero postergados para mantener el scope del PR #3 acotado.

- [ ] Agregar subsección "Phase 3.1 — Testing & CI infrastructure" al `CHANGELOG.md` documentando el PR #3 (vitest + smoke tests + GitHub Actions CI)
- [ ] Mencionar el split de `HighCardGame` en Board / Setup / `useHighCardGame` hook / constants en `src/components/activities/README.md` (commit `c8bb506`)

## Research & Ideas

_(vacío — sugerencias y exploraciones que no son todavía tareas accionables)_
