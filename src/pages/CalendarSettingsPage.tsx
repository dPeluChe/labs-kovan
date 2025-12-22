import { useState, useEffect, useCallback } from "react";
import type { Id } from "../../convex/_generated/dataModel";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { useConfirmModal } from "../hooks/useConfirmModal";
import { ArrowLeft, Calendar, Trash2, Check, ExternalLink } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";

export function CalendarSettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentFamily } = useFamily();
  const { user } = useAuth();

  const [calendarId, setCalendarId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const integration = useQuery(
    api.calendar.getCalendarIntegration,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const saveIntegration = useMutation(api.calendar.saveCalendarIntegration);
  const removeIntegration = useMutation(api.calendar.removeCalendarIntegration);
  const getAuthUrl = useAction(api.calendar.getGoogleAuthUrl);
  const exchangeCode = useAction(api.calendar.exchangeGoogleAuthCode);
  const provisionCalendar = useAction(api.calendar.provisionKovanCalendar);

  const { confirm, ConfirmModal } = useConfirmModal();

  // Initialize form with existing data
  useEffect(() => {
    if (integration) {
      setCalendarId(integration.calendarId);
      setDisplayName(integration.displayName);
    }
  }, [integration]);

  // Handle OAuth Callback
  useEffect(() => {
    const handleOAuth = async () => {
      const code = searchParams.get("code");
      if (code && currentFamily && user) {
        setIsSyncing(true);
        try {
          // 1. Exchange Code
          const tokens = await exchangeCode({
            code,
            redirectUri: window.location.origin + "/settings/calendar"
          });

          // 1.5 Provision Kovan Calendar
          const kovanCalendar = await provisionCalendar({ accessToken: tokens.accessToken });

          // 2. Save Integration
          await saveIntegration({
            familyId: currentFamily._id,
            calendarId: kovanCalendar.calendarId,
            displayName: "KOVAN - FAMILIA",
            connectedBy: user._id,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenExpiry: Date.now() + (tokens.expiresIn * 1000),
            scope: tokens.scope,
          });

          // 3. Cleanup URL
          setSearchParams({});
          navigate("/calendar");
        } catch {
          alert("Error al conectar con Google. Revisa que las credenciales en Convex Dashboard sean correctas.");
        } finally {
          setIsSyncing(false);
        }
      }
    };

    handleOAuth();
  }, [searchParams, currentFamily, user, exchangeCode, saveIntegration, navigate, setSearchParams, provisionCalendar]);

  const handleConnect = async () => {
    try {
      const url = await getAuthUrl({
        redirectUri: window.location.origin + "/settings/calendar"
      });
      window.location.href = url;
    } catch {
      alert("Error: Asegúrate de configurar GOOGLE_CLIENT_ID en Convex Dashboard.");
    }
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calendarId.trim() || !displayName.trim() || !currentFamily || !user) return;

    try {
      await saveIntegration({
        familyId: currentFamily._id,
        calendarId: calendarId.trim(),
        displayName: displayName.trim(),
        connectedBy: user._id,
      });
      navigate("/calendar");
    } catch (err) {
      console.error(err);
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

    if (confirmed && currentFamily) {
      await removeIntegration({ familyId: currentFamily._id });
    }
  };

  if (!currentFamily || !user) return <PageLoader />;

  if (isSyncing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-lg font-medium animate-pulse">Conectando con Google...</p>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <PageHeader
        title="Configurar Calendario"
        startAction={
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-6">

        {/* Integrations List */}
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            Cuentas Conectadas
          </h3>

          {!integration?.accessToken ? (
            <div className="card bg-base-100 shadow-sm border border-base-300">
              <div className="card-body p-5 text-center">
                <p className="text-base-content/70 mb-4">
                  No hay calendarios conectados. Vincula tu cuenta de Google.
                </p>
                <button
                  onClick={handleConnect}
                  className="btn btn-primary w-full sm:w-auto"
                >
                  <ExternalLink className="w-4 h-4" />
                  Conectar Google Calendar
                </button>
                <p className="text-xs text-base-content/50 mt-4">
                  Requiere configuración de credenciales en el servidor.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">
                {/* Integration Item */}
                <div className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{integration.displayName}</h4>
                    <p className="text-xs text-base-content/60 truncate font-mono">{integration.calendarId}</p>
                    <span className="badge badge-success badge-xs gap-1 text-white mt-1">
                      <Check className="w-2 h-2" /> Activo
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRemove}
                      className="btn btn-ghost btn-circle btn-sm text-error"
                      title="Desconectar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Calendar Selection */}
              <CalendarSelection
                accessToken={integration.accessToken!}
                syncedIds={integration.syncedCalendarIds || [integration.calendarId]}
                familyId={currentFamily._id}
              />
            </div>
          )}
        </div>

        {/* Manual Configuration (Advanced) - Always visible or only when needed? User kept it. */}
        <div className="collapse collapse-arrow bg-base-100 border border-base-300">
          <input type="checkbox" />
          <div className="collapse-title font-medium text-sm text-base-content/70">
            Configuración manual (Avanzado)
          </div>
          <div className="collapse-content">
            <form onSubmit={handleManualSave} className="space-y-4 pt-2">
              <p className="text-xs text-warning mb-2">
                * Editar estos valores puede romper la sincronización automática.
              </p>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">ID del Calendario</span>
                </label>
                <input
                  type="text"
                  placeholder="primary"
                  className="input input-bordered w-full"
                  value={calendarId}
                  onChange={(e) => setCalendarId(e.target.value)}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Nombre a mostrar</span>
                </label>
                <input
                  type="text"
                  placeholder="Mi Calendario"
                  className="input input-bordered w-full"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn btn-ghost btn-outline btn-sm w-full"
                disabled={!calendarId || !displayName}
              >
                Actualizar Datos
              </button>
            </form>
          </div>
        </div>
      </div>

      <ConfirmModal />
    </div>
  );
}

function CalendarSelection({ accessToken, syncedIds, familyId }: { accessToken: string, syncedIds: string[], familyId: Id<"families"> }) {
  const listCalendars = useAction(api.calendar.listGoogleCalendarsAction);
  const updateSettings = useMutation(api.calendar.updateCalendarSettings);

  const [calendars, setCalendars] = useState<{ id: string, summary: string, primary?: boolean, color?: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(syncedIds);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCalendars = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const list = await listCalendars({ familyId });
      setCalendars(list);
    } catch (err) {
      console.error(err);
      setError("Error al cargar calendarios");
    } finally {
      setIsLoading(false);
    }
  }, [familyId, listCalendars]);

  useEffect(() => {
    loadCalendars();
  }, [loadCalendars]);

  const toggleCalendar = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        familyId,
        syncedCalendarIds: selectedIds
      });
      // Ideally trigger a sync here too? Or let the user wait for next sync?
      // Usually valid to trigger sync immediately. But let's just save for now.
    } catch (err) {
      console.error(err);
      setError("Error al guardar configuración");
    } finally {
      setIsSaving(false);
    }
  };

  // Check if current selection differs from props
  // Simple array comparison
  const hasChanges = JSON.stringify(selectedIds.sort()) !== JSON.stringify(syncedIds.sort());

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
            <p className="text-xs text-base-content/50 text-center py-2">
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
