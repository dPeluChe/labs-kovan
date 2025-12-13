import { useState } from "react";
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

export function RecipesPage() {
  const { currentFamily } = useFamily();
  const { user } = useAuth();
  const [showNewRecipe, setShowNewRecipe] = useState(false);
  const { confirm, ConfirmModal } = useConfirmModal();

  const recipes = useQuery(
    api.recipes.getRecipes,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const toggleFavorite = useMutation(api.recipes.toggleFavorite);
  const deleteRecipe = useMutation(api.recipes.deleteRecipe);

  if (!currentFamily || !user) return null;

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
                      onToggleFavorite={() => toggleFavorite({ recipeId: recipe._id })}
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
                          await deleteRecipe({ recipeId: recipe._id });
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
                      onToggleFavorite={() => toggleFavorite({ recipeId: recipe._id })}
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
                          await deleteRecipe({ recipeId: recipe._id });
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

      {showNewRecipe && currentFamily && user && (
        <NewRecipeModal
          familyId={currentFamily._id}
          userId={user._id}
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
            >
              <Heart className={`w-4 h-4 ${recipe.isFavorite ? "fill-current" : ""}`} />
            </button>
            {recipe.url && (
              <a
                href={recipe.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-xs btn-circle text-primary"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          <button onClick={onDelete} className="btn btn-ghost btn-xs btn-circle text-error">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function NewRecipeModal({
  familyId,
  userId,
  onClose,
}: {
  familyId: Id<"families">;
  userId: Id<"users">;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createRecipe = useMutation(api.recipes.createRecipe);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      await createRecipe({
        familyId,
        title: title.trim(),
        url: url.trim() || undefined,
        category: category.trim() || undefined,
        addedBy: userId,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Nueva receta</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Nombre *</span></label>
            <input
              type="text"
              placeholder="Ej: Tacos al pastor"
              className="input input-bordered w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">URL de la receta</span></label>
            <input
              type="url"
              placeholder="https://..."
              className="input input-bordered w-full"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Categoría</span></label>
            <select
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
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
