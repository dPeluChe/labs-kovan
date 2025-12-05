import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim()) {
      setError("Por favor completa todos los campos");
      return;
    }

    if (!email.includes("@")) {
      setError("Por favor ingresa un email válido");
      return;
    }

    try {
      await login(email.trim().toLowerCase(), name.trim());
    } catch {
      setError("Error al iniciar sesión. Intenta de nuevo.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <div className="flex justify-end p-4">
        <button
          onClick={toggleTheme}
          className="btn btn-ghost btn-circle"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-xl w-full max-w-sm">
          <div className="card-body">
            <div className="text-center mb-4">
              <span className="text-5xl">🏠</span>
              <h1 className="text-2xl font-bold mt-2">Kovan</h1>
              <p className="text-base-content/60 text-sm">
                Organiza tu familia en un solo lugar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Nombre</span>
                </label>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  className="input input-bordered w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="input input-bordered w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="alert alert-error text-sm py-2">
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "Entrar"
                )}
              </button>
            </form>

            <p className="text-center text-xs text-base-content/50 mt-4">
              Demo mode - No se requiere contraseña
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
