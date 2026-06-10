import { describe, it, expect } from "vitest";
import { stringSimilarity, findBestMatch } from "../../convex/lib/agent/fuzzyMatch";

describe("stringSimilarity", () => {
  it("match exacto da 1.0 (case-insensitive)", () => {
    expect(stringSimilarity("Civic", "civic")).toBe(1.0);
  });

  it("substring da score alto", () => {
    expect(stringSimilarity("Civic", "Honda Civic")).toBe(0.8);
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

  it("devuelve null con lista vacía", () => {
    expect(findBestMatch("Civic", [], (v: { name: string }) => v.name)).toBeNull();
  });
});
