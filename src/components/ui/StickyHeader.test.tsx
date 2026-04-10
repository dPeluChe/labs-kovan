import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StickyHeader } from "./StickyHeader";

describe("StickyHeader", () => {
  it("renders the title as an h1", () => {
    render(<StickyHeader title="Finanzas" />);
    const heading = screen.getByRole("heading", { level: 1, name: "Finanzas" });
    expect(heading).toBeInTheDocument();
  });

  it("renders the optional subtitle when provided", () => {
    render(<StickyHeader title="Tareas" subtitle="3 pendientes" />);
    expect(screen.getByText("3 pendientes")).toBeInTheDocument();
  });

  it("does not render a subtitle element when subtitle prop is omitted", () => {
    const { container } = render(<StickyHeader title="Tareas" />);
    expect(container.querySelector("p")).toBeNull();
  });

  it("renders the action slot content", () => {
    render(
      <StickyHeader
        title="Gastos"
        action={<button type="button">Agregar</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Agregar" })).toBeInTheDocument();
  });

  it("renders the tabs slot content", () => {
    render(
      <StickyHeader
        title="Household"
        tabs={<div data-testid="tabs-slot">tabs go here</div>}
      />,
    );
    expect(screen.getByTestId("tabs-slot")).toBeInTheDocument();
  });
});
