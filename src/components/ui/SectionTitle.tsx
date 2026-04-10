import type { ReactNode } from "react";

interface SectionTitleProps {
  /** The section label */
  children: ReactNode;
  /** Optional icon or emoji rendered to the left of the label */
  icon?: ReactNode;
  /** Optional right-aligned slot (e.g. a "Ver todo" link) */
  action?: ReactNode;
  /** Additional classes for the wrapper */
  className?: string;
}

/**
 * Unified section title used to label groups of content inside a page.
 *
 * Replaces the repeated inline pattern:
 *   <h3 className="text-sm font-semibold text-base-content/60 mb-2">...</h3>
 */
export function SectionTitle({ children, icon, action, className = "" }: SectionTitleProps) {
  return (
    <div className={`flex items-center justify-between mb-2 ${className}`}>
      <h3 className="text-sm font-semibold text-muted flex items-center gap-1.5">
        {icon}
        {children}
      </h3>
      {action}
    </div>
  );
}
