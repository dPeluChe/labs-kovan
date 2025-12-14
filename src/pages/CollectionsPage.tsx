import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { SkeletonPageContent } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { useConfirmModal } from "../hooks/useConfirmModal";
import { Book, Plus, Trash2, Check, ShoppingCart, Gamepad2, Disc, Box } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Id, Doc } from "../../convex/_generated/dataModel";

type CollectionType = "all" | "book" | "manga" | "comic" | "board_game" | "video_game" | "collectible" | "other";
type CollectionStatus = "wishlist" | "owned_unread" | "in_progress" | "finished" | "abandoned";

import type { ConfirmOptions } from "../hooks/useConfirmModal";

const TYPE_CONFIG: Record<string, { label: string; icon: LucideIcon }> = {
  book: { label: "Libro", icon: Book },
  manga: { label: "Manga", icon: Book },
  comic: { label: "Comic", icon: Book },
  board_game: { label: "Juego de Mesa", icon: Box },
  video_game: { label: "Videojuego", icon: Gamepad2 },
  collectible: { label: "Coleccionable", icon: Disc },
  other: { label: "Otro", icon: Box },
};

const STATUS_LABELS: Record<string, string> = {
  wishlist: "Lista de deseos",
  owned_unread: "Por empezar",
  in_progress: "En progreso",
  finished: "Terminado",
  abandoned: "Abandonado",
};

