import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "../../../contexts/AuthContext";
import { Lightbulb } from "lucide-react";
import { MobileModal } from "../../ui/MobileModal";
import { Input } from "../../ui/Input";
import { TextArea } from "../../ui/TextArea";
import { DateInput } from "../../ui/DateInput";
import type { Id } from "../../../../convex/_generated/dataModel";

interface AddPlanModalProps {
  tripId: Id<"trips">;
  familyId: Id<"families">;
  placeListId?: Id<"placeLists"> | null;
  initialPlaceId?: Id<"places">;
  minDate?: number;
  maxDate?: number;
  editPlanId?: Id<"tripPlans">;
  onClose: () => void;
}

export function AddPlanModal({
  tripId,
  familyId,
  placeListId,
  initialPlaceId,
  minDate,
  maxDate,
  editPlanId,
  onClose,
}: AddPlanModalProps) {
  const { sessionToken } = useAuth();
  const addPlan = useMutation(api.trips.addTripPlan);
  const updatePlan = useMutation(api.trips.updateTripPlan);

  const places = useQuery(
    api.places.getPlaces,
    sessionToken ? { sessionToken, familyId, listId: placeListId || undefined } : "skip"
  );
  const planToEdit = useQuery(
    api.trips.getTripPlan,
    editPlanId && sessionToken ? { sessionToken, planId: editPlanId } : "skip"
  );

  const [activity, setActivity] = useState("");
  const [placeId, setPlaceId] = useState<Id<"places"> | "">(initialPlaceId || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (planToEdit) {
      setActivity(planToEdit.activity || "");
      setPlaceId(planToEdit.placeId || "");
      if (planToEdit.dayDate) {
        const d = new Date(planToEdit.dayDate);
        setDate(d.toISOString().split("T")[0]);
      }
      setTime(planToEdit.time || "");
      setNotes(planToEdit.notes || "");
    }
  }, [planToEdit]);

  useEffect(() => {
    if (initialPlaceId && places && !activity) {
      const p = places.find((pl) => pl._id === initialPlaceId);
      if (p) {
        setActivity(`Visitar ${p.name} `);
      }
    }
  }, [initialPlaceId, places, activity]);

  const handlePlaceChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newPlaceId = e.target.value as Id<"places">;
    setPlaceId(newPlaceId);
    if (newPlaceId && !activity && places) {
      const place = places.find((p) => p._id === newPlaceId);
      if (place) {
        setActivity(`Visitar ${place.name} `);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activity.trim()) return;

    setIsLoading(true);
    try {
      const dayTimestamp = date ? new Date(date + "T12:00:00").getTime() : undefined;

      if (editPlanId) {
        if (!sessionToken) return;
        await updatePlan({
          sessionToken,
          planId: editPlanId,
          activity: activity.trim(),
          placeId: placeId && placeId !== "" ? (placeId as Id<"places">) : undefined,
          dayDate: dayTimestamp,
          time: time || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        if (!sessionToken) return;
        await addPlan({
          sessionToken,
          tripId,
          placeId: placeId && placeId !== "" ? (placeId as Id<"places">) : undefined,
          activity: activity.trim(),
          dayDate: dayTimestamp,
          time: time || undefined,
          notes: notes.trim() || undefined,
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving plan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileModal isOpen onClose={onClose} title={editPlanId ? "Editar Actividad" : "Nueva Actividad"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label"><span className="label-text">Lugar (Opcional)</span></label>

          {!placeListId ? (
            <div className="alert alert-warning py-2 text-xs flex shadow-sm">
              <Lightbulb className="w-4 h-4 shrink-0" />
              <span>
                No has vinculado una lista de lugares.
                <br />Vincula una en la pestaña <strong>Ideas</strong> para ver tus sugerencias aquí.
              </span>
            </div>
          ) : (
            <select
              className="select select-bordered w-full"
              value={placeId}
              onChange={handlePlaceChange}
            >
              <option value="">-- Seleccionar lugar de lista --</option>
              {places?.map((place) => (
                <option key={place._id} value={place._id}>{place.name}</option>
              ))}
            </select>
          )}
        </div>

        <Input
          label="Actividad *"
          placeholder="Ej. Visitar Museo del Prado"
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <DateInput
            label="Fecha (Opcional)"
            value={date}
            onChange={setDate}
            min={minDate ? new Date(minDate).toISOString().split("T")[0] : undefined}
            max={maxDate ? new Date(maxDate).toISOString().split("T")[0] : undefined}
          />
          <Input
            label="Hora (Opcional)"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <TextArea
          label="Notas"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />

        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={!activity.trim() || isLoading}>
            {isLoading ? <span className="loading loading-spinner" /> : "Guardar"}
          </button>
        </div>
      </form>
    </MobileModal>
  );
}
