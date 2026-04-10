import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { useToast } from "../components/ui/Toast";
import {
  ArrowLeft,
  LogOut,
  Check,
  Pen,
} from "lucide-react";
import { EditProfileModal } from "../components/settings/EditProfileModal";
import { NavOrderEditor } from "../components/settings/NavOrderEditor";
import { ALL_NAV_ITEMS, DEFAULT_NAV_ORDER } from "../components/settings/navOrderConstants";

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, sessionToken, logout } = useAuth();
  const { success } = useToast();

  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [localNavOrder, setLocalNavOrder] = useState<string[] | null>(null);

  const savedNavOrder = useQuery(
    api.users.getNavOrder,
    sessionToken ? { sessionToken } : "skip"
  );

  const updateNavOrder = useMutation(api.users.updateNavOrder);
  const updateUser = useMutation(api.users.updateUser);

  // Compute the nav order: use local if modified, otherwise derive from saved
  const navOrder = useMemo(() => {
    // If user has made local changes, use those
    if (localNavOrder !== null) {
      return localNavOrder;
    }

    // Otherwise, compute from saved order
    if (!savedNavOrder) {
      return ["home", "agent", "finances", "places"];
    }

    // Get all available item IDs (excluding legacy ones and 'more')
    const allAvailableIds = ALL_NAV_ITEMS
      .filter(item => !['expenses', 'library', 'services'].includes(item.id))
      .map(item => item.id);

    // Start with saved order
    const mergedOrder = [...savedNavOrder];

    // Add any new items that aren't in the saved order
    allAvailableIds.forEach(id => {
      if (!mergedOrder.includes(id)) {
        mergedOrder.push(id);
      }
    });

    // Remove any legacy or invalid items
    const cleanedOrder = mergedOrder.filter(id =>
      allAvailableIds.includes(id) || id === 'more'
    );

    return cleanedOrder;
  }, [savedNavOrder, localNavOrder]);

  // Wrapper to set nav order that marks changes
  const setNavOrder = useCallback((newOrder: string[]) => {
    setLocalNavOrder(newOrder);
    setHasChanges(true);
  }, []);

  if (!user) return <PageLoader />;

  const handleDragStart = (id: string) => {
    setDraggedItem(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const newOrder = [...navOrder];
    const draggedIdx = newOrder.indexOf(draggedItem);
    const targetIdx = newOrder.indexOf(targetId);

    newOrder.splice(draggedIdx, 1);
    newOrder.splice(targetIdx, 0, draggedItem);

    setNavOrder(newOrder);
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const moveItem = (id: string, direction: "up" | "down") => {
    const idx = navOrder.indexOf(id);
    if (direction === "up" && idx > 0) {
      const newOrder = [...navOrder];
      [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
      setNavOrder(newOrder);
      setHasChanges(true);
    } else if (direction === "down" && idx < navOrder.length - 1) {
      const newOrder = [...navOrder];
      [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
      setNavOrder(newOrder);
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    if (!sessionToken) return;
    await updateNavOrder({ sessionToken, navOrder });
    setHasChanges(false);
    success("Navegación guardada");
  };

  const handleReset = () => {
    setNavOrder(DEFAULT_NAV_ORDER);
    setHasChanges(true);
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-base-100 border-b border-base-300">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm btn-circle">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Configuración</h1>
        </div>
        {hasChanges && (
          <button onClick={handleSave} className="btn btn-primary btn-sm gap-1">
            <Check className="w-4 h-4" />
            Guardar
          </button>
        )}
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* User info */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center text-base-content/70 font-semibold text-xl">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-sm text-base-content/60">{user.email}</p>
              </div>
              <button
                onClick={() => {
                  setEditName(user.name);
                  setShowEditProfile(true);
                }}
                className="btn btn-ghost btn-sm"
              >
                <Pen className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <NavOrderEditor
          navOrder={navOrder}
          draggedItem={draggedItem}
          onReset={handleReset}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onMoveItem={moveItem}
        />

        {/* Logout */}
        <button
          onClick={() => void logout()}
          className="card bg-base-100 shadow-sm border border-error/30 w-full text-left card-interactive"
        >
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-error/10 text-error">
                <LogOut className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-error">Cerrar sesión</h3>
                <p className="text-xs text-base-content/60">{user.email}</p>
              </div>
            </div>
          </div>
        </button>
      </div>

      <EditProfileModal
        isOpen={showEditProfile}
        userEmail={user.email}
        editName={editName}
        onChangeName={setEditName}
        onClose={() => setShowEditProfile(false)}
        onSubmit={async () => {
          if (!editName.trim()) return;
          if (!sessionToken) return;
          await updateUser({ sessionToken, name: editName.trim() });
          success("Perfil actualizado");
          setShowEditProfile(false);
        }}
      />
    </div >
  );
}
