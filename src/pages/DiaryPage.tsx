import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageHeader } from "../components/ui/PageHeader";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { CreateDiaryEntryModal } from "../components/diary/CreateDiaryEntryModal";
import { EditDiaryEntryModal } from "../components/diary/EditDiaryEntryModal";
import { Plus, Users, Lock, Trash2, Calendar } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import type { Id, Doc } from "../../convex/_generated/dataModel";

const MOODS_MAP: Record<string, string> = {
    happy: "😊",
    grateful: "🙏",
    excited: "🤩",
    neutral: "😐",
    sad: "😔",
    tired: "😴",
    sick: "🤒",
};

export function DiaryPage() {
    const { currentFamily } = useFamily();
    const { user } = useAuth();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<Doc<"diaryEntries"> | null>(null);

    const entries = useQuery(api.diary.getEntries,
        currentFamily && user ? { familyId: currentFamily._id, userId: user._id } : "skip"
    );

    const deleteEntry = useMutation(api.diary.deleteEntry);

    if (!entries) return <PageLoader />;

    const handleDelete = async (e: React.MouseEvent, id: Id<"diaryEntries">) => {
        e.stopPropagation(); // Prevent opening edit modal
        if (!user) return;
        if (!window.confirm("¿Estás seguro de que deseas borrar este registro?")) return;
        try {
            await deleteEntry({ entryId: id, userId: user._id });
        } catch (e) {
            console.error("Failed to delete", e);
        }
    }

    const getConversationalDate = (timestamp: number) => {
        const date = new Date(timestamp);
        if (isToday(date)) return "Hoy";
        if (isYesterday(date)) return "Ayer";
        return format(date, "EEEE d 'de' MMMM", { locale: es });
    };

    return (
        <div className="pb-4 min-h-screen bg-base-100">
            <PageHeader
                title="Diario"
                subtitle="Historias y momentos"
                action={
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="btn btn-primary btn-sm gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo
                    </button>
                }
            />

            <div className="px-4 py-2">
                {entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                        <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mb-4">
                            <Calendar className="w-10 h-10 text-base-content/40" />
                        </div>
                        <h3 className="font-medium text-lg">Tu diario está vacío</h3>
                        <p className="text-sm mt-1 max-w-[200px]">Agradece, reflexiona o comparte tus momentos con la familia.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(entries.reduce((acc, entry) => {
                            const monthYear = format(entry.date, "MMMM yyyy", { locale: es });
                            if (!acc[monthYear]) acc[monthYear] = [];
                            acc[monthYear].push(entry);
                            return acc;
                        }, {} as Record<string, typeof entries>)).map(([monthYear, monthEntries]) => (
                            <div key={monthYear} className="space-y-4">
                                <div className="sticky top-0 z-20 bg-base-100/95 backdrop-blur-sm py-2 px-4 -mx-4 border-b border-base-200 shadow-sm">
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-base-content/60">
                                        {monthYear}
                                    </h2>
                                </div>
                                <div className="relative space-y-8 pl-4 border-l-2 border-base-200 ml-4 py-4">
                                    {monthEntries.map((entry) => {
                                        const dateStr = getConversationalDate(entry.date);
                                        const moodEmoji = entry.moodEmoji || MOODS_MAP[entry.mood || "neutral"] || "📝";
                                        const moodLabel = entry.moodLabel || (entry.mood === "custom" ? "Custom" : entry.mood);

                                        // Conversational Title
                                        const titlePrefix = entry.userId === user?._id ? "Te sentiste" : "Se sintió";
                                        const conversationalTitle = `${dateStr} ${titlePrefix.toLowerCase()} ${moodLabel}`;

                                        return (
                                            <div
                                                key={entry._id}
                                                onClick={() => user && entry.userId === user._id && setEditingEntry(entry)}
                                                className={`relative pl-6 animate-fade-in group cursor-pointer ${user && entry.userId === user._id ? "hover:translate-x-1 transition-transform" : ""}`}
                                            >
                                                {/* Timeline Dot */}
                                                <div className="absolute -left-[21px] top-0 w-10 h-10 rounded-full bg-base-100 border-4 border-base-100 flex items-center justify-center text-xl shadow-sm z-10 transition-transform hover:scale-110">
                                                    {moodEmoji}
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-bold text-lg leading-tight capitalize text-base-content/90">
                                                                {conversationalTitle}
                                                            </h3>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-xs text-base-content/50 font-medium capitalize">
                                                                    {format(entry.date, "p", { locale: es })}
                                                                </span>
                                                                {entry.visibility === "private" ? (
                                                                    <div className="badge badge-xs badge-ghost gap-1 pl-0 pr-2 bg-transparent border-0 text-base-content/40">
                                                                        <Lock className="w-3 h-3" />
                                                                        Solo yo
                                                                    </div>
                                                                ) : (
                                                                    <div className="badge badge-xs badge-ghost gap-1 pl-0 pr-2 bg-transparent border-0 text-primary/70">
                                                                        <Users className="w-3 h-3" />
                                                                        Familia
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Actions (Only for owner) */}
                                                        {user && entry.userId === user._id && (
                                                            <button
                                                                onClick={(e) => handleDelete(e, entry._id)}
                                                                className="btn btn-ghost btn-xs btn-square text-base-content/20 hover:text-error hover:bg-error/10"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {entry.content && (
                                                        <div className="relative mt-1 bg-base-200/40 p-4 rounded-2xl rounded-tl-none text-base-content/80 text-sm leading-relaxed whitespace-pre-wrap hover:bg-base-200/60 transition-colors">
                                                            {entry.content}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CreateDiaryEntryModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
            {editingEntry && (
                <EditDiaryEntryModal
                    isOpen={true}
                    onClose={() => setEditingEntry(null)}
                    entry={editingEntry}
                />
            )}
        </div>
    );
}
