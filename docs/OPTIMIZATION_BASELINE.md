# Línea base de optimización — Kovan

Auditoría de performance/calidad pedida por Antonio (2026-10-07), medida el
2026-10-14. Solo documenta hallazgos — las correcciones viven como items
`OPT-00N` en [`TASK_TODO.md`](./TASK_TODO.md).

## Método

- **react-doctor**: `npm run doctor` (score remoto), `doctor.config.json` con la
  única supresión aceptada (`auth-token-in-web-storage` en `AuthContext.tsx`,
  auth en hold — no cuenta contra "no suppressions").
- **Lighthouse**: `orbital-lighthouse <url> --runs 5 --form-factor mobile|desktop`
  contra el build de producción (`npm run build` con `VITE_CONVEX_URL`
  placeholder + `vite preview --port 4100`). Una pasada de calentamiento por
  URL descartada como cold start; los números son la mediana de 5 corridas.
- **Convex**: revisión manual de `convex/` (`.collect()`, `.filter()`,
  `Promise.all(map(ctx.db...))`, índices de `schema.ts`).

### Alcance medible

La app es una SPA donde todas las rutas salvo `/` (landing) y `/login`
requieren sesión contra un backend Convex real; el router redirige a `/`
cualquier URL si no hay usuario (`src/App.tsx:74-81`). Sin un deployment
sembrado no hay forma de autenticarse en el preview local, así que solo esas
dos páginas públicas son medibles. Medir páginas autenticadas (solo cuentan
a11y y best-practices, con `noindex`) queda en `OPT-013`.

## Scores

### react-doctor

**91 / 100** — 23 warnings, 0 errores. El gate exige ≥ 90 (`doctor:check`):
hay margen de 1 punto, cualquier regresión lo rompe.

| Regla | Count | Archivos |
| --- | --- | --- |
| `no-high-complexity-react-function` | 19 | `DocumentFormModal`, `ExpensesView`, `PlanEditor`, `PlacesLayout`, `PlaceDetailModal`, `SubscriptionDetailModal`, `CreateTaskModal`, `TripPlanDetailModal`, `TripFinancesTab`, `TripOverviewTab`, `ImageUploader`, `DashboardPage`, `FamilyPage`, `GiftsPage`, `HealthProfilePage`, `HouseholdPage`, `NutritionPage`, `PetProfilePage`, `TripDetailPage` |
| `no-giant-component` | 3 | `SubscriptionDetailModal.tsx:36`, `DashboardPage.tsx:14`, `HouseholdPage.tsx:31` |
| `html-no-nested-interactive` | 1 | `src/utils/a11y.test.tsx:10` — fixture deliberado (testea que un control anidado no dispare el padre); mantener o suprimir localmente |

### Lighthouse (mediana de 5 corridas, build de producción local)

Baseline (2026-10-14, antes de OPT-001/002): a11y **86** (`/`), **85**
(`/login`); SEO **91-92**. Post-fix, re-medido el mismo día:

| Página | Form | Perf | A11y | Best practices | SEO |
| --- | --- | --- | --- | --- | --- |
| `/` (Landing) | mobile | 76 | **100** | 100 | **100** |
| `/` (Landing) | desktop | 100 | **100** | 100 | **100** |
| `/login` | mobile | 95 | **100** | 100 | **100** |

Targets: SEO/a11y/best-practices ≥ 90 y perf mobile ≥ 80. Todas las
categorías no-perf cumplen ya; a11y cerró la brecha (85-86 → 100). Perf
mobile osciló 67-76 en esta pasada (cold start / varianza del entorno; el
baseline midió 94) — sigue siendo `OPT-007` el item que lo ataca.

Baseline de bundle (path crítico, gzip): `react-vendor` 232 kB (74 kB gz),
`vendor` 155 kB (43 kB gz), `index` 71 kB (19 kB gz), `ui-vendor` 68 kB
(24 kB gz), `utils-vendor` 68 kB (19 kB gz), CSS 194 kB (30 kB gz).

## Hallazgos ordenados por impacto

### 1. Accesibilidad — ✅ resuelto en OPT-001 (85-86 → 100)

