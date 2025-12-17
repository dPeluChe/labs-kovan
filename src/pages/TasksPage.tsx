import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { AnimatedTabs } from "../components/ui/AnimatedTabs";
import { TaskItem } from "../components/tasks/TaskItem";
import { CreateTaskModal } from "../components/tasks/CreateTaskModal";
import { CheckSquare, ShoppingCart, Repeat, Plus } from "lucide-react";
import type { Doc } from "../../convex/_generated/dataModel";
import { useFamily } from "../contexts/FamilyContext";

export function TasksPage() {
    const { currentFamily } = useFamily();
    const [activeTab, setActiveTab] = useState<"general" | "shopping" | "chore">("general");
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Queries
    const allTasks = useQuery(
        api.tasks.list,
        currentFamily ? { familyId: currentFamily._id } : "skip"
    ) as Doc<"tasks">[] | undefined;

    const toggleStatus = useMutation(api.tasks.toggleStatus);
    const deleteTask = useMutation(api.tasks.delete_task);

    // We optimize by fetching all and filtering client side for smoothest tab transitions
    // But if list is huge, we should filter server side. 
    // Given current usage, client side filtering of a few hundred tasks is fine and provides instant tab switching.

    // Filter logic
    const tasks = allTasks?.filter(t => {
        // Show pending tasks of the active type
        return t.type === activeTab;
    }).sort((a, b) => {
        // Sort completed to bottom
        if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
        return 0; // Existing sort from backend is preserved
    });

    const pendingCount = allTasks?.filter(t => t.type === "general" && t.status === "pending").length;
    const shoppingCount = allTasks?.filter(t => t.type === "shopping" && t.status === "pending").length;
    const choreCount = allTasks?.filter(t => t.type === "chore" && t.status === "pending").length;

    if (allTasks === undefined) return <PageLoader />;

    const tabs = [
        { id: "general", label: "Pendientes", icon: <CheckSquare className="w-4 h-4" />, count: pendingCount },
        { id: "shopping", label: "Super", icon: <ShoppingCart className="w-4 h-4" />, count: shoppingCount },
        { id: "chore", label: "Rutina", icon: <Repeat className="w-4 h-4" />, count: choreCount },
    ] as const;

    return (
        <div className="pb-20">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-base-100/80 backdrop-blur-md pt-safe-top">
                <div className="px-4 py-3 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Tareas</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn btn-primary btn-sm btn-circle"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-4 pb-2">
                    <AnimatedTabs
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabChange={(id) => setActiveTab(id as any)}
                    />
                </div>
            </div>

            <div className="px-4 py-4 space-y-4">
                {/* Active Tasks */}
                <div className="min-h-[300px]">
                    {tasks && tasks.length > 0 ? (
                        <div className="space-y-2">
                            {tasks.map((task) => (
                                <TaskItem
                                    key={task._id}
                                    task={task}
                                    onToggle={(id) => currentFamily && toggleStatus({ taskId: id, familyId: currentFamily._id })}
                                    onClick={(t) => {
                                        // Open edit modal (Future)
                                        console.log("Edit", t);
                                    }}
                                    onDelete={(id) => currentFamily && deleteTask({ taskId: id, familyId: currentFamily._id })}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={activeTab === "shopping" ? ShoppingCart : CheckSquare}
                            title="Todo listo"
                            description={`No hay tareas pendientes en ${activeTab === "shopping" ? "la lista del super" :
                                activeTab === "chore" ? "rutina" : "pendientes"
                                }.`}
                            action={
                                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
                                    Agregar tarea
                                </button>
                            }
                        />
                    )}
                </div>
            </div>

            <CreateTaskModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                defaultType={activeTab}
            />
        </div>
    );
}
