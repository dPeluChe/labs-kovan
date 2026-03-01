# Labs Kovan - Sistema de Gestión Familiar

Plataforma integral para gestión familiar: finanzas, tareas, eventos, salud, colecciones, viajes y más.

## Estado del proyecto

El modo demo fue retirado. Actualmente la app opera con:
- Autenticación real por cuenta (`register` / `login`).
- Sesiones con `sessionToken`.
- Aislamiento estricto por familia en backend.
- Invitaciones seguras por `inviteToken + email + familyId`.

## Seguridad y autorización

Principio base:
- Toda operación de datos familiares requiere `sessionToken` válido.
- El backend valida membresía activa de la familia antes de leer o mutar datos.
- Acceso por recurso (por ejemplo `giftEvent`, `trip`, `vehicle`, `recipe`, etc.) se valida contra su `familyId` real.

### Invitaciones de familia

Flujo:
1. Owner/Admin envía invitación a un correo.
2. Se genera `inviteToken` de un solo uso con expiración.
3. El usuario abre el link y entra/crea cuenta con ese mismo correo.
4. Backend valida token, correo y vigencia antes de aceptar.

## Stack

- Frontend: React + Vite + TypeScript
- Backend/DB: Convex
- Estilos: TailwindCSS + DaisyUI
- Iconos: Lucide React

## Desarrollo local

1. Instalar dependencias
```bash
npm install
```

2. Levantar frontend
```bash
npm run dev
```

3. Levantar Convex
```bash
npx convex dev
```

## Calidad

Comandos principales:
```bash
npm run lint
npm run build
```

Nota: puede aparecer un warning conocido de DaisyUI (`@property`) durante `build`; actualmente no bloquea compilación.
