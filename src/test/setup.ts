import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Unmount and clean DOM between tests so each renders in isolation.
afterEach(() => {
  cleanup();
});
