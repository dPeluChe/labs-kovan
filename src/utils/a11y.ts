import type { KeyboardEvent } from "react";

const INTERACTIVE_SELECTOR =
    'a[href], button, input, select, textarea, summary, [role="button"], [role="link"], [role="checkbox"], [role="switch"], [role="tab"], [role="menuitem"], [contenteditable="true"], [tabindex]';

/**
 * Keyboard activation handler for elements with `role="button"` that cannot be
 * a native <button> (e.g. cards containing nested interactive controls).
 */
export function activationKeyDown(handler: () => void) {
    return (e: KeyboardEvent) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        // Activation keys pressed on a nested interactive control (e.g. the
        // completion checkbox inside a swipeable card) belong to that control;
        // don't preventDefault or fire the card action for them.
        let el = e.target as HTMLElement | null;
        while (el && el !== e.currentTarget) {
            if (el.matches(INTERACTIVE_SELECTOR)) return;
            el = el.parentElement;
        }
        e.preventDefault();
        handler();
    };
}
