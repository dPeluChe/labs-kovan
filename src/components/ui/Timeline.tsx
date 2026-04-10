import type { ReactNode } from "react";

interface TimelineProps {
  children: ReactNode;
  className?: string;
}

/**
 * Vertical timeline container. Provides the left connecting line.
 * Use together with `TimelineItem` children.
 *
 * Example:
 *   <Timeline>
 *     <TimelineItem><VisitCard /></TimelineItem>
 *     <TimelineItem variant="success"><VisitCard /></TimelineItem>
 *   </Timeline>
 */
export function Timeline({ children, className = "" }: TimelineProps) {
  return (
    <div
      className={`relative border-l-2 border-base-300 ml-3 space-y-8 py-2 ${className}`}
    >
      {children}
    </div>
  );
}

type TimelineVariant = "primary" | "success" | "warning" | "error" | "muted";

interface TimelineItemProps {
  children: ReactNode;
  /** Controls the dot color */
  variant?: TimelineVariant;
  /** Optional custom dot content (emoji, icon…). Overrides the solid dot. */
  dot?: ReactNode;
  /** Use larger dot for emoji/icon dots (auto-enabled when `dot` is set) */
  largeDot?: boolean;
  className?: string;
}

const DOT_COLORS: Record<TimelineVariant, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  muted: "bg-base-content/30",
};

/**
 * A single row in a `Timeline`. Renders the colored dot and positions its
 * children to the right of the connecting line.
 *
 * Replaces inline patterns like:
 *   <div className="relative pl-6">
 *     <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-base-100" />
 *     {content}
 *   </div>
 */
export function TimelineItem({
  children,
  variant = "primary",
  dot,
  largeDot = false,
  className = "",
}: TimelineItemProps) {
  const useLargeDot = largeDot || !!dot;

  return (
    <div className={`relative ${useLargeDot ? "pl-8" : "pl-6"} ${className}`}>
      {dot ? (
        <div className="absolute -left-[21px] top-0 w-10 h-10 rounded-full bg-base-100 border-4 border-base-100 flex items-center justify-center text-xl shadow-sm z-10">
          {dot}
        </div>
      ) : (
        <div
          className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${DOT_COLORS[variant]} border-4 border-base-100 shadow-sm`}
        />
      )}
      {children}
    </div>
  );
}
