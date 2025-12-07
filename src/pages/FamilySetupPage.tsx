import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { useFamily } from "../contexts/FamilyContext";
import { LogOut } from "lucide-react";

const EMOJIS = ["🏠", "🏡", "🏢", "❤️", "👨‍👩‍👧‍👦", "🐕", "🌟", "🌈"];

export function FamilySetupPage() {
  const { user, logout } = useAuth();
  const { setCurrentFamily, clearInviteError } = useFamily();
  const createFamily = useMutation(api.families.createFamily);

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏠");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const familyId = await createFamily({
        name: name.trim(),
        emoji,
        userId: user._id,
      });

      // The FamilyContext will automatically pick up the new family
      setCurrentFamily({
        _id: familyId,
        name: name.trim(),
        emoji,
        role: "owner",
      });
    } catch {
      setError("Error al crear la familia. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base-200">
      <div className="card bg-base-100 shadow-xl w-full max-w-sm">
        <div className="card-body">
          {/* Logout button - allows user to restart flow */}
          <button
            onClick={() => {
              clearInviteError();
              logout();
            }}
            className="btn btn-ghost btn-sm btn-circle absolute top-4 left-4"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <div className="text-center mb-4">
            <span className="text-5xl">{emoji}</span>
            <h1 className="text-xl font-bold mt-2">Crea tu primera familia</h1>
            <p className="text-base-content/60 text-sm">
              Un espacio para organizar todo juntos
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Nombre de la familia</span>
              </label>
              <input
                type="text"
                placeholder="Ej: Familia García, Nuestra casa"
                className="input input-bordered w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Ícono</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`btn btn-square btn-sm text-xl ${
                      emoji === e ? "btn-primary" : "btn-ghost"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="alert alert-error text-sm py-2">
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  clearInviteError();
                  logout();
                }}
                className="btn btn-ghost flex-1"
                disabled={isLoading}
              >
                Cerrar sesión
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "Crear familia"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
