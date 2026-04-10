import type { ReactNode } from "react";

interface IconBadgeProps {
  /**
   * Pre-composed color classes (background + foreground).
   * Use `moduleColor("finances")` from `lib/moduleColors.ts` when the badge
   * represents a feature module. Defaults to neutral gray.
   */
  color?: string;
  /** Badge size */
  size?: "xs" | "sm" | "md" | "lg";
  /** Shape variant */
  rounded?: "md" | "lg" | "full";
  /** Additional classes */
  className?: string;
  /** Icon node (typically a lucide-react icon) */
  children: ReactNode;
}

const SIZE_CLASSES: Record<NonNullable<IconBadgeProps["size"]>, string> = {
  xs: "p-1.5",
  sm: "p-2",
  md: "p-2.5",
  lg: "p-3",
};

const ROUNDED_CLASSES: Record<NonNullable<IconBadgeProps["rounded"]>, string> = {
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

/**
 * A small colored container for an icon, used to visually identify a feature
 * or category. Replaces the repeated inline pattern:
 *
 *   <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
 *     <Icon className="w-5 h-5" />
 *   </div>
 *
 * Example:
 *   <IconBadge color={moduleColor("finances")} size="md">
 *     <DollarSign className="w-5 h-5" />
 *   </IconBadge>
 */
export function IconBadge({
  color = "bg-base-200 text-base-content",
  size = "md",
  rounded = "lg",
  className = "",
  children,
}: IconBadgeProps) {
  return (
    <div
      className={`${SIZE_CLASSES[size]} ${ROUNDED_CLASSES[rounded]} ${color} inline-flex items-center justify-center ${className}`}
    >
      {children}
    </div>
  );
}
