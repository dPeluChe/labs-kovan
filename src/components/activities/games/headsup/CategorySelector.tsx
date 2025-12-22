import type { HeadsUpCategory } from "../../types";
import { HEADS_UP_CATEGORIES } from "./types";

interface CategorySelectorProps {
  currentCategory: HeadsUpCategory;
  onCategoryChange: (category: HeadsUpCategory) => void;
}

export function CategorySelector({
  currentCategory,
  onCategoryChange,
}: CategorySelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.entries(HEADS_UP_CATEGORIES).map(([key, config]) => {
        const isSelected = currentCategory === key;
        const cardCount = config.cards.length;

        return (
          <button
            key={key}
            onClick={() => onCategoryChange(key as HeadsUpCategory)}
            disabled={cardCount === 0 && key !== "familiares" && key !== "custom"}
            className={`card bg-base-100 shadow-sm border transition-all text-left ${
              isSelected ? "border-primary" : "border-base-300 hover:border-primary/50"
            }`}
          >
            <div className="card-body p-4 flex flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm">{config.name}</h3>
                <p className="text-xs text-base-content/60">
                  {cardCount > 0 ? `${cardCount} cartas` : "Personalizado"}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
