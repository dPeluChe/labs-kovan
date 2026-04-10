import { Plus } from "lucide-react";
import type { ReactNode } from "react";

interface CircleAddButtonProps {
  onClick: () => void;
  /** Optional custom icon (defaults to Plus) */
  icon?: ReactNode;
  /** Accessible label / title */
  label?: string;
  /** Visual variant, defaults to primary */
  variant?: "primary" | "secondary" | "ghost";
  /** Optional disabled state */
  disabled?: boolean;
}

/**
 * The standard "add" button used in page headers across the app.
 * Replaces the repeated pattern: `btn btn-primary btn-sm btn-circle`.
 */
export function CircleAddButton({
  onClick,
  icon,
  label = "Agregar",
  variant = "primary",
  disabled = false,
}: CircleAddButtonProps) {
  const variantClass =
    variant === "secondary"
      ? "btn-secondary"
      : variant === "ghost"
        ? "btn-ghost"
        : "btn-primary";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`btn btn-sm btn-circle ${variantClass}`}
    >
      {icon ?? <Plus className="w-5 h-5" />}
    </button>
  );
}
