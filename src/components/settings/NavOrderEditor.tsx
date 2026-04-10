import {
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
  RotateCcw,
  Bot,
  Contact,
  Dices,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ALL_NAV_ITEMS: { id: string; icon: LucideIcon; label: string }[] = [
  { id: "home", icon: Home, label: "Inicio" },
  { id: "agent", icon: Bot, label: "Kovan" },
  { id: "gifts", icon: Gift, label: "Regalos" },
  { id: "places", icon: MapPin, label: "Lugares" },
  { id: "health", icon: Heart, label: "Salud" },
  { id: "calendar", icon: Calendar, label: "Calendario" },
  { id: "finances", icon: DollarSign, label: "Finanzas" },
  { id: "recipes", icon: ChefHat, label: "Recetas" },
  { id: "collections", icon: Book, label: "Colecciones" },
  { id: "vehicles", icon: Car, label: "Autos" },
  { id: "contacts", icon: Contact, label: "Directorio" },
  { id: "activities", icon: Dices, label: "Juegos" },
  { id: "expenses", icon: DollarSign, label: "Gastos" },
  { id: "library", icon: Book, label: "Librería" },
  { id: "services", icon: Car, label: "Servicios" },
];

export const DEFAULT_NAV_ORDER = ["home", "agent", "finances", "places"];

interface NavOrderEditorProps {
  navOrder: string[];
  draggedItem: string | null;
  onReset: () => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, targetId: string) => void;
  onDragEnd: () => void;
  onMoveItem: (id: string, direction: "up" | "down") => void;
}

export function NavOrderEditor({
  navOrder,
  draggedItem,
  onReset,
  onDragStart,
  onDragOver,
  onDragEnd,
  onMoveItem,
}: NavOrderEditorProps) {
  const mainNavItems = navOrder.slice(0, 4);
  const moreItems = navOrder.slice(4);

  const getNavItem = (id: string) => {
    if (id === "more") return { id: "more", icon: MoreHorizontal, label: "Más" };
    return ALL_NAV_ITEMS.find((item) => item.id === id) || { id, icon: Home, label: id };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Barra de navegación</h3>
        <button onClick={onReset} className="btn btn-ghost btn-xs gap-1">
          <RotateCcw className="w-3 h-3" />
          Restablecer
        </button>
      </div>

      <p className="text-sm text-base-content/60 mb-3">
        Arrastra para reordenar. Los primeros 4 aparecen en la barra inferior.
      </p>

      <div className="space-y-1 mb-4">
        <div className="text-xs font-medium text-primary mb-2">Barra inferior (4 items)</div>
        {mainNavItems.map((id, index) => {
          const item = getNavItem(id);
          const Icon = item.icon;
          return (
            <div
              key={id}
              draggable
              onDragStart={() => onDragStart(id)}
              onDragOver={(e) => onDragOver(e, id)}
              onDragEnd={onDragEnd}
              className={`flex items-center gap-3 p-3 rounded-xl border bg-base-100 cursor-move transition-all ${draggedItem === id
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
                  onClick={() => onMoveItem(id, "up")}
                  disabled={index === 0}
                  className="btn btn-ghost btn-xs btn-circle"
                >
                  ↑
                </button>
                <button
                  onClick={() => onMoveItem(id, "down")}
                  disabled={index === mainNavItems.length - 1 && moreItems.length === 0}
                  className="btn btn-ghost btn-xs btn-circle"
                >
                  ↓
                </button>
              </div>
            </div>
          );
        })}

        <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-base-300 bg-base-200/50">
          <div className="w-4 h-4" />
          <div className="bg-base-300 p-2 rounded-lg">
            <MoreHorizontal className="w-4 h-4 text-base-content/50" />
          </div>
          <span className="flex-1 font-medium text-sm text-base-content/50">Más (fijo)</span>
        </div>
      </div>

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
                onDragStart={() => onDragStart(id)}
                onDragOver={(e) => onDragOver(e, id)}
                onDragEnd={onDragEnd}
                className={`flex items-center gap-3 p-3 rounded-xl border bg-base-100 cursor-move transition-all ${draggedItem === id
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
                    onClick={() => onMoveItem(id, "up")}
                    className="btn btn-ghost btn-xs btn-circle"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => onMoveItem(id, "down")}
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
  );
}
