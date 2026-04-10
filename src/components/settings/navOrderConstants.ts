import {
  Home,
  Gift,
  MapPin,
  Heart,
  Calendar,
  DollarSign,
  ChefHat,
  Book,
  Car,
  Bot,
  Contact,
  Dices,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ALL_NAV_ITEMS: { id: string; icon: LucideIcon; label: string }[] = [
  { id: "home", icon: Home, label: "Inicio" },
  { id: "agent", icon: Bot, label: "Kovan" },
  { id: "gifts", icon: Gift, label: "Regalos" },
  { id: "places", icon: MapPin, label: "Lugares" },
  { id: "health", icon: Heart, label: "Salud" },
  { id: "calendar", icon: Calendar, label: "Calendario" },
  { id: "finances", icon: DollarSign, label: "Finanzas" },
  { id: "recipes", icon: ChefHat, label: "Recetas" },
  { id: "collections", icon: Book, label: "Colecciones" },
  { id: "vehicles", icon: Car, label: "Autos" },
  { id: "contacts", icon: Contact, label: "Directorio" },
  { id: "activities", icon: Dices, label: "Juegos" },
  { id: "expenses", icon: DollarSign, label: "Gastos" },
  { id: "library", icon: Book, label: "Librería" },
  { id: "services", icon: Car, label: "Servicios" },
];

export const DEFAULT_NAV_ORDER = ["home", "agent", "finances", "places"];
