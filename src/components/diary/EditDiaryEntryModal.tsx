import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MobileModal } from "../ui/MobileModal";
import { Users, Lock } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { DateInput } from "../ui/DateInput";
import type { Doc } from "../../../convex/_generated/dataModel";

interface EditDiaryEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: Doc<"diaryEntries">;
}

const MOODS = [
    { id: "custom", emoji: "✨", label: "Custom" },
    { id: "grateful", emoji: "🙏", label: "Agradecido" },
    { id: "happy", emoji: "😊", label: "Feliz" },
    { id: "excited", emoji: "🤩", label: "Emocionado" },
    { id: "neutral", emoji: "😐", label: "Normal" },
    { id: "sad", emoji: "😔", label: "Triste" },
    { id: "tired", emoji: "😴", label: "Cansado" },
    { id: "sick", emoji: "🤒", label: "Enfermo" },
];

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

                    {/* Visibility - Compact */}
                    <div className="flex-none">
                        <label className="label text-xs font-medium text-base-content/60">Visibilidad</label>
                        <div className="flex bg-base-200 rounded-lg p-1 h-[48px] items-center">
                            <button
                                type="button"
                                onClick={() => setVisibility("private")}
                                className={`h-full px-3 rounded-md flex items-center justify-center gap-1.5 transition-all text-sm font-medium ${visibility === "private" ? "bg-white shadow-sm text-primary" : "text-base-content/50 hover:text-base-content"
                                    }`}
                                title="Solo yo"
                            >
                                <Lock className="w-4 h-4" />
                                <span className="hidden sm:inline">Privado</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setVisibility("family")}
                                className={`h-full px-3 rounded-md flex items-center justify-center gap-1.5 transition-all text-sm font-medium ${visibility === "family" ? "bg-white shadow-sm text-primary" : "text-base-content/50 hover:text-base-content"
                                    }`}
                                title="Familia"
                            >
                                <Users className="w-4 h-4" />
                                <span className="hidden sm:inline">Familia</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mood Selector */}
                <div>
                    <label className="label text-xs font-medium text-base-content/60">¿Cómo te sentiste?</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar snap-x">
                        {MOODS.map((m) => (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => setMood(m.id)}
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
                                onChange={(e) => setCustomEmoji(e.target.value)}
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
                                onChange={(e) => setCustomLabel(e.target.value)}
                            />
                        </div>
                    </div>
                )}

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
