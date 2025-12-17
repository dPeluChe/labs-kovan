import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { CreateSubscriptionModal } from "../components/subscriptions/CreateSubscriptionModal";
import { SubscriptionDetailModal } from "../components/subscriptions/SubscriptionDetailModal";
import { PageHeader } from "../components/ui/PageHeader";
import { Plus, Zap, Wifi, Tv, Shield, CreditCard, Smartphone, HelpCircle, DollarSign, Calendar } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useFamily } from "../contexts/FamilyContext";
import type { Doc } from "../../convex/_generated/dataModel";

const TYPE_ICONS: Record<string, LucideIcon> = {
    utility: Zap,
    internet: Wifi,
    streaming: Tv,
    insurance: Shield,
    membership: CreditCard,
    software: Smartphone,
    other: HelpCircle,
};

export function SubscriptionsPage() {
    const { currentFamily } = useFamily();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedSub, setSelectedSub] = useState<Doc<"subscriptions"> | null>(null);

    const subscriptions = useQuery(api.subscriptions.list, currentFamily ? { familyId: currentFamily._id } : "skip");

    if (subscriptions === undefined) return <PageLoader />;

    // Calculate totals (Monthly approx)
    const totalMonthly = subscriptions.reduce((acc, sub) => {
        if (!sub.isActive || !sub.amount) return acc;
        let monthlyAmount = sub.amount;
        if (sub.billingCycle === "bimonthly") monthlyAmount /= 2;
        if (sub.billingCycle === "quarterly") monthlyAmount /= 3;
        if (sub.billingCycle === "annual") monthlyAmount /= 12;
        // variable is skipped or treated as 0 for fixed total
        if (sub.billingCycle === "variable") return acc;
        return acc + monthlyAmount;
    }, 0);

    return (
        <div className="pb-20">
            <PageHeader
                title="Suscripciones"
                action={
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn btn-primary btn-sm gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nuevo Servicio</span>
                    </button>
                }
            />

            {/* Stats Card */}
            <div className="px-4 pb-4">
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-1 opactiy-80">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm font-medium text-white/80">Gasto Mensual Fijo</span>
                    </div>
                    <div className="text-3xl font-bold tracking-tight">
                        ${totalMonthly.toFixed(2)}
                    </div>
                    <p className="text-xs text-white/60 mt-2">
                        {subscriptions.filter(s => s.isActive).length} servicios activos
                    </p>
                </div>
            </div>

            <div className="px-4 space-y-3">
                {subscriptions.length > 0 ? (
                    subscriptions.map((sub) => {
                        const Icon = TYPE_ICONS[sub.type] || HelpCircle;
                        return (
                            <div
                                key={sub._id}
                                onClick={() => setSelectedSub(sub)}
                                className={`card bg-base-100 shadow-sm border border-base-200 p-4 active:scale-[0.98] transition-all cursor-pointer ${!sub.isActive ? "opacity-60" : ""}`}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-3 items-center">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sub.isActive ? "bg-violet-500/10 text-violet-600" : "bg-base-200 text-base-content/40"}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{sub.name}</h3>
                                            <div className="flex items-center gap-1.5 text-xs text-base-content/60">
                                                <span>{sub.amount ? `$${sub.amount}` : "Variable"}</span>
                                                <span>•</span>
                                                <span className="capitalize">{sub.billingCycle === "bimonthly" ? "Bimestral" : sub.billingCycle === "monthly" ? "Mensual" : sub.billingCycle}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {sub.dueDay && (
                                        <div className="flex flex-col items-end">
                                            <div className="text-xs font-bold bg-base-200 px-2 py-1 rounded-md flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>Día {sub.dueDay}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <EmptyState
                        icon={Zap}
                        title="Sin servicios"
                        description="Registra tus servicios para llevar el control de pagos y contratos."
                        action={
                            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
                                Agregar Servicio
                            </button>
                        }
                    />
                )}
            </div>

            <CreateSubscriptionModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />

            <SubscriptionDetailModal
                subscription={selectedSub}
                onClose={() => setSelectedSub(null)}
            />
        </div>
    );
}
