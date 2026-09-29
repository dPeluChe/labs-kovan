import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { allToolDefinitions, toolHandlers } from "./lib/agent";
import {
  JSON_RPC_ERRORS,
  isNotification,
  jsonRpcError,
  jsonRpcResult,
  negotiateProtocolVersion,
  parseJsonRpcMessage,
  toolTextResult,
  type JsonRpcMessage,
  type JsonRpcResponse,
} from "./lib/mcp/protocol";

const MCP_SERVER_INFO = {
  name: "kovan",
  title: "Kovan — Gestión Familiar",
  version: "1.0.0",
};

const MCP_INSTRUCTIONS =
  "Servidor MCP de Kovan, la app de gestión familiar. Las tools operan sobre los datos " +
  "de la familia asociada a la API key: gastos, préstamos, regalos, vehículos, recetas, " +
  "lugares y colecciones. Todas las respuestas de tools son texto en español.";

// Las API keys se mandan en el header Authorization; CORS permisivo para
// permitir clientes MCP basados en navegador.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Mcp-Protocol-Version, Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body: JsonRpcResponse, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function unauthorizedResponse(id: JsonRpcMessage["id"] = null): Response {
  return new Response(
    JSON.stringify(jsonRpcError(id ?? null, JSON_RPC_ERRORS.UNAUTHORIZED, "API key inválida, revocada o ausente")),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": 'Bearer realm="Kovan MCP"',
        ...CORS_HEADERS,
      },
    }
  );
}

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

const mcpEndpoint = httpAction(async (ctx, request) => {
  const token = extractBearerToken(request);
  if (!token) {
    return unauthorizedResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(jsonRpcError(null, JSON_RPC_ERRORS.PARSE_ERROR, "JSON inválido"), 400);
  }

  const parsed = parseJsonRpcMessage(body);
  if (!parsed.ok) {
    return jsonResponse(jsonRpcError(null, parsed.code, parsed.errorMessage), 400);
  }

  const message = parsed.message;
  const id = message.id ?? null;

  // Toda interacción (incluidos ping y notificaciones) exige API key válida:
  // el endpoint no confirma ni su existencia a clientes sin credenciales.
  const auth = await ctx.runQuery(internal.apiTokens.validateApiToken, { token });
  if (!auth) return unauthorizedResponse(id);

  // Las notificaciones (initialized, cancelled, etc.) no llevan respuesta.
  if (isNotification(message)) {
    return new Response(null, { status: 202, headers: CORS_HEADERS });
  }

  switch (message.method) {
    case "initialize": {
      return jsonResponse(
        jsonRpcResult(id, {
          protocolVersion: negotiateProtocolVersion(message.params?.protocolVersion),
          capabilities: { tools: { listChanged: false } },
          serverInfo: MCP_SERVER_INFO,
          instructions: MCP_INSTRUCTIONS,
        })
      );
    }

    case "ping": {
      return jsonResponse(jsonRpcResult(id, {}));
    }

    case "tools/list": {
      const tools = allToolDefinitions.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.parameters,
      }));
      return jsonResponse(jsonRpcResult(id, { tools }));
    }

    case "tools/call": {
      const name = message.params?.name;
      const args = message.params?.arguments ?? {};

      if (typeof name !== "string" || !name) {
        return jsonResponse(
          jsonRpcError(id, JSON_RPC_ERRORS.INVALID_PARAMS, 'El parámetro "name" es requerido')
        );
      }
      if (typeof args !== "object" || args === null || Array.isArray(args)) {
        return jsonResponse(
          jsonRpcError(id, JSON_RPC_ERRORS.INVALID_PARAMS, 'El parámetro "arguments" debe ser un objeto')
        );
      }

      const handler = toolHandlers[name];
      if (!handler) {
        return jsonResponse(
          jsonRpcError(id, JSON_RPC_ERRORS.INVALID_PARAMS, `Tool desconocida: ${name}`)
        );
      }

      const session = await ctx.runMutation(internal.apiTokens.mintMcpSession, { token });
      if (!session) return unauthorizedResponse(id);

      try {
        const result = await handler(
          {
            ctx,
            userId: session.userId,
            familyId: session.familyId,
            sessionToken: session.sessionToken,
          },
          args as Record<string, unknown>
        );

        if ("error" in result) {
          return jsonResponse(jsonRpcResult(id, toolTextResult(result.error, true)));
        }
        return jsonResponse(jsonRpcResult(id, toolTextResult(result.message, !result.success)));
      } catch (error) {
        // Errores de ejecución de la tool se reportan como resultado con
        // isError (no como error de protocolo), según la spec de MCP.
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`MCP tool error [${name}]:`, errorMessage);
        return jsonResponse(jsonRpcResult(id, toolTextResult(`Error al ejecutar ${name}: ${errorMessage}`, true)));
      } finally {
        await ctx.runMutation(internal.apiTokens.clearMcpSession, {
          sessionToken: session.sessionToken,
        });
      }
    }

    default:
      return jsonResponse(
        jsonRpcError(id, JSON_RPC_ERRORS.METHOD_NOT_FOUND, `Método no soportado: ${message.method}`)
      );
  }
});

