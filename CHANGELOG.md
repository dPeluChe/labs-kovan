# Changelog

## [Phase 3 - Household + Design System + Refactors] - 2026-04-10

Gran ronda que integra la feature de gamificación del hogar, un design
system unificado de extremo a extremo y un refactor estructural mayor
tanto del backend (Convex) como del frontend (páginas grandes partidas
en componentes reutilizables). Se cerraron dos PRs grandes: **#1**
(household + design system base) y **#2** (design system followup +
hardening de household).

### 🏠 Nueva feature: Gamificación del hogar (`/household`)

- Módulo completo para registrar y gamificar tareas del día a día
  (lavar platos, cocinar, ir al super…) con puntos asociados.
- **Auto-seed** de 18 actividades predeterminadas en la primera visita
  de cada familia, totalmente personalizables (crear, editar puntos,
  desactivar, eliminar). Soft delete vía `isActive: false` preserva el
  historial de logs.
- Cualquier miembro puede registrar una actividad **para sí mismo o
  para otro** miembro; el log guarda tanto `userId` (quién la hizo)
  como `loggedBy` (quién la registró).
- Tres tabs: **Actividades** (grid agrupado por categoría),
  **Registro** (feed en tiempo real con borrado) y **Ranking** (podio
  semanal animado con Framer Motion).
- Ranking semanal (lunes→domingo) con podio 1º/2º/3º, lista completa
  y resumen semanal de puntos y actividades totales.
- Backend: `convex/household.ts` + schema. Frontend:
  `src/pages/HouseholdPage.tsx` + `src/components/household/*`.

### 🔐 Seguridad y Autorización (extensión)

- **Hardening de household**: `convex/household.ts` ahora exige
  `sessionToken` en todas sus queries y mutations, deriva
  `createdBy`/`loggedBy` del usuario de sesión (no del cliente) y
  verifica que cualquier `userId` destino de `logActivity` sea miembro
  activo de la misma familia antes de permitir el log. Cierra una
  brecha de impersonación que quedó abierta cuando el módulo aterrizó
  en el PR #1.
- Módulo `places` migrado a autorización por sesión y acceso familiar
  estricto (continúa el trabajo de Phase 2).

### ⚡ Performance y arquitectura

- **Lazy loading completo** de páginas no críticas con `React.lazy()` +
  `<Suspense>`. Entry bundle inicial: **~18.5 kB gzipped**. Cada página
  se sirve como su propio chunk (3-10 kB gzip).
- **Composición de providers** extraída a `src/app/AppProviders.tsx`
  para mantener `App.tsx` enfocado en routing.
- **Manual chunking** de vendors en `vite.config.ts` (`react-vendor`,
  `ui-vendor`, `utils-vendor`, `ai-vendor`, `vendor`) para un grafo
  óptimo en el navegador.

### 🎨 Design system unificado

#### Tokens semánticos (`src/index.css`)

- **Jerarquía de texto**: `text-strong` / `text-body` / `text-muted` /
  `text-subtle` / `text-faint` — reemplaza **274 instancias hardcoded**
  de `text-base-content/{40,50,60,70}` en ~85 archivos.
- **Superficies**: `surface-card` / `surface-muted` / `surface-row` /
  `sticky-header`.

#### 9 primitivos compartidos (`src/components/ui/`)

- **`StickyHeader`** — header top-level con título + acción + tabs
  (sticky con blur y safe-area).
- **`DetailHeader`** — header de página de detalle con botón back,
  slots (subtitle, badge, action, description, tabs, banner).
- **`SectionTitle`** — h3 semántico con icono opcional y slot de acción
  (reemplaza 50+ headings inline).
- **`CircleAddButton`** — el "+" estándar para agregar desde el header.
- **`IconBadge`** — container coloreado con icono (reemplaza 24+
  instancias inline en MorePage y otros).
- **`ContextMenu`** — dropdown "⋮" con array de items tipado, soporta
  `variant: "danger"`, `hidden`, alineación custom.
- **`Timeline`** + **`TimelineItem`** — timeline vertical con dot y
  línea conectora, acepta emoji/icono custom como dot.
- **`Avatar`** — foto con fallback a iniciales (ya existía, ahora
  adoptado en household, nutrition y family en vez de reimplementarlo
  inline).

#### Registry de colores de módulos (`src/lib/moduleColors.ts`)

- Single source of truth para los 21 colores por feature
  (Finanzas=emerald, Hogar=yellow, Agente=purple, etc.).
- Uso: `moduleColor("finances")` devuelve el string `bg-<color>/10 text-<color>-600`.
- Elimina strings de color hardcoded en `MorePage`, `BottomNav`,
  `HealthProfilePage`, `PetProfilePage`.

#### Cobertura post-followup (PR #2)

