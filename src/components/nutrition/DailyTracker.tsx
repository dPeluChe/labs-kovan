import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import {
  Apple,
  Bean,
  Beef,
  Calendar as CalendarIcon,
  Candy,
  Carrot,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Milk,
  Minus,
  Plus,
  Sparkles,
  Utensils,
  Wheat,
} from "lucide-react";
import { LogMealModal } from "./LogMealModal";
import { NUTRIENTS } from "./constants";
import { getLocalDateString } from "./utils";

interface DailyTrackerProps {
  sessionToken: string;
  familyId: Id<"families">;
  personId: Id<"personProfiles">;
}

export function DailyTracker({ sessionToken, familyId, personId }: DailyTrackerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMealModal, setShowMealModal] = useState(false);

  const dateStr = useMemo(() => getLocalDateString(selectedDate), [selectedDate]);
  const queryTimestamp = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(12, 0, 0, 0);
    return d.getTime();
  }, [selectedDate]);

  const activeAssignment = useQuery(api.nutrition.getActiveAssignment, {
    sessionToken,
    personId,
    date: queryTimestamp,
  });

  const dailyLog = useQuery(api.nutrition.getDailyLog, {
    sessionToken,
    personId,
    date: dateStr,
  });

  const todayMeals = useQuery(api.nutrition.getMeals, {
    sessionToken,
    personId,
    date: dateStr,
  });

  const logIntake = useMutation(api.nutrition.logIntake);

  const handleLog = (type: string, delta: number) => {
    logIntake({
      sessionToken,
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
  ].filter((t) => (t.target || 0) > 0 || (consumed[t.key as keyof typeof consumed] || 0) > 0);

  return (
    <div className="px-4 space-y-4">
      {showMealModal && (
        <LogMealModal
          sessionToken={sessionToken}
          familyId={familyId}
          personId={personId}
          date={dateStr}
          plan={plan}
          onClose={() => setShowMealModal(false)}
        />
      )}

      <div className="flex items-center justify-between bg-base-100 p-2 rounded-xl border border-base-200 shadow-sm">
        <button onClick={() => shiftDate(-1)} className="btn btn-sm btn-ghost btn-circle">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <span className="font-bold block capitalize">
            {selectedDate.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" })}
          </span>
          <span className="text-xs opacity-50 block">Hoy: {new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
        </div>
        <button onClick={() => shiftDate(1)} className="btn btn-sm btn-ghost btn-circle">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

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

      <div className="flex justify-end">
        <button
          onClick={() => setShowMealModal(true)}
          className="btn btn-primary btn-sm gap-2 rounded-full"
        >
          <Utensils className="w-4 h-4" />
          Registrar Alimento
        </button>
      </div>

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
                        className={`h-full rounded-full transition-all duration-500 ${t.color.replace("text-", "bg-")}`}
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
                      const label = NUTRIENTS.find((n) => n.key === k)?.label || (k === "other" ? "Cheat Meal" : k);
                      return <span key={k} className={k === "other" ? "text-red-500 font-bold" : ""}>{label}: {String(v)}</span>;
                    })}
                  </p>
                </div>
                <span className="text-xs opacity-30 font-mono">
                  {new Date(meal.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
