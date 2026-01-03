import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, type LucideIcon } from "lucide-react";

interface ResourceCardProps {
    title: string;
    subtitle?: string | ReactNode;
    icon?: LucideIcon | ReactNode;
    iconClassName?: string;
    to?: string;
    onClick?: () => void;
    action?: ReactNode;
    className?: string;
}

export function ResourceCard({
    title,
    subtitle,
    icon: IconOrNode,
    iconClassName = "text-primary",
    to,
    onClick,
    action,
    className = "",
}: ResourceCardProps) {

    const renderIcon = () => {
        if (!IconOrNode) return null;
        if (typeof IconOrNode === "function") {
            const Icon = IconOrNode as LucideIcon;
            return <Icon className={`w-5 h-5 ${iconClassName}`} />;
        }
        return IconOrNode;
    };

    const content = (
        <div className="card-body p-4">
            <div className="flex items-center gap-3">
                {IconOrNode && (
                    <div className={`p-2 rounded-lg bg-base-200 flex items-center justify-center shrink-0`}>
                        {renderIcon()}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base leading-tight truncate">{title}</h3>
                    {subtitle && (
                        <div className="text-sm text-base-content/60 truncate mt-0.5">
                            {subtitle}
                        </div>
                    )}
                </div>
                {action || (
                    (to || onClick) && <ChevronRight className="w-5 h-5 text-base-content/30 shrink-0" />
                )}
            </div>
        </div>
    );

    const baseClasses = `card bg-base-100 shadow-sm border border-base-200 animate-fade-in ${to || onClick ? "card-interactive cursor-pointer hover:shadow-md transition-all active:scale-[0.99]" : ""} ${className}`;

    if (to) {
        return (
            <Link to={to} className={baseClasses} onClick={onClick}>
                {content}
            </Link>
        );
    }

    return (
        <div onClick={onClick} className={baseClasses}>
            {content}
        </div>
    );
}
