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
>
> Segunda pasada 2026-09-30: `main` en `04a4003` (PR #19 ciclo de chunks, PR #20 react-doctor 91).
> Orden sugerido: `REVIEW-AUTH` + `REVIEW-CLOUDINARY` (seguridad), `REVIEW-DEADCODE`
> → `REVIEW-DEPS` (limpian el audit), `REVIEW-HEALTH` + `BUNDLE-SMOKE` (gates), y luego
> `PERF-COLLECT`, `TEST-COVERAGE`, `TYPES-ANY`, `REACTDOCTOR-2`.

## Priority 2 — Siguiente

### REVIEW-AUTH: funciones públicas sin validación de sesión `added: 2026-09-29`

13 de 220 funciones públicas de `convex/` no validan sesión ni membresía
(la excepción documentada `getFamilyByInviteToken` no cuenta). Detalle y
evaluación por función en `docs/JOURNAL/REVIEW_2609.md` §4.

- [ ] `featureRequests.list` — expone todos los requests (con emails) sin auth y sin callers; proteger como admin o eliminar
- [ ] `files.generateUploadUrl` — minta URLs de upload sin sesión; agregar `sessionToken` (único caller: `src/components/ui/ImageUpload.tsx:15`, hay que pasarlo ahí)
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

> Motivación: todos los juegos nuevos por turnos deberían consumir este core en vez de reimplementar lógica de estado, historial y física.

## Priority 3 — Backlog

### REVIEW-DEADCODE: funciones y deps muertas `added: 2026-09-29`

- [ ] Eliminar `users.getCurrentUser` y `users.getOrCreateUser` (`convex/users.ts:14,29`) — usan `ctx.auth.getUserIdentity()` sin `auth.config.*`; identidad siempre `null`, sin callers en `src/`
- [ ] `featureRequests.list` (`convex/featureRequests.ts:35`) — sin callers; decidir entre borrarla o protegerla con admin (ver `REVIEW-AUTH`)

### REVIEW-DEPS: dependencias y vulnerabilidades `added: 2026-09-29`

Revisión 2026-09-30: `npm audit --omit=dev` tenía 14 vulns, casi todas de la cadena `langchain` → `langgraph` → `uuid` (deps muertas). Quitadas las deps y subido `react-router-dom` a 7.18: producción en 0 vulns. Quedan 19 en devDependencies.

- [ ] `npm audit fix` para lo que quede en devDependencies (19 vulns, 1 crítica; revisar cuál paquete)
- [ ] Bump seguro dentro de rango (`npm update`), un PR con los 4 gates: `react` / `react-dom` 19.3, `convex` 1.46, `vite` 7.3, `vitest` 3.2, `tailwindcss` + `@tailwindcss/vite` 4.3, `daisyui` 5.7, `framer-motion` 12.43, `date-fns` 4.4, `typescript-eslint` 8.71
- [ ] Majors, uno por PR y solo con motivo: `vite` 8 + `@vitejs/plugin-react` 6, `vitest` 5, `eslint` 10, `typescript` 7, `lucide-react` 1.x (revisar iconos renombrados; 121 archivos lo importan), `framer-motion` 13
- [ ] Fijar versión de Node: no hay `engines` ni `.nvmrc`; CI usa 22.x y con Node 26 local fallan 3 tests de `AuthContext` (`localStorage` no existe en jsdom). Agregar `.nvmrc` y `engines`

### AUTH-SAMESITE: sesión en cookie HttpOnly de primera parte `added: 2026-09-29`

El token sigue en `localStorage` (riesgo aceptado, regla de react-doctor ignorada en `doctor.config.json`). Una cookie emitida por `*.convex.site` es de terceros y Safari/Firefox estricto la bloquean, así que se descartó (PR #12, commit `ed858ca`).

- [ ] Cuando el dominio del frontend sea el oficial: rewrite de hosting `/api/*` → `*.convex.site` (mismo rewrite que `MCP-MISC`), cookie `SameSite=Lax` y cliente con rutas relativas. Retomar `ed858ca` como base

### BUNDLE-SMOKE: un ciclo entre chunks rompió la app sin que ningún gate lo viera `added: 2026-09-30`

`scheduler` caía en `vendor` y `react-vendor` <-> `vendor` se importaban entre sí; la app no cargaba en el navegador con lint, test y build en verde (arreglado en PR #19). Falta el gate que lo habría detectado.

- [ ] Script de CI post-build que importe cada chunk de `dist/assets/*vendor*.js` en Node y falle si alguno lanza (con el build viejo reproduce exactamente `Cannot set properties of undefined (setting 'Activity')`), o detecte ciclos entre chunks
- [ ] Alternativa más simple: quitar `manualChunks` y dejar que Vite decida; medir el tamaño antes de aceptar

### PERF-COLLECT: lecturas sin límite en Convex `added: 2026-09-30`

94 usos de `.collect()` contra 9 de `.take()`/`.paginate()` en `convex/`; 122 `withIndex` (bien indexado, pero sin acotar). Hoy es una app familiar pequeña, pero las tablas que crecen sin techo van a degradar las queries reactivas.

- [ ] Auditar las tablas que crecen con el tiempo: `expenses` (`expenses/queries.ts`, 6 collects), `places` (8), `nutrition` (5), actividad de `household`, `gifts/summary`, agentConversations. Poner `take(n)`/paginación o un rango de fechas
- [ ] `convex/admin.ts` (4 collects): confirmar que solo corre bajo demanda

### TEST-COVERAGE: `convex/` sin tests `added: 2026-09-30`

11 archivos de test sobre ~37k líneas; ninguno cubre `convex/` (auth, MCP, tools del agente, fuzzy match) y ahí está el riesgo (aislamiento entre familias).

- [ ] Tests unitarios de lo puro: `lib/agent/fuzzyMatch.ts`, `lib/agent/dates.ts`, `lib/mcp/protocol.ts`
- [ ] Evaluar `convex-test` para `requireFamilyAccessFromSession` (sesión de otra familia, sesión MCP acotada) y `apiTokens`

### TYPES-ANY: `any` y supresiones en `convex/*/access.ts` `added: 2026-09-30`

23 `any` y 23 `eslint-disable`/`@ts-*` en `src/` + `convex/`, concentrados en `health/access.ts`, `trips/access.ts`, `gifts/access.ts`, `vehicles/access.ts` (guardas de acceso, la parte más sensible).

- [ ] Tipar las guardas con `QueryCtx | MutationCtx` y `Id<"...">` y quitar los `any`
- [ ] 16 `console.log/debug` en `src`/`convex`: revisar y quitar los de depuración

### REACTDOCTOR-2: 23 warnings restantes `added: 2026-09-30`

- [ ] `no-high-complexity-react-function` ×19, `no-giant-component` ×3 (partir componentes; candidatos: `DashboardPage` 427 líneas, `CalendarPage` 404, `HouseholdPage` 346, `SubscriptionDetailModal` 344). El gate exige score ≥ 90, hoy 91: cualquier regresión lo rompe

### REVIEW-HEALTH: cobertura de typecheck en CI `added: 2026-09-29`

- [ ] `convex/` no lo typecheckea ningún gate: `tsc -b` solo cubre `tsconfig.app.json` + `tsconfig.node.json`. Agregar `npx tsc --noEmit -p convex/tsconfig.json` al CI (o un script `typecheck` en `package.json`)

### DOCS-NITS: Doc nits menores identificados en post-merge review `added: 2026-04-10`

Pequeños ajustes de documentación identificados durante la sesión de cierre de Phase 3 pero postergados para mantener el scope del PR #3 acotado.

- [ ] Agregar subsección "Phase 3.1 — Testing & CI infrastructure" al `CHANGELOG.md` documentando el PR #3 (vitest + smoke tests + GitHub Actions CI)
- [ ] Mencionar el split de `HighCardGame` en Board / Setup / `useHighCardGame` hook / constants en `src/components/activities/README.md` (commit `c8bb506`)

## Research & Ideas

_(vacío — sugerencias y exploraciones que no son todavía tareas accionables)_
