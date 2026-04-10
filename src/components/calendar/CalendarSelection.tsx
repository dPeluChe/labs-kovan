import { useState, useEffect, useCallback } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface CalendarSelectionProps {
  sessionToken: string;
  syncedIds: string[];
  familyId: Id<"families">;
}

export function CalendarSelection({ sessionToken, syncedIds, familyId }: CalendarSelectionProps) {
  const listCalendars = useAction(api.calendar.listGoogleCalendarsAction);
  const updateSettings = useMutation(api.calendar.updateCalendarSettings);

  const [calendars, setCalendars] = useState<{ id: string; summary: string; primary?: boolean; color?: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(syncedIds);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCalendars = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const list = await listCalendars({ sessionToken, familyId });
      setCalendars(list);
    } catch (err) {
      console.error(err);
      setError("Error al cargar calendarios");
    } finally {
      setIsLoading(false);
    }
  }, [familyId, listCalendars, sessionToken]);

  useEffect(() => {
    loadCalendars();
  }, [loadCalendars]);

  const toggleCalendar = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((c) => c !== id)
        : [...prev, id]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        sessionToken,
        familyId,
        syncedCalendarIds: selectedIds,
      });
    } catch (err) {
      console.error(err);
      setError("Error al guardar configuración");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify([...selectedIds].sort()) !== JSON.stringify([...syncedIds].sort());

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-sm">Calendarios Sincronizados</h4>
          <button
            onClick={loadCalendars}
            className="btn btn-ghost btn-xs"
            disabled={isLoading}
          >
            {isLoading ? "Cargando..." : "Refrescar lista"}
          </button>
        </div>

        {error && <p className="text-xs text-error mb-2">{error}</p>}

        <div className="space-y-1 max-h-60 overflow-y-auto">
          {calendars.map((cal) => {
            const isSelected = selectedIds.includes(cal.id);
            return (
              <label key={cal.id} className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={isSelected}
                  onChange={() => toggleCalendar(cal.id)}
                  disabled={isSaving}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{cal.summary}</span>
                    {cal.primary && <span className="badge badge-xs badge-ghost">Principal</span>}
                  </div>
                </div>
                {cal.color && (
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cal.color }} />
                )}
              </label>
            );
          })}
          {calendars.length === 0 && !isLoading && (
            <p className="text-xs text-subtle text-center py-2">
              No se encontraron calendarios. Sincroniza para actualizar.
            </p>
          )}
        </div>

        {hasChanges && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSave}
              className="btn btn-primary btn-sm"
              disabled={isSaving}
            >
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
