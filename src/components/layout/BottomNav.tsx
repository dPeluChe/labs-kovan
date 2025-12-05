import { NavLink } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../contexts/AuthContext";
import {
  Home,
  Gift,
  Calendar,
  Heart,
  MoreHorizontal,
  MapPin,
  DollarSign,
  ChefHat,
  Book,
  Car,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const NAV_CONFIG: Record<string, { to: string; icon: LucideIcon; label: string }> = {
  home: { to: "/", icon: Home, label: "Inicio" },
  gifts: { to: "/gifts", icon: Gift, label: "Regalos" },
  calendar: { to: "/calendar", icon: Calendar, label: "Calendario" },
  health: { to: "/health", icon: Heart, label: "Salud" },
  places: { to: "/places", icon: MapPin, label: "Lugares" },
  expenses: { to: "/expenses", icon: DollarSign, label: "Gastos" },
  recipes: { to: "/recipes", icon: ChefHat, label: "Recetas" },
  library: { to: "/library", icon: Book, label: "Librería" },
  services: { to: "/services", icon: Car, label: "Servicios" },
  more: { to: "/more", icon: MoreHorizontal, label: "Más" },
};

const DEFAULT_NAV_ORDER = ["home", "gifts", "places", "health"];

export function BottomNav() {
  const { user } = useAuth();
  
  const savedNavOrder = useQuery(
    api.users.getNavOrder,
    user ? { userId: user._id } : "skip"
  );

  // Use saved order or default
  const navOrder = savedNavOrder ?? DEFAULT_NAV_ORDER;
  const mainItems = navOrder.slice(0, 4);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex flex-row items-center justify-around bg-base-200/90 backdrop-blur-md border-t border-base-300 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] safe-bottom transition-all duration-300">
      <div className="flex w-full h-16 items-center justify-around">
        {mainItems.map((id) => {
          const config = NAV_CONFIG[id];
          if (!config) return null;
          const Icon = config.icon;
          
          return (
            <NavLink
              key={id}
              to={config.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[64px] rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "text-primary scale-105" 
                    : "text-base-content/60 hover:text-base-content hover:bg-base-content/5 active:scale-95"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{config.label}</span>
            </NavLink>
          );
        })}
        
        {/* Fixed "More" button */}
        <NavLink
          to="/more"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[64px] rounded-xl transition-all duration-200 ${
              isActive 
                ? "text-primary scale-105" 
                : "text-base-content/60 hover:text-base-content hover:bg-base-content/5 active:scale-95"
            }`
          }
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-xs font-medium">Más</span>
        </NavLink>
      </div>
    </nav>
  );
}
