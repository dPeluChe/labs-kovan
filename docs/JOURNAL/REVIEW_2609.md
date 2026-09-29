# REVIEW 2609 — Estado de Kovan al incorporarse a Orbital

> Revisión de onboarding del repo `labs-kovan` (último commit en `main`:
> 2026-06-10). La ruta `docs/JOURNAL/` viene del brief de la tarea — el repo
> no tiene una convención `JOURNAL/` propia; se crea con este archivo.
> Toda afirmación tiene una cita `archivo:línea` o el comando que la produjo.
> Fecha de la revisión: 2026-09-29.

---

## 1. Qué es la app (según el código)

**Kovan** es una PWA de gestión familiar todo-en-uno: React 19 + Vite 7 +
TypeScript en el frontend, Convex (serverless, reactivo) como backend único,
Tailwind v4 + DaisyUI + Framer Motion en UI. Mobile-first con bottom
navigation.

### Rutas y páginas (`src/App.tsx`)

- Sin sesión: `/` (Landing) y `/login`; cualquier otra → redirect a `/`.
- Con sesión pero sin familia: `FamilySetupPage` a pantalla completa.
- Con familia: 32 rutas bajo `AppLayout` + wildcard → `/`.
- Code-splitting: `React.lazy` en las 31 páginas no críticas; solo `Login`,
  `Landing`, `FamilySetup` y `Dashboard` cargan eager (`src/App.tsx:9-13`).
- 35 archivos en `src/pages/`; todos están enrutados.

### Providers (`src/app/AppProviders.tsx:22-35`)

`ConvexProvider → ThemeProvider → AuthProvider → FamilyProvider →
ToastProvider → BrowserRouter` — coincide con lo documentado en el README.

### Capa de datos (`convex/`)

- 44 tablas en `convex/schema.ts`, todas las multi-tenant con índice
  `by_family`.
- 220 funciones públicas exportadas (`query`/`mutation`/`action`) + 5
  `internal*` (`apiTokens.validateApiToken`, `mintMcpSession`,
  `clearMcpSession`, `expenses/agent.ts` ×2).
- Módulos partidos en subcarpeta + barrel: `calendar`, `contacts`,
  `expenses`, `families`, `gifts`, `health`, `trips`, `vehicles`. Monolitos:
  `household`, `tasks`, `recipes`, `documents`, `diary`, `places`,
  `nutrition`, `petNutrition`, `collections`, `subscriptions`, `loans`,
  `users`, `admin`, `games`, `featureRequests`, `files`, `cloudinary`.
- UI ↔ Convex reactivo vía `useQuery`/`useMutation`/`useAction`, sin polling.

### Auth

- **Custom, no Convex Auth**: email + password con PBKDF2 (120k iteraciones,
  `convex/lib/auth.ts:40-63`), sesiones de 30 días guardadas por
  `tokenHash` SHA-256 (`convex/lib/auth.ts:76-90`). El token vive en
  `localStorage` (`src/contexts/AuthContext.tsx:33-60`).
- Guard central: `requireFamilyAccessFromSession` (`convex/lib/auth.ts:178`)
  valida sesión + membresía activa; las sesiones MCP quedan acotadas al
  `familyId` de su API key (`convex/lib/auth.ts:188-192`).
- **MCP** (`convex/http.ts`): `POST /mcp` JSON-RPC 2.0 stateless; toda
  request exige API key (`http.ts:88`, incluido `ping`); `GET /mcp` → 405
  (`http.ts:183`); notificaciones → 202; `tools/call` minta sesión efímera
  de 10 min acotada a la familia de la llave y la borra en `finally`
  (`http.ts:143-171`). API keys `kovan_` + 48 hex, solo hash en DB.
- **Agente interno** (`convex/agent.ts`): loop Gemini con 44 tools
  (`convex/lib/agent/index.ts` — el mismo registry que expone el MCP);
  fallback de modelo solo ante 429: `GEMINI_MODEL` → `GEMINI_FALLBACK_MODEL`.

### APIs externas que consume

