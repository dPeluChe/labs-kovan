import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface DashboardCardProps {
    icon: LucideIcon;
    title: string;
    to: string;
    color: string;
    children: React.ReactNode;
}

export function DashboardCard({
    icon: Icon,
    title,
    to,
    color,
    children,
}: DashboardCardProps) {
    return (
        <Link to={to} className="card bg-base-100 shadow-sm border border-base-300 card-interactive">
            <div className="card-body p-4">
                <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${color} transition-transform group-hover:scale-110`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1">{title}</h3>
                        {children}
                    </div>
                </div>
            </div>
        </Link>
    );
}
