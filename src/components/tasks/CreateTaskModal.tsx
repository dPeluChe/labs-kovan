import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MobileModal } from "../ui/MobileModal";
import { Input } from "../ui/Input";
import { ShoppingCart, CheckSquare, Calendar, Flag } from "lucide-react";
import { useFamily } from "../../contexts/FamilyContext";
import { useAuth } from "../../contexts/AuthContext";

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultType?: "general" | "shopping" | "chore";
}

export function CreateTaskModal({ isOpen, onClose, defaultType = "general" }: CreateTaskModalProps) {
    const { currentFamily } = useFamily();
    const { user } = useAuth();
    const create = useMutation(api.tasks.create);

    const [title, setTitle] = useState("");
    const [type, setType] = useState<"general" | "shopping" | "chore">(defaultType);
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const [dueDate, setDueDate] = useState(""); // YYYY-MM-DD
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !currentFamily || !user) return;

        setIsLoading(true);
        try {
            await create({
                familyId: currentFamily._id,
                userId: user._id,
                title: title.trim(),
                type,
                priority: priority === "medium" ? undefined : priority,
                dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
            });
            setTitle("");
            onClose();
        } catch (error) {
            console.error("Failed to create task:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MobileModal isOpen={isOpen} onClose={onClose} title="Nueva Tarea">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Selector */}
                <div className="flex gap-2 p-1 bg-base-200 rounded-xl overflow-x-auto">
                    {[
                        { id: "general", label: "General", icon: CheckSquare },
                        { id: "shopping", label: "Super", icon: ShoppingCart },
                        { id: "chore", label: "Recurrente", icon: Calendar },
                    ].map((t) => {
                        const Icon = t.icon;
                        const isSelected = type === t.id;
                        return (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setType(t.id as "general" | "shopping" | "chore")}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${isSelected ? "bg-white shadow-sm text-primary" : "text-base-content/60 hover:text-base-content"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                <Input
                    label="¿Qué hay que hacer?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Comprar leche, Pagar internet..."
                    autoFocus
                />

                {/* Details Row */}
                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="label text-xs font-medium text-base-content/60">Fecha límite</label>
                        <input
                            type="date"
                            className="input input-bordered w-full"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>

                    <div className="flex-1">
                        <label className="label text-xs font-medium text-base-content/60">Prioridad</label>
                        <div className="flex gap-1 h-12 items-center bg-base-100 border border-base-200 rounded-lg px-2">
                            {(["low", "medium", "high"] as const).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPriority(p)}
                                    className={`flex-1 h-8 rounded-md flex items-center justify-center transition-all ${priority === p
                                        ? p === "high" ? "bg-red-500 text-white" : p === "medium" ? "bg-yellow-500 text-white" : "bg-blue-500 text-white"
                                        : "hover:bg-base-200"
                                        }`}
                                    title={p}
                                >
                                    <Flag className={`w-4 h-4 ${priority !== p ? "text-base-content/30" : ""}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        className="btn btn-primary w-full rounded-xl"
                        disabled={isLoading || !title.trim()}
                    >
                        {isLoading ? <span className="loading loading-spinner" /> : "Crear Tarea"}
                    </button>
                </div>
            </form>
        </MobileModal>
    );
}
