import { useState, useEffect, useRef, type FormEvent } from "react";
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
  const firstFieldRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
      firstFieldRef.current?.focus();
  }, []);
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submitSeq = useRef(0);

  const createEvent = useMutation(api.gifts.createGiftEvent);

  const handleSubmit = async (e: FormEvent) => {
    const seq = ++submitSeq.current;
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading((cur) => (seq === submitSeq.current ? true : cur));
    try {
      await createEvent({
        sessionToken,
        familyId,
        name: name.trim(),
        date: date ? new Date(date).getTime() : undefined,
        description: description.trim() || undefined,
      });
      if (seq === submitSeq.current) onClose();
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setIsLoading((cur) => (seq === submitSeq.current ? false : cur));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <label htmlFor="nombre-del-evento" className="label">
          <span className="label-text">Nombre del evento *</span>
        </label>
        <input id="nombre-del-evento"
          type="text"
          placeholder="Ej: Navidad 2025, Cumple de mamá"
          className="input input-bordered w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          ref={firstFieldRef}
        />
      </div>

      <DateInput
        label="Fecha (opcional)"
        value={date}
        onChange={setDate}
        disabled={isLoading}
      />

      <div className="form-control">
        <label htmlFor="descripcion-opcional" className="label">
          <span className="label-text">Descripción (opcional)</span>
        </label>
        <textarea id="descripcion-opcional"
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
