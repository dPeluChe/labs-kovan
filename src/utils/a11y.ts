import type { KeyboardEvent } from "react";

/**
 * Keyboard activation handler for elements with `role="button"` that cannot be
 * a native <button> (e.g. cards containing nested interactive controls).
 */
export function activationKeyDown(handler: () => void) {
    return (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handler();
        }
    };
}