| Audit | Detalle | Dónde |
| --- | --- | --- |
| `meta-viewport` | `user-scalable=no` + `maximum-scale=1.0` bloquean zoom — falla a11y en todas las páginas | `index.html:7` |
| `color-contrast` | `text-faint` en labels de quarter | `src/components/landing/Roadmap.tsx:77` |
| `color-contrast` | `text-base-content/50` hardcodeado en footer (además viola la regla 1 del design system — debe ser `text-subtle`/token) | `src/components/landing/Footer.tsx:15,18` |
| `color-contrast` | badge `text-amber-600` sobre `bg-amber-100` | `src/components/landing/AboutKovan.tsx:43` |
| `color-contrast` | labels del form con `opacity-70` | `src/pages/LoginPage.tsx:165,182,197` |
| `heading-order` | steps usan `<h4>` saltando niveles tras `<h2>` | `src/components/landing/InstallPWA.tsx:62,69,80,94,101,112` |
| `landmark-one-main` | Login no tiene landmark `<main>` (todo el layout son `div`) | `src/pages/LoginPage.tsx:122-153` |

Todos son fixes chicos de markup/token — juntos cierran la brecha de a11y.
Resueltos en OPT-001 (2026-10-14): `text-muted` en vez de `text-subtle` en
footer/roadmap (50% sigue bajo 4.5:1; 60% → ~4.6:1 pasa), `text-amber-800`
en el badge, `opacity-70` removido de los labels, steps a `<h3>` y LoginPage
dentro de `<main>`.

### 2. SEO (91-92 → 100) — ✅ resuelto en OPT-002

- **`robots.txt` "no válido"**: ~~no existe `public/robots.txt`~~ resuelto —
  `public/robots.txt` creado con `Disallow` por prefijo de las rutas
  autenticadas (una app-route listada por línea; `/`, `/login` y `/assets/*`
  quedan crawlables) + `public/sitemap.xml` con la URL de la landing.
- **OG/canonical**: `og:url`/`twitter:url` apuntan a `https://kovan.labs/`
  (verificar que sea el dominio real al definir hosting) — `og:image`/
  `twitter:image` ya usan `https://kovan.labs/og-preview.png` absoluto
  (resuelto en OPT-002).

### 3. Performance (mobile 94-95, ya sobre target pero con margen a recuperar)

