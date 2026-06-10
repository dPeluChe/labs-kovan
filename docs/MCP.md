# Servidor MCP de Kovan

Kovan expone un servidor [MCP](https://modelcontextprotocol.io) (Model Context
Protocol) para que asistentes IA externos — Claude Code, Claude Desktop o
cualquier cliente MCP — consulten y registren datos familiares en lenguaje
natural usando las mismas tools del agente interno.

## Arquitectura

```
Cliente MCP (Claude Code / Desktop / …)
        │  POST JSON-RPC + Authorization: Bearer kovan_…
        ▼
convex/http.ts → POST /mcp          (Streamable HTTP, stateless)
        │
        ├─ validateApiToken         → toda request (incluido ping) exige
        │                             API key válida antes de responder
        │
        └─ tools/call
             ├─ mintMcpSession      → intercambia la API key por una
             │                        sesión efímera (10 min máx) acotada
             │                        a la familia de la llave
             ├─ toolHandlers[name]  → mismas tools del agente interno
             │                        (convex/lib/agent/)
             └─ clearMcpSession     → elimina la sesión al terminar
```

Decisiones clave:

- **Un solo catálogo de tools.** `tools/list` expone `allToolDefinitions` de
  `convex/lib/agent/index.ts`, el mismo registry que usa el agente Gemini de
  la app. Toda tool nueva queda disponible en ambos mundos sin duplicación.
- **Sesiones efímeras en lugar de refactor de auth.** Las queries/mutations
  existentes validan `sessionToken`; el endpoint MCP intercambia la API key
  por una sesión corta y la destruye al terminar la tool call. Así se reusa
  íntegra la validación de membresía y aislamiento por familia.
- **Sesiones MCP acotadas a una familia.** La sesión efímera se crea con
  `kind: "mcp"` y el `familyId` de la API key;
  `requireFamilyAccessFromSession` rechaza cualquier acceso a otra familia
  aunque el usuario pertenezca a varias. Una sesión MCP nunca es más
  poderosa que la llave que la originó.
- **Ninguna función confía en un `familyId` suelto.** Incluso las funciones
  `internal.*` que usan las tools (`expenses/agent.ts`) exigen
  `sessionToken` y validan membresía; la invariante aplica a todo acceso a
  datos sin excepción.
- **Stateless.** No se emite `Mcp-Session-Id` ni se ofrece stream SSE
  (`GET /mcp` responde 405). Cada request es independiente, ideal para
  serverless. Los batches JSON-RPC se rechazan (la revisión 2025-06-18 del
  protocolo los eliminó).
- **Errores de tools como resultado, no como error de protocolo.** Una tool
  que falla devuelve `content` con `isError: true`, para que el agente pueda
  leer el mensaje y autocorregirse (p. ej. la lista de vehículos disponibles).

## Autenticación: API keys personales

- Tabla `apiTokens` (`convex/schema.ts`): se guarda solo el **hash SHA-256**
  del token; el valor en claro se muestra una única vez al crearlo.
- Cada llave pertenece a un usuario **y** a una familia. Las tools operan
  exclusivamente sobre los datos de esa familia.
- Gestión en la app: **Configuración → Conexiones MCP** (`/mcp`): crear
  llaves nombradas (una por cliente/dispositivo), ver último uso y revocar.
- Límite de 10 llaves activas por usuario. La revocación es inmediata.
- Formato: `kovan_` + 48 hex. Header: `Authorization: Bearer kovan_…`.

## Cómo conectarte

El endpoint vive en el dominio `*.convex.site` del deployment (las HTTP
actions de Convex no se sirven desde `*.convex.cloud`):

```
https://<deployment>.convex.site/mcp
```

### Claude Code

```bash
claude mcp add --transport http kovan https://<deployment>.convex.site/mcp \
  --header "Authorization: Bearer kovan_…"
```

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "kovan": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://<deployment>.convex.site/mcp",
        "--header", "Authorization: Bearer kovan_…"
      ]
    }
  }
}
```

### Exponerlo bajo tu propio dominio

Para no compartir la URL de Convex, se puede publicar el endpoint detrás del
dominio de la app con un rewrite del hosting hacia Convex. La ruta `/mcp`
del dominio la ocupa la SPA (página de instrucciones y llaves), así que el
endpoint proxy conviene en `/api/mcp`:

**Vercel** (`vercel.json`):

```json
{
  "rewrites": [
    { "source": "/api/mcp", "destination": "https://<deployment>.convex.site/mcp" }
  ]
}
```

**Netlify** (`netlify.toml`):

```toml
[[redirects]]
  from = "/api/mcp"
  to = "https://<deployment>.convex.site/mcp"
  status = 200
```

Con el rewrite activo, los clientes usan `https://tudominio.com/api/mcp`.

## Catálogo de tools

| Dominio | Lectura | Escritura |
|---|---|---|
| General | `getFamilyOverview` (resumen del día) | — |
| Finanzas | `getExpenseSummary`, `getLoans`, `getSubscriptions` | `registerExpense`, `registerLoan` |
| Tareas | `listTasks` | `addTask`, `completeTask` |
| Calendario | `getUpcomingEvents` | — |
| Salud | `getHealthSummary` | — |
| Hogar | `getHouseholdRanking` | `logHouseholdActivity` |
| Viajes | `getTrips` | — |
| Diario | — | `addDiaryEntry` |
| Vehículos | `listVehicles` | `addVehicleEvent` |
| Regalos | `getGiftsForEvent`, `getGiftsForPerson` | `createGiftEvent`, `addGiftToEvent`, `updateGiftStatus`, `updateGiftItem` |
| Lugares | — | `addPlace` |
| Recetas | — | `addRecipe` |
| Colecciones | `getCollections` | `addToCollection` |

## Agregar una tool nueva

1. Define `ToolDefinition` + handler en `convex/lib/agent/tools.<feature>.ts`
   (o `<feature>Tools/` si crece). El handler recibe `ToolContext`
   (`ctx`, `familyId`, `userId`, `sessionToken`) ya autenticado y debe
   devolver `{ success, message }`.
2. Regístrala en `allToolDefinitions` y `toolHandlers`
   (`convex/lib/agent/index.ts`).
3. Listo: aparece automáticamente en el agente interno y en `tools/list`
   del MCP.

Convenciones para tools de calidad:

- **Nunca crear entidades de forma implícita.** Si la tool no encuentra el
  recurso referido (vehículo, evento, persona…), responde `success: false`
  con la lista de candidatos y exige confirmación explícita
  (ver `createIfMissing` en `addVehicleEvent`).
- Usa `findBestMatch` de `lib/agent/fuzzyMatch.ts` para resolver nombres,
  no `includes()` a mano.
- Valida fechas y números antes de escribir; devuelve mensajes accionables
  en español (el agente los muestra o reacciona a ellos).
- Parsea fechas `YYYY-MM-DD` con `parseLocalDate` de `lib/agent/dates.ts`
  (`new Date("YYYY-MM-DD")` interpreta UTC y corre la fecha un día en
  zonas horarias negativas como la de México).

## Pruebas

- `src/test/mcpProtocol.test.ts` — parsing/validación JSON-RPC y negociación
  de versión del protocolo.
- `src/test/fuzzyMatch.test.ts` — matching difuso usado por las tools.
- `src/test/dates.test.ts` — parseo local de fechas `YYYY-MM-DD`.

Smoke test manual contra un deployment:

```bash
curl -s https://<deployment>.convex.site/mcp \
  -H "Authorization: Bearer kovan_…" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```
