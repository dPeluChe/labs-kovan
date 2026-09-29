import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageHeader } from "../components/ui/PageHeader";
import { SkeletonGrid } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { useConfirmModal } from "../hooks/useConfirmModal";
import { ChefHat, Plus, Trash2, Heart, ExternalLink, Star } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";
import { MobileModal } from "../components/ui/MobileModal";

export function RecipesPage() {
  const { currentFamily } = useFamily();
  const { sessionToken } = useAuth();
  const [showNewRecipe, setShowNewRecipe] = useState(false);
  const { confirm, ConfirmModal } = useConfirmModal();

  const recipes = useQuery(
    api.recipes.getRecipes,
    currentFamily && sessionToken ? { sessionToken, familyId: currentFamily._id } : "skip"
  );

  const toggleFavorite = useMutation(api.recipes.toggleFavorite);
  const deleteRecipe = useMutation(api.recipes.deleteRecipe);

  if (!currentFamily || !sessionToken) return null;

  const favorites = recipes?.filter((r) => r.isFavorite) || [];
  const others = recipes?.filter((r) => !r.isFavorite) || [];

  return (
    <div className="pb-4">
      <PageHeader
        title="Recetas"
        subtitle="Colección de recetas familiares"
        action={
          <button
            onClick={() => setShowNewRecipe(true)}
            className="btn btn-primary btn-sm gap-1"
          >
            <Plus className="w-4 h-4" />
            Nueva
          </button>
        }
      />

      <div className="px-4">
        {recipes === undefined ? (
          <SkeletonGrid count={4} />
        ) : recipes.length === 0 ? (
          <EmptyState
            icon={ChefHat}
            title="Sin recetas"
            description="Guarda tus recetas favoritas de internet"
            action={
              <button
                onClick={() => setShowNewRecipe(true)}
                className="btn btn-primary btn-sm"
              >
                Agregar receta
              </button>
            }
          />
        ) : (
          <div className="space-y-4 animate-fade-in">
            {favorites.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Favoritas
                </h3>
                <div className="grid grid-cols-2 gap-2 stagger-children">
                  {favorites.map((recipe) => (
                    <RecipeCard
                      key={recipe._id}
                      recipe={recipe}
                      onToggleFavorite={() => toggleFavorite({ sessionToken, recipeId: recipe._id })}
                      onDelete={async () => {
                        const confirmed = await confirm({
                          title: "Eliminar receta",
                          message: `¿Estás seguro de que quieres eliminar "${recipe.title}"?`,
                          confirmText: "Eliminar",
                          cancelText: "Cancelar",
                          variant: "danger",
                          icon: "trash",
                        });
                        if (confirmed) {
                          await deleteRecipe({ sessionToken, recipeId: recipe._id });
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {others.length > 0 && (
              <div>
                {favorites.length > 0 && (
                  <h3 className="font-semibold text-sm mb-2">Todas las recetas</h3>
                )}
                <div className="grid grid-cols-2 gap-2 stagger-children">
                  {others.map((recipe) => (
                    <RecipeCard
                      key={recipe._id}
                      recipe={recipe}
                      onToggleFavorite={() => toggleFavorite({ sessionToken, recipeId: recipe._id })}
                      onDelete={async () => {
                        const confirmed = await confirm({
                          title: "Eliminar receta",
                          message: `¿Estás seguro de que quieres eliminar "${recipe.title}"?`,
                          confirmText: "Eliminar",
                          cancelText: "Cancelar",
                          variant: "danger",
                          icon: "trash",
                        });
                        if (confirmed) {
                          await deleteRecipe({ sessionToken, recipeId: recipe._id });
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showNewRecipe && currentFamily && sessionToken && (
        <NewRecipeModal
          sessionToken={sessionToken}
          familyId={currentFamily._id}
          onClose={() => setShowNewRecipe(false)}
        />
      )}

      <ConfirmModal />
    </div>
  );
}

function RecipeCard({
  recipe,
  onToggleFavorite,
  onDelete,
}: {
  recipe: {
    _id: Id<"recipes">;
    title: string;
    url?: string;
    imageUrl?: string;
    category?: string;
    isFavorite?: boolean;
  };
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 overflow-hidden">
      {recipe.imageUrl && (
        <figure className="h-24">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </figure>
      )}
      <div className="card-body p-3">
        <h4 className="font-semibold text-sm truncate">{recipe.title}</h4>
        {recipe.category && (
          <span className="badge badge-xs badge-ghost">{recipe.category}</span>
        )}
        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-1">
            <button
              onClick={onToggleFavorite}
              className={`btn btn-ghost btn-xs btn-circle ${recipe.isFavorite ? "text-amber-500" : ""}`}
              aria-label={recipe.isFavorite ? "Quitar de favoritos" : "Marcar como favorito"}
            >
              <Heart className={`w-4 h-4 ${recipe.isFavorite ? "fill-current" : ""}`} />
            </button>
            {recipe.url && (
              <a
                href={recipe.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-xs btn-circle text-primary"
                aria-label="Abrir receta en nueva pestaña"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          <button onClick={onDelete} className="btn btn-ghost btn-xs btn-circle text-error" aria-label="Eliminar receta">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function NewRecipeModal({
  sessionToken,
  familyId,
  onClose,
}: {
  sessionToken: string;
  familyId: Id<"families">;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const firstFieldRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const submitSeq = useRef(0);

  const createRecipe = useMutation(api.recipes.createRecipe);

  const handleSubmit = async (e: React.FormEvent) => {
    const seq = ++submitSeq.current;
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading((cur) => (seq === submitSeq.current ? true : cur));
    try {
      if (!sessionToken) return;
      await createRecipe({
        sessionToken,
        familyId,
        title: title.trim(),
        url: url.trim() || undefined,
        category: category.trim() || undefined,
      });
      if (seq === submitSeq.current) onClose();
    } finally {
      setIsLoading((cur) => (seq === submitSeq.current ? false : cur));
    }
  };

  return (
    <MobileModal
      isOpen={true}
      onClose={onClose}
      title="Nueva receta"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label htmlFor="nombre" className="label"><span className="label-text">Nombre *</span></label>
          <input id="nombre"
            type="text"
            placeholder="Ej: Tacos al pastor"
            className="input input-bordered w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            ref={firstFieldRef}
          />
        </div>

        <div className="form-control">
          <label htmlFor="url-de-la-receta" className="label"><span className="label-text">URL de la receta</span></label>
          <input id="url-de-la-receta"
            type="url"
            placeholder="https://..."
            className="input input-bordered w-full"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="form-control">
          <label htmlFor="categoria" className="label"><span className="label-text">Categoría</span></label>
          <select id="categoria"
            className="select select-bordered w-full"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Sin categoría</option>
            <option value="Desayuno">Desayuno</option>
            <option value="Comida">Comida</option>
            <option value="Cena">Cena</option>
            <option value="Postre">Postre</option>
            <option value="Snack">Snack</option>
            <option value="Bebida">Bebida</option>
          </select>
        </div>

        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={isLoading || !title.trim()}>
            {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
          </button>
        </div>
      </form>
    </MobileModal>
  );
}
