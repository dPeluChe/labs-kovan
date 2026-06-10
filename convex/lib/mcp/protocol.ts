/**
 * Helpers puros del protocolo MCP (JSON-RPC 2.0 sobre Streamable HTTP).
 * Sin dependencias de Convex para que sean testeables de forma aislada.
 *
 * Spec: https://modelcontextprotocol.io/specification
 */

export const JSON_RPC_VERSION = "2.0";

/** Versión más reciente del protocolo que soporta este servidor. */
export const MCP_PROTOCOL_VERSION = "2025-06-18";

/** Versiones aceptadas en la negociación de initialize. */
export const SUPPORTED_PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];

export const JSON_RPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  UNAUTHORIZED: -32001,
} as const;

export type JsonRpcId = string | number | null;

export interface JsonRpcMessage {
  jsonrpc: typeof JSON_RPC_VERSION;
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: typeof JSON_RPC_VERSION;
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export type ParseResult =
  | { ok: true; message: JsonRpcMessage }
  | { ok: false; code: number; errorMessage: string };

/**
 * Valida que el body sea un mensaje JSON-RPC 2.0 bien formado.
 * Nota: los batches (arrays) se rechazan; la revisión 2025-06-18 del
 * protocolo MCP eliminó el soporte de batching.
 */
export function parseJsonRpcMessage(body: unknown): ParseResult {
  if (Array.isArray(body)) {
    return {
      ok: false,
      code: JSON_RPC_ERRORS.INVALID_REQUEST,
      errorMessage: "Los batches JSON-RPC no están soportados",
    };
  }

  if (typeof body !== "object" || body === null) {
    return {
      ok: false,
      code: JSON_RPC_ERRORS.INVALID_REQUEST,
      errorMessage: "El body debe ser un objeto JSON-RPC",
    };
  }

  const msg = body as Record<string, unknown>;

  if (msg.jsonrpc !== JSON_RPC_VERSION) {
    return {
      ok: false,
      code: JSON_RPC_ERRORS.INVALID_REQUEST,
      errorMessage: 'El campo "jsonrpc" debe ser "2.0"',
    };
  }

  if (typeof msg.method !== "string" || msg.method.length === 0) {
    return {
      ok: false,
      code: JSON_RPC_ERRORS.INVALID_REQUEST,
      errorMessage: 'El campo "method" es requerido',
    };
  }

  const idType = typeof msg.id;
  if (msg.id !== undefined && msg.id !== null && idType !== "string" && idType !== "number") {
    return {
      ok: false,
      code: JSON_RPC_ERRORS.INVALID_REQUEST,
      errorMessage: 'El campo "id" debe ser string, number o null',
    };
  }

  if (msg.params !== undefined && (typeof msg.params !== "object" || msg.params === null)) {
    return {
      ok: false,
      code: JSON_RPC_ERRORS.INVALID_PARAMS,
      errorMessage: 'El campo "params" debe ser un objeto',
    };
  }

  return { ok: true, message: msg as unknown as JsonRpcMessage };
}

/** Un mensaje sin id es una notificación: no espera respuesta. */
export function isNotification(message: JsonRpcMessage): boolean {
  return message.id === undefined;
}

export function jsonRpcResult(id: JsonRpcId, result: unknown): JsonRpcResponse {
  return { jsonrpc: JSON_RPC_VERSION, id, result };
}

export function jsonRpcError(
  id: JsonRpcId,
  code: number,
  message: string,
  data?: unknown
): JsonRpcResponse {
  return { jsonrpc: JSON_RPC_VERSION, id, error: { code, message, ...(data !== undefined ? { data } : {}) } };
}

/**
 * Negociación de versión: si el cliente pide una versión soportada se acepta;
 * si no, se responde con la más reciente del servidor (el cliente decide si
 * puede continuar, según la spec).
 */
export function negotiateProtocolVersion(requested: unknown): string {
  if (typeof requested === "string" && SUPPORTED_PROTOCOL_VERSIONS.includes(requested)) {
    return requested;
  }
  return MCP_PROTOCOL_VERSION;
}

/** Resultado estándar de una tool MCP (contenido de texto). */
export function toolTextResult(text: string, isError = false) {
  return {
    content: [{ type: "text" as const, text }],
    isError,
  };
}
