import { Link } from "react-router-dom";
import {
    Gift, Heart, Book, Car,
    DollarSign, ChefHat, MapPin, Plus, CreditCard, FileText
} from "lucide-react";

interface QuickAddSectionProps {
    hasExpenses: boolean | undefined;
    hasGifts: boolean | undefined;
    hasPlaces: boolean | undefined;
    hasRecipes: boolean | undefined;
    hasHealth: boolean | undefined;
    hasLibrary: boolean | undefined;
    hasVehicles: boolean | undefined;
    hasSubscriptions: boolean | undefined;
    hasDocuments: boolean | undefined;
}

export function QuickAddSection({
    hasExpenses,
    hasGifts,
    hasPlaces,
    hasRecipes,
    hasHealth,
    hasLibrary,
    hasVehicles,
    hasSubscriptions,
    hasDocuments,
}: QuickAddSectionProps) {
    const emptyModules = [
        { show: !hasExpenses, to: "/expenses", icon: DollarSign, label: "Gastos", color: "text-emerald-600" },
        { show: !hasSubscriptions, to: "/subscriptions", icon: CreditCard, label: "Suscripciones", color: "text-indigo-600" },
        { show: !hasDocuments, to: "/documents", icon: FileText, label: "Documentos", color: "text-orange-600" },
        { show: !hasGifts, to: "/gifts", icon: Gift, label: "Regalos", color: "text-red-600" },
        { show: !hasPlaces, to: "/places", icon: MapPin, label: "Lugares", color: "text-rose-600" },
        { show: !hasRecipes, to: "/recipes", icon: ChefHat, label: "Recetas", color: "text-amber-600" },
        { show: !hasHealth, to: "/health", icon: Heart, label: "Salud", color: "text-pink-600" },
        { show: !hasLibrary, to: "/library", icon: Book, label: "Librería", color: "text-blue-600" },
        { show: !hasVehicles, to: "/vehicles", icon: Car, label: "Autos", color: "text-green-600" },
    ].filter((m) => m.show);

    if (emptyModules.length === 0) return null;

    return (
        <div className="mt-4">
            <h3 className="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-3">
                Agregar más
            </h3>
            <div className="flex flex-wrap gap-2">
                {emptyModules.map(({ to, icon: Icon, label, color }) => (
                    <Link
                        key={to}
                        to={to}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-base-300 hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                        <div className={`${color} opacity-60 group-hover:opacity-100`}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm text-base-content/60 group-hover:text-base-content">{label}</span>
                        <Plus className="w-3 h-3 text-base-content/40 group-hover:text-primary" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
