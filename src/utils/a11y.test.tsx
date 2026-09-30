import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { activationKeyDown } from "./a11y";

function Card({ onActivate, onNested }: { onActivate: () => void; onNested?: () => void }) {
  return (
    <div role="button" tabIndex={0} onKeyDown={activationKeyDown(onActivate)}>
      card body
      <button onClick={onNested}>nested</button>
    </div>
  );
}

describe("activationKeyDown", () => {
  it("activates on Enter and Space when the element itself is focused", async () => {
    const onActivate = vi.fn();
    render(<Card onActivate={onActivate} />);
    screen.getByRole("button", { name: /card body/ }).focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onActivate).toHaveBeenCalledTimes(2);
  });

  it("ignores activation keys bubbling from a nested interactive control", async () => {
    const onActivate = vi.fn();
    const onNested = vi.fn();
    render(<Card onActivate={onActivate} onNested={onNested} />);
    screen.getByRole("button", { name: "nested" }).focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onActivate).not.toHaveBeenCalled();
    expect(onNested).toHaveBeenCalled();
  });
});
