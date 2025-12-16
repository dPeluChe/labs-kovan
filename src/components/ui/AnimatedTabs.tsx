
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export interface TabItem<T extends string = string> {
    id: T;
    label: string;
    icon?: ReactNode;
    count?: number;
}

interface AnimatedTabsProps<T extends string = string> {
    tabs: readonly TabItem<T>[] | TabItem<T>[];
    activeTab: T;
    onTabChange: (id: T) => void;
    layoutId?: string;
    className?: string;
}

export function AnimatedTabs<T extends string = string>({ tabs, activeTab, onTabChange, layoutId = "activeTab", className = "" }: AnimatedTabsProps<T>) {
    return (
        <div className={`bg-base-200/50 p-1 rounded-2xl flex relative justify-between items-center h-12 ${className}`}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`relative h-10 px-4 rounded-xl transition-all z-10 flex items-center justify-center gap-2 ${isActive ? 'text-primary-content flex-grow' : 'text-base-content/60 hover:text-base-content flex-none aspect-square'}`}
                    >
                        {isActive && (
                            <motion.div
                                layoutId={layoutId}
                                className="absolute inset-0 bg-primary rounded-xl shadow-md -z-10"
                                transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                            />
                        )}
                        <span className="z-10">{tab.icon}</span>

                        {isActive && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                className="font-bold text-sm whitespace-nowrap overflow-hidden"
                            >
                                {tab.label}
                            </motion.span>
                        )}

                        {isActive && tab.count !== undefined && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="z-10 badge badge-sm badge-circle border-0 h-5 w-5 text-[10px] bg-white/20 text-white ml-1"
                            >
                                {tab.count}
                            </motion.span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
