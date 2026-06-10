import { describe, it, expect } from "vitest";
import { parseLocalDate } from "../../convex/lib/agent/dates";

describe("parseLocalDate", () => {
  it("parsea YYYY-MM-DD como fecha local (no UTC)", () => {
    const ts = parseLocalDate("2026-06-10");
    expect(ts).not.toBeNull();
    const date = new Date(ts as number);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(5);
    expect(date.getDate()).toBe(10);
  });

  it("equivale a medianoche local, no a medianoche UTC", () => {
    const ts = parseLocalDate("2026-06-10") as number;
    expect(ts).toBe(new Date(2026, 5, 10).getTime());
  });

  it("rechaza fechas con componentes fuera de rango", () => {
    expect(parseLocalDate("2026-02-31")).toBeNull();
    expect(parseLocalDate("2026-13-01")).toBeNull();
    expect(parseLocalDate("2026-00-10")).toBeNull();
  });

  it("rechaza strings que no son fecha", () => {
    expect(parseLocalDate("mañana")).toBeNull();
    expect(parseLocalDate("")).toBeNull();
  });

  it("acepta formatos no-ISO parseables como fallback", () => {
    expect(parseLocalDate("June 10, 2026")).not.toBeNull();
  });

  it("tolera espacios alrededor", () => {
    expect(parseLocalDate(" 2026-06-10 ")).toBe(new Date(2026, 5, 10).getTime());
  });
});
