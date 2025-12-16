
import { FolderHeart } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";

interface PlaceListCardProps {
    list: Doc<"placeLists">;
    placeCount?: number;
    isSelected?: boolean;
    onClick: () => void;
    onEdit?: (e: React.MouseEvent) => void;
}

export function PlaceListCard({ list, placeCount = 0, isSelected, onClick, onEdit }: PlaceListCardProps) {
    return (
        <div
            onClick={onClick}
            className={`relative group p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden
        ${isSelected
                    ? "bg-primary text-primary-content border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                    : "bg-base-100 hover:bg-base-200/50 border-base-content/5 hover:border-base-content/10 hover:shadow-md"
                }
      `}
        >
            <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl mb-3 ${isSelected ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                    {list.icon ? (
                        <span className="text-xl">{list.icon}</span>
                    ) : (
                        <FolderHeart className="w-6 h-6" />
                    )}
                </div>
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className={`btn btn-xs btn-circle btn-ghost ${isSelected ? 'text-primary-content hover:bg-white/20' : ''}`}
                    >
                        •••
                    </button>
                )}
            </div>

            <div>
                <h3 className="font-bold text-lg mb-1 line-clamp-1">{list.name}</h3>
                <p className={`text-xs font-medium ${isSelected ? 'text-primary-content/70' : 'text-base-content/50'}`}>
                    {placeCount} lugares
                </p>
            </div>

            {/* Decorative background element */}
            <div className="absolute right-[-10px] bottom-[-10px] opacity-5 rotate-12 pointer-events-none">
                <FolderHeart className="w-24 h-24" />
            </div>
        </div>
    );
}
