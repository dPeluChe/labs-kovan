import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Moon, Sun, Users, Home } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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

      {/* Desktop Advice Banner */}
      <div className="hidden lg:flex bg-primary/10 text-primary px-4 py-2 text-sm justify-center items-center gap-2 animate-slide-down">
        <span className="font-bold">💡 Tip:</span> Kovan está diseñada para ser tu aliado en gestión familiar. Para la mejor experiencia, instálala en tu celular.
      </div>

      <div className="flex justify-between items-center p-4">
        {/* Logo/Brand for mobile reassurance */}
        <div className="flex items-center gap-2 lg:hidden opacity-50">
          <span className="font-bold text-sm tracking-widest uppercase">Kovan</span>
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => navigate('/')}
            className="btn btn-ghost btn-circle bg-base-100/50 backdrop-blur-sm"
            aria-label="Back to home"
          >
            <Home className="w-5 h-5" />
          </button>
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-circle bg-base-100/50 backdrop-blur-sm"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="card bg-base-100 shadow-2xl w-full max-w-sm animate-scale-in border border-base-content/5">
          <div className="card-body p-6 sm:p-8">
            <div className="text-center mb-8">
              <div className="bg-primary/10 w-20 h-20 rounded-3xl rotate-3 flex items-center justify-center mx-auto mb-6 animate-bounce-in shadow-lg shadow-primary/20">
                <span className="text-4xl filter drop-shadow-sm">{inviteFamily ? "👋" : "🏠"}</span>
              </div>
              <h1 className="text-2xl font-bold mb-2">
                {inviteFamily ? "¡Te invitaron!" : "Bienvenido a Casa"}
              </h1>
              <p className="text-base-content/60 text-sm">
                {inviteFamily
                  ? `Únete a la familia "${inviteFamily.name}"`
                  : "Tu hogar digital te espera"
                }
              </p>
            </div>

            {/* Invite banner */}
            {inviteFamily && (
              <div className="alert alert-info mb-6 animate-fade-in shadow-sm">
                <Users className="w-5 h-5" />
                <div>
                  <p className="font-bold text-sm">Invitación a "{inviteFamily.name}"</p>
                  <p className="text-xs opacity-90">Ingresa tus datos para unirte</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="form-control">
                <label className="label pt-0">
                  <span className="label-text font-bold text-xs uppercase tracking-wide opacity-70">Nombre</span>
                </label>
                <input
                  type="text"
                  placeholder="¿Cómo te decimos?"
                  className="input input-lg input-bordered w-full focus:input-primary rounded-2xl bg-base-200/50 focus:bg-base-100 transition-all font-medium placeholder:font-normal placeholder:opacity-50"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  autoComplete="name"
                  autoFocus
                />
              </div>

              <div className="form-control">
                <label className="label pt-0">
                  <span className="label-text font-bold text-xs uppercase tracking-wide opacity-70">Email</span>
                </label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  className="input input-lg input-bordered w-full focus:input-primary rounded-2xl bg-base-200/50 focus:bg-base-100 transition-all font-medium placeholder:font-normal placeholder:opacity-50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              {error && (
                <div className="alert alert-error text-sm py-3 rounded-2xl animate-shake shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full btn-lg rounded-2xl shadow-xl shadow-primary/30 mt-4 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-md" />
                ) : (
                  "Abrir la Puerta"
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-base-content/40">
          Labs Kovan v1.0 BETA
        </p>
      </div>
    </div>
  );
}