| API | Uso | Dónde |
|---|---|---|
| Google Gemini (`@google/generative-ai`) | Agente interno | `convex/agent.ts:3` |
| Google Calendar (OAuth + Calendar API v3) | Sync de calendario | `convex/calendar/googleActions.ts`, `orchestration.ts` |
| Cloudinary (REST) | Uploads (unsigned preset, frontend) y borrado (action backend) | `src/lib/cloudinary.ts`, `convex/cloudinary.ts` |

### Variables de entorno (inventario mecánico)

Frontend (`import.meta.env` en `src/`):

| Var | Usada en | En `.env.example` |
|---|---|---|
| `VITE_CONVEX_URL` | `src/lib/convex.ts:4`, `src/components/mcp/McpConnectionGuide.tsx:12` | ✅ |
| `VITE_CLOUDINARY_CLOUD_NAME` | `src/lib/cloudinary.ts:5` | ✅ |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | `src/lib/cloudinary.ts:6` | ✅ |

Backend (`process.env` en `convex/`):

| Var | Usada en | En `.env.example` |
|---|---|---|
| `GEMINI_API_KEY` | `convex/agent.ts:31` | ✅ (pero ver §3: el README la manda a `.env.local`, donde no se lee) |
| `GEMINI_MODEL` | `convex/agent.ts:34` | ❌ → **agregada en este PR** |
| `GEMINI_FALLBACK_MODEL` | `convex/agent.ts:36` | ❌ → **agregada en este PR** |
| `GOOGLE_CLIENT_ID` | `convex/calendar/googleActions.ts:9,28,37`, `shared.ts:17,24` | ❌ → **agregada en este PR** |
| `GOOGLE_CLIENT_SECRET` | `convex/calendar/googleActions.ts:28,38`, `shared.ts:17,25` | ❌ → **agregada en este PR** |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | **Ningún `process.env` las lee** — `convex/cloudinary.ts:6-10` usa un objeto hardcodeado vacío | Documentadas pero el código las ignora (ver §4) |

### No determinado

- Sin `VITE_CONVEX_URL`/deployment real no se ejercitó el runtime de Convex,
  Gemini ni Google Calendar: la revisión de auth/APIs es análisis estático.
- No hay config de hosting del frontend (Vercel/Netlify) en el repo; el
  rewrite `tudominio.com/api/mcp` sigue pendiente (backlog MCP-MISC).

---

## 2. Salud del repo (comando exacto + resultado)

| Gate | Comando | Resultado |
|---|---|---|
| Install | `npm ci` | ✅ 357 paquetes en 14s. Reporta 31 vulnerabilidades (ver §4). |
| Typecheck (app+node) | `npx tsc -b` | ✅ exit 0. Cubre `tsconfig.app.json` (src/) y `tsconfig.node.json` (vite/vitest configs) vía `tsconfig.json` references — lo mismo que corre `npm run build`. |
| Typecheck (convex) | `npx tsc --noEmit -p convex/tsconfig.json` | ✅ exit 0. **Ningún gate lo corre**: ni `tsc -b` ni CI typecheckean `convex/` (schema, auth, MCP, tools del agente). Hueco de cobertura → backlog `REVIEW-HEALTH`. |
| Lint | `npm run lint` | ✅ exit 0, sin warnings. |
| Tests | `npm run test` | ✅ 9 archivos, 61 tests, 0 fallos (11.4s). |
| Build | `VITE_CONVEX_URL=https://example.convex.cloud npm run build` | ✅ exit 0 (~9s). Mismo placeholder que usa CI (`.github/workflows/ci.yml:44`). |
| react-doctor | `npx -y react-doctor@latest .` (versión resuelta: **0.9.14**) | ❌ **Score 48/100** — 513 issues: 15 errores, 498 warnings, 314 archivos; exit 1. Coincide con el baseline del brief. |
| Dependencias | `npm outdated` | exit 1 (su exit normal cuando hay outdated): 34 paquetes detrás de `wanted`/`latest` — salida verbatim completa en §4. |
| Auditoría | `npm audit` | 31 vulnerabilidades (1 critical, 17 high, 8 moderate, 5 low); `npm audit fix` las resuelve según el propio reporte. |

