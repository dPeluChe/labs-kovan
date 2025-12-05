import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { useToast } from "../components/ui/Toast";
import {
  ArrowLeft,
  LogOut,
  GripVertical,
  Home,
  Gift,
  MapPin,
  Heart,
  MoreHorizontal,
  Calendar,
  DollarSign,
  ChefHat,
  Book,
  Car,
  Check,
  RotateCcw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// All available nav items
const ALL_NAV_ITEMS: { id: string; icon: LucideIcon; label: string }[] = [
  { id: "home", icon: Home, label: "Inicio" },
  { id: "gifts", icon: Gift, label: "Regalos" },
  { id: "places", icon: MapPin, label: "Lugares" },
  { id: "health", icon: Heart, label: "Salud" },
  { id: "calendar", icon: Calendar, label: "Calendario" },
  { id: "expenses", icon: DollarSign, label: "Gastos" },
  { id: "recipes", icon: ChefHat, label: "Recetas" },
  { id: "library", icon: Book, label: "Librería" },
  { id: "services", icon: Car, label: "Servicios" },
];

const DEFAULT_NAV_ORDER = ["home", "gifts", "places", "health", "more"];

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { success } = useToast();
  
  const [navOrder, setNavOrder] = useState<string[]>(DEFAULT_NAV_ORDER);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const savedNavOrder = useQuery(
    api.users.getNavOrder,
    user ? { userId: user._id } : "skip"
  );

  const updateNavOrder = useMutation(api.users.updateNavOrder);

  useEffect(() => {
    if (savedNavOrder) {
      setNavOrder(savedNavOrder);
    }
  }, [savedNavOrder]);

  if (!user) return <PageLoader />;

  const mainNavItems = navOrder.slice(0, 4); // First 4 items in bottom nav
  const moreItems = navOrder.slice(4); // Rest go to "more"

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
    await updateNavOrder({ userId: user._id, navOrder });
    setHasChanges(false);
    success("Navegación guardada");
  };

  const handleReset = () => {
    setNavOrder(DEFAULT_NAV_ORDER);
    setHasChanges(true);
  };

  const getNavItem = (id: string) => {
    if (id === "more") return { id: "more", icon: MoreHorizontal, label: "Más" };
    return ALL_NAV_ITEMS.find((item) => item.id === id) || { id, icon: Home, label: id };
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
              <div className="avatar placeholder">
                <div className="bg-primary/10 text-primary rounded-full w-12">
                  <span className="text-xl">{user.name.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-sm text-base-content/60">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation order */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Barra de navegación</h3>
            <button onClick={handleReset} className="btn btn-ghost btn-xs gap-1">
              <RotateCcw className="w-3 h-3" />
              Restablecer
            </button>
          </div>
          
          <p className="text-sm text-base-content/60 mb-3">
            Arrastra para reordenar. Los primeros 4 aparecen en la barra inferior.
          </p>

          {/* Main nav items (first 4) */}
          <div className="space-y-1 mb-4">
            <div className="text-xs font-medium text-primary mb-2">Barra inferior (4 items)</div>
            {mainNavItems.map((id, index) => {
              const item = getNavItem(id);
              const Icon = item.icon;
              return (
                <div
                  key={id}
                  draggable
                  onDragStart={() => handleDragStart(id)}
                  onDragOver={(e) => handleDragOver(e, id)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 rounded-xl border bg-base-100 cursor-move transition-all ${
                    draggedItem === id
                      ? "opacity-50 scale-95 border-primary"
                      : "border-base-300 hover:border-primary/50"
                  }`}
                >
                  <GripVertical className="w-4 h-4 text-base-content/40" />
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="flex-1 font-medium text-sm">{item.label}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveItem(id, "up")}
                      disabled={index === 0}
                      className="btn btn-ghost btn-xs btn-circle"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveItem(id, "down")}
                      disabled={index === mainNavItems.length - 1 && moreItems.length === 0}
                      className="btn btn-ghost btn-xs btn-circle"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Fixed "Más" indicator */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-base-300 bg-base-200/50">
              <div className="w-4 h-4" />
              <div className="bg-base-300 p-2 rounded-lg">
                <MoreHorizontal className="w-4 h-4 text-base-content/50" />
              </div>
              <span className="flex-1 font-medium text-sm text-base-content/50">Más (fijo)</span>
            </div>
          </div>

          {/* Overflow items */}
          {moreItems.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-base-content/60 mb-2">En menú "Más"</div>
              {moreItems.map((id, index) => {
                const item = getNavItem(id);
                const Icon = item.icon;
                return (
                  <div
                    key={id}
                    draggable
                    onDragStart={() => handleDragStart(id)}
                    onDragOver={(e) => handleDragOver(e, id)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-3 rounded-xl border bg-base-100 cursor-move transition-all ${
                      draggedItem === id
                        ? "opacity-50 scale-95 border-primary"
                        : "border-base-300 hover:border-primary/50"
                    }`}
                  >
                    <GripVertical className="w-4 h-4 text-base-content/40" />
                    <div className="bg-base-200 p-2 rounded-lg">
                      <Icon className="w-4 h-4 text-base-content/60" />
                    </div>
                    <span className="flex-1 font-medium text-sm text-base-content/70">{item.label}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveItem(id, "up")}
                        className="btn btn-ghost btn-xs btn-circle"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveItem(id, "down")}
                        disabled={index === moreItems.length - 1}
                        className="btn btn-ghost btn-xs btn-circle"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
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
    </div>
  );
}
