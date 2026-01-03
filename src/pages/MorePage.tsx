
import { useState } from "react";
import { Link } from "react-router-dom";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import {
  Book,
  Car,
  Users,
  Calendar,
  Settings,
  ChevronRight,
  DollarSign,
  ChefHat,
  MapPin,
  Contact,
  Dices,
  Bot,
  Heart,
  LayoutGrid,
  List,
  Cat,
  Plane,
  CheckSquare, // Added back
  FileText,
  CreditCard,
  Utensils,
  BookHeart,
} from "lucide-react";

const menuItems = [
  {
    to: "/agent",
    icon: Bot,
    label: "Kovan",
    description: "Asistente inteligente",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    to: "/calendar",
    icon: Calendar,
    label: "Calendario",
    description: "Agenda Familiar",
    color: "bg-orange-500/10 text-orange-600",
  },
  {
    to: "/finances",
    icon: DollarSign,
    label: "Finanzas",
    description: "Control de gastos",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    to: "/tasks",
    icon: CheckSquare,
    label: "Tareas",
    description: "Pendientes y Super",
    color: "bg-sky-500/10 text-sky-600",
  },
  {
    to: "/documents",
    icon: FileText,
    label: "Bóveda",
    description: "Documentos importantes",
    color: "bg-slate-500/10 text-slate-600",
  },
  {
    to: "/subscriptions",
    icon: CreditCard,
    label: "Suscripciones",
    description: "Servicios y Pagos",
    color: "bg-violet-500/10 text-violet-600",
  },
  {
    to: "/health",
    icon: Heart,
    label: "Salud",
    description: "Expedientes médicos",
    color: "bg-pink-500/10 text-pink-600",
  },
  {
    to: "/pets",
    icon: Cat,
    label: "Mascotas",
    description: "Salud y cuidados",
    color: "bg-orange-500/10 text-orange-600",
  },
  {
    to: "/recipes",
    icon: ChefHat,
    label: "Recetas",
    description: "Colección de recetas",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    to: "/nutrition",
    icon: Utensils,
    label: "Nutrición",
    description: "Planes y seguimiento",
    color: "bg-lime-500/10 text-lime-600",
  },
  {
    to: "/places",
    icon: MapPin,
    label: "Lugares",
    description: "Lugares por conocer",
    color: "bg-rose-500/10 text-rose-600",
  },
  {
    to: "/trips",
    icon: Plane,
    label: "Viajes",
    description: "Tus aventuras",
    color: "bg-cyan-500/10 text-cyan-600",
  },
  {
    to: "/collections",
    icon: Book,
    label: "Colecciones",
    description: "Libros, juegos y más",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    to: "/activities",
    icon: Dices,
    label: "Juegos",
    description: "Dinámicas familiares",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    to: "/vehicles",
    icon: Car,
    label: "Autos",
    description: "Mantenimiento",
    color: "bg-green-500/10 text-green-600",
  },
  {
    to: "/contacts",
    icon: Contact,
    label: "Directorio",
    description: "Contactos útiles",
    color: "bg-indigo-500/10 text-indigo-600",
  },
  {
    to: "/diary",
    icon: BookHeart,
    label: "Diario",
    description: "Momentos y gratitud",
    color: "bg-rose-500/10 text-rose-600",
  },
  {
    to: "/family",
    icon: Users,
    label: "Familia",
    description: "Miembros",
    color: "bg-purple-500/10 text-purple-600",
  },

  {
    to: "/settings",
    icon: Settings,
    label: "Ajustes",
    description: "Configuración",
    color: "bg-gray-500/10 text-gray-600",
  },
];

export function MorePage() {
  const { currentFamily } = useFamily();
  const [viewMode, setViewMode] = useState<"list" | "grid">(() => {
    return (localStorage.getItem("morePage_viewMode") as "list" | "grid") || "grid";
  });

  const toggleViewMode = () => {
    const newMode = viewMode === "list" ? "grid" : "list";
    setViewMode(newMode);
    localStorage.setItem("morePage_viewMode", newMode);
  };

  return (
    <div className="pb-4">
      <PageHeader
        title="Más"
        subtitle={currentFamily?.name}
        action={
          <button
            onClick={toggleViewMode}
            className="btn btn-ghost btn-sm btn-square"
            title={viewMode === "list" ? "Ver como cuadrícula" : "Ver como lista"}
          >
            {viewMode === "list" ? <LayoutGrid className="w-5 h-5" /> : <List className="w-5 h-5" />}
          </button>
        }
      />

      <div key={viewMode} className={`px-4 stagger-children ${viewMode === "grid" ? "grid grid-cols-2 gap-3" : "space-y-2"}`}>
        {menuItems.map(({ to, icon: Icon, label, description, color }) => (
          <Link
            key={to}
            to={to}
            className={`
              card bg-base-100 shadow-sm border border-base-300 card-interactive
              ${viewMode === "grid" ? "flex flex-col items-center justify-center text-center p-3 h-32" : ""}
            `}
          >
            {viewMode === "list" ? (
              // List View Content
              <div className="card-body p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{label}</h3>
                    <p className="text-xs text-base-content/60">{description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-base-content/40 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ) : (
              // Grid View Content
              <div className="flex flex-col items-center gap-2 w-full">
                <div className={`p-2.5 rounded-xl ${color} bg-opacity-20 flex items-center justify-center shadow-sm mb-1`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-center w-full px-1">
                  <span className="font-semibold text-sm leading-tight truncate w-full">
                    {label}
                  </span>
                  <p className="text-[10px] leading-tight text-base-content/60 line-clamp-2 mt-1 w-full mx-auto max-w-[90%]">
                    {description}
                  </p>
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
