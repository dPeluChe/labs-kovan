import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DateInput } from "../ui/DateInput";
import type { Id } from "../../../convex/_generated/dataModel";

interface NewGiftEventFormProps {
  sessionToken: string;
  familyId: Id<"families">;
  onClose: () => void;
}

export function NewGiftEventForm({
  sessionToken,
  familyId,
  onClose,
}: NewGiftEventFormProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createEvent = useMutation(api.gifts.createGiftEvent);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await createEvent({
        sessionToken,
        familyId,
        name: name.trim(),
        date: date ? new Date(date).getTime() : undefined,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Nombre del evento *</span>
        </label>
        <input
          type="text"
          placeholder="Ej: Navidad 2025, Cumple de mamá"
          className="input input-bordered w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          autoFocus
        />
      </div>

      <DateInput
        label="Fecha (opcional)"
        value={date}
        onChange={setDate}
        disabled={isLoading}
      />

      <div className="form-control">
        <label className="label">
          <span className="label-text">Descripción (opcional)</span>
        </label>
        <textarea
          placeholder="Notas adicionales..."
          className="textarea textarea-bordered w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn" onClick={onClose} disabled={isLoading}>
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading || !name.trim()}
        >
          {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Crear"}
        </button>
      </div>
    </form>
  );
}
