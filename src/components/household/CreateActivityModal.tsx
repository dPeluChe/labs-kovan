import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { MobileModal } from "../ui/MobileModal";
import { useFamily } from "../../contexts/FamilyContext";
import { useAuth } from "../../contexts/AuthContext";

const CATEGORIES = [
  { value: "cleaning", label: "Limpieza", emoji: "🧹" },
  { value: "cooking", label: "Cocina", emoji: "🍳" },
  { value: "laundry", label: "Ropa", emoji: "👕" },
  { value: "organization", label: "Orden", emoji: "📦" },
  { value: "maintenance", label: "Mantenimiento", emoji: "🔧" },
  { value: "pets", label: "Mascotas", emoji: "🐾" },
  { value: "errands", label: "Mandados", emoji: "🛒" },
  { value: "other", label: "Otro", emoji: "✨" },
] as const;

const EMOJI_OPTIONS = ["🧹", "🍳", "👕", "🛒", "🐾", "🔧", "🏠", "🚗", "🌱", "🗑️", "🧺", "🛏️", "🚿", "🍽️", "📦", "✨", "💪", "🎯"];

type CategoryType = (typeof CATEGORIES)[number]["value"];

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityToEdit?: Doc<"householdActivities">;
}

export function CreateActivityModal({ isOpen, onClose, activityToEdit }: CreateActivityModalProps) {
  const { currentFamily } = useFamily();
  const { user, sessionToken } = useAuth();

  const [name, setName] = useState(activityToEdit?.name ?? "");
  const [emoji, setEmoji] = useState(activityToEdit?.emoji ?? "✨");
  const [points, setPoints] = useState(activityToEdit?.points ?? 5);
  const [category, setCategory] = useState<CategoryType>(
    (activityToEdit?.category as CategoryType) ?? "other"
  );

  const createActivity = useMutation(api.household.createActivity);
  const updateActivity = useMutation(api.household.updateActivity);

  const handleSubmit = async () => {
    if (!currentFamily || !user || !sessionToken || !name.trim()) return;

    if (activityToEdit) {
      await updateActivity({
        sessionToken,
        activityId: activityToEdit._id,
        familyId: currentFamily._id,
        name: name.trim(),
        emoji,
        points,
        category,
      });
    } else {
      await createActivity({
        sessionToken,
        familyId: currentFamily._id,
        name: name.trim(),
        emoji,
        points,
        category,
      });
    }

    onClose();
  };

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title={activityToEdit ? "Editar actividad" : "Nueva actividad"}
    >
      <div className="space-y-4">
        {/* Emoji selector */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Emoji</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`btn btn-sm btn-square text-lg ${
                  emoji === e ? "btn-primary" : "btn-ghost"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Nombre</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Lavar platos"
            className="input input-bordered"
          />
        </div>

        {/* Points */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Puntos</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={20}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="range range-primary range-sm flex-1"
            />
            <span className="badge badge-primary badge-lg min-w-[3rem] justify-center">
              {points}
            </span>
          </div>
        </div>

        {/* Category */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Categoría</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`btn btn-sm justify-start gap-2 ${
                  category === cat.value
                    ? "btn-primary"
                    : "btn-ghost border border-base-300"
                }`}
              >
                <span>{cat.emoji}</span>
                <span className="text-xs">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="btn btn-ghost flex-1">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="btn btn-primary flex-1"
          >
            {activityToEdit ? "Guardar" : "Crear"}
          </button>
        </div>
      </div>
    </MobileModal>
  );
}