### react-doctor 0.9.14 — reglas top por conteo

| Count | Sev | Regla |
|---|---|---|
| 105 | ⚠ | `label-has-associated-control` |
| 93 | ⚠ | `control-has-associated-label` |
| 64 | ⚠ | `no-placeholder-only-field` |
| 27 | ⚠ | `no-static-element-interactions` |
| 26 | ⚠ | `click-events-have-key-events` |
| 23 | ⚠ | `async-await-in-loop` (mayoría en `convex/`) |
| 23 | ⚠ | `no-high-complexity-react-function` |
| 19 | ⚠ | `no-unowned-async-error-clear` |
| 15 | ⚠ | `no-transition-all` |
| 14 | ⚠ | `rerender-lazy-state-init` |
| 14 | ⚠ | `no-adjust-state-on-prop-change` |
| 10 | ⚠ | `no-array-index-as-key` |
| 9 | **✖** | `no-layout-property-animation` |
| 2 | **✖** | `effect-needs-cleanup` |
| 2 | **✖** | `react-router-no-navigate-in-render` (`src/pages/GiftEventDetailPage.tsx:144`, `HealthProfilePage.tsx:87`) |
| 1 | **✖** | `require-reduced-motion` |
| 1 | **✖** | `no-impure-state-updater` |

Distribución: Bugs 5e/62w · Performance 9e/69w · Accesibilidad 1e/337w ·
Mantenibilidad 27w · Seguridad 3w (`auth-token-in-web-storage`: token de
sesión en `localStorage`).

La remediación a 90 la maneja una tarea separada (`REVIEW-REACTDOCTOR`);
este PR no toca findings de React.

---

## 3. Docs vs código

