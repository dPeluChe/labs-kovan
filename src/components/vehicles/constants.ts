import { Car, FileCheck, Fuel, Shield, Wrench } from "lucide-react";

export const EVENT_TYPE_CONFIG = {
  verification: { label: "Verificación", icon: FileCheck, color: "text-blue-600 bg-blue-500/10" },
  service: { label: "Servicio", icon: Wrench, color: "text-orange-600 bg-orange-500/10" },
  insurance: { label: "Seguro", icon: Shield, color: "text-purple-600 bg-purple-500/10" },
  fuel: { label: "Gasolina", icon: Fuel, color: "text-yellow-600 bg-yellow-500/10" },
  repair: { label: "Reparación", icon: Wrench, color: "text-red-600 bg-red-500/10" },
  other: { label: "Otro", icon: Car, color: "text-gray-600 bg-gray-500/10" },
} as const;

export type EventType = keyof typeof EVENT_TYPE_CONFIG;
