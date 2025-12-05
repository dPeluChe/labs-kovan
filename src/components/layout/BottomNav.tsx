import { NavLink } from "react-router-dom";
import {
  Home,
  Gift,
  Calendar,
  Heart,
  MoreHorizontal,
} from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Inicio" },
  { to: "/gifts", icon: Gift, label: "Regalos" },
  { to: "/calendar", icon: Calendar, label: "Calendario" },
  { to: "/health", icon: Heart, label: "Salud" },
  { to: "/more", icon: MoreHorizontal, label: "Más" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex flex-row items-center justify-around bg-base-200 border-t border-base-300 h-16 safe-bottom shadow-lg">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[64px] transition-colors ${
              isActive 
                ? "text-primary" 
                : "text-base-content/60 hover:text-base-content"
            }`
          }
        >
          <Icon className="w-5 h-5" />
          <span className="text-xs font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