| Doc | Afirmación | Código | Veredicto |
|---|---|---|---|
| `README.md` Stack | "IA: Google Gemini via `@ai-sdk/google` + LangChain" | Solo `convex/agent.ts:3` importa `@google/generative-ai`. `ai`, `@ai-sdk/google`, `langchain`, `@langchain/*` están instaladas pero **cero imports** en `src/`/`convex/` | ❌ Falso + deps muertas |
| `README.md` Stack | "React 19 + TypeScript + Vite", "React Router v7", "Tailwind v4 + DaisyUI", "Framer Motion", "Cloudinary" | `package.json`: react ^19.2.0, vite ^7.2.4, react-router-dom ^7.10.1, tailwindcss ^4.1.17, daisyui ^5.5.8, framer-motion ^12 | ✅ |
| `README.md` Setup | "Copia `.env.example` a `.env.local`… `GEMINI_API_KEY=…`" | `GEMINI_API_KEY` se lee con `process.env` en el backend (`convex/agent.ts:31`); ponerla en `.env.local` no hace nada (solo `VITE_*` se bundlean) | ⚠️ Engañoso: las vars de backend van en el Convex Dashboard |
| `.env.example` | Lista de vars necesarias | Faltaban `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (todas leídas en `convex/`); `CLOUDINARY_*` documentadas pero no leídas por el código | ❌ → faltantes corregidas en este PR; el gap Cloudinary va al backlog |
| `README.md` Scripts | 6 scripts documentados | Coinciden con `package.json:6-13` | ✅ |
| `README.md` Testing | Tests colocated `src/**/*.test.tsx` | 9 archivos: 6 colocated en `components/ui/`, 3 en `src/test/` (convención mixta, pero el patrón los cubre) | ✅ (con matiz) |
| `README.md` CI | "lint → test → build en cada push/PR a main" | `.github/workflows/ci.yml` exactamente eso, Node 22 | ✅ |
| `README.md` Arquitectura | Orden de providers, lazy loading, manualChunks, multi-tenancy `by_family` | `AppProviders.tsx`, `App.tsx`, `vite.config.ts:12-27`, `schema.ts` | ✅ |
| `README.md` Features | Tabla de 17 módulos | Todos existen en `convex/` + páginas enrutadas | ✅ |
| `README.md` Hogar | "18 tareas comunes" precargadas | `DEFAULT_ACTIVITIES` tiene 18 entradas (`convex/household.ts:9-26`) | ✅ |
| `docs/MCP.md` | Auth en toda request, 405 en GET, sesiones efímeras, isError, 44 tools | `convex/http.ts` + conteo de `ToolDefinition` = 44 | ✅ |
| `convex/README.md` | "Toda query/mutation de familia debe llamar `requireFamilyAccessFromSession`… salvo motivo documentado" | 14 funciones públicas sin sesión ni guardia (lista en §4); solo `getFamilyByInviteToken` tiene excepción documentada | ❌ Convención violada en 13 casos |
| `docs/TASK_TODO.md` | ACTIVITIES-CORE menciona carpetas `physics/`, `state/`, `ui/` "ya existen vacías como placeholders" | Las carpetas **no están en git** (git no commitea dirs vacíos); `shared/core/` sí tiene código real (`turnSystem/TurnManager.ts`, `PlayerManager.ts`) | ⚠️ Nota obsoleta; core sí existe |

---

## 4. Riesgos

### Seguridad

**Hallazgos buenos:** ningún secret commiteado (scan de literales
key/token/password: 0 hits), ningún `dangerouslySetInnerHTML`, `eval` ni
`innerHTML` en `src/`/`convex/`, hashing PBKDF2 correcto, API keys solo con
hash en DB, sesiones MCP acotadas por familia.

**Gaps de auth — escaneo exhaustivo de las 220 funciones públicas**
(guardias consideradas: `requireFamilyAccessFromSession`,
`requireUserFromSessionToken`, `getUserFromSessionToken`,
`requireFamilyMembership`, `assertActionFamilyAccess`, `validateApiToken`,
`ctx.auth.getUserIdentity`, `sessionToken`):

| Función | Evaluación |
|---|---|
| `convex/featureRequests.ts:35` `list` (query) | **Leak real**: devuelve todos los feature requests (incl. emails) sin auth. El propio código lo admite: `// Admin ONLY… In a real app, protect this with auth` + `// TODO: Add proper admin check`. Sin callers en `src/` |
| `convex/files.ts:3` `generateUploadUrl` (mutation) | Sin sesión: cualquiera minta URLs de upload de Convex Storage (abuso de storage). Usada por `ImageUpload` |
| `convex/cloudinary.ts:14` `deleteImage` (action) | Sin sesión; además rota (ver abajo). Si se cablean las credenciales queda como endpoint público de borrado de imágenes |
| `convex/featureRequests.ts:5` `submit` (mutation) | Pública **intencional** (la llama `FeatureRequestModal` en Landing, pre-auth). Spam-able: sin rate-limit ni captcha |
| `convex/users.ts:14` `getCurrentUser`, `:29` `getOrCreateUser` | Usan `ctx.auth.getUserIdentity()` pero **no existe `auth.config.*`** → identidad siempre `null`: la query siempre devuelve `null` y la mutation siempre throwea. Código muerto, sin callers |
| `convex/calendar/googleActions.ts` ×7 | `getGoogleAuthUrl:6`, `exchangeGoogleAuthCode:25`, `provisionKovanCalendar:60`, `fetchGoogleEventsAction:179`, `createGoogleEventAction:214`, `updateGoogleEventAction:260`, `deleteGoogleEventAction:307` — actions públicas sin `sessionToken` (la única guardada es `listGoogleCalendarsAction:115`). Las de CRUD solo se invocan server-side desde `orchestration.ts` (que sí valida), pero Convex las expone igual: actúan como proxy no autenticado hacia Google con el `client_secret` del servidor |
| `convex/families/queries.ts:31` `getFamilyByInviteToken` | Excepción documentada (pre-login) | ✅ OK |

Las demás 206 funciones públicas validan sesión (el patrón está bien
aplicado en lo nuevo; los gaps se concentran en código viejo).

**Otros:**

- `.gitignore` cubría `*.local` pero **no `.env` ni `.env.*`** → corregido
  en este PR (micro-fix).
- Token de sesión en `localStorage` (`auth-token-in-web-storage` ×3):
  aceptable para el modelo de amenaza actual; flaggeado por react-doctor,
  queda en la tarea `REVIEW-REACTDOCTOR`.
