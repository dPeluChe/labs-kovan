import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MobileModal } from "../ui/MobileModal";
import { useAuth } from "../../contexts/AuthContext";
import { DateInput } from "../ui/DateInput";
import { VisibilitySelector } from "../ui/VisibilitySelector";
import { MoodSelector } from "./MoodSelector";
import { MOODS } from "./constants";
import type { Doc } from "../../../convex/_generated/dataModel";

interface EditDiaryEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: Doc<"diaryEntries">;
}

export function EditDiaryEntryModal({ isOpen, onClose, entry }: EditDiaryEntryModalProps) {
    const { user } = useAuth();
    const update = useMutation(api.diary.updateEntry);

    const [content, setContent] = useState(entry.content || "");
    const [mood, setMood] = useState<string>(entry.mood || "grateful");
    const [visibility, setVisibility] = useState<"private" | "family">(entry.visibility);
    const [date, setDate] = useState(new Date(entry.date).toISOString().split("T")[0]);
    const [isLoading, setIsLoading] = useState(false);

    // Custom mood state
    const [customEmoji, setCustomEmoji] = useState(entry.moodEmoji || "✨");
    const [customLabel, setCustomLabel] = useState(entry.moodLabel || "");

    const today = new Date().toISOString().split("T")[0];
    const oneYearAgoDate = new Date();
    oneYearAgoDate.setFullYear(oneYearAgoDate.getFullYear() - 1);
    const minDate = oneYearAgoDate.toISOString().split("T")[0];

    useEffect(() => {
        if (entry) {
            setContent(entry.content || "");
            setMood(entry.mood || "grateful");
            setVisibility(entry.visibility);
            setDate(new Date(entry.date).toISOString().split("T")[0]);
            setCustomEmoji(entry.moodEmoji || "✨");
            setCustomLabel(entry.moodLabel || "");
        }
    }, [entry]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        let finalEmoji = "";
        let finalLabel = "";

        if (mood === "custom") {
            finalEmoji = customEmoji.trim() || "✨";
            finalLabel = customLabel.trim() || "Custom";
        } else {
            const found = MOODS.find(m => m.id === mood);
            if (found) {
                finalEmoji = found.emoji;
                finalLabel = found.label;
            }
        }

        setIsLoading(true);
        try {
            await update({
                entryId: entry._id,
                userId: user._id,
                content: content.trim() || undefined,
                mood,
                moodEmoji: finalEmoji,
                moodLabel: finalLabel,
                visibility,
                date: date ? new Date(date).getTime() : entry.date,
            });
            onClose();
        } catch (error) {
            console.error("Failed to update entry:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const modalTitle = visibility === "private" ? "🔒 Solo yo lo veré" : "👥 Compartiré con mi familia";

    return (
        <MobileModal isOpen={isOpen} onClose={onClose} title={modalTitle}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-3">
                    {/* Date Input */}
                    <div className="flex-1 min-w-0">
                        <DateInput
                            label="Fecha"
                            value={date}
                            onChange={setDate}
                            placeholder="Hoy"
                            max={today}
                            min={minDate}
                        />
                    </div>

                    {/* Visibility */}
                    <VisibilitySelector value={visibility} onChange={setVisibility} />
                </div>

                {/* Mood Selector */}
                <MoodSelector
                    mood={mood}
                    onMoodChange={setMood}
                    customEmoji={customEmoji}
                    onCustomEmojiChange={setCustomEmoji}
                    customLabel={customLabel}
                    onCustomLabelChange={setCustomLabel}
                />

                {/* Content */}
                <div>
                    <label className="label text-xs font-medium text-base-content/60">Tu historia</label>
                    <textarea
                        className="textarea textarea-bordered w-full h-32 rounded-xl leading-relaxed resize-none text-base focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Edita tu historia..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    className="btn btn-primary w-full rounded-xl shadow-lg shadow-primary/20"
                    disabled={isLoading}
                >
                    {isLoading ? <span className="loading loading-spinner" /> : "Guardar Cambios"}
                </button>
            </form>
        </MobileModal>
    );
}
