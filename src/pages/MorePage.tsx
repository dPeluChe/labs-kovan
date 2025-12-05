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
} from "lucide-react";

const menuItems = [
  {
    to: "/expenses",
    icon: DollarSign,
    label: "Gastos",
    description: "Control de gastos familiares",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    to: "/recipes",
    icon: ChefHat,
    label: "Recetas",
    description: "Colección de recetas",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    to: "/places",
    icon: MapPin,
    label: "Lugares",
    description: "Lugares por conocer",
    color: "bg-rose-500/10 text-rose-600",
  },
  {
    to: "/library",
    icon: Book,
    label: "Librería",
    description: "Libros, mangas y cómics",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    to: "/services",
    icon: Car,
    label: "Servicios y Autos",
    description: "Pagos y mantenimiento",
    color: "bg-green-500/10 text-green-600",
  },
  {
    to: "/contacts",
    icon: Contact,
    label: "Directorio",
    description: "Doctores, mecánicos y más",
    color: "bg-indigo-500/10 text-indigo-600",
  },
  {
    to: "/family",
    icon: Users,
    label: "Familia",
    description: "Miembros e invitaciones",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    to: "/settings/calendar",
    icon: Calendar,
    label: "Calendario",
    description: "Conectar Google Calendar",
    color: "bg-orange-500/10 text-orange-600",
  },
  {
    to: "/settings",
    icon: Settings,
    label: "Configuración",
    description: "Navegación y cuenta",
    color: "bg-gray-500/10 text-gray-600",
  },
];

export function MorePage() {
  const { currentFamily } = useFamily();

  return (
    <div className="pb-4">
      <PageHeader
        title="Más"
        subtitle={currentFamily?.name}
      />

      <div className="px-4 space-y-2 stagger-children">
        {menuItems.map(({ to, icon: Icon, label, description, color }) => (
          <Link
            key={to}
            to={to}
            className="card bg-base-100 shadow-sm border border-base-300 card-interactive"
          >
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
          </Link>
        ))}
      </div>
    </div>
  );
}
