import type { Doc } from "../../../convex/_generated/dataModel";
import { Check, Calendar, User as UserIcon, Trash2 } from "lucide-react";
import { SwipeableCard } from "../ui/SwipeableCard";

interface TaskItemProps {
    task: Doc<"tasks">;
    onToggle: (taskId: Doc<"tasks">["_id"]) => void;
    onClick: (task: Doc<"tasks">) => void;
    onDelete: (taskId: Doc<"tasks">["_id"]) => void;
}

export function TaskItem({ task, onToggle, onClick, onDelete }: TaskItemProps) {
    const isCompleted = task.status === "completed";

    // Priority colors
    const priorityColor = {
        low: "bg-blue-500",
        medium: "bg-yellow-500",
        high: "bg-red-500",
    };

    const formatDate = (timestamp: number) => {
        return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(new Date(timestamp));
    };

    return (
        <SwipeableCard
            enabled={!isCompleted}
            actions={!isCompleted ? ({ close }) => (
                <button
                    onClick={() => {
                        onDelete(task._id);
                        close();
                    }}
                    className="btn btn-error btn-square btn-sm h-full rounded-xl"
                >
                    <Trash2 className="w-5 h-5 text-white" />
                </button>
            ) : null}
            contentClassName={`bg-base-100 p-3 rounded-xl border border-transparent transition-all duration-200 ${isCompleted ? "opacity-50" : "hover:border-base-content/10 shadow-sm"
                }`}
            className="mb-2"
            onClick={() => onClick(task)}
        >
            <div className="flex items-center gap-3">
                {/* Checkbox */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle(task._id);
                    }}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isCompleted
                        ? "bg-primary border-primary text-primary-content"
                        : "border-base-content/20 hover:border-primary"
                        }`}
                >
                    {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`font-medium truncate ${isCompleted ? "line-through text-base-content/50" : "text-base-content"}`}>
                            {task.title}
                        </span>
                        {task.priority && task.priority !== "low" && !isCompleted && (
                            <div className={`w-1.5 h-1.5 rounded-full ${priorityColor[task.priority]}`} />
                        )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-base-content/60">
                        {task.dueDate && (
                            <span className={`flex items-center gap-1 ${task.dueDate < new Date().getTime() && !isCompleted ? "text-error" : ""
                                }`}>
                                <Calendar className="w-3 h-3" />
                                {formatDate(task.dueDate)}
                            </span>
                        )}

                        {task.type === "shopping" && (
                            <span className="bg-orange-500/10 text-orange-600 px-1.5 py-0.5 rounded-md font-medium text-[10px]">
                                Super
                            </span>
                        )}

                        {task.assignedTo && (
                            <span className="flex items-center gap-1">
                                <UserIcon className="w-3 h-3" />
                                {/* Placeholder until we have user lookup */}
                                <span>Asignado</span>
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </SwipeableCard>
    );
}
