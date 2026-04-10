import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Package } from "lucide-react";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        icon={Package}
        title="Sin elementos"
        description="Crea el primero para empezar"
      />,
    );
    expect(
      screen.getByRole("heading", { level: 3, name: "Sin elementos" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Crea el primero para empezar"),
    ).toBeInTheDocument();
  });

  it("renders the icon as an SVG", () => {
    const { container } = render(
      <EmptyState icon={Package} title="Vacío" />,
    );
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("omits the description when not provided", () => {
    render(<EmptyState icon={Package} title="Vacío" />);
    expect(screen.queryByText(/Crea el primero/)).toBeNull();
  });

  it("renders the optional action slot", () => {
    render(
      <EmptyState
        icon={Package}
        title="Vacío"
        action={<button type="button">Crear</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Crear" })).toBeInTheDocument();
  });
});
