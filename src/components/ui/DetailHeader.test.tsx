import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { DetailHeader } from "./DetailHeader";

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("DetailHeader", () => {
  it("renders the title as an h1", () => {
    renderWithRouter(<DetailHeader title="Viaje a Tokio" />);
    const heading = screen.getByRole("heading", {
      level: 1,
      name: /viaje a tokio/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it("renders the subtitle when provided", () => {
    renderWithRouter(
      <DetailHeader title="Viaje" subtitle="Japón • activo" />,
    );
    expect(screen.getByText("Japón • activo")).toBeInTheDocument();
  });

  it("renders a back button with the accessible name 'Regresar'", () => {
    renderWithRouter(<DetailHeader title="Ajustes" />);
    expect(
      screen.getByRole("button", { name: "Regresar" }),
    ).toBeInTheDocument();
  });

  it("calls the provided onBack handler when the back button is clicked", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    renderWithRouter(<DetailHeader title="Ajustes" onBack={onBack} />);
    await user.click(screen.getByRole("button", { name: "Regresar" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders the action slot content", () => {
    renderWithRouter(
      <DetailHeader
        title="Vehículo"
        action={<button type="button">Editar</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
  });

  it("renders the badge next to the title", () => {
    renderWithRouter(
      <DetailHeader
        title="Viaje"
        badge={<span data-testid="badge">planeado</span>}
      />,
    );
    expect(screen.getByTestId("badge")).toBeInTheDocument();
  });

  it("renders the tabs slot", () => {
    renderWithRouter(
      <DetailHeader
        title="Viaje"
        tabs={<div data-testid="tabs">tabs content</div>}
      />,
    );
    expect(screen.getByTestId("tabs")).toBeInTheDocument();
  });

  it("renders the banner slot", () => {
    renderWithRouter(
      <DetailHeader
        title="Viaje"
        banner={<div data-testid="banner">archived notice</div>}
      />,
    );
    expect(screen.getByTestId("banner")).toBeInTheDocument();
  });
});
