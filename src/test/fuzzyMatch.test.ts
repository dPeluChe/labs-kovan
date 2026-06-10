import { describe, it, expect } from "vitest";
import { stringSimilarity, findBestMatch } from "../../convex/lib/agent/fuzzyMatch";

describe("stringSimilarity", () => {
  it("match exacto da 1.0 (case-insensitive)", () => {
    expect(stringSimilarity("Civic", "civic")).toBe(1.0);
  });

  it("palabra completa contenida da score alto", () => {
    expect(stringSimilarity("Civic", "Honda Civic")).toBe(0.85);
    expect(stringSimilarity("civic honda", "Honda Civic")).toBe(0.85);
  });

  it("prefijo de palabra da score medio-alto", () => {
    // "cumple" es prefijo de "cumpleaños"
    expect(stringSimilarity("Cumple", "Cumpleaños de María")).toBe(0.75);
  });

  it("substring que no respeta límites de palabra NO puntúa alto", () => {
    // "ana" está contenido en "mariana" pero no es la misma persona
    expect(stringSimilarity("Ana", "Mariana")).toBeLessThan(0.6);
  });

  it("strings muy distintos dan score bajo", () => {
    expect(stringSimilarity("Civic", "Camioneta roja")).toBeLessThan(0.5);
  });
});

describe("findBestMatch", () => {
  const vehicles = [
    { name: "Mi auto" },
    { name: "Honda Civic" },
    { name: "Camioneta" },
  ];

  it("encuentra el mejor candidato por encima del umbral", () => {
    const match = findBestMatch("civic", vehicles, (v) => v.name, 0.6);
    expect(match?.name).toBe("Honda Civic");
  });

  it("devuelve null cuando nada supera el umbral", () => {
    const match = findBestMatch("Tesla Model 3", vehicles, (v) => v.name, 0.6);
    expect(match).toBeNull();
  });

  it("no confunde personas con nombres contenidos", () => {
    const recipients = [{ name: "Mariana" }, { name: "Pedro" }];
    expect(findBestMatch("Ana", recipients, (r) => r.name, 0.75)).toBeNull();
  });

  it("devuelve null con lista vacía", () => {
    expect(findBestMatch("Civic", [], (v: { name: string }) => v.name)).toBeNull();
  });
});
