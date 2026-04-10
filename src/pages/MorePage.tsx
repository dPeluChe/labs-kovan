
import { useState } from "react";
import { Link } from "react-router-dom";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { IconBadge } from "../components/ui/IconBadge";
import { moduleColor, type ModuleColorKey } from "../lib/moduleColors";
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
  CheckSquare,
  FileText,
  CreditCard,
  Utensils,
  BookHeart,
  Medal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MenuItem {
  to: string;
  icon: LucideIcon;
  label: string;
  description: string;
  colorKey: ModuleColorKey;
}

const menuItems: MenuItem[] = [
  { to: "/agent",         icon: Bot,        label: "Kovan",        description: "Asistente inteligente",  colorKey: "agent" },
  { to: "/calendar",      icon: Calendar,   label: "Calendario",   description: "Agenda Familiar",        colorKey: "calendar" },
  { to: "/finances",      icon: DollarSign, label: "Finanzas",     description: "Control de gastos",      colorKey: "finances" },
  { to: "/tasks",         icon: CheckSquare,label: "Tareas",       description: "Pendientes y Super",     colorKey: "tasks" },
  { to: "/documents",     icon: FileText,   label: "Bóveda",       description: "Documentos importantes", colorKey: "documents" },
  { to: "/subscriptions", icon: CreditCard, label: "Suscripciones",description: "Servicios y Pagos",      colorKey: "subscriptions" },
  { to: "/health",        icon: Heart,      label: "Salud",        description: "Expedientes médicos",    colorKey: "health" },
  { to: "/pets",          icon: Cat,        label: "Mascotas",     description: "Salud y cuidados",       colorKey: "pets" },
  { to: "/recipes",       icon: ChefHat,    label: "Recetas",      description: "Colección de recetas",   colorKey: "recipes" },
  { to: "/nutrition",     icon: Utensils,   label: "Nutrición",    description: "Planes y seguimiento",   colorKey: "nutrition" },
  { to: "/places",        icon: MapPin,     label: "Lugares",      description: "Lugares por conocer",    colorKey: "places" },
  { to: "/trips",         icon: Plane,      label: "Viajes",       description: "Tus aventuras",          colorKey: "trips" },
  { to: "/collections",   icon: Book,       label: "Colecciones",  description: "Libros, juegos y más",   colorKey: "collections" },
  { to: "/household",     icon: Medal,      label: "Hogar",        description: "Actividades y puntos",   colorKey: "household" },
  { to: "/activities",    icon: Dices,      label: "Juegos",       description: "Dinámicas familiares",   colorKey: "activities" },
  { to: "/vehicles",      icon: Car,        label: "Autos",        description: "Mantenimiento",          colorKey: "vehicles" },
  { to: "/contacts",      icon: Contact,    label: "Directorio",   description: "Contactos útiles",       colorKey: "contacts" },
  { to: "/diary",         icon: BookHeart,  label: "Diario",       description: "Momentos y gratitud",    colorKey: "diary" },
  { to: "/family",        icon: Users,      label: "Familia",      description: "Miembros",               colorKey: "family" },
  { to: "/settings",      icon: Settings,   label: "Ajustes",      description: "Configuración",          colorKey: "settings" },
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
        {menuItems.map(({ to, icon: Icon, label, description, colorKey }) => (
          <Link
            key={to}
            to={to}
            className={`
              card surface-card shadow-sm card-interactive
              ${viewMode === "grid" ? "flex flex-col items-center justify-center text-center p-3 h-32" : ""}
            `}
          >
            {viewMode === "list" ? (
              // List View Content
              <div className="card-body p-4">
                <div className="flex items-center gap-3">
                  <IconBadge color={moduleColor(colorKey)} size="sm">
                    <Icon className="w-5 h-5" />
                  </IconBadge>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{label}</h3>
                    <p className="text-xs text-muted">{description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-faint transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ) : (
              // Grid View Content
              <div className="flex flex-col items-center gap-2 w-full">
                <IconBadge color={moduleColor(colorKey)} size="md" rounded="lg" className="shadow-sm mb-1">
                  <Icon className="w-6 h-6" />
                </IconBadge>
                <div className="flex flex-col items-center w-full px-1">
                  <span className="font-semibold text-sm leading-tight truncate w-full">
                    {label}
                  </span>
                  <p className="text-[10px] leading-tight text-muted line-clamp-2 mt-1 w-full mx-auto max-w-[90%]">
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
