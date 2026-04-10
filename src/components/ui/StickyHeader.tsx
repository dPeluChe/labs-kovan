import type { ReactNode } from "react";

interface StickyHeaderProps {
  /** Page title (left-aligned, bold) */
  title: string;
  /** Optional subtitle displayed below the title */
  subtitle?: string;
  /** Right-aligned action slot (typically a CircleAddButton or icon buttons) */
  action?: ReactNode;
  /** Tab row slot, rendered below title/action with its own padding */
  tabs?: ReactNode;
}

/**
 * Unified sticky header for pages that combine a title + actions + tab row.
 *
 * Replaces the common inline pattern:
 *   <div className="sticky top-0 z-40 bg-base-100/80 backdrop-blur-md pt-safe-top">
 *     <div className="px-4 py-3 flex items-center justify-between">...</div>
 *     <div className="px-4 pb-2"><AnimatedTabs ... /></div>
 *   </div>
 *
 * Use `PageHeader` for simple pages without tabs. Use `StickyHeader` when you
 * need the blurred sticky surface + tab row.
 */
export function StickyHeader({ title, subtitle, action, tabs }: StickyHeaderProps) {
  return (
    <div className="sticky-header">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-muted leading-tight">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
      </div>
      {tabs && <div className="px-4 pb-2">{tabs}</div>}
    </div>
  );
}