- **JS sin usar ~62-63 KiB en landing**: `react-vendor` desperdicia ~37 KiB y
  `vendor` ~27 KiB. El `manualChunks` de `vite.config.ts:12-24` mete todo
  `node_modules` que no es react/framer/convex en un solo `vendor` — incluye
  deps que solo usan páginas lazy (`qrcode.react` + `react-barcode` solo los
  importa `SubscriptionDetailModal.tsx`). Como un módulo eager ya necesita
  `vendor`, el chunk completo se descarga en el path crítico. Relacionado:
  `BUNDLE-SMOKE` (este mismo `manualChunks` ya produjo un ciclo de chunks en
  PR #19).
- **CSS render-blocking 194 kB** (30 kB gz): DaisyUI completo; opciones a
  medir — purge/extracción crítica. Ahorro estimado por Lighthouse ~150 ms.
- FCP 2.3-2.4 s / LCP 2.4-2.5 s en mobile (scores 0.72-0.92): mejoran con el
  punto anterior; no hace falta obra mayor.
- `LazyMotion` importa `domAnimation` estáticamente en `src/main.tsx` — el
  feature bundle entra al chunk eager; evaluar `LazyMotion` con carga async
  de features si se busca recortar `ui-vendor`.

### 4. Acceso a datos (Convex)

#### 4.1 Full-table scans — filtros sin `withIndex` (impacto alto: leen la tabla `expenses` completa, de todas las familias)

| Ubicación | Qué hace | Fix |
| --- | --- | --- |
| `convex/vehicles/events.ts:90-93` | `deleteVehicleEvent` busca gastos con `.filter(q.eq(q.field("vehicleEventId"), id))` sin índice | Agregar índice `by_vehicle_event` a `expenses` (el campo existe, `schema.ts:330`; los índices actuales están en `schema.ts:342-348`) y usar `withIndex` |
| `convex/gifts/items.ts:148-151` | Al marcar item `bought` busca gasto duplicado con `.filter(q.eq(q.field("giftItemId"), id))` sin índice | Ídem con `by_gift_item` (campo en `schema.ts:332`) |

#### 4.2 Filtros en JS sobre campos que ya tienen índice — ✅ resuelto en OPT-004 (2026-10-14)

| Ubicación | Hoy | Debería |
| --- | --- | --- |
| `convex/expenses/queries.ts:98-103` (`getExpensesByMonth`) | `by_family` + `collect()` de TODOS los gastos y filtra el mes en JS | `by_family_date` (`schema.ts:343`) con `.gte("date", start).lte("date", end)` |
| `convex/expenses/queries.ts:114-119` (`getExpenseSummary`) | igual: todos los gastos de la familia para sumar el mes | `by_family_date` con `.gte("date", startOfMonth)` |
| `convex/expenses/agent.ts:18-20` (tool del agente) | mismo patrón de "mes en JS" | `by_family_date` + rango |
| `convex/calendar/queriesMutations.ts:101-114` (`getCachedEvents`) | `by_family_start` solo para ordenar; startDate/endDate en JS | `.gte`/`.lte("startDateTime", …)` en el mismo índice |
| `convex/calendar/queriesMutations.ts:123-132` (`getUpcomingEvents`) | collect de todos los eventos + `filter(>= now)` + `slice(limit)` | `.gte("startDateTime", now)` + `.take(limit)` |
| `convex/tasks.ts:16-28` (`list`) | `by_family` + filtros JS por `status`/`type` | `by_family_status` / `by_family_type` ya existen (`schema.ts:606-607`) |
| `convex/documents.ts:15-25` (`list`) | `by_family` + filtro JS por `personId` | `by_person` ya existe (`schema.ts:583`) |
| `convex/household.ts:172-179` (`getUserWeeklyStats`) | collect de TODOS los logs del usuario (histórico completo) + filtro de semana en JS | `by_family_date` con `.gte("date", weekStart)` + filtro JS por `userId` (acotado a la semana, sin índice nuevo) |
| `convex/vehicles/summary.ts:50-57` | todos los expenses tipo `vehicle` de la familia + filtro de mes en JS | `by_family_date` + filtro JS por `type` (acotado al mes) |

#### 4.3 N+1 (queries por elemento dentro de `Promise.all(map(...))`)

| Ubicación | Patrón | Fix sugerido |
| --- | --- | --- |
| `convex/household.ts:73-89` (`getRecentLogs`) | feed reactivo: hasta 50 logs × 3 `ctx.db.get` (activity, user, loggedBy) ≈ 150 lecturas puntuales por refresh | deduplicar ids y resolver una vez por id |
| `convex/gifts/summary.ts:24-31` y `:61-80`, `convex/gifts/items.ts:21-34` | una query de `giftItems` por recipient | `giftItems` ya tiene `by_event` (`schema.ts:113`): un solo collect por evento + agrupar en memoria |
| `convex/health/summary.ts:37-48` | 2 queries por perfil (records + meds), cada una sin acotar | índice `by_person_date` en `medicalRecords` + rango de 30 días (meds son pocas) |
| `convex/places.ts:242-249` (`getAllVisits`) | `take(50)` bien, pero un `ctx.db.get(placeId)` por visita | deduplicar `placeId`s |
| `convex/places.ts:24-33` (`getLists`) | collect de todos los `places` de la familia solo para contarlos por lista | mantener un `count` desnormalizado o aceptar hasta crecer (comentado en el propio código) |
| `convex/nutrition.ts:158-163`, `convex/families/queries.ts:69-84` | `ctx.db.get` por assignment/membership | n chico (miembros/planes de una familia) — baja prioridad |

#### 4.4 Lecturas sin límite que crecen con el tiempo (continúa `PERF-COLLECT`)

94 `.collect()` vs 9 `.take()`/`.paginate()` en `convex/`. Los casos que más
crecen:

- `convex/diary.ts:13-26` (`getEntries`) — todas las entradas de la familia,
  histórico completo, e incluye las `private` de otros miembros antes del
  filtro en memoria. `by_family_date` ya permite acotar por fecha/paginar.
- `convex/admin.ts:24-28` (`getStats`) — 3 collects full-table
  (`families`/`users`/`familyInvites`). Solo corre para `isSuperAdmin` desde
  `AdminDashboardPage` — aceptable hoy, documentado.
- Listas por familia sin `take`: `places.ts:127-130`, `recipes.ts:17-20`,
  `collections.ts`, `loans.ts`, `subscriptions.ts`, `contacts/queries.ts`,
  `health/*`. Hoy es volumen familiar chico; poner `take(n)` donde la UI
  solo muestra los primeros N.

#### 4.5 Amplificación de escrituras

- `convex/calendar/queriesMutations.ts:156-170` (`syncCalendarEvents`) —
  borra TODOS los eventos cacheados y los reinserta en cada sync (aunque no
  cambiara nada): invalida queries reactivas y duplica escrituras. Diff por
  `externalId` antes de escribir.

### 5. Splits y limpieza

Archivos >~300 líneas o con UI+datos+lógica mezclados:

| Archivo | Líneas | Nota |
| --- | --- | --- |
| `src/pages/DashboardPage.tsx` | 427 | giant + complexity; mezcla N `useQuery`, agregación y layout |
| `src/pages/CalendarPage.tsx` | 404 | página + lógica de calendario inline |
| `convex/household.ts` | 396 | monolito; `convex/README.md` manda split+barrel al crecer |
| `src/pages/HouseholdPage.tsx` | 346 | giant + complexity |
| `convex/nutrition.ts` | 346 | monolito (además con `any` en helpers — ver `TYPES-ANY`) |
| `src/components/subscriptions/SubscriptionDetailModal.tsx` | 344 | giant + complexity; único consumidor de `qrcode.react`/`react-barcode` |
| `convex/calendar/googleActions.ts` | 331 | actions de Google (auth pendiente en `REVIEW-AUTH`, fuera de scope aquí) |
| `convex/places.ts` | 319 | monolito, incluye los N+1 de §4.3 |
| `src/pages/RecipesPage.tsx` | 305 | página + formulario + listado |
| `src/components/activities/shared/core/turnSystem/TurnManager.ts` | 305 | módulo de lógica — aceptable, revisar solo si crece |
| `src/components/gifts/RecipientCard.tsx` | 302 | card con lógica de estado |
| `convex/schema.ts` | 756 | registro único de tablas; convención Convex lo mantiene en un archivo — no partir |

Además los 19 `no-high-complexity-react-function` de §react-doctor (lista en
`REACTDOCTOR-2`).

Dead code/deps confirmados en esta pasada (ya trackeados):
`users.getCurrentUser`/`getOrCreateUser` (`convex/users.ts:14,29`) y
`featureRequests.list` (`convex/featureRequests.ts:35`) sin callers — ver
`REVIEW-DEADCODE`; `npm audit` dev + bumps — ver `REVIEW-DEPS`.

### 6. Gates/tooling

- `convex/` no lo typecheckea ningún gate (`REVIEW-HEALTH`) — conviene antes
  de tocar schema/queries en los items OPT.
- `BUNDLE-SMOKE` — el script post-build que importa chunks hubiera detectado
  tanto el ciclo de PR #19 como el bloat del `vendor` catch-all (§3).

## Mapeo a tareas (ver `TASK_TODO.md`)

| Orden | Item | Cubre |
| --- | --- | --- |
| 1 | ~~`OPT-001` a11y: viewport, contraste, headings, landmark~~ ✅ 2026-10-14 | §1 completo |
| 2 | ~~`OPT-002` SEO: robots.txt, og absoluto~~ ✅ 2026-10-14 | §2 |
| 3 | `OPT-003` Convex: índices `by_vehicle_event`/`by_gift_item` | §4.1 |
| 4 | ~~`OPT-004` Convex: rangos sobre índices existentes~~ ✅ 2026-10-14 | §4.2 |
| 5 | `OPT-005` Convex: batching de N+1 | §4.3 |
| 6 | `OPT-006` collects sin límite | §4.4 (absorbe `PERF-COLLECT`) |
| 7 | `OPT-007` manualChunks / vendor eager | §3 (absorbe `BUNDLE-SMOKE`) |
| 8 | `OPT-008` splits frontend | §5 + `REACTDOCTOR-2` |
| 9 | `OPT-009` splits backend monolitos | §5 |
| 10 | `OPT-010` Lighthouse en páginas autenticadas | §Alcance |
| — | `REVIEW-HEALTH`, `REVIEW-DEADCODE`, `REVIEW-DEPS`, `TYPES-ANY` | siguen bajo su clave dentro del plan |

## Out of scope findings (seguridad — solo se listan)

Ya trackeados, no se planea fix aquí:

- `REVIEW-AUTH`: `featureRequests.list` expone requests con emails sin auth;
  `files.generateUploadUrl` minta URLs sin sesión; `cloudinary.deleteImage`
  y las 7 `calendar/googleActions` son públicas.
- `REVIEW-CLOUDINARY`: `deleteImage` es no-op silencioso (config hardcodeada
  vacía) — `success` no prueba borrado.
- `AUTH-SAMESITE`: token en `localStorage` (riesgo aceptado, supresión de
  react-doctor documentada).

Nuevo en esta pasada (informativo, no es fuga): las queries que leen datos de
la familia y filtran en memoria (`diary.getEntries` incluye entradas
`private` de otros miembros en el set leído) amplifican lectura pero el
filtro ocurre server-side antes de responder — no llegan al cliente. Se
cubre como read amplification en §4.4, no como problema de seguridad.
