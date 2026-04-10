import { MoreVertical } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface ContextMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  /** Rendered with error color (e.g. for destructive actions) */
  variant?: "default" | "danger";
  /** Disable/hide this item */
  hidden?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  /** DaisyUI dropdown alignment */
  align?: "start" | "end";
  /** Optional custom trigger (defaults to MoreVertical icon button) */
  trigger?: ReactNode;
  /** Additional classes for the dropdown content */
  contentClassName?: string;
}

/**
 * Standardized dropdown menu for card/row context actions.
 *
 * Replaces the repeated DaisyUI dropdown pattern:
 *   <div className="dropdown dropdown-end">
 *     <button tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
 *       <MoreVertical />
 *     </button>
 *     <ul tabIndex={0} className="dropdown-content menu ...">
 *       <li><button onClick={...}><Icon /> Label</button></li>
 *       ...
 *     </ul>
 *   </div>
 *
 * Example:
 *   <ContextMenu items={[
 *     { icon: Edit2, label: "Editar", onClick: onEdit },
 *     { icon: Trash2, label: "Eliminar", onClick: onDelete, variant: "danger" },
 *   ]} />
 */
export function ContextMenu({
  items,
  align = "end",
  trigger,
  contentClassName = "w-52",
}: ContextMenuProps) {
  const visibleItems = items.filter((item) => !item.hidden);
  if (visibleItems.length === 0) return null;

  return (
    <div className={`dropdown ${align === "end" ? "dropdown-end" : "dropdown-start"}`}>
      <button
        type="button"
        tabIndex={0}
        aria-label="Más opciones"
        className="btn btn-ghost btn-sm btn-circle"
      >
        {trigger ?? <MoreVertical className="w-5 h-5" />}
      </button>
      <ul
        tabIndex={0}
        className={`dropdown-content menu p-2 shadow bg-base-100 rounded-box border border-base-300 z-50 ${contentClassName}`}
      >
        {visibleItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <li key={`${item.label}-${idx}`}>
              <button
                type="button"
                onClick={item.onClick}
                className={item.variant === "danger" ? "text-error" : ""}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
