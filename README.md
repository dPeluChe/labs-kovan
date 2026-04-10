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
