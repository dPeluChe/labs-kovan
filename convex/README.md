# Convex backend

Backend funcional reactivo de Kovan sobre [Convex](https://docs.convex.dev).
Este README documenta la organización del directorio `convex/` y las
convenciones específicas del proyecto. Para una guía general del stack y
del design system, ver el [README raíz](../README.md).

## Estructura de carpetas

```
convex/
├── schema.ts                    # Schema completo de la base de datos
├── _generated/                  # Tipos autogenerados por `npx convex dev`
│
├── <module>.ts                  # Barrel: re-exporta las funciones públicas
├── <module>/                    # Implementación partida por responsabilidad
│   ├── queries.ts               # Read side (validado con sessionToken)
│   ├── mutations.ts             # Write side (validado con sessionToken)
│   ├── access.ts                # Helpers de acceso específicos del módulo
│   ├── types.ts                 # Validators y tipos compartidos
│   └── ...                      # Otros submódulos por feature (events, items...)
│
├── lib/
│   ├── auth.ts                  # Primitivas de sesión, hashing, acceso familiar
│   ├── utils.ts                 # Helpers genéricos de backend
│   └── agent/                   # Definición de tools para el agente IA
│       ├── tools.<feature>.ts   # Barrel por feature (si aplica)
│       └── <feature>Tools/      # Tools partidas en read.ts / write.ts / helpers.ts
│
└── household.ts                 # Módulo monolítico (aún sin partir)
```

### Módulos partidos vs monolíticos

Los módulos grandes (`calendar`, `contacts`, `expenses`, `families`, `gifts`,
`health`, `trips`, `vehicles`) están partidos en subcarpetas por
responsabilidad y el archivo `<módulo>.ts` en la raíz de `convex/` es un
**barrel** de re-exportaciones que mantiene estables los imports del
frontend (`api.calendar.getUpcomingEvents`, etc.).

Los módulos chicos (`household.ts`, `recipes.ts`, `tasks.ts`, `documents.ts`,
etc.) viven como archivos sueltos. Cuando uno crece demasiado, se sigue el
mismo patrón de split + barrel. Los agentes del LLM conviven igual: sus
tools también pueden partirse bajo `lib/agent/<feature>Tools/` y se
re-exportan desde un `tools.<feature>.ts` delgado.

## Patrón de autorización

Toda query o mutation que lee o muta datos de una familia **debe**:

1. Aceptar un argumento `sessionToken: v.string()` y, cuando aplique, un
   `familyId: v.id("families")`.
2. Llamar a `requireFamilyAccessFromSession(ctx, sessionToken, familyId)`
   de `./lib/auth` antes de tocar la base de datos. El helper devuelve
   `{ user, membership }` validados.
3. Al escribir, derivar cualquier `userId`/`createdBy`/`loggedBy` del
   `user` retornado por el helper — nunca confiar en lo que envía el
   cliente.

Ejemplo canónico:

```ts
import { query } from "./_generated/server";
import { v } from "convex/values";
import { requireFamilyAccessFromSession } from "./lib/auth";

export const getThings = query({
  args: { sessionToken: v.string(), familyId: v.id("families") },
  handler: async (ctx, args) => {
    await requireFamilyAccessFromSession(ctx, args.sessionToken, args.familyId);

    return await ctx.db
      .query("things")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();
  },
});
```

Para recursos individuales (`giftEvent`, `trip`, `vehicle`…), además de la
validación por familia, las queries/mutations verifican que el documento
pertenezca al `familyId` real antes de permitir la operación. Esto evita
el acceso cruzado cuando un miembro de otra familia envía un id válido.

## Helpers en `lib/auth.ts`

| Helper | Uso |
|---|---|
| `normalizeEmail(email)` | Normaliza correos antes de comparaciones. |
| `generateRandomToken(bytes)` | Token seguro para sesiones e invites. |
| `generateSalt()` | Salt para hashing de password. |
| `sha256Hex(input)` | Hash determinista (para `tokenHash` de sesiones). |
| `hashPassword(password, salt)` / `verifyPassword(password, hash, salt)` | PBKDF2 120k iterations. |
| `createSession(ctx, userId)` | Crea sesión y devuelve el raw token. |
| `getUserFromSessionToken(ctx, token)` | Resuelve sesión → usuario. Retorna `null` si es inválida o expirada (y la limpia). |
| `requireUserFromSessionToken(ctx, token)` | Igual pero throwea `"Sesión inválida o expirada"`. |
| `deleteSessionByToken(ctx, token)` | Logout. |
| `sanitizeUser(user)` | Strips campos sensibles antes de enviar al frontend. |
| `requireFamilyMembership(ctx, familyId, userId)` | Verifica membresía activa. |
| `requireFamilyAccessFromSession(ctx, token, familyId)` | La forma canónica: session + membership en una sola llamada. |

Cualquier nuevo módulo debe usar `requireFamilyAccessFromSession` como
primera línea del handler salvo que tenga un motivo documentado para
operar sin sesión (por ejemplo `getFamilyByInviteToken`, que resuelve un
invite para usuarios que aún no tienen sesión).

## Tools del agente (`lib/agent/`)

Las tools del agente IA viven en `lib/agent/tools.<feature>.ts`. Cuando
crecen lo suficiente se parten en subcarpetas siguiendo el mismo patrón
que los módulos de dominio (por ejemplo `lib/agent/giftsTools/{read,write,helpers}.ts`
re-exportadas desde `lib/agent/tools.gifts.ts`).

Las tools **mutantes** que tocan datos familiares deben usar
`internalMutation`/`internalQuery` (no `mutation`/`query` públicas) y ser
invocadas desde el módulo de agente, que ya valida la sesión del usuario
antes de despachar la tool. Ejemplo: las helpers internas de `expenses`
para el agente viven en `convex/expenses/agent.ts` y no se exportan al
frontend.

## Schema y migraciones

`convex/schema.ts` es la fuente única de la base de datos. Al modificarlo:

1. Correr `npx convex dev` local para regenerar tipos y validar el schema.
2. Si se agregan índices nuevos, documentarlos en línea con un comentario
   corto explicando qué query los consume.
3. Si un campo se vuelve opcional o cambia de tipo, asegurarse de que los
   documentos existentes sigan siendo válidos (Convex hará check al
   deployar).

## Desarrollo local

```bash
# Desde la raíz del repo
npx convex dev       # levanta el deployment de dev y mantiene tipos al día
npm run dev          # frontend (en otra terminal)
```

`npx convex dev` regenera `_generated/api.d.ts` cuando editas cualquier
función. Si estás trabajando offline o en un agente automatizado que no
corre `convex dev`, puedes agregar manualmente los módulos nuevos a
`_generated/api.d.ts` (ya pasó una vez con `household.ts`).

## Referencias externas

- [Convex docs](https://docs.convex.dev/functions)
- [Queries y reactividad](https://docs.convex.dev/client/react#reactivity)
- [Validators (`convex/values`)](https://docs.convex.dev/database/schemas#validators)
