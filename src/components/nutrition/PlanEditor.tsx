import { useState, type FormEvent, type MouseEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { useAuth } from "../../contexts/AuthContext";
import { MobileModal } from "../ui/MobileModal";
import { Plus, Minus, X } from "lucide-react";
import { NUTRIENTS } from "./constants";

interface PlanEditorProps {
  familyId: Id<"families">;
  plan: Doc<"nutritionPlans"> | null;
  onClose: () => void;
}

export function PlanEditor({ familyId, plan, onClose }: PlanEditorProps) {
  const { sessionToken } = useAuth();
  const createPlan = useMutation(api.nutrition.createPlan);
  const updatePlan = useMutation(api.nutrition.updatePlan);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: plan?.name || "",
    description: plan?.description || "",
    calories: plan?.targets?.calories?.toString() || "",
    protein: plan?.targets?.protein || 0,
    carbs: plan?.targets?.carbs || 0,
    fat: plan?.targets?.fat || 0,
    veggies: plan?.targets?.veggies || 0,
    fruits: plan?.targets?.fruits || 0,
    dairy: plan?.targets?.dairy || 0,
    legumes: plan?.targets?.legumes || 0,
  });

  const [activeNutrients, setActiveNutrients] = useState<Set<string>>(() => {
    const active = new Set<string>();
    const targets = plan?.targets as Record<string, number | undefined> | undefined;
    NUTRIENTS.forEach((n) => {
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
      setFormData((prev) => ({ ...prev, [key]: 0 }));
    } else {
      next.add(key);
      setFormData((prev) => ({ ...prev, [key]: 1 }));
    }
    setActiveNutrients(next);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const targets: Record<string, number | undefined> = {
        calories: Number(formData.calories) || undefined,
      };

      const formDataRecord = formData as Record<string, string | number>;
      activeNutrients.forEach((key) => {
        const val = formDataRecord[key];
        if (typeof val === "number" && val > 0) targets[key] = val;
      });

      if (plan) {
        await updatePlan({
          sessionToken: sessionToken ?? "",
          planId: plan._id,
          name: formData.name,
          description: formData.description,
          targets,
        });
      } else {
        await createPlan({
          sessionToken: sessionToken ?? "",
          familyId,
          name: formData.name,
          description: formData.description,
          targets,
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

  const availableNutrients = NUTRIENTS.filter((n) => !activeNutrients.has(n.key));

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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-control">
              <label className="label text-sm font-medium">Notas</label>
              <textarea
                className="textarea textarea-sm textarea-bordered w-full focus:textarea-primary leading-tight min-h-[60px]"
                rows={2}
                placeholder="Notas del plan..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="form-control">
              <label className="label text-sm font-medium">Calorías (Kcal)</label>
              <input
                type="number"
                className="input input-sm input-bordered w-full"
                placeholder="2000"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-4">
            <h3 className="font-bold text-sm uppercase opacity-50 tracking-wider mb-2">Porciones Diarias</h3>

            <div className="space-y-3 mb-6">
              {Array.from(activeNutrients).map((key) => {
                const nutrient = NUTRIENTS.find((n) => n.key === key);
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

            {availableNutrients.length > 0 && (
              <div>
                <p className="text-xs font-bold opacity-40 mb-3 uppercase tracking-wider">Agregar Elemento:</p>
                <div className="flex flex-wrap gap-2">
                  {availableNutrients.map((n) => (
                    <button
                      key={n.key}
                      type="button"
                      onClick={() => toggleNutrient(n.key)}
                      className="btn btn-xs h-8 px-3 rounded-full border-0 bg-base-200 hover:bg-base-300 gap-1.5 font-medium"
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

function CounterInput({ value, onChange, min = 0, max = 50 }: { value: number; onChange: (val: number) => void; min?: number; max?: number }) {
  const handleDecrement = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (value > min) onChange(value - 1);
  };
  const handleIncrement = (e: MouseEvent) => {
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
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
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
