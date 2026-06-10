import { describe, it, expect } from "vitest";
import {
  JSON_RPC_ERRORS,
  MCP_PROTOCOL_VERSION,
  isNotification,
  jsonRpcError,
  jsonRpcResult,
  negotiateProtocolVersion,
  parseJsonRpcMessage,
  toolTextResult,
} from "../../convex/lib/mcp/protocol";

describe("parseJsonRpcMessage", () => {
  it("acepta un request válido", () => {
    const result = parseJsonRpcMessage({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message.method).toBe("tools/list");
      expect(result.message.id).toBe(1);
    }
  });

  it("acepta params como objeto", () => {
    const result = parseJsonRpcMessage({
      jsonrpc: "2.0",
      id: "abc",
      method: "tools/call",
      params: { name: "listVehicles", arguments: {} },
    });
    expect(result.ok).toBe(true);
  });

  it("rechaza batches (arrays)", () => {
    const result = parseJsonRpcMessage([{ jsonrpc: "2.0", id: 1, method: "ping" }]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(JSON_RPC_ERRORS.INVALID_REQUEST);
  });

  it("rechaza body que no es objeto", () => {
    expect(parseJsonRpcMessage("hola").ok).toBe(false);
    expect(parseJsonRpcMessage(null).ok).toBe(false);
    expect(parseJsonRpcMessage(42).ok).toBe(false);
  });

  it("rechaza jsonrpc distinto de 2.0", () => {
    const result = parseJsonRpcMessage({ jsonrpc: "1.0", id: 1, method: "ping" });
    expect(result.ok).toBe(false);
  });

  it("rechaza method ausente o vacío", () => {
    expect(parseJsonRpcMessage({ jsonrpc: "2.0", id: 1 }).ok).toBe(false);
    expect(parseJsonRpcMessage({ jsonrpc: "2.0", id: 1, method: "" }).ok).toBe(false);
  });

  it("rechaza id de tipo inválido", () => {
    const result = parseJsonRpcMessage({ jsonrpc: "2.0", id: {}, method: "ping" });
    expect(result.ok).toBe(false);
  });

  it("rechaza params que no son objeto", () => {
    const result = parseJsonRpcMessage({ jsonrpc: "2.0", id: 1, method: "ping", params: "x" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(JSON_RPC_ERRORS.INVALID_PARAMS);
  });
});

describe("isNotification", () => {
  it("un mensaje sin id es notificación", () => {
    expect(isNotification({ jsonrpc: "2.0", method: "notifications/initialized" })).toBe(true);
  });

  it("un mensaje con id no es notificación", () => {
    expect(isNotification({ jsonrpc: "2.0", id: 1, method: "ping" })).toBe(false);
    expect(isNotification({ jsonrpc: "2.0", id: null, method: "ping" })).toBe(false);
  });
});

describe("negotiateProtocolVersion", () => {
  it("acepta versiones soportadas", () => {
    expect(negotiateProtocolVersion("2025-03-26")).toBe("2025-03-26");
    expect(negotiateProtocolVersion("2025-06-18")).toBe("2025-06-18");
  });

  it("responde con la versión propia ante versiones desconocidas", () => {
    expect(negotiateProtocolVersion("1999-01-01")).toBe(MCP_PROTOCOL_VERSION);
    expect(negotiateProtocolVersion(undefined)).toBe(MCP_PROTOCOL_VERSION);
    expect(negotiateProtocolVersion(123)).toBe(MCP_PROTOCOL_VERSION);
  });
});

describe("respuestas JSON-RPC", () => {
  it("jsonRpcResult arma la respuesta correcta", () => {
    expect(jsonRpcResult(7, { ok: true })).toEqual({
      jsonrpc: "2.0",
      id: 7,
      result: { ok: true },
    });
  });

  it("jsonRpcError arma el error correcto", () => {
    expect(jsonRpcError(null, JSON_RPC_ERRORS.METHOD_NOT_FOUND, "nope")).toEqual({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32601, message: "nope" },
    });
  });

  it("toolTextResult arma contenido de texto", () => {
    expect(toolTextResult("hola")).toEqual({
      content: [{ type: "text", text: "hola" }],
      isError: false,
    });
    expect(toolTextResult("falló", true).isError).toBe(true);
  });
});
