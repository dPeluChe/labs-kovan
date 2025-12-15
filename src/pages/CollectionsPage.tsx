
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { SkeletonPageContent } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { useConfirmModal } from "../hooks/useConfirmModal";
import { Book, Plus } from "lucide-react";
import type { Doc } from "../../convex/_generated/dataModel";

// Components
import { CollectionSection } from "../components/collections/CollectionSection";
import { CollectionGroup } from "../components/collections/CollectionGroup";
import { ItemCard } from "../components/collections/ItemCard";
import { NewItemModal } from "../components/collections/NewItemModal";
import { TYPE_CONFIG, type CollectionType } from "../components/collections/CollectionConstants";

export function CollectionsPage() {
  const { currentFamily } = useFamily();
  const [showNewItem, setShowNewItem] = useState(false);
  const { confirm, ConfirmModal } = useConfirmModal();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = (searchParams.get("type") as CollectionType) || "all";
  const [filterType, setFilterType] = useState<CollectionType>(initialType);

  const items = useQuery(
    api.collections.getCollections,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  if (!currentFamily) return null;

  const handleFilterChange = (type: CollectionType) => {
    setFilterType(type);
    setSearchParams(type === "all" ? {} : { type });
  };

  const filteredItems = items?.filter((item: Doc<"collections">) => {
    if (filterType !== "all" && item.type !== filterType) return false;
    return true;
  });

  // Group by series logic (for filtered view)
  const bySeries = new Map<string, Doc<"collections">[]>();
  const standalone: Doc<"collections">[] = [];

  if (filterType !== "all" && filteredItems) {
    filteredItems.forEach((item: Doc<"collections">) => {
      if (item.series) {
        const existing = bySeries.get(item.series) || [];
        existing.push(item);
        bySeries.set(item.series, existing);
      } else {
        standalone.push(item);
      }
    });
  }

  // Group by Type (for All view)
  const byType: Record<string, Doc<"collections">[]> = {};
  if (filterType === "all" && items) {
    items.forEach(item => {
      if (!byType[item.type]) byType[item.type] = [];
      byType[item.type].push(item);
    });
  }

  const renderContent = () => {
    if (items === undefined) return <SkeletonPageContent cards={4} />;

    if (items.length === 0) {
      return (
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
      );
    }

    if (filteredItems?.length === 0) {
      return (
        <EmptyState
          icon={Book}
          title="Sin resultados"
          description="No hay elementos de este tipo"
        />
      );
    }

    // "ALL" VIEW - Dashboard/Shelves style
    if (filterType === "all") {
      return (
        <div className="space-y-8 animate-fade-in pb-10">
          {Object.entries(TYPE_CONFIG).map(([key, config]) => {
            const typeItems = byType[key] || [];
            if (typeItems.length === 0) return null;

            return (
              <CollectionSection
                key={key}
                title={config.label}
                icon={config.icon}
                items={typeItems}
                onViewAll={() => handleFilterChange(key as CollectionType)}
                confirm={confirm}
              />
            );
          })}
        </div>
      );
    }

    // "SPECIFIC TYPE" VIEW - Grouped Grid
    return (
      <div className="space-y-6 stagger-children pb-10">
        {/* Series Groups first */}
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
              <h3 className="font-semibold text-sm mb-3 px-1 text-base-content/60">Individuales</h3>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {standalone.map((item) => (
                <ItemCard key={item._id} item={item} confirm={confirm} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pb-4 min-h-screen bg-base-100">
      <PageHeader
        title="Colecciones"
        subtitle="Biblioteca y entretenimiento"
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

      {/* Type Filter Tabs */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar sticky top-[60px] z-10 bg-base-100/95 backdrop-blur border-b border-base-200 pb-3 pt-2">
        <button
          onClick={() => handleFilterChange("all")}
          className={`btn btn-sm rounded-full ${filterType === "all" ? "btn-neutral" : "btn-ghost bg-base-200 hover:bg-base-300"}`}
        >
          Todo
        </button>
        {Object.entries(TYPE_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => handleFilterChange(key as CollectionType)}
            className={`btn btn-sm rounded-full whitespace-nowrap gap-2 ${filterType === key ? "btn-primary" : "btn-ghost bg-base-200 hover:bg-base-300"}`}
          >
            <config.icon className="w-3.5 h-3.5" />
            {config.label}
          </button>
        ))}
      </div>

      <div className="mt-4 px-4">
        {renderContent()}
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