export function CollectionsPage() {
  const { currentFamily } = useFamily();
  const [showNewItem, setShowNewItem] = useState(false);
  const { confirm, ConfirmModal } = useConfirmModal();
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get("type") as CollectionType) || "all";
  const [filterType, setFilterType] = useState<CollectionType>(initialType);

  const items = useQuery(
    api.collections.getCollections,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  if (!currentFamily) return null;

  const filteredItems = items?.filter((item: Doc<"collections">) => {
    if (filterType !== "all" && item.type !== filterType) return false;
    return true;
  });

  // Group by series
  const bySeries = new Map<string, Doc<"collections">[]>();
  const standalone: Doc<"collections">[] = [];

  filteredItems?.forEach((item: Doc<"collections">) => {
    if (item.series) {
      const existing = bySeries.get(item.series) || [];
      existing.push(item);
      bySeries.set(item.series, existing);
    } else {
      standalone.push(item);
    }
  });

  return (
    <div className="pb-4">
      <PageHeader
        title="Colecciones"
        subtitle="Libros, juegos y más"
        action={
          <button
            onClick={() => setShowNewItem(true)}
            className="btn btn-primary btn-sm gap-1"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        }
      />

      {/* Filters */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto">
        <select
          className="select select-bordered select-sm"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as CollectionType)}
        >
          <option value="all">Todos los tipos</option>
          {Object.entries(TYPE_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      <div className="px-4">
        {items === undefined ? (
          <SkeletonPageContent cards={4} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Book}
            title="Colección vacía"
            description="Agrega tus libros, juegos y coleccionables"
            action={
              <button
                onClick={() => setShowNewItem(true)}
                className="btn btn-primary btn-sm"
              >
                Agregar item
              </button>
            }
          />
        ) : filteredItems?.length === 0 ? (
          <EmptyState
            icon={Book}
            title="Sin resultados"
            description="No hay elementos con eses filtros"
          />
        ) : (
          <div className="space-y-6 stagger-children">
            {/* Series Groups */}
            {Array.from(bySeries.entries())
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([seriesName, seriesItems]) => (
                <CollectionGroup
                  key={seriesName}
                  name={seriesName}
                  items={seriesItems}
                  confirm={confirm}
                />
              ))}

            {/* Standalone Items */}
            {standalone.length > 0 && (
              <div>
                {bySeries.size > 0 && (
                  <h3 className="font-semibold text-sm mb-2 text-base-content/60">Individuales</h3>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {standalone.map((item) => (
                    <ItemCard key={item._id} item={item} confirm={confirm} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showNewItem && currentFamily && (
        <NewItemModal
          familyId={currentFamily._id}
          onClose={() => setShowNewItem(false)}
        />
      )}

      <ConfirmModal />
    </div>
  );
}

function CollectionGroup({
  name,
  items,
  confirm,
}: {
  name: string;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  items: Doc<"collections">[];
}) {
  // Try to sort by volume/version if possible
  const sortedItems = [...items].sort((a, b) => {
    // Basic Alphanumeric sort on volumeOrVersion
    // If null, put at end
    if (!a.volumeOrVersion) return 1;
    if (!b.volumeOrVersion) return -1;
    return a.volumeOrVersion.localeCompare(b.volumeOrVersion, undefined, { numeric: true });
  });

  const ownedCount = items.filter((b) => b.owned).length;

  return (
    <div className="bg-base-200/50 p-3 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-lg">{name}</h3>
        <span className="badge badge-sm badge-ghost">
          {ownedCount}/{items.length}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {sortedItems.map((item) => (
          <ItemCard key={item._id} item={item} showVolume confirm={confirm} />
        ))}
      </div>
    </div>
  );
}

function ItemCard({
  item,
  showVolume = false,
  confirm,
}: {
  item: Doc<"collections">;
  showVolume?: boolean;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}) {
  const updateItem = useMutation(api.collections.updateItem);
  const deleteItem = useMutation(api.collections.deleteItem);

  const TypeIcon = TYPE_CONFIG[item.type]?.icon || Box;

  const toggleOwned = async () => {
    await updateItem({ itemId: item._id, owned: !item.owned });
  };

  return (
    <div className={`card bg-base-100 shadow-sm border ${item.owned ? "border-base-300" : "border-dashed border-base-300 opacity-80"}`}>
      <div className="card-body p-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-xs opacity-60 mb-1">
              <TypeIcon className="w-3 h-3" />
              <span>{TYPE_CONFIG[item.type]?.label}</span>
            </div>

            <h4 className="font-medium text-sm truncate" title={item.title}>
              {showVolume && item.volumeOrVersion ? item.volumeOrVersion : item.title}
            </h4>

            {item.creator && !showVolume && (
              <p className="text-xs text-base-content/60 truncate">{item.creator}</p>
            )}
            {/* Fallback title if showing volume but keeping context */}
            {showVolume && item.volumeOrVersion && (
              <p className="text-xs text-base-content/40 truncate">{item.title}</p>
            )}
          </div>

          <div className="dropdown dropdown-end dropdown-bottom">
            <button tabIndex={0} className="btn btn-ghost btn-xs btn-circle -mr-2 -mt-2">
              ⋮
            </button>
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[50] w-40 p-2 shadow-lg border border-base-300">
              <li>
                <button onClick={toggleOwned}>
                  {item.owned ? <ShoppingCart className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  {item.owned ? "A Deseados" : "Tengo esto"}
                </button>
              </li>
              <li>
                <button
                  onClick={async () => {
                    const confirmed = await confirm({
                      title: "Eliminar item",
                      message: `¿Borrar "${item.title}"?`,
                      confirmText: "Eliminar",
                      variant: "danger",
                    });
                    if (confirmed) {
                      await deleteItem({ itemId: item._id });
                    }
                  }}
                  className="text-error"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className={`badge badge-xs ${item.status === 'finished' ? 'badge-success' : item.status === 'in_progress' ? 'badge-warning' : 'badge-ghost'}`}>
            {STATUS_LABELS[item.status]}
          </span>
          {!item.owned && <span className="badge badge-xs badge-outline">Deseado</span>}
        </div>
      </div>
    </div>
  );
}

function NewItemModal({
  familyId,
  onClose,
}: {
  familyId: Id<"families">;
  onClose: () => void;
}) {
  const [type, setType] = useState<Exclude<CollectionType, "all">>("book");
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [series, setSeries] = useState("");
  const [volumeOrVersion, setVolumeOrVersion] = useState("");
  const [owned, setOwned] = useState(true);
  const [status, setStatus] = useState<CollectionStatus>("owned_unread");
  const [isLoading, setIsLoading] = useState(false);

  const createItem = useMutation(api.collections.createItem);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await createItem({
        familyId,
        type,
        title: title.trim(),
        creator: creator.trim() || undefined,
        series: series.trim() || undefined,
        volumeOrVersion: volumeOrVersion.trim() || undefined,
        owned,
        status,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Nuevo Elemento</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Tipo</span></label>
            <select
              className="select select-bordered w-full"
              value={type}
              onChange={(e) => setType(e.target.value as Exclude<CollectionType, "all">)}
            >
              {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Título *</span></label>
            <input className="input input-bordered" placeholder="Ej: Catan, Batman Vol 1" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Creador / Autor (Opcional)</span></label>
            <input className="input input-bordered" placeholder="Autor, Diseñador, Estudio" value={creator} onChange={(e) => setCreator(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="form-control">
              <label className="label"><span className="label-text">Serie / Colección</span></label>
              <input className="input input-bordered" placeholder="Ej: Harry Potter" value={series} onChange={(e) => setSeries(e.target.value)} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Volumen / Versión</span></label>
              <input className="input input-bordered" placeholder="Ej: Vol 1, Ed. 2024" value={volumeOrVersion} onChange={(e) => setVolumeOrVersion(e.target.value)} />
            </div>
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Estado</span></label>
            <select className="select select-bordered" value={status} onChange={e => setStatus(e.target.value as CollectionStatus)}>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-2">
              <input type="checkbox" className="checkbox checkbox-primary" checked={owned} onChange={e => setOwned(e.target.checked)} />
              <span className="label-text">Ya lo tengo</span>
            </label>
          </div>

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || !title.trim()}>
              {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
