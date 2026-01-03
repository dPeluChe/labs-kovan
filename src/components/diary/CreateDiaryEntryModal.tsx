import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MobileModal } from "../ui/MobileModal";
import { useFamily } from "../../contexts/FamilyContext";
import { useAuth } from "../../contexts/AuthContext";
import { DateInput } from "../ui/DateInput";
import { VisibilitySelector } from "../ui/VisibilitySelector";
import { MoodSelector } from "./MoodSelector";
import { MOODS } from "./constants";

interface CreateDiaryEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateDiaryEntryModal({ isOpen, onClose }: CreateDiaryEntryModalProps) {
    const { currentFamily } = useFamily();
    const { user } = useAuth();
    const create = useMutation(api.diary.createEntry);

    const [content, setContent] = useState("");
    const [mood, setMood] = useState<string>("grateful");
    const [visibility, setVisibility] = useState<"private" | "family">("private");
    const [date, setDate] = useState(""); // YYYY-MM-DD
    const [isLoading, setIsLoading] = useState(false);

    // Custom mood state
    const [customEmoji, setCustomEmoji] = useState("✨");
    const [customLabel, setCustomLabel] = useState("");

    // Calculate Date Limits
    const today = new Date().toISOString().split("T")[0];
    const oneYearAgoDate = new Date();
    oneYearAgoDate.setFullYear(oneYearAgoDate.getFullYear() - 1);
    const minDate = oneYearAgoDate.toISOString().split("T")[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentFamily || !user) return;

        // Determine final emoji/label
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
            await create({
                familyId: currentFamily._id,
                userId: user._id,
                content: content.trim() || undefined,
                mood,
                moodEmoji: finalEmoji,
                moodLabel: finalLabel,
                visibility,
                date: date ? new Date(date).getTime() : Date.now(),
            });
            // Reset
            setContent("");
            setMood("grateful");
            setCustomEmoji("✨");
            setCustomLabel("");
            setVisibility("private");
            setDate("");
            onClose();
        } catch (error) {
            console.error("Failed to create entry:", error);
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
                    <label className="label text-xs font-medium text-base-content/60">Tu historia (opcional)</label>
                    <textarea
                        className="textarea textarea-bordered w-full h-32 rounded-xl leading-relaxed resize-none text-base focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Escribe aquí... (Eventos, agradecimientos, pensamientos)"
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
                    {isLoading ? <span className="loading loading-spinner" /> : "Guardar Registro"}
                </button>
            </form>
        </MobileModal>
    );
}
