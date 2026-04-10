import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { MobileModal } from "../ui/MobileModal";
import { ChevronRight, Minus, Plus } from "lucide-react";
import { NUTRIENTS } from "./constants";

interface LogMealModalProps {
  sessionToken: string;
  familyId: Id<"families">;
  personId: Id<"personProfiles">;
  date: string;
  plan?: Doc<"nutritionPlans"> | null;
  onClose: () => void;
}

export function LogMealModal({ sessionToken, familyId, personId, date, plan, onClose }: LogMealModalProps) {
  const logMeal = useMutation(api.nutrition.logMeal);
  const [name, setName] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showExtras, setShowExtras] = useState(false);

  const activeKeys = new Set<string>();
  if (plan?.targets) {
    Object.entries(plan.targets).forEach(([k, v]) => {
      if (typeof v === "number" && v > 0) activeKeys.add(k);
    });
  }

  const planNutrients = NUTRIENTS.filter((n) => activeKeys.has(n.key));
  const extraNutrients = NUTRIENTS.filter((n) => !activeKeys.has(n.key));

  const handleIncrement = (key: string) => {
    setCounts((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  const handleDecrement = (key: string) => {
    setCounts((prev) => {
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
        sessionToken,
        familyId,
        personId,
        date,
        name,
        content: counts,
      });
      onClose();
    } catch (e) {
      console.error("Failed to log meal", e);
      alert("Error al guardar alimento");
    } finally {
      setIsLoading(false);
    }
  };

  const renderNutrientRow = (n: typeof NUTRIENTS[number] | { key: string; label: string; icon: string }, isExtra = false) => {
    const count = counts[n.key] || 0;
    return (
      <div key={n.key} className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${count > 0 ? "bg-primary/5 border-primary/20" : "bg-base-100 border-base-200"}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{n.icon}</span>
          <span className={`text-xs font-medium ${isExtra ? "opacity-70" : ""}`}>{n.label}</span>
        </div>

        <div className="flex items-center bg-base-200 rounded-lg p-0.5 scale-90 origin-right">
          <button
            onClick={() => handleDecrement(n.key)}
            className={`btn btn-xs btn-square btn-ghost ${count === 0 ? "invisible" : ""}`}
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className={`w-6 text-center text-sm font-bold ${count > 0 ? "text-primary" : "opacity-30"}`}>
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
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {planNutrients.length > 0 && (
            <div>
              <label className="label text-xs font-bold opacity-50 uppercase tracking-wider mb-1">Del Plan</label>
              <div className="grid grid-cols-2 gap-2">
                {planNutrients.map((n) => renderNutrientRow(n))}
              </div>
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={() => setShowExtras(!showExtras)}
              className="w-full flex items-center justify-between py-2 text-xs font-bold opacity-50 uppercase tracking-wider hover:opacity-100 transition-opacity"
            >
              <span>Extras / Otros</span>
              <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${showExtras ? "rotate-90" : ""}`} />
            </button>

            {showExtras && (
              <div className="grid grid-cols-2 gap-2 mt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                {extraNutrients.map((n) => renderNutrientRow(n, true))}
                {renderNutrientRow({ key: "other", label: "Cheat Meal / Extra", icon: "🍰" }, true)}
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