// Servidor stateless: no ofrecemos stream SSE, así que GET responde 405
// como indica la spec de Streamable HTTP.
const mcpGetNotAllowed = httpAction(async () => {
  return new Response(null, { status: 405, headers: { Allow: "POST, OPTIONS", ...CORS_HEADERS } });
});

const mcpPreflight = httpAction(async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
});

// Sesión persistente del frontend: el sessionToken vive solo en memoria; la
// persistencia entre recargas usa una cookie HttpOnly+Secure+SameSite=None
// en el dominio *.convex.site, ilegible para cualquier JS de la app (ni
// siquiera sin HttpOnly, por ser otro origen). La app la crea tras login
// (POST), la consulta al recargar (GET) y la borra en logout (DELETE).
const SESSION_COOKIE = "kovan_session";
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // igual que las sesiones (30 días)

const DEV_APP_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

// Orígenes desde los que la app puede usar la cookie. APP_ORIGIN se define en
// el Convex Dashboard (coma-separado si hay varios). Reflejar cualquier origen
// con credenciales dejaría que cualquier sitio leyera el token de sesión.
function allowedOrigin(request: Request): string | null {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  const configured = (process.env.APP_ORIGIN ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return [...configured, ...DEV_APP_ORIGINS].includes(origin) ? origin : null;
}

function sessionCorsHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
  const origin = allowedOrigin(request);
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function sessionCookieHeader(token: string, maxAge: number): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${maxAge}`;
}

function readSessionCookie(request: Request): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) return rest.join("=");
  }
  return null;
}

const sessionResume = httpAction(async (ctx, request) => {
  const headers = sessionCorsHeaders(request);
  const token = readSessionCookie(request);
  const valid =
    token !== null &&
    (await ctx.runQuery(internal.users.validateSessionToken, { sessionToken: token }));

  if (!valid) {
    return new Response(JSON.stringify({ sessionToken: null }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": sessionCookieHeader("", 0),
        ...headers,
      },
    });
  }

  return new Response(JSON.stringify({ sessionToken: token }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...headers },
  });
});

const sessionPersist = httpAction(async (ctx, request) => {
  const headers = sessionCorsHeaders(request);

  // Exigir JSON fuerza preflight en navegadores: sin CORS para el origen,
  // un sitio externo no puede fijar la cookie de sesión (session fixation).
  if (!request.headers.get("Content-Type")?.includes("application/json")) {
    return new Response(null, { status: 415, headers });
  }
  if (request.headers.get("Origin") && !allowedOrigin(request)) {
    return new Response(null, { status: 403, headers });
  }

  const body = (await request.json().catch(() => null)) as { sessionToken?: unknown } | null;
  const token = typeof body?.sessionToken === "string" ? body.sessionToken : null;
  const valid =
    token !== null &&
    (await ctx.runQuery(internal.users.validateSessionToken, { sessionToken: token }));

  if (!valid) {
    return new Response(null, { status: 401, headers });
  }

  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": sessionCookieHeader(token, SESSION_COOKIE_MAX_AGE), ...headers },
  });
});

const sessionClear = httpAction(async (_ctx, request) => {
  const headers = sessionCorsHeaders(request);
  if (request.headers.get("Origin") && !allowedOrigin(request)) {
    return new Response(null, { status: 403, headers });
  }

  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": sessionCookieHeader("", 0), ...headers },
  });
});

const sessionPreflight = httpAction(async (_ctx, request) => {
  return new Response(null, { status: 204, headers: sessionCorsHeaders(request) });
});

const http = httpRouter();

http.route({ path: "/mcp", method: "POST", handler: mcpEndpoint });
http.route({ path: "/mcp", method: "GET", handler: mcpGetNotAllowed });
http.route({ path: "/mcp", method: "OPTIONS", handler: mcpPreflight });
http.route({ path: "/auth/session", method: "GET", handler: sessionResume });
http.route({ path: "/auth/session", method: "POST", handler: sessionPersist });
http.route({ path: "/auth/session", method: "DELETE", handler: sessionClear });
http.route({ path: "/auth/session", method: "OPTIONS", handler: sessionPreflight });

export default http;
