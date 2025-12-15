
import { ChevronRight } from "lucide-react";
import { ItemCard } from "./ItemCard";
import type { Doc } from "../../../convex/_generated/dataModel";
import type { ConfirmOptions } from "../../hooks/useConfirmModal";
import type { LucideIcon } from "lucide-react";

export function CollectionSection({
    title,
    icon: Icon,
    items,
    onViewAll,
    confirm,
}: {
    title: string;
    icon: LucideIcon;
    items: Doc<"collections">[];
    onViewAll: () => void;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}) {
    if (items.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-base-200 rounded-lg text-primary">
                        <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg">{title}</h3>
                    <span className="badge badge-sm badge-ghost">{items.length}</span>
                </div>
                <button onClick={onViewAll} className="btn btn-ghost btn-xs gap-1">
                    Ver todos <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Horizontal Scroll Shelf */}
            <div className="flex gap-4 overflow-x-auto pb-4 px-1 snap-x no-scrollbar">
                {items.slice(0, 6).map((item) => ( // Show max 6 in shelf
                    <div key={item._id} className="min-w-[160px] w-[160px] snap-start">
                        <ItemCard item={item} confirm={confirm} />
                    </div>
                ))}
                {items.length > 6 && (
                    <div className="min-w-[100px] flex items-center justify-center snap-start">
                        <button onClick={onViewAll} className="btn btn-circle btn-outline">
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
