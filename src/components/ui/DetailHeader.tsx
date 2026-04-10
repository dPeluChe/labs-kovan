import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface DetailHeaderProps {
  /** Main title (bold, truncated) */
  title: string;
  /** Optional subtitle rendered below title (truncated) */
  subtitle?: ReactNode;
  /** Back handler. Defaults to `navigate(-1)` */
  onBack?: () => void;
  /** Right-aligned action slot (buttons, dropdowns...) */
  action?: ReactNode;
  /** Optional inline badge shown next to the title (e.g. status) */
  badge?: ReactNode;
  /** Optional description block rendered below title row, inside the sticky area */
  description?: ReactNode;
  /** Optional tab row (AnimatedTabs or filter buttons), rendered sticky */
  tabs?: ReactNode;
  /** Optional banner rendered at the bottom of the sticky area (e.g. "archived" notice) */
  banner?: ReactNode;
}

/**
 * Unified sticky header for detail/secondary pages that have a "back" button.
 *
 * Replaces inline patterns in:
 *   - GiftEventHeader (src/components/gifts/GiftEventHeader.tsx)
 *   - TripDetailPage (inline header)
 *   - PlaceVisitsPage (inline header)
 *   - other detail screens with back + title + optional tabs/banner
 *
 * For top-level pages without a back button, use `StickyHeader` or `PageHeader`.
 */
export function DetailHeader({
  title,
  subtitle,
  onBack,
  action,
  badge,
  description,
  tabs,
  banner,
}: DetailHeaderProps) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));

  return (
    <div className="sticky top-0 z-30 bg-base-100/90 backdrop-blur-md border-b border-base-300 shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Regresar"
          className="btn btn-ghost btn-sm btn-circle shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate leading-tight flex items-center gap-2">
            <span className="truncate">{title}</span>
            {badge}
          </h1>
          {subtitle && (
            <div className="text-xs text-muted truncate">{subtitle}</div>
          )}
        </div>

        {action && <div className="flex items-center gap-1 shrink-0">{action}</div>}
      </div>

      {description && <div className="px-4 pb-2">{description}</div>}

      {tabs && <div className="px-4 pb-2">{tabs}</div>}

      {banner}
    </div>
  );
}
