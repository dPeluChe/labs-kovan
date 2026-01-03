import { MOODS } from "./constants";

interface MoodSelectorProps {
    mood: string;
    onMoodChange: (mood: string) => void;
    customEmoji: string;
    onCustomEmojiChange: (emoji: string) => void;
    customLabel: string;
    onCustomLabelChange: (label: string) => void;
}

export function MoodSelector({
    mood,
    onMoodChange,
    customEmoji,
    onCustomEmojiChange,
    customLabel,
    onCustomLabelChange
}: MoodSelectorProps) {
    return (
        <div className="space-y-4">
            <div>
                <label className="label text-xs font-medium text-base-content/60">¿Cómo te sientes?</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar snap-x">
                    {MOODS.map((m) => (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => onMoodChange(m.id)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-w-[64px] snap-center ${mood === m.id ? "bg-primary/10 border-primary shadow-sm" : "bg-base-200 border-transparent hover:bg-base-300"
                                } border`}
                        >
                            <span className="text-2xl">{m.emoji}</span>
                            <span className="text-[10px] whitespace-nowrap">{m.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Mood Inputs */}
            {mood === "custom" && (
                <div className="flex gap-3 animate-fade-in bg-primary/5 border border-primary/20 p-3 rounded-xl transition-all">
                    <div className="w-16">
                        <label className="label text-[10px] font-medium text-base-content/60 pt-0">Emoji</label>
                        <input
                            type="text"
                            className="input input-sm input-bordered w-full text-center text-xl px-1 bg-white"
                            value={customEmoji}
                            onChange={(e) => onCustomEmojiChange(e.target.value)}
                            maxLength={2}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="label text-[10px] font-medium text-base-content/60 pt-0">Etiqueta</label>
                        <input
                            type="text"
                            className="input input-sm input-bordered w-full bg-white"
                            placeholder="Ej: Productivo, Zen..."
                            value={customLabel}
                            onChange={(e) => onCustomLabelChange(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
