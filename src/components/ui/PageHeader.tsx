import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  startAction?: ReactNode;
}

export function PageHeader({ title, subtitle, action, startAction }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-base-100 gap-3">
      <div className="flex items-center gap-3 flex-1">
        {startAction}
        <div>
          <h1 className="text-xl font-bold leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-base-content/60 leading-tight">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
