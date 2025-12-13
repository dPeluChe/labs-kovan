import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { useConfirmModal } from "../hooks/useConfirmModal";
import { ArrowLeft, Calendar, Trash2, Check } from "lucide-react";

export function CalendarSettingsPage() {
  const navigate = useNavigate();
  const { currentFamily } = useFamily();
  const { user } = useAuth();
  const [calendarId, setCalendarId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { confirm, ConfirmModal } = useConfirmModal();

  const integration = useQuery(
    api.calendar.getCalendarIntegration,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const saveIntegration = useMutation(api.calendar.saveCalendarIntegration);
  const removeIntegration = useMutation(api.calendar.removeCalendarIntegration);

  if (!currentFamily || !user) return <PageLoader />;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendarId.trim() || !displayName.trim()) return;

    setIsLoading(true);
    try {
      await saveIntegration({
        familyId: currentFamily._id,
        calendarId: calendarId.trim(),
        displayName: displayName.trim(),
        connectedBy: user._id,
      });
      navigate("/calendar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    const confirmed = await confirm({
      title: "Desconectar calendario",
      message: "¿Estás seguro de que quieres desconectar el calendario? Se perderá la sincronización.",
      confirmText: "Desconectar",
      cancelText: "Cancelar",
      variant: "warning",
      icon: "warning",
    });
    
    if (confirmed) {
      await removeIntegration({ familyId: currentFamily._id });
    }
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-base-100 border-b border-base-300">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm btn-circle">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Configurar Calendario</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Current Integration */}
        {integration && (
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/10 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{integration.displayName}</h3>
                  <p className="text-xs text-base-content/60 truncate">
                    {integration.calendarId}
                  </p>
                </div>
                <button
                  onClick={handleRemove}
                  className="btn btn-ghost btn-sm btn-circle text-error"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Setup Form */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4">
            <h3 className="font-semibold mb-4">
              {integration ? "Actualizar calendario" : "Conectar Google Calendar"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">ID del Calendario *</span>
                </label>
                <input
                  type="text"
                  placeholder="ejemplo@group.calendar.google.com"
                  className="input input-bordered w-full"
                  value={calendarId}
                  onChange={(e) => setCalendarId(e.target.value)}
                  disabled={isLoading}
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    Encuentra esto en Configuración de Google Calendar → ID del calendario
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Nombre a mostrar *</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Calendario Familiar"
                  className="input input-bordered w-full"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isLoading || !calendarId.trim() || !displayName.trim()}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Guardar
                  </>
                )}
              </button>
            </form>

            <div className="divider text-xs text-base-content/50">Próximamente</div>
            
            <p className="text-sm text-base-content/60 text-center">
              La sincronización automática con Google Calendar estará disponible pronto.
              Por ahora puedes configurar el ID del calendario manualmente.
            </p>
          </div>
        </div>
      </div>
      
      {/* Confirm Modal */}
      <ConfirmModal />
    </div>
  );
}