El 100% de las páginas de app usa uno de los headers unificados
(`PageHeader` / `StickyHeader` / `DetailHeader`). Las excepciones
(Login, Landing, FamilySetup, AgentPage) tienen layouts
intencionalmente distintos.

### 🧩 Refactor estructural de Convex (9 módulos partidos)

Cada módulo monolítico grande fue partido en subcarpetas por
responsabilidad. El archivo raíz (`<módulo>.ts`) se conserva como un
**barrel de re-exportaciones** para mantener estables los imports del
frontend y del agente.

| Módulo | Antes | Después (subcarpeta) |
|---|---|---|
| `convex/calendar` | 837 líneas | `calendar/{googleActions,orchestration,queriesMutations,shared}.ts` |
| `convex/contacts` | 124 líneas | `contacts/{access,mutations,queries,types}.ts` |
| `convex/expenses` | 425 líneas | `expenses/{agent,mutations,queries,subscriptions,types}.ts` |
| `convex/families` | 364 líneas | `families/{mutations,queries}.ts` |
| `convex/gifts` | 472 líneas | `gifts/{access,events,items,recipients,summary}.ts` |
| `convex/health` | 438 líneas | `health/{access,medications,profiles,records,studies,summary}.ts` |
| `convex/trips` | 308 líneas | `trips/{access,bookings,plans,trips}.ts` |
| `convex/vehicles` | 272 líneas | `vehicles/{access,events,summary,vehicles}.ts` |
| `convex/lib/agent/giftsTools` | 492 líneas | `giftsTools/{helpers,read,write}.ts` |

Refactor puramente estructural: los tests de lint y build siguen
verdes y la seguridad de sesión heredada de Phase 2 se preserva en
cada submódulo.

### 📄 Refactor estructural de páginas frontend (11 páginas partidas)

Las páginas más grandes se partieron en carpetas por componente. Los
handlers de estado y la lógica de routing se quedan en el archivo
`Page` (ahora mucho más chico); el JSX y los modals viven en
componentes dedicados.

