# Kovan

Aplicación de gestión familiar todo-en-uno: organiza salud, finanzas, viajes,
regalos, recetas, mascotas, documentos y mucho más, con un asistente IA y un
sistema de gamificación de tareas del hogar.

## Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: [Convex](https://convex.dev) (serverless, reactivo)
- **Estilos**: Tailwind CSS v4 + DaisyUI
- **Animaciones**: Framer Motion
- **IA**: Google Gemini via `@ai-sdk/google` + LangChain
- **Routing**: React Router v7
- **Imágenes**: Cloudinary

## Features

| Módulo            | Descripción                                                          |
| ----------------- | -------------------------------------------------------------------- |
| **Hogar (NEW)**   | Gamificación: registra tareas del hogar, gana puntos, ranking semanal |
| **Kovan (Agent)** | Asistente IA con tools para crear/consultar datos en lenguaje natural |
| **Finanzas**      | Gastos, suscripciones, préstamos                                     |
| **Calendario**    | Sincronización con Google Calendar                                  |
| **Salud**         | Expedientes médicos, medicamentos, estudios                          |
| **Mascotas**      | Salud, nutrición, cuidados                                          |
| **Recetas**       | Colección personal con favoritos                                    |
| **Lugares**       | Restaurantes, cafés, lugares por visitar (con visitas registradas)  |
| **Viajes**        | Itinerarios, reservas, presupuesto                                  |
| **Tareas**        | Pendientes, lista del super, rutinas                                |
| **Regalos**       | Eventos, destinatarios, listas de ideas                             |
| **Bóveda**        | Documentos importantes (identidad, viajes, seguros)                 |
| **Colecciones**   | Libros, mangas, juegos de mesa, videojuegos                         |
| **Diario**        | Entradas personales con mood tracking                               |
| **Autos**         | Mantenimiento y eventos del vehículo                                |
| **Familia**       | Miembros, invitaciones, roles                                       |

## Estructura del proyecto

```
labs-kovan/
├── convex/              # Backend Convex (queries, mutations, actions)
│   ├── schema.ts        # Schema completo de la base de datos
│   ├── household.ts     # Gamificación del hogar
│   ├── lib/agent/       # Tools del agente IA
│   └── ...
├── src/
│   ├── app/             # Composición top-level (AppProviders)
│   ├── components/      # Componentes organizados por dominio
│   │   ├── household/   # UI de gamificación
│   │   ├── ui/          # Componentes reutilizables
│   │   └── layout/      # Header, BottomNav, AppLayout
│   ├── contexts/        # Auth, Family, Theme
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Convex client, Cloudinary
│   └── pages/           # Una página por ruta (lazy-loaded)
└── public/
```

## Setup

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

Copia `.env.example` a `.env.local` y completa los valores:

```env
VITE_CONVEX_URL=                # URL de tu deployment de Convex
VITE_CLOUDINARY_CLOUD_NAME=     # Tu cloud de Cloudinary
VITE_CLOUDINARY_UPLOAD_PRESET=  # Preset unsigned para uploads
GEMINI_API_KEY=                 # API key de Google Gemini (para el agente)
```

### 3. Levantar Convex

```bash
npx convex dev
```

### 4. Levantar el frontend

```bash
npm run dev
```

## Scripts

- `npm run dev` - Servidor de desarrollo (Vite)
- `npm run build` - Build de producción (`tsc -b && vite build`)
- `npm run lint` - ESLint
- `npm run preview` - Preview del build de producción

## Arquitectura

### Reactividad con Convex

Todas las queries del backend son reactivas: cuando los datos cambian, la UI
se actualiza automáticamente sin polling ni invalidación manual de caché. Se
usa `useQuery` para lecturas y `useMutation`/`useAction` para escrituras y
side effects.

### Code-splitting por página

Todas las páginas (excepto Login, Landing, FamilySetup y Dashboard, que están
en el path crítico) se cargan con `React.lazy()` y `Suspense`. Esto reduce el
bundle inicial y acelera el time-to-interactive.

Ver `src/App.tsx`.

### Composición de providers

El árbol de providers vive en `src/app/AppProviders.tsx` para mantener
`App.tsx` enfocado en routing. El orden importa: providers externos no deben
depender de providers internos.

```
ConvexProvider → ThemeProvider → AuthProvider → FamilyProvider → ToastProvider → BrowserRouter
```

### Multi-tenancy familiar

Cada documento que pertenece a una familia incluye un `familyId` y un índice
`by_family`. Las mutaciones validan que el documento pertenezca a la familia
del usuario antes de modificarlo.

### Bundle splitting

`vite.config.ts` define manual chunks para vendors:

- `react-vendor`: React, React DOM, React Router
- `ui-vendor`: Framer Motion, Lucide icons
- `utils-vendor`: Convex, Zod, UUID
- `ai-vendor`: AI SDK, LangChain, Google AI
- `vendor`: el resto

Combinado con el lazy loading de páginas, esto produce un grafo de chunks
óptimo para el navegador.

## Convenciones

- **Idioma de UI**: Español (mexicano)
- **Mobile-first**: Diseñado para mobile, con bottom navigation
- **Modales**: Usar `MobileModal` (bottom-sheet en mobile, centrado en desktop)
- **Confirmaciones destructivas**: Usar `useConfirmModal` (no `window.confirm`)
- **Tabs animados**: `AnimatedTabs` con `layoutId` único por página
- **Validación de autorización**: Toda mutation que toca un documento de familia
  debe verificar `familyId` antes de patchear/borrar

## Design system (clases y componentes unificados)

Para mantener consistencia visual, **siempre usar** los tokens y componentes
centralizados en vez de clases hardcoded.

### Tokens de texto (jerarquía semántica)

