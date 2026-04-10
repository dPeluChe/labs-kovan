import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DollarSign } from "lucide-react";
import { IconBadge } from "./IconBadge";

describe("IconBadge", () => {
  it("renders its children (the icon)", () => {
    render(
      <IconBadge>
        <DollarSign data-testid="badge-icon" className="w-5 h-5" />
      </IconBadge>,
    );
    expect(screen.getByTestId("badge-icon")).toBeInTheDocument();
  });

  it("applies the provided color class string", () => {
    const { container } = render(
      <IconBadge color="bg-emerald-500/10 text-emerald-600">
        <DollarSign className="w-5 h-5" />
      </IconBadge>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-emerald-500/10");
    expect(wrapper.className).toContain("text-emerald-600");
  });

  it("applies size and rounded variant classes", () => {
    const { container } = render(
      <IconBadge size="lg" rounded="full">
        <DollarSign className="w-5 h-5" />
      </IconBadge>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("p-3");
    expect(wrapper.className).toContain("rounded-full");
  });

  it("falls back to neutral base-200 color when no color is provided", () => {
    const { container } = render(
      <IconBadge>
        <DollarSign className="w-5 h-5" />
      </IconBadge>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-base-200");
  });
});
