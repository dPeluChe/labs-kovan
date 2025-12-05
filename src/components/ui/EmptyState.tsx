import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-base-300 rounded-xl bg-base-100/50 my-4">
      <div className="bg-base-200 rounded-full p-4 mb-4 animate-bounce-in">
        <Icon className="w-8 h-8 text-base-content/50" />
      </div>
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      {description && (
        <p className="text-base-content/60 text-sm mb-4 max-w-xs">{description}</p>
      )}
      {action}
    </div>
  );
}