Definidos en `src/index.css`. Reemplazan `text-base-content/XX`:

| Clase          | Uso                                               |
| -------------- | ------------------------------------------------- |
| `text-strong`  | Títulos y contenido primario                      |
| `text-body`    | Body copy, encabezados secundarios                |
| `text-muted`   | Subtítulos, descripciones                         |
| `text-subtle`  | Terciario, timestamps, hints                      |
| `text-faint`   | Íconos, dividers, helpers deshabilitados          |

### Tokens de superficie

| Clase           | Uso                                              |
| --------------- | ------------------------------------------------ |
| `surface-card`  | Card estándar (bg + border + rounded)            |
| `surface-muted` | Inset suave (bg-base-200/50 + rounded)           |
| `surface-row`   | Fila de lista (surface-card + padding)           |
| `sticky-header` | Header sticky con blur + safe-area               |

### Componentes unificados

| Componente        | Uso                                                     |
| ----------------- | ------------------------------------------------------- |
| `PageHeader`      | Título de página estático sin tabs                      |
| `StickyHeader`    | Header con título + acción + tabs (sticky con blur)     |
| `DetailHeader`    | Header de página de detalle con botón back + slots      |
| `SectionTitle`    | Label de sección (h3) con icono opcional                |
| `CircleAddButton` | Botón circular "+" para agregar desde el header         |
| `IconBadge`       | Container coloreado con icono (feature badges)          |
| `ContextMenu`     | Dropdown "⋮" de acciones para cards/rows                |
| `Avatar`          | Foto de usuario con fallback a iniciales                |
| `Timeline` + `TimelineItem` | Timeline vertical con dot y línea conectora  |
| `EmptyState`      | Estados vacíos (prohibido hacer divs inline)            |
| `MobileModal`     | Modales (bottom-sheet mobile / centrado desktop)        |
| `AnimatedTabs`    | Tabs animados con indicador deslizante                  |
| `ConfirmModal`    | Via `useConfirmModal` hook                              |

### Registry de colores de módulos

Cada feature tiene un color distintivo (Finanzas=emerald, Hogar=yellow, etc).
Centralizado en `src/lib/moduleColors.ts` para evitar duplicación:

```tsx
import { moduleColor } from "../lib/moduleColors";
import { IconBadge } from "../components/ui/IconBadge";

<IconBadge color={moduleColor("finances")} size="md">
  <DollarSign className="w-5 h-5" />
</IconBadge>
```

Cambiar el color de un módulo en `moduleColors.ts` lo actualiza en todas partes
(BottomNav, MorePage, DashboardPage, agent chips, etc.).

### Ejemplo: página con tabs (top-level)

```tsx
<StickyHeader
  title="Tareas"
  action={<CircleAddButton onClick={handleCreate} label="Nueva tarea" />}
  tabs={<AnimatedTabs tabs={tabs} activeTab={activeTab} onTabChange={...} />}
/>
```

### Ejemplo: página de detalle (con back)

```tsx
<DetailHeader
  title={trip.name}
  subtitle={`${trip.destination} • ${trip.status}`}
  action={<button onClick={edit} className="btn btn-ghost btn-circle btn-sm"><Pencil/></button>}
  tabs={<AnimatedTabs .../>}
/>
```

### Ejemplo: menú contextual

```tsx
<ContextMenu items={[
  { icon: Edit2, label: "Editar", onClick: onEdit },
  { icon: Trash2, label: "Eliminar", onClick: onDelete, variant: "danger" },
]} />
```

### Ejemplo: timeline vertical

```tsx
<Timeline>
  {visits.map(visit => (
    <TimelineItem key={visit._id} variant="primary">
      <VisitCard visit={visit} />
    </TimelineItem>
  ))}
</Timeline>

{/* Con dot personalizado (emoji, icono) */}
<Timeline>
  {entries.map(entry => (
    <TimelineItem key={entry._id} dot={<span>{entry.moodEmoji}</span>}>
      <EntryContent entry={entry} />
    </TimelineItem>
  ))}
</Timeline>
```

### Reglas

1. **No usar** `text-base-content/40`, `/50`, `/60`, `/70` directamente. Usar
   los aliases semánticos. Los valores `/5`, `/10`, `/20`, `/80`, `/90` sí
   pueden usarse para casos especiales (hover, dividers, emphasis).
2. **No construir** sticky headers inline. Usar `StickyHeader` (top-level) o
   `DetailHeader` (detalle con back button).
3. **No usar** `<div className="text-center py-8...">` para empty states. Usar
   `EmptyState` con un `LucideIcon`.
4. **No hardcodear** `btn btn-primary btn-sm btn-circle`. Usar `CircleAddButton`.
5. **No hardcodear** colores de módulo como `bg-emerald-500/10 text-emerald-600`.
   Usar `moduleColor("finances")` de `lib/moduleColors.ts`.
6. **No construir** dropdowns "⋮" inline. Usar `ContextMenu` con items.
7. **No construir** avatars inline con `<img>` + fallback. Usar `<Avatar src={url} name={name} size="sm" />`.

## Feature destacada: Gamificación del hogar

En `/household`, la familia puede:

1. **Registrar actividades** del día a día (lavar platos, cocinar, ir al super…)
   con puntos asociados. Cualquier miembro puede registrar actividades por sí
   mismo o por otro miembro.
2. **Ver el feed** en tiempo real de quién hizo qué.
3. **Competir en el ranking semanal** con podio animado (1°, 2°, 3°) y resumen
   de puntos totales de la semana.

Las actividades vienen pre-cargadas con 18 tareas comunes y son totalmente
personalizables (crear, editar puntos, desactivar, eliminar) por familia.

Backend: `convex/household.ts`
Frontend: `src/pages/HouseholdPage.tsx` + `src/components/household/*`