- `npm audit`: 31 vulns — notables: `langsmith` (SSRF + prototype
  pollution) y `@langchain/core` ("serialization injection enables secret
  extraction") — pero son **deps muertas** (ver abajo); `react-router`
  7.10.1 con múltiples advisories de XSS/open-redirect (mayoría
  SSR/RSC — Kovan es SPA, exposición baja pero real); `vite` con path
  traversal en dev server. Casi todas transitivas/dev-only; `npm audit fix`
  las resuelve.

### Código roto o muerto

- **`convex/cloudinary.ts` está roto**: `CLOUDINARY_CONFIG` hardcodeado con
  strings vacíos (`cloudinary.ts:6-10`) — nunca lee `process.env`, así que
  `deleteImage` siempre hace "skip" (`cloudinary.ts:21-26`) aunque devuelve
  `success: true`. `useCloudinary` la llama al reemplazar/borrar imágenes
  (`src/hooks/useCloudinary.ts:68,98`): **las imágenes viejas se acumulan
  en Cloudinary silenciosamente**. Fix en backlog `REVIEW-CLOUDINARY`.
- **`users.getCurrentUser` / `getOrCreateUser`**: muertos (ver tabla auth).
- **`featureRequests.list`**: muerta + sin guardia.
- **Dependencias instaladas sin un solo import**: `ai`, `@ai-sdk/google`,
  `langchain`, `@langchain/core`, `@langchain/google-genai`, `matter-js`,
  `@types/react-router-dom` (v5; `react-router-dom` v7 trae sus propios
  tipos y `tsconfig.app.json` pinea `types: ["vite/client","node"]`).
  El chunk `ai-vendor` de `vite.config.ts:23` queda vacío.
- **Agente toma `families[0]`** en vez de la familia activa
  (`convex/agent.ts:13`) — **ya trackeado** en `MCP-MISC`, no duplicar.

### Dependencias por detrás (`npm outdated`)

Salida verbatim completa de `npm outdated` (exit 1 — su código normal
cuando existen paquetes outdated), capturada el 2026-09-29 tras `npm ci`:

```
Package                       Current   Wanted   Latest  Location                                  Depended by
@ai-sdk/google                 2.0.46  2.0.100   4.0.85  node_modules/@ai-sdk/google               repo
@eslint/js                     9.39.2   9.39.5   10.0.1  node_modules/@eslint/js                   repo
@langchain/core                 1.1.5   1.2.13   1.2.13  node_modules/@langchain/core              repo
@langchain/google-genai         2.1.0    2.3.2    2.3.2  node_modules/@langchain/google-genai      repo
@tailwindcss/vite              4.1.18    4.3.3    4.3.3  node_modules/@tailwindcss/vite            repo
@testing-library/jest-dom       6.9.1    6.9.1    7.0.1  node_modules/@testing-library/jest-dom    repo
@testing-library/react         16.3.2   16.3.3   16.3.3  node_modules/@testing-library/react       repo
@testing-library/user-event    14.6.1   14.6.7   14.6.7  node_modules/@testing-library/user-event  repo
@types/node                   24.10.4  24.19.0   26.6.3  node_modules/@types/node                  repo
@types/react                   19.2.7   19.3.0   19.3.0  node_modules/@types/react                 repo
@types/react-dom               19.2.3   19.3.0   19.3.0  node_modules/@types/react-dom             repo
@vitejs/plugin-react            5.1.2    5.2.0    6.1.1  node_modules/@vitejs/plugin-react         repo
ai                            5.0.113  5.0.269  7.0.122  node_modules/ai                           repo
convex                         1.31.0   1.46.0   1.46.0  node_modules/convex                       repo
daisyui                        5.5.14   5.7.46   5.7.46  node_modules/daisyui                      repo
date-fns                        4.1.0    4.4.0    4.4.0  node_modules/date-fns                     repo
eslint                         9.39.2   9.39.5  10.11.0  node_modules/eslint                       repo
eslint-plugin-react-hooks       7.0.1    7.1.1    7.1.1  node_modules/eslint-plugin-react-hooks    repo
eslint-plugin-react-refresh    0.4.24   0.4.26    0.5.7  node_modules/eslint-plugin-react-refresh  repo
framer-motion                12.23.26  12.43.0   13.4.6  node_modules/framer-motion                repo
globals                        16.5.0   16.5.0   17.12.0  node_modules/globals                      repo
jsdom                          27.0.1   27.4.0   30.1.1  node_modules/jsdom                        repo
langchain                       1.2.0   1.5.14   1.5.14  node_modules/langchain                    repo
lucide-react                  0.556.0  0.556.0   1.48.0  node_modules/lucide-react                 repo
react                          19.2.3   19.3.0   19.3.0  node_modules/react                        repo
react-dom                      19.2.3   19.3.0   19.3.0  node_modules/react-dom                    repo
react-router-dom               7.10.1   7.18.4   7.18.4  node_modules/react-router-dom             repo
tailwindcss                    4.1.18    4.3.3    4.3.3  node_modules/tailwindcss                  repo
typescript                      5.9.3    5.9.3    7.0.2  node_modules/typescript                   repo
typescript-eslint              8.49.0   8.71.0   8.71.0  node_modules/typescript-eslint            repo
uuid                           13.0.0   13.0.2   14.0.2  node_modules/uuid                         repo
vite                            7.2.7    7.3.6    8.3.1  node_modules/vite                         repo
vitest                          3.2.4    3.2.7    5.0.2  node_modules/vitest                       repo
zod                            4.1.13    4.6.5    4.6.5  node_modules/zod                          repo
```

Interpretación (extracto de los más relevantes):

| Paquete | Actual | Latest | Nota |
|---|---|---|---|
| `convex` | 1.31.0 | 1.46.0 | 15 minors atrás |
| `ai` | 5.0.113 | 7.0.122 | 2 majors; **muerta** |
| `vite` | 7.2.7 | 8.3.1 | 1 major |
| `vitest` | 3.2.4 | 5.0.2 | 2 majors |
| `typescript` | 5.9.3 | 7.0.2 | pineada `~5.9` |
| `eslint` | 9.39.2 | 10.11.0 | 1 major |
| `lucide-react` | 0.556.0 | 1.48.0 | |
| `react-router-dom` | 7.10.1 | 7.18.4 | advisories activos |
| `@tailwindcss/vite`, `tailwindcss` | 4.1.18 | 4.3.3 | |

El resto del stack core (react 19.2.x, framer-motion 12, zod 4, convex
client) está razonablemente al día.

---

## 5. Plan de follow-up

Orden acordado por el brief: blockers (gates rojos) → react-doctor → resto.
**No hay gates rojos**: install, typecheck, lint, tests y build pasan;
react-doctor es el único gate "rojo" por score.

Items creados en `docs/TASK_TODO.md` (todos `added: 2026-09-29`):

1. `REVIEW-REACTDOCTOR` — subir el score 48 → 90 (tarea separada; incluye
   los 15 errores: navigate-in-render ×2, layout-property-animation ×9,
   effect-needs-cleanup ×2, no-impure-state-updater, require-reduced-motion).
2. `REVIEW-AUTH` — cerrar los 13 gaps de auth enumerados en §4.
3. `REVIEW-CLOUDINARY` — cablear `process.env.CLOUDINARY_*` en
   `deleteImage` + guardia de sesión (hoy la action es un no-op silencioso).
4. `REVIEW-DEADCODE` — borrar `users.getCurrentUser`/`getOrCreateUser`,
   decidir `featureRequests.list` (guardarla como admin o eliminarla).
5. `REVIEW-DEPS` — quitar deps muertas (`ai`, `@ai-sdk/google`,
   `langchain`, `@langchain/*`, `matter-js`, `@types/react-router-dom`),
   `npm audit fix`, y evaluar majors (`convex`, `vitest`, `vite`).
6. `REVIEW-HEALTH` — typecheck de `convex/` en CI (hoy ningún gate lo cubre).
7. `REVIEW-DOCS` — README: corregir línea del stack de IA y aclarar que las
   vars de backend van en el Convex Dashboard, no en `.env.local`.
