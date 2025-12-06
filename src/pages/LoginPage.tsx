import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Moon, Sun, Users } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const inviteFamilyId = searchParams.get("invite");
  
  const { login, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  // Get family info if invite link
  const inviteFamily = useQuery(
    api.families.getFamily,
    inviteFamilyId ? { familyId: inviteFamilyId as Id<"families"> } : "skip"
  );

  // Store invite in localStorage to process after login
  useEffect(() => {
    if (inviteFamilyId) {
      localStorage.setItem("kovan_pending_invite", inviteFamilyId);
    }
  }, [inviteFamilyId]);

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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-base-200 to-base-300">
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
        <div className="card bg-base-100 shadow-2xl w-full max-w-sm animate-scale-in">
          <div className="card-body">
            <div className="text-center mb-6">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                <span className="text-3xl">{inviteFamily ? "👋" : "🏠"}</span>
              </div>
              <h1 className="text-2xl font-bold">
                {inviteFamily ? "¡Te invitaron!" : "Bienvenido a Kovan"}
              </h1>
              <p className="text-base-content/60 text-sm mt-1">
                {inviteFamily 
                  ? `Únete a la familia "${inviteFamily.name}"`
                  : "Organiza tu vida familiar"
                }
              </p>
            </div>

            {/* Invite banner */}
            {inviteFamily && (
              <div className="alert alert-info mb-4 animate-fade-in">
                <Users className="w-5 h-5" />
                <div>
                  <p className="font-medium">Invitación a "{inviteFamily.name}"</p>
                  <p className="text-xs opacity-80">Ingresa tus datos para unirte</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Nombre</span>
                </label>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  className="input input-bordered w-full focus:input-primary transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  autoComplete="name"
                  autoFocus
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email</span>
                </label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="input input-bordered w-full focus:input-primary transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              {error && (
                <div className="alert alert-error text-sm py-2 animate-shake">
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full btn-lg mt-2 shadow-lg shadow-primary/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "Entrar a casa"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
