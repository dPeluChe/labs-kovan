import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MobileModal } from "../ui/MobileModal";
import { Input } from "../ui/Input";
import { DateInput } from "../ui/DateInput";
import { ShoppingCart, CheckSquare, Calendar, Flag, Trash2 } from "lucide-react";
import { useFamily } from "../../contexts/FamilyContext";
import { useAuth } from "../../contexts/AuthContext";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import type { Doc } from "../../../convex/_generated/dataModel";

interface TaskFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultType?: "general" | "shopping" | "chore";
    taskToEdit?: Doc<"tasks">;
}

export function TaskFormModal({ isOpen, onClose, defaultType = "general", taskToEdit }: TaskFormModalProps) {
    const { currentFamily } = useFamily();
    const { user } = useAuth();
    const { confirm, ConfirmModal } = useConfirmModal(); // Hook
    const create = useMutation(api.tasks.create);
    const update = useMutation(api.tasks.update);
    const remove = useMutation(api.tasks.delete_task);

    const [title, setTitle] = useState("");
    const [type, setType] = useState<"general" | "shopping" | "chore">(defaultType);
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const [dueDate, setDueDate] = useState(""); // YYYY-MM-DD
    const [isLoading, setIsLoading] = useState(false);

    // Populate form when taskToEdit changes
    useEffect(() => {
        if (taskToEdit) {
            setTitle(taskToEdit.title);
            setType(taskToEdit.type as "general" | "shopping" | "chore");
            setPriority(taskToEdit.priority || "medium");
            if (taskToEdit.dueDate) {
                setDueDate(new Date(taskToEdit.dueDate).toISOString().split('T')[0]);
            } else {
                setDueDate("");
            }
        } else {
            // Reset form for create mode
            setTitle("");
            setType(defaultType);
            setPriority("medium");
            setDueDate("");
        }
    }, [taskToEdit, defaultType, isOpen]); // Reset on open if needed

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !currentFamily || !user) return;

        setIsLoading(true);
        try {
            if (taskToEdit) {
                await update({
                    taskId: taskToEdit._id,
                    familyId: currentFamily._id,
                    title: title.trim(),
                    type,
                    priority: priority === "medium" ? undefined : priority,
                    dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
                });
            } else {
                await create({
                    familyId: currentFamily._id,
                    userId: user._id,
                    title: title.trim(),
                    type,
                    priority: priority === "medium" ? undefined : priority,
                    dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
                });
            }
            setTitle("");
            onClose();
        } catch (error) {
            console.error("Failed to save task:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!taskToEdit || !currentFamily) return;

        const ok = await confirm({
            title: "Eliminar tarea",
            message: "¿Estás seguro de que deseas eliminar esta tarea?",
            confirmText: "Eliminar",
            variant: "danger",
            icon: "trash"
        });

        if (!ok) return;

        setIsLoading(true);
        try {
            await remove({ taskId: taskToEdit._id, familyId: currentFamily._id });
            onClose();
        } catch (error) {
            console.error("Failed to delete task:", error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <MobileModal isOpen={isOpen} onClose={onClose} title={taskToEdit ? "Editar Tarea" : "Nueva Tarea"}>
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
                            <DateInput
                                label="Fecha límite"
                                value={dueDate}
                                onChange={(val) => setDueDate(val)}
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

                    <div className="pt-4 space-y-3">
                        <button
                            type="submit"
                            className="btn btn-primary w-full rounded-xl"
                            disabled={isLoading || !title.trim()}
                        >
                            {isLoading ? <span className="loading loading-spinner" /> : (taskToEdit ? "Guardar Cambios" : "Crear Tarea")}
                        </button>

                        {taskToEdit && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="btn btn-ghost text-error w-full rounded-xl gap-2"
                                disabled={isLoading}
                            >
                                <Trash2 className="w-4 h-4" />
                                Eliminar Tarea
                            </button>
                        )}
                    </div>
                </form>
            </MobileModal>
            <ConfirmModal />
        </>
    );
}

// Export legacy name for compatibility if needed, but preferable to update usage
export const CreateTaskModal = TaskFormModal;
