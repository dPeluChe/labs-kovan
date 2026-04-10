import { GripVertical, Home, MoreHorizontal, RotateCcw } from "lucide-react";
import { ALL_NAV_ITEMS } from "./navOrderConstants";

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

      <p className="text-sm text-muted mb-3">
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
              <GripVertical className="w-4 h-4 text-faint" />
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
            <MoreHorizontal className="w-4 h-4 text-subtle" />
          </div>
          <span className="flex-1 font-medium text-sm text-subtle">Más (fijo)</span>
        </div>
      </div>

      {moreItems.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted mb-2">En menú "Más"</div>
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
                <GripVertical className="w-4 h-4 text-faint" />
                <div className="bg-base-200 p-2 rounded-lg">
                  <Icon className="w-4 h-4 text-muted" />
                </div>
                <span className="flex-1 font-medium text-sm text-body">{item.label}</span>
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
