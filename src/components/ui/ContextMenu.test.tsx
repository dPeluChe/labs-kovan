import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Edit2, Trash2 } from "lucide-react";
import { ContextMenu } from "./ContextMenu";

describe("ContextMenu", () => {
  it("renders all visible items with their labels", () => {
    render(
      <ContextMenu
        items={[
          { label: "Editar", icon: Edit2, onClick: () => {} },
          {
            label: "Eliminar",
            icon: Trash2,
            onClick: () => {},
            variant: "danger",
          },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /eliminar/i }),
    ).toBeInTheDocument();
  });

  it("skips hidden items", () => {
    render(
      <ContextMenu
        items={[
          { label: "Visible", onClick: () => {} },
          { label: "Oculto", onClick: () => {}, hidden: true },
        ]}
      />,
    );
    expect(
      screen.getByRole("button", { name: /visible/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /oculto/i })).toBeNull();
  });

  it("returns null when every item is hidden", () => {
    const { container } = render(
      <ContextMenu
        items={[
          { label: "A", onClick: () => {}, hidden: true },
          { label: "B", onClick: () => {}, hidden: true },
        ]}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("calls the item's onClick when clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <ContextMenu
        items={[{ label: "Editar", icon: Edit2, onClick: onEdit }]}
      />,
    );
    await user.click(screen.getByRole("button", { name: /editar/i }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("renders the danger item with the error text color class", () => {
    render(
      <ContextMenu
        items={[
          {
            label: "Eliminar",
            icon: Trash2,
            onClick: () => {},
            variant: "danger",
          },
        ]}
      />,
    );
    const btn = screen.getByRole("button", { name: /eliminar/i });
    expect(btn.className).toContain("text-error");
  });
});
