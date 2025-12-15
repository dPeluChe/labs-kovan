
import React from 'react';

interface TabItem {
    id: string;
    icon: React.ElementType;
    label: string;
}

interface ShiftingTabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (id: string) => void;
    className?: string;
}

export function ShiftingTabs({ tabs, activeTab, onChange, className = "" }: ShiftingTabsProps) {
    return (
        <div className={`flex gap-1 bg-base-200 p-0.5 rounded-lg min-w-max sm:min-w-0 overflow-x-auto ${className}`}>
            {tabs.map((tab) => (
                <TabButton
                    key={tab.id}
                    active={activeTab === tab.id}
                    onClick={() => onChange(tab.id)}
                    icon={tab.icon}
                    label={tab.label}
                />
            ))}
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
    return (
        <button
            className={`flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-all duration-300 ${active
                ? "bg-primary text-primary-content shadow-sm flex-[2] min-w-[80px]"
                : "text-base-content/60 hover:bg-base-300 flex-1 sm:flex-none w-8 bg-transparent"
                }`}
            onClick={onClick}
            title={label}
        >
            <Icon className={`w-4 h-4 shrink-0 ${active ? "" : "opacity-70"}`} />
            {active && <span className="animate-fade-in whitespace-nowrap">{label}</span>}
        </button>
    );
}
