import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Timeline, TimelineItem } from "./Timeline";

describe("Timeline", () => {
  it("renders children inside a bordered container", () => {
    const { container } = render(
      <Timeline>
        <TimelineItem>First</TimelineItem>
        <TimelineItem>Second</TimelineItem>
      </Timeline>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("border-l-2");
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });
});

describe("TimelineItem", () => {
  it("renders its children", () => {
    render(
      <Timeline>
        <TimelineItem>Hello world</TimelineItem>
      </Timeline>,
    );
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders a solid dot by default with the primary variant color", () => {
    const { container } = render(
      <Timeline>
        <TimelineItem>Item</TimelineItem>
      </Timeline>,
    );
    // Default variant is primary — the generated dot uses bg-primary.
    const dot = container.querySelector(".bg-primary");
    expect(dot).not.toBeNull();
  });

  it("renders a custom dot node when provided instead of the solid dot", () => {
    render(
      <Timeline>
        <TimelineItem dot={<span data-testid="custom-dot">🎉</span>}>
          Item with custom dot
        </TimelineItem>
      </Timeline>,
    );
    expect(screen.getByTestId("custom-dot")).toBeInTheDocument();
  });

  it("applies the dot color from the variant prop", () => {
    const { container } = render(
      <Timeline>
        <TimelineItem variant="success">Item</TimelineItem>
      </Timeline>,
    );
    const dot = container.querySelector(".bg-success");
    expect(dot).not.toBeNull();
  });
});
