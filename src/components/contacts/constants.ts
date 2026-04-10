import type { LucideIcon } from "lucide-react";
import {
  Stethoscope,
  Cat,
  Wrench,
  Droplets,
  Zap,
  Heart,
  AlertTriangle,
  MoreHorizontal,
} from "lucide-react";

export type ContactCategory = "doctor" | "veterinarian" | "mechanic" | "plumber" | "electrician" | "dentist" | "emergency" | "other";

export const CATEGORY_CONFIG: Record<ContactCategory, { label: string; icon: LucideIcon; color: string }> = {
  doctor: { label: "Doctor", icon: Stethoscope, color: "text-blue-600 bg-blue-500/10" },
  veterinarian: { label: "Veterinario", icon: Cat, color: "text-amber-600 bg-amber-500/10" },
  mechanic: { label: "Mecánico", icon: Wrench, color: "text-gray-600 bg-gray-500/10" },
  plumber: { label: "Plomero", icon: Droplets, color: "text-cyan-600 bg-cyan-500/10" },
  electrician: { label: "Electricista", icon: Zap, color: "text-yellow-600 bg-yellow-500/10" },
  dentist: { label: "Dentista", icon: Heart, color: "text-pink-600 bg-pink-500/10" },
  emergency: { label: "Emergencia", icon: AlertTriangle, color: "text-red-600 bg-red-500/10" },
  other: { label: "Otro", icon: MoreHorizontal, color: "text-gray-600 bg-gray-500/10" },
};
