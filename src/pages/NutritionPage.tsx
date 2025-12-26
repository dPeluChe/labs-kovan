import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageHeader } from "../components/ui/PageHeader";
import type { Id, Doc } from "../../convex/_generated/dataModel";
import { MobileModal } from "../components/ui/MobileModal";
import {
    Utensils,
    Plus,
    Minus,
    Calendar as CalendarIcon,
    Beef,
    Wheat,
    Candy,
    Carrot,
    Apple,
    Milk,
    Activity,
    Droplet,
    PlusCircle,
    FileText,
    User,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    ClipboardList,
    Bean,
    X,
} from "lucide-react";
import { DateInput } from "../components/ui/DateInput";

// Helper to get local YYYY-MM-DD
const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

type ViewMode = "tracker" | "plans" | "create-plan" | "edit-plan";

interface Participant {
    id: string; // userId
    name: string;
    imageUrl?: string;
    userId: Id<"users">;
    personId?: Id<"personProfiles">; // Optional: Only if health profile exists
}

export function NutritionPage() {
    const { currentFamily } = useFamily();
    // Replaced selectedPersonId with selectedParticipantId to handle both users and profiles
    const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
    const [view, setView] = useState<ViewMode>("tracker");

    // Editor State
    const [editingPlan, setEditingPlan] = useState<Doc<"nutritionPlans"> | null>(null);

    // Assignment State (Lifted from PlansManager)
    const [assigningPlan, setAssigningPlan] = useState<Doc<"nutritionPlans"> | null>(null);
    const [targetPersonId, setTargetPersonId] = useState<Id<"personProfiles"> | null>(null);

    // 1. Fetch Family Members (Users) - Source of Truth
    const familyMembers = useQuery(api.families.getFamilyMembers,
        currentFamily ? { familyId: currentFamily._id } : "skip"
    );

    // 2. Fetch Health Profiles (to link to users)
    const healthProfiles = useQuery(api.health.getPersonProfiles,
        currentFamily ? { familyId: currentFamily._id } : "skip"
    );

    const createProfile = useMutation(api.health.createPersonProfile);

    // 3. Merge lists to create "Participants" - STRICTLY MATCHED TO USERS
    const participants = useMemo<Participant[]>(() => {
        if (!familyMembers) return [];

        const list: Participant[] = [];

        familyMembers.forEach(member => {
            if (!member) return;
            // Match health profile by exact name (case insensitive)
            const matchingProfile = healthProfiles?.find(p =>
                p.name.trim().toLowerCase() === member.name.trim().toLowerCase() &&
                p.type === "human"
            );

            list.push({
                id: member._id, // User ID is the key
                name: member.name,
                imageUrl: member.photoUrl,
                userId: member._id,
                personId: matchingProfile?._id
            });
        });

        return list;
    }, [familyMembers, healthProfiles]);

    // Auto-select first participant
    if (participants.length > 0 && !selectedParticipantId) {
        setSelectedParticipantId(participants[0].id);
    }

    const activeParticipant = participants.find(p => p.id === selectedParticipantId);

    const handleCreatePlan = () => {
        setEditingPlan(null);
        setView("create-plan");
    };

    const handleEditPlan = (plan: Doc<"nutritionPlans">) => {
        setEditingPlan(plan);
        setView("edit-plan");
    };

    const handleCloseEditor = () => {
        setEditingPlan(null);
        setView("plans");
    };

    // Smart Assign Flow
    const handleInitiateAssign = async (plan: Doc<"nutritionPlans">) => {
        if (!activeParticipant || !currentFamily) return;

        let pid = activeParticipant.personId;

        // If user has no profile yet, create it silently
        if (!pid) {
            try {
                pid = await createProfile({
                    familyId: currentFamily._id,
                    type: "human",
                    name: activeParticipant.name,
                    relation: "Family Member", // Default
                });
            } catch (e) {
                console.error("Failed to auto-create profile for assignment", e);
                return;
            }
        }

        setTargetPersonId(pid);
        setAssigningPlan(plan);
    };

    return (
        <div className="pb-20 min-h-screen bg-base-100">
            {/* Editor is now a full screen overlay */}
            {(view === "create-plan" || view === "edit-plan") && (
                <PlanEditor
                    familyId={currentFamily!._id}
                    plan={editingPlan}
                    onClose={handleCloseEditor}
                />
            )}

            {/* Assignment Modal (Lifted) */}
            {assigningPlan && targetPersonId && currentFamily && (
                <AssignPlanModal
                    familyId={currentFamily._id}
                    personId={targetPersonId}
                    plan={assigningPlan}
                    onClose={() => setAssigningPlan(null)}
                />
            )}

            <PageHeader
                title="Nutrición"
                subtitle={currentFamily?.name}
                action={
                    <button
                        onClick={() => setView(view === "tracker" ? "plans" : "tracker")}
                        className="btn btn-sm btn-ghost gap-2"
                    >
                        {view === "tracker" ? <FileText className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                        {view === "tracker" ? "Ver Planes" : "Ver Diario"}
                    </button>
                }
            />

            {/* Participants Selector */}
            {participants.length > 0 && (
                <div className="px-4 mb-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {participants.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedParticipantId(p.id)}
                                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all
                  ${selectedParticipantId === p.id
                                        ? "bg-primary text-primary-content border-primary shadow-md"
                                        : "bg-base-100 border-base-300 hover:bg-base-200"
                                    }
                `}
                            >
                                <div className="w-6 h-6 rounded-full bg-base-300 flex items-center justify-center overflow-hidden">
                                    {p.imageUrl ? (
                                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-3 h-3 opacity-50" />
                                    )}
                                </div>
                                {p.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {activeParticipant && currentFamily ? (
                <>
                    {view === "tracker" ? (
                        activeParticipant.personId ? (
                            <DailyTracker
                                familyId={currentFamily._id}
                                personId={activeParticipant.personId}
                            />
                        ) : (
                            <div className="p-8 text-center opacity-60">
                                <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="text-sm">No hay plan asignado.</p>
                                <button
                                    onClick={() => setView("plans")}
                                    className="btn btn-sm btn-link text-primary no-underline mt-2"
                                >
                                    Ir a Planes
                                </button>
                            </div>
                        )
                    ) : (
                        <PlansManager
                            familyId={currentFamily._id}
                            onAssign={handleInitiateAssign}
                            onCreate={handleCreatePlan}
                            onEdit={handleEditPlan}
                        />
                    )}
                </>
            ) : (
                <div className="p-8 text-center text-base-content/50">
                    <Utensils className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Selecciona un miembro de la familia</p>
                </div>
            )}
        </div>
    );
}

function DailyTracker({ familyId, personId }: { familyId: Id<"families">, personId: Id<"personProfiles"> }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showMealModal, setShowMealModal] = useState(false);

    const dateStr = useMemo(() => getLocalDateString(selectedDate), [selectedDate]);
    // Timestamp for getting the assignment active at that specific day
    const queryTimestamp = useMemo(() => {
        const d = new Date(selectedDate);
        d.setHours(12, 0, 0, 0);
        return d.getTime();
    }, [selectedDate]);

    // Queries
    const activeAssignment = useQuery(api.nutrition.getActiveAssignment, {
        personId,
        date: queryTimestamp,
    });

    const dailyLog = useQuery(api.nutrition.getDailyLog, {
        personId,
        date: dateStr,
    });

    const todayMeals = useQuery(api.nutrition.getMeals, {
        personId,
        date: dateStr,
    });

    const logIntake = useMutation(api.nutrition.logIntake);

    const handleLog = (type: string, delta: number) => {
        logIntake({
            familyId,
            personId,
            date: dateStr,
            type,
            delta,
        });
    };

    const shiftDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + days);
        setSelectedDate(newDate);
    };

    if (activeAssignment === undefined) return <div className="p-8 text-center loading loading-dots"></div>;

    const { plan } = activeAssignment || {};
    const consumed = dailyLog?.consumed || {};

    const trackers = [
        { key: "protein", label: "Proteína / AOA", icon: Beef, color: "text-red-500", bg: "bg-red-500/10", target: plan?.targets?.protein },
        { key: "carbs", label: "Cereales", icon: Wheat, color: "text-amber-500", bg: "bg-amber-500/10", target: plan?.targets?.carbs },
        { key: "legumes", label: "Leguminosas", icon: Bean, color: "text-orange-700", bg: "bg-orange-700/10", target: plan?.targets?.legumes },
        { key: "fat", label: "Grasas", icon: Droplet, color: "text-yellow-500", bg: "bg-yellow-500/10", target: plan?.targets?.fat },
        { key: "veggies", label: "Verduras", icon: Carrot, color: "text-green-500", bg: "bg-green-500/10", target: plan?.targets?.veggies },
        { key: "fruits", label: "Frutas", icon: Apple, color: "text-lime-500", bg: "bg-lime-500/10", target: plan?.targets?.fruits },
        { key: "dairy", label: "Leches", icon: Milk, color: "text-cyan-500", bg: "bg-cyan-500/10", target: plan?.targets?.dairy },
        { key: "water", label: "Agua", icon: Droplet, color: "text-blue-500", bg: "bg-blue-500/10", target: undefined },
        { key: "other", label: "Extras", icon: Candy, color: "text-purple-500", bg: "bg-purple-500/10", target: undefined },
    ].filter(t => (t.target || 0) > 0 || (consumed[t.key as keyof typeof consumed] || 0) > 0);

    return (
        <div className="px-4 space-y-4">
            {showMealModal && (
                <LogMealModal
                    familyId={familyId}
                    personId={personId}
                    date={dateStr}
                    plan={plan}
                    onClose={() => setShowMealModal(false)}
                />
            )}

            {/* Date Navigator */}
            <div className="flex items-center justify-between bg-base-100 p-2 rounded-xl border border-base-200 shadow-sm">
                <button onClick={() => shiftDate(-1)} className="btn btn-sm btn-ghost btn-circle">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-center">
                    <span className="font-bold block capitalize">
                        {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-xs opacity-50 block">Hoy: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                </div>
                <button onClick={() => shiftDate(1)} className="btn btn-sm btn-ghost btn-circle">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Plan Header */}
            {activeAssignment ? (
                <div className="bg-base-100 rounded-2xl p-4 border border-base-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <CalendarIcon className="w-16 h-16" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold uppercase tracking-wider opacity-50 mb-1">Plan Asignado</p>
                        <h2 className="text-2xl font-black">{plan?.name}</h2>
                        <p className="text-sm opacity-60 line-clamp-2">{plan?.description}</p>
                        <div className="mt-4 flex items-center gap-2 text-xs font-mono opacity-50">
                            <span>{plan?.targets?.calories ? `${plan.targets.calories} kcal` : "Sin meta calórica"}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center p-8 bg-base-100 rounded-xl border border-dashed border-base-300">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-primary opacity-50" />
                    <p className="font-bold">Sin Plan Activo</p>
                    <p className="text-xs opacity-60 mb-4">No hay un plan asignado para esta fecha.</p>
                </div>
            )}

            {/* Action Bar */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowMealModal(true)}
                    className="btn btn-primary btn-sm gap-2 rounded-full"
                >
                    <Utensils className="w-4 h-4" />
                    Registrar Alimento
                </button>
            </div>

            {/* Trackers Grid */}
            {trackers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {trackers.map((t) => {
                        const current = consumed[t.key as keyof typeof consumed] || 0;
                        const target = t.target || 0;
                        const progress = target > 0 ? (current / target) * 100 : 0;
                        const remaining = Math.max(0, target - current);

                        return (
                            <div key={t.key} className="card bg-base-100 border border-base-200 shadow-sm">
                                <div className="card-body p-4 flex-row items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${t.bg} ${t.color}`}>
                                        <t.icon className="w-6 h-6" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="font-bold text-sm">{t.label}</h3>
                                            <span className="text-xs font-mono">
                                                <span className="font-bold text-base">{current}</span>
                                                <span className="opacity-40"> / {target}</span>
                                            </span>
                                        </div>
                                        <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${t.color.replace('text-', 'bg-')}`}
                                                style={{ width: `${Math.min(100, progress)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            {remaining > 0 ? (
                                                <p className="text-[10px] opacity-50">Faltan {remaining}</p>
                                            ) : (
                                                <p className="text-[10px] text-success font-bold">¡Completado!</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => handleLog(t.key, 1)}
                                            className="btn btn-xs btn-circle btn-ghost border border-base-300 hover:bg-base-200"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => handleLog(t.key, -1)}
                                            disabled={current <= 0}
                                            className="btn btn-xs btn-circle btn-ghost border border-base-300 hover:bg-base-200 disabled:opacity-20"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : activeAssignment ? (
                <div className="text-center p-8 opacity-40 text-sm">
                    No hay objetivos definidos ni registros para este día.
                </div>
            ) : null}

            {/* Today's Meals List */}
            {todayMeals && todayMeals.length > 0 && (
                <div className="mt-8">
                    <h3 className="font-bold text-sm opacity-50 uppercase tracking-wider mb-3">Historial de hoy</h3>
                    <div className="space-y-2">
                        {todayMeals.map((meal: Doc<"nutritionMeals">) => (
                            <div key={meal._id} className="card bg-base-100 border border-base-200 p-3 flex-row justify-between items-center">
                                <div>
                                    <p className="font-bold text-sm">{meal.name}</p>
                                    <p className="text-xs opacity-50 flex gap-2">
                                        {Object.entries(meal.content || {}).map(([k, v]) => {
                                            if (!v) return null;
                                            const label = NUTRIENTS.find(n => n.key === k)?.label || (k === 'other' ? 'Cheat Meal' : k);
                                            return <span key={k} className={k === 'other' ? 'text-red-500 font-bold' : ''}>{label}: {String(v)}</span>
                                        })}
                                    </p>
                                </div>
                                <span className="text-xs opacity-30 font-mono">
                                    {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

interface PlansManagerProps {
    familyId: Id<"families">;
    onCreate: () => void;
    onAssign: (plan: Doc<"nutritionPlans">) => void;
    onEdit: (plan: Doc<"nutritionPlans">) => void;
}

function PlansManager({ familyId, onCreate, onAssign, onEdit }: PlansManagerProps) {
    const plans = useQuery(api.nutrition.getPlans, { familyId });

    return (
        <div className="px-4 space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Planes Guardados</h3>
                <button
                    onClick={onCreate}
                    className="btn btn-sm btn-primary rounded-full"
                >
                    <PlusCircle className="w-4 h-4" />
                    Nuevo Plan
                </button>
            </div>

            <div className="grid gap-3">
                {plans?.map((plan: Doc<"nutritionPlans">) => (
                    <div key={plan._id} className="card bg-base-100 border border-base-200 shadow-sm relative group">
                        {/* Edit Button (Absolute) */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(plan); }}
                            className="absolute top-3 right-3 btn btn-xs btn-ghost btn-circle opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <FileText className="w-3 h-3" />
                        </button>

                        <div className="card-body p-4">
                            <div className="flex justify-between items-start">
                                <div className="cursor-pointer flex-1" onClick={() => onEdit(plan)}>
                                    <h3 className="font-bold">{plan.name}</h3>
                                    <p className="text-xs opacity-60 mb-2 line-clamp-2">{plan.description || "Sin descripción"}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {plan.targets?.calories ? (
                                            <span className="badge badge-xs badge-neutral text-neutral-content">
                                                {plan.targets.calories} kcal
                                            </span>
                                        ) : null}
                                        {plan.targets?.protein ? <span className="badge badge-xs badge-ghost">AOA: {plan.targets.protein}</span> : null}
                                    </div>
                                </div>
                                <button
                                    onClick={() => onAssign(plan)}
                                    className="btn btn-sm btn-outline btn-primary shrink-0 ml-2"
                                >
                                    Asignar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {plans?.length === 0 && (
                    <div className="text-center p-8 opacity-50 text-sm bg-base-100 rounded-xl border border-dashed border-base-300">
                        No hay planes creados aún.
                    </div>
                )}
            </div>
        </div>
    );
}

// === VIEWS & MODALS ===

// === DEFINITIONS ===
const NUTRIENTS = [
    { key: 'protein', label: 'Proteína', icon: '🥩' },
    { key: 'carbs', label: 'Cereales', icon: '🌾' },
    { key: 'veggies', label: 'Verduras', icon: '🥕' },
    { key: 'fruits', label: 'Frutas', icon: '🍎' },
    { key: 'dairy', label: 'Leches', icon: '🥛' },
    { key: 'legumes', label: 'Leguminosas', icon: '🫘' },
    { key: 'fat', label: 'Grasas', icon: '🥑' },
    // Removed Water and Other for Plan creation
] as const;

function LogMealModal({ familyId, personId, date, plan, onClose }: { familyId: Id<"families">, personId: Id<"personProfiles">, date: string, plan?: Doc<"nutritionPlans"> | null, onClose: () => void }) {
    const { user } = useAuth();
    const logMeal = useMutation(api.nutrition.logMeal);
    const [name, setName] = useState("");
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showExtras, setShowExtras] = useState(false);

    // 1. Identify active nutrients from plan
    const activeKeys = new Set<string>();
    if (plan?.targets) {
        Object.entries(plan.targets).forEach(([k, v]) => {
            if (typeof v === "number" && v > 0) activeKeys.add(k);
        });
    }

    // 2. Split NUTRIENTS
    const planNutrients = NUTRIENTS.filter(n => activeKeys.has(n.key));
    const extraNutrients = NUTRIENTS.filter(n => !activeKeys.has(n.key));

    const handleIncrement = (key: string) => {
        setCounts(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
    };

    const handleDecrement = (key: string) => {
        setCounts(prev => {
            const current = prev[key] || 0;
            if (current <= 1) {
                const copy = { ...prev };
                delete copy[key];
                return copy;
            }
            return { ...prev, [key]: current - 1 };
        });
    };

    const handleSave = async () => {
        if (!name) return;
        setIsLoading(true);
        try {
            await logMeal({
                familyId,
                personId,
                date,
                name,
                content: counts,
                addedBy: user?._id,
            });
            onClose();
        } catch (e) {
            console.error("Failed to log meal", e);
            alert("Error al guardar alimento");
        } finally {
            setIsLoading(false);
        }
    }

    const renderNutrientRow = (n: typeof NUTRIENTS[number] | { key: string, label: string, icon: string }, isExtra = false) => {
        const count = counts[n.key] || 0;
        return (
            <div key={n.key} className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${count > 0 ? 'bg-primary/5 border-primary/20' : 'bg-base-100 border-base-200'}`}>
                <div className="flex items-center gap-2">
                    <span className="text-lg">{n.icon}</span>
                    <span className={`text-xs font-medium ${isExtra ? 'opacity-70' : ''}`}>{n.label}</span>
                </div>

                <div className="flex items-center bg-base-200 rounded-lg p-0.5 scale-90 origin-right">
                    <button
                        onClick={() => handleDecrement(n.key)}
                        className={`btn btn-xs btn-square btn-ghost ${count === 0 ? 'invisible' : ''}`}
                    >
                        <Minus className="w-3 h-3" />
                    </button>
                    <span className={`w-6 text-center text-sm font-bold ${count > 0 ? 'text-primary' : 'opacity-30'}`}>
                        {count}
                    </span>
                    <button
                        onClick={() => handleIncrement(n.key)}
                        className="btn btn-xs btn-square btn-ghost"
                    >
                        <Plus className="w-3 h-3" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <MobileModal title="Registrar Alimento" onClose={onClose}>
            <div className="space-y-6">
                <div>
                    <label className="label text-sm font-medium">Nombre del Alimento / Descripción</label>
                    <input
                        className="input input-bordered w-full focus:input-primary"
                        placeholder="Ej. Desayuno, Tacos, Pizza..."
                        autoFocus
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </div>

                <div className="space-y-4">
                    {/* Plan Nutrients */}
                    {planNutrients.length > 0 && (
                        <div>
                            <label className="label text-xs font-bold opacity-50 uppercase tracking-wider mb-1">Del Plan</label>
                            <div className="grid grid-cols-2 gap-2">
                                {planNutrients.map(n => renderNutrientRow(n))}
                            </div>
                        </div>
                    )}

                    {/* Extras Section */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowExtras(!showExtras)}
                            className="w-full flex items-center justify-between py-2 text-xs font-bold opacity-50 uppercase tracking-wider hover:opacity-100 transition-opacity"
                        >
                            <span>Extras / Otros</span>
                            <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${showExtras ? 'rotate-90' : ''}`} />
                        </button>

                        {showExtras && (
                            <div className="grid grid-cols-2 gap-2 mt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                {extraNutrients.map(n => renderNutrientRow(n, true))}

                                {/* Manual 'Other/Cheat' Entry */}
                                {renderNutrientRow({ key: 'other', label: 'Cheat Meal / Extra', icon: '🍰' }, true)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                    <button onClick={onClose} className="btn btn-ghost flex-1">Cancelar</button>
                    <button onClick={handleSave} disabled={!name || isLoading} className="btn btn-primary flex-1">
                        {isLoading ? <span className="loading loading-spinner"></span> : "Guardar"}
                    </button>
                </div>
            </div>
        </MobileModal>
    );
}

function PlanEditor({ familyId, plan, onClose }: { familyId: Id<"families">, plan: Doc<"nutritionPlans"> | null, onClose: () => void }) {
    const { user } = useAuth(); // <--- Get current user from context
    const createPlan = useMutation(api.nutrition.createPlan);
    const updatePlan = useMutation(api.nutrition.updatePlan);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // Initialize form data
    const [formData, setFormData] = useState({
        name: plan?.name || "",
        description: plan?.description || "",
        calories: plan?.targets?.calories?.toString() || "",
        // Nutrients
        protein: plan?.targets?.protein || 0,
        carbs: plan?.targets?.carbs || 0,
        fat: plan?.targets?.fat || 0,
        veggies: plan?.targets?.veggies || 0,
        fruits: plan?.targets?.fruits || 0,
        dairy: plan?.targets?.dairy || 0,
        // water: plan?.targets?.water || 0, 
        legumes: plan?.targets?.legumes || 0,
        // other: plan?.targets?.other || 0,
    });

    // Determine initial active nutrients based on existing values > 0
    const [activeNutrients, setActiveNutrients] = useState<Set<string>>(() => {
        const active = new Set<string>();
        const targets = plan?.targets as Record<string, number | undefined> | undefined;
        NUTRIENTS.forEach(n => {
            if ((targets?.[n.key] ?? 0) > 0) {
                active.add(n.key);
            }
        });
        return active;
    });

    const toggleNutrient = (key: string) => {
        const next = new Set(activeNutrients);
        if (next.has(key)) {
            next.delete(key);
            // Reset value to 0 when removing
            setFormData(prev => ({ ...prev, [key]: 0 }));
        } else {
            next.add(key);
            // Set default value to 1 when adding to prompt usage
            setFormData(prev => ({ ...prev, [key]: 1 }));
        }
        setActiveNutrients(next);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const targets: Record<string, number | undefined> = {
                calories: Number(formData.calories) || undefined,
            };

            // Only include active nutrients
            const formDataRecord = formData as Record<string, string | number>;
            activeNutrients.forEach(key => {
                const val = formDataRecord[key];
                if (typeof val === 'number' && val > 0) targets[key] = val;
            });

            if (plan) {
                await updatePlan({
                    planId: plan._id,
                    name: formData.name,
                    description: formData.description,
                    targets,
                });
            } else {
                await createPlan({
                    familyId,
                    name: formData.name,
                    description: formData.description,
                    targets,
                    createdBy: user?._id, // <--- Pass user ID
                });
            }
            onClose();
        } catch (err: unknown) {
            console.error(err);
            const msg = err instanceof Error ? err.message : "Error al guardar";
            setError(msg.includes("Not authenticated")
                ? "Sesión expirada. Por favor recarga la página o inicia sesión nuevamente."
                : msg
            );
        } finally {
            setIsLoading(false);
        }
    };

    const availableNutrients = NUTRIENTS.filter(n => !activeNutrients.has(n.key));

    return (
        <MobileModal
            isOpen={true}
            onClose={onClose}
            title={plan ? "Editar Plan" : "Nuevo Plan"}
        >
            <form id="plan-form" onSubmit={handleSubmit} className="space-y-6">

                {error && (
                    <div role="alert" className="alert alert-error text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Basic Info */}
                <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body p-4 gap-4">
                        <h3 className="font-bold text-sm uppercase opacity-50 tracking-wider">Detalles</h3>
                        <div className="form-control">
                            <label className="label text-sm font-medium">Nombre</label>
                            <input
                                required
                                className="input input-sm input-bordered w-full focus:input-primary"
                                placeholder="Ej. Definición 2024"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="form-control">
                            <label className="label text-sm font-medium">Notas</label>
                            <textarea
                                className="textarea textarea-sm textarea-bordered w-full focus:textarea-primary leading-tight min-h-[60px]"
                                rows={2}
                                placeholder="Notas del plan..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="form-control">
                            <label className="label text-sm font-medium">Calorías (Kcal)</label>
                            <input
                                type="number"
                                className="input input-sm input-bordered w-full"
                                placeholder="2000"
                                value={formData.calories}
                                onChange={e => setFormData({ ...formData, calories: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Dynamic Portions */}
                <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body p-4">
                        <h3 className="font-bold text-sm uppercase opacity-50 tracking-wider mb-2">Porciones Diarias</h3>

                        {/* Active List */}
                        <div className="space-y-3 mb-6">
                            {Array.from(activeNutrients).map((key) => {
                                const nutrient = NUTRIENTS.find(n => n.key === key);
                                if (!nutrient) return null;
                                return (
                                    <div key={key} className="flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => toggleNutrient(key)}
                                                className="btn btn-xs btn-circle btn-ghost text-error opacity-50 hover:opacity-100"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <span className="text-xl">{nutrient.icon}</span>
                                            <span className="font-bold text-sm">{nutrient.label}</span>
                                        </div>
                                        <CounterInput
                                            value={(formData as Record<string, string | number>)[key] as number}
                                            onChange={(val) => setFormData({ ...formData, [key]: val })}
                                        />
                                    </div>
                                );
                            })}
                            {activeNutrients.size === 0 && (
                                <div className="text-center py-6 opacity-40 text-sm border-2 border-dashed border-base-200 rounded-xl">
                                    Agrega los elementos que quieres controlar
                                </div>
                            )}
                        </div>

                        {/* Available Badges */}
                        {availableNutrients.length > 0 && (
                            <div>
                                <p className="text-xs font-bold opacity-40 mb-3 uppercase tracking-wider">Agregar Elemento:</p>
                                <div className="flex flex-wrap gap-2">
                                    {availableNutrients.map((n) => (
                                        <button
                                            key={n.key}
                                            type="button"
                                            onClick={() => toggleNutrient(n.key)}
                                            className={`btn btn-xs h-8 px-3 rounded-full border-0 bg-base-200 hover:bg-base-300 gap-1.5 font-medium`}
                                        >
                                            <span>{n.icon}</span>
                                            {n.label}
                                            <Plus className="w-3 h-3 opacity-50" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* BUTTONS INLINE */}
                <div className="flex gap-3 pt-6">
                    <button type="button" onClick={onClose} className="btn flex-1">
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || !formData.name}
                        className="btn btn-primary flex-1"
                    >
                        {isLoading ? <span className="loading loading-spinner" /> : "Guardar"}
                    </button>
                </div>

            </form>
        </MobileModal>
    );
}

function CounterInput({ value, onChange, min = 0, max = 50 }: { value: number, onChange: (val: number) => void, min?: number, max?: number }) {
    const handleDecrement = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (value > min) onChange(value - 1);
    };
    const handleIncrement = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (value < max) onChange(value + 1);
    };

    return (
        <div className="flex items-center bg-base-200 rounded-xl p-1">
            <button
                type="button"
                onClick={handleDecrement}
                disabled={value <= min}
                className="btn btn-sm btn-ghost btn-square w-8 h-8 rounded-lg text-lg hover:bg-base-300 disabled:opacity-20"
            >
                <Minus className="w-4 h-4" />
            </button>
            <input
                type="number"
                value={value}
                onChange={e => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v) && v >= min && v <= max) onChange(v);
                    else if (e.target.value === "") onChange(0);
                }}
                className="input input-ghost input-sm w-12 text-center text-lg font-bold p-0 focus:outline-none"
            />
            <button
                type="button"
                onClick={handleIncrement}
                disabled={value >= max}
                className="btn btn-sm btn-ghost btn-square w-8 h-8 rounded-lg text-lg hover:bg-base-300 disabled:opacity-20"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    );
}

function AssignPlanModal({ familyId, personId, plan, onClose }: { familyId: Id<"families">, personId: Id<"personProfiles">, plan: Doc<"nutritionPlans">, onClose: () => void }) {
    const assignPlan = useMutation(api.nutrition.assignPlan);
    const [dates, setDates] = useState({
        start: getLocalDateString(),
        end: getLocalDateString(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)), // 15 days default
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleAssign = async () => {
        setIsLoading(true);
        setError("");
        try {
            const startTs = new Date(dates.start + "T00:00:00").getTime();
            const endTs = new Date(dates.end + "T23:59:59.999").getTime();

            await assignPlan({
                familyId,
                personId,
                planId: plan._id,
                startDate: startTs,
                endDate: endTs,
            });
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al asignar");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MobileModal title={`Asignar ${plan.name}`} onClose={onClose}>
            <div className="space-y-6">
                <p className="text-sm opacity-60">Selecciona el rango de fechas para aplicar este plan alimenticio.</p>

                {error && <div className="alert alert-error text-xs">{error}</div>}

                <div className="space-y-4">
                    <DateInput
                        label="Fecha de inicio"
                        value={dates.start}
                        onChange={(val) => setDates(prev => ({ ...prev, start: val }))}
                    />

                    <DateInput
                        label="Fecha de término (opcional)"
                        value={dates.end}
                        onChange={(val) => setDates(prev => ({ ...prev, end: val }))}
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <button onClick={onClose} className="btn btn-ghost flex-1">Cancelar</button>
                    <button onClick={handleAssign} disabled={isLoading} className="btn btn-primary flex-1">
                        {isLoading ? <span className="loading loading-spinner loading-xs"></span> : "Confirmar"}
                    </button>
                </div>
            </div>
        </MobileModal>
    );
}