| Página | Antes | Componentes extraídos |
|---|---|---|
| `NutritionPage` | 1200+ líneas | `DailyTracker`, `LogMealModal`, `PlanEditor`, `PlansManager`, `AssignPlanModal`, `constants`, `utils` |
| `FinancesPage` | 725 líneas | `ExpensesView`, `LoansView`, `NewLoanModal`, `NewSubscriptionModal`, `PaySubscriptionModal`, `PaymentModal` |
| `TripDetailPage` | 666 líneas | `TripItineraryTab`, `AddPlanModal` (los demás tabs ya venían de PR #1) |
| `VehicleDetailPage` | 291 líneas | `EditVehicleModal`, `AddVehicleEventModal`, `constants` |
| `SettingsPage` | 243 líneas | `EditProfileModal`, `NavOrderEditor` |
| `GiftsPage` + `GiftEventDetailPage` | 232 + 202 líneas | `GiftEventCard`, `GiftEventContent`, `GiftEventModals`, `NewGiftEventForm` |
| `FamilyPage` | 226 líneas | `InviteModal` |
| `ContactsPage` | 174 líneas | `NewContactModal`, `constants` |
| `CalendarSettingsPage` | 125 líneas | `CalendarSelection` |
| `DashboardPage` | 125 líneas | `useDashboardData` hook |
| `HighCardGame` (activities) | 470 líneas | `HighCardBoard`, `HighCardSetup`, `useHighCardGame`, `constants` |

Al mismo tiempo, todas las migraciones del design system (headers
unificados, `IconBadge`, `ContextMenu`, `Timeline`, `EmptyState`,
tokens semánticos) fueron **reaplicadas** sobre la nueva estructura en
el PR #2 de followup.

### 🧹 Fixes y limpieza

- **`useDashboardData`**: el hook extraído se llamaba después del early
  return por `!currentFamily`, lo cual violaba
  `react-hooks/rules-of-hooks`. Corregido moviendo la llamada al hook
  antes del return y haciendo que el hook acepte `familyId` opcional
  (`"skip"` internamente).
- **`NutritionPage`**: el `useEffect` que defaulteaba el participante
  seleccionado al primero llamaba `setState` síncronamente dentro del
  efecto. Reemplazado por `effectiveParticipantId = selectedParticipantId
  ?? participants[0]?.id ?? null`, derivando el estado en render.
- **`NavOrderEditor`**: el componente exportaba constantes junto con
  el componente (tripping `react-refresh/only-export-components`). Las
  constantes (`ALL_NAV_ITEMS`, `DEFAULT_NAV_ORDER`) se movieron a
  `src/components/settings/navOrderConstants.ts`, dedupeando también
  la copia local de `DEFAULT_NAV_ORDER` que tenía `BottomNav`.
- **`MorePage`**: migrado al registry de colores (`moduleColor()` +
  `IconBadge`), agregada la entry `/household` y removido el entry
  duplicado `/settings/"Perfil"` que apuntaba a la misma ruta.
- **`LogActivityModal`**: ajustado para pasar `sessionToken` a
  `api.families.getFamilyMembers` (requerido por el hardening de auth
  que ya vivía en main cuando el PR #1 aterrizó).

### 📚 Documentación

- **`README.md`**: reescrito como fusión de la documentación de
  auth/security (Phase 2) con la nueva sección de design system
  (tokens, primitivos, registry de colores, reglas y tabla de
  cobertura) y la sección de feature destacada de household
  gamification.
- **`docs/ds-followup/`** (nuevo directorio): durante la integración
  del PR #1 con el refactor local paralelo, se decidió per-file a
  favor del split estructural sobre las migraciones de design system
  del PR en 12 archivos. Los parches del PR para esos 12 archivos se
  preservaron en `docs/ds-followup/<Page>.patch` + un `README.md`
  que clasifica cada uno por prioridad y documenta el plan de
  reaplicación, ejecutado en PR #2.
- **`convex/README.md`**: reemplazado el template default de Convex
  por documentación específica del proyecto (estructura de carpetas,
  patrón de split + barrel, autorización con
  `requireFamilyAccessFromSession`, tools del agente).

### ✅ Validación

- `npm run lint`: **0 errors, 0 warnings** (incluidos los 2 warnings
  pre-existentes de react-refresh en `NavOrderEditor`, ahora
  corregidos).
- `npm run build`: **✓ ~2.8s**, solo el warning conocido de DaisyUI
  `@property` (no bloqueante).
- Bundle entry: **~18.5 kB gzipped**.
- Bundle por página (gzip): NutritionPage 6.7, FinancesPage 6.0,
  TripDetailPage 9.9, HouseholdPage 4.6, VehicleDetailPage 3.3,
  GiftEventDetailPage 6.0.

### 🔗 PRs mergeados en esta ronda

- **PR #1** — `feat: household gamification + design system unification`
  (merge `153961e`, resuelto per-file durante la integración local
  para preservar el refactor estructural en 12 páginas).
- **PR #2** — `refactor(ui): design system followup + household security
  hardening` (merge `5b16e9b`, re-aplica las 12 migraciones diferidas
  del PR #1 sobre la estructura particionada y cierra el hueco de auth
  de household).

---

## [Phase 2 - Security Hardening] - 2026-03-01

### 🔐 Seguridad y Autorización
- Endurecimiento general de backend para requerir `sessionToken` y validar membresía familiar en módulos funcionales.
- Aislamiento por familia reforzado con validación por recurso (`familyId` derivado del documento) para evitar acceso cruzado.
- Módulo `games` migrado a autorización por sesión y acceso familiar estricto.
- Helpers del agente para gastos migrados a `internalQuery/internalMutation` para eliminar exposición pública.

### 👨‍👩‍👧‍👦 Invitaciones y Familias
- Flujo de invitación reforzado con validación combinada `inviteToken + email + familyId`.
- Bloqueo de aceptación cuando el correo de sesión no coincide con correo invitado.
- Invitaciones pendientes filtradas por vigencia (no mostrar expiradas).
- Mejora en UX de login con invitación inválida/expirada.
- Modal de invitación ajustado para compartir solo links seguros con token (no link genérico).

### 🧹 Refactor y Consistencia
- Utilidades legacy de familia alineadas al modelo de sesión actual (`sessionToken`).
- Homogeneización de patrones de auth/autorización entre módulos.
- Limpieza incremental de firmas y payloads para evitar campos sensibles enviados por frontend.

### ✅ Validación
- `npm run lint`: sin errores ni warnings.
- `npm run build`: correcto (warning conocido no bloqueante de DaisyUI `@property`).

## [Previous] - 2026-01-11

### ✨ Nuevas Funcionalidades
- **Panel de SuperAdmin**: Nuevo dashboard en `/admin` accesible solo para superadministradores.
  - **Resumen**: Estadísticas en tiempo real de familias, usuarios e invitaciones. Visualización de familias recientes.
  - **Gestión de Usuarios**: Tabla para listar todos los usuarios del sistema con opciones para eliminar usuarios (protegido).
- **Perfil de Usuario**: Nuevo acceso "Perfil" en el menú "Más" que redirige a la configuración de usuario.

### 🛡 Mejora de Código y Calidad
- **Corrección de Linting**: Se eliminaron usos de `any` en módulos administrativos, implementando tipos estrictos.
- **Optimización de Build**: Se solucionaron errores de resolución de módulos de Vite/Rollup eliminando dependencias externas en el código del cliente.
- **Refactorización de Tipos**: Definición local de tipos `Id` para compatibilidad estructural con Convex.

### 🐛 Correcciones
- **Autenticación**: Mejora en la lógica de aceptación automática de invitaciones.
- **Tipado**: Resolución de advertencias de TypeScript en componentes de administración.
