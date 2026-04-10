import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { useFamily } from "../../contexts/FamilyContext";
import { useAuth } from "../../contexts/AuthContext";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { SkeletonPageContent } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { AnimatedTabs } from "../ui/AnimatedTabs";
import { DollarSign, Plus, Trash2, Repeat } from "lucide-react";
import { ExpenseCard } from "./ExpenseCard";
import { ExpenseFormModal } from "./ExpenseFormModal";
import { NewSubscriptionModal } from "./NewSubscriptionModal";
import { PaySubscriptionModal } from "./PaySubscriptionModal";
import { TYPE_CONFIG, SUBSCRIPTION_TYPES } from "./constants";
import type { ExpenseType } from "./constants";

type DateFilter = "thisMonth" | "last3Months" | "all";
const DATE_FILTER_CONFIG: Record<DateFilter, { label: string }> = {
  thisMonth: { label: "Este mes" },
  last3Months: { label: "3 meses" },
  all: { label: "Todo" },
};

export function ExpensesView() {
  const { currentFamily } = useFamily();
  const { user, sessionToken } = useAuth();
  const [activeTab, setActiveTab] = useState<ExpenseType>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("thisMonth");
  const [showNewExpense, setShowNewExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Doc<"expenses"> | undefined>(undefined);
  const [showNewSubscription, setShowNewSubscription] = useState(false);
  const [showPaySubscription, setShowPaySubscription] = useState<Id<"subscriptions"> | null>(null);
  const { confirm, ConfirmModal } = useConfirmModal();

  const expenses = useQuery(
    api.expenses.getExpenses,
    currentFamily && sessionToken
      ? { sessionToken, familyId: currentFamily._id, type: activeTab === "all" ? undefined : activeTab }
      : "skip"
  );

  const subscriptions = useQuery(
    api.expenses.getSubscriptions,
    currentFamily && sessionToken ? { sessionToken, familyId: currentFamily._id } : "skip"
  );

  const summary = useQuery(
    api.expenses.getExpenseSummary,
    currentFamily && sessionToken ? { sessionToken, familyId: currentFamily._id } : "skip"
  );

  const deleteExpense = useMutation(api.expenses.deleteExpense);
  const deleteSubscription = useMutation(api.expenses.deleteSubscription);

  const filteredExpenses = expenses?.filter((expense: Doc<"expenses">) => {
    if (dateFilter === "all") return true;

    const now = new Date();
    const expenseDate = new Date(expense.date);

    if (dateFilter === "thisMonth") {
      return expenseDate.getMonth() === now.getMonth() &&
        expenseDate.getFullYear() === now.getFullYear();
    }

    if (dateFilter === "last3Months") {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return expenseDate >= threeMonthsAgo;
    }

    return true;
  });

  if (!currentFamily) return null;

  const handleCreateExpense = () => {
    setEditingExpense(undefined);
    setShowNewExpense(true);
  };

  const handleEditExpense = (expense: Doc<"expenses">) => {
    setEditingExpense(expense);
    setShowNewExpense(true);
  };

  const getAddAction = () => {
    switch (activeTab) {
      case "subscription":
        return { label: "Nueva suscripción", action: () => setShowNewSubscription(true) };
      case "vehicle":
        return { label: "Ir a Autos", action: () => { window.location.href = "/vehicles"; } };
      case "gift":
        return { label: "Ir a Regalos", action: () => { window.location.href = "/gifts"; } };
      default:
        return { label: "Nuevo gasto", action: handleCreateExpense };
    }
  };

  const addAction = getAddAction();

  const tabs = (Object.entries(TYPE_CONFIG) as [ExpenseType, typeof TYPE_CONFIG[ExpenseType]][]).map(([type, config]) => ({
    id: type,
    icon: <config.icon className="w-5 h-5" />,
    label: config.label,
  }));

  return (
    <>
      <div className="px-4 mb-4">
        <div className="mb-2 overflow-x-auto">
          <AnimatedTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as ExpenseType)}
            className="mb-2"
          />
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-1">
            {(Object.entries(DATE_FILTER_CONFIG) as [DateFilter, { label: string }][]).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setDateFilter(key)}
                className={`btn btn-xs ${dateFilter === key ? "btn-secondary" : "btn-ghost"}`}
              >
                {config.label}
              </button>
            ))}
          </div>

          {activeTab === "all" || activeTab === "general" ? (
            <div className="dropdown dropdown-end">
              <button tabIndex={0} className="btn btn-primary btn-sm gap-1">
                <Plus className="w-4 h-4" />
                Nuevo
              </button>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52">
                <li><a onClick={handleCreateExpense}>💳 Gasto puntual</a></li>
                <li><a onClick={() => setShowNewSubscription(true)}>🔄 Nueva suscripción</a></li>
              </ul>
            </div>
          ) : (
            <button onClick={addAction.action} className="btn btn-primary btn-sm gap-1">
              <Plus className="w-4 h-4" />
              {addAction.label}
            </button>
          )}
        </div>

        {summary && (activeTab === "all" || activeTab === "general") && (
          <div className="card bg-gradient-to-r from-emerald-500/20 to-green-500/10 border border-emerald-500/30 mb-4">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted">Este mes</div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {summary.totalThisMonth?.toLocaleString("es-MX", { style: "currency", currency: "MXN" }) || "$0.00"}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-muted">{summary.countThisMonth} gastos</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {activeTab === "subscription" && subscriptions && subscriptions.length > 0 && (
        <div className="px-4 mb-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Repeat className="w-4 h-4" /> Suscripciones activas
          </h3>
          <div className="space-y-2 stagger-children">
            {subscriptions.filter((s: Doc<"subscriptions">) => s.isActive !== false).map((sub: Doc<"subscriptions">) => (
              <div
                key={sub._id}
                className="card bg-base-100 border border-base-300 animate-fade-in"
              >
                <div className="card-body p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{SUBSCRIPTION_TYPES[sub.type as keyof typeof SUBSCRIPTION_TYPES]?.icon || "📋"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{sub.name}</div>
                      <div className="text-xs text-muted">
                        {sub.amount ? `$${sub.amount.toLocaleString()}` : "Variable"} • {sub.billingCycle === "monthly" ? "Mensual" : sub.billingCycle === "annual" ? "Anual" : sub.billingCycle}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPaySubscription(sub._id)}
                      className="btn btn-primary btn-xs"
                    >
                      Pagar
                    </button>
                    <button
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: "Eliminar suscripción",
                          message: `¿Eliminar "${sub.name}" y todos sus pagos?`,
                          confirmText: "Eliminar",
                          variant: "danger",
                        });
                        if (confirmed) {
                          if (!sessionToken) return;
                          await deleteSubscription({ sessionToken, subscriptionId: sub._id });
                        }
                      }}
                      className="btn btn-ghost btn-xs text-error"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="divider text-xs text-faint">Historial de pagos</div>
        </div>
      )}

      <div className="px-4">
        {filteredExpenses === undefined ? (
          <SkeletonPageContent cards={3} />
        ) : filteredExpenses.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title={
              activeTab === "all"
                ? `Sin gastos ${DATE_FILTER_CONFIG[dateFilter].label.toLowerCase()}`
                : `Sin gastos de ${TYPE_CONFIG[activeTab].label.toLowerCase()} ${DATE_FILTER_CONFIG[dateFilter].label.toLowerCase()}`
            }
            description={activeTab === "subscription" ? "Registra tus suscripciones y pagos recurrentes" : "Registra tus gastos para llevar control"}
            action={
              <button
                onClick={() => activeTab === "subscription" ? setShowNewSubscription(true) : handleCreateExpense()}
                className="btn btn-primary btn-sm"
              >
                {activeTab === "subscription" ? "Agregar suscripción" : "Agregar gasto"}
              </button>
            }
          />
        ) : (
          <div className="space-y-2 stagger-children">
            {filteredExpenses.map((expense: Doc<"expenses">) => (
              <ExpenseCard
                key={expense._id}
                expense={expense}
                onEdit={handleEditExpense}
                onDelete={async (id) => {
                  if (!sessionToken) return;
                  await deleteExpense({ sessionToken, expenseId: id });
                }}
              />
            ))}
          </div>
        )}
      </div>

      {showNewExpense && currentFamily && (
        <ExpenseFormModal
          familyId={currentFamily._id}
          onClose={() => setShowNewExpense(false)}
          expenseToEdit={editingExpense}
        />
      )}

      {showNewSubscription && currentFamily && (
        <NewSubscriptionModal
          sessionToken={sessionToken}
          familyId={currentFamily._id}
          onClose={() => setShowNewSubscription(false)}
        />
      )}

      {showPaySubscription && currentFamily && user && (
        <PaySubscriptionModal
          sessionToken={sessionToken}
          subscriptionId={showPaySubscription}
          familyId={currentFamily._id}
          subscriptions={subscriptions || []}
          onClose={() => setShowPaySubscription(null)}
        />
      )}

      <ConfirmModal />
    </>
  );
}
