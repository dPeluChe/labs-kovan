import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageHeader } from "../components/ui/PageHeader";
import { SkeletonPageContent } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { useConfirmModal } from "../components/ui/ConfirmModal";
import { useToast } from "../components/ui/Toast";
import { DollarSign, Plus, Trash2, Car, Gift, CreditCard, Repeat } from "lucide-react";
import { DateInput } from "../components/ui/DateInput";
import type { Id } from "../../convex/_generated/dataModel";

type ExpenseType = "all" | "general" | "subscription" | "vehicle" | "gift";
type ExpenseCategory = "food" | "transport" | "entertainment" | "utilities" | "health" | "shopping" | "home" | "education" | "gifts" | "vehicle" | "subscription" | "other";

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  food: { label: "Comida", icon: "🍔", color: "from-orange-500/20" },
  transport: { label: "Transporte", icon: "🚗", color: "from-blue-500/20" },
  entertainment: { label: "Entretenimiento", icon: "🎬", color: "from-purple-500/20" },
  utilities: { label: "Servicios", icon: "💡", color: "from-yellow-500/20" },
  health: { label: "Salud", icon: "💊", color: "from-red-500/20" },
  shopping: { label: "Compras", icon: "🛍️", color: "from-pink-500/20" },
  home: { label: "Hogar", icon: "🏠", color: "from-teal-500/20" },
  education: { label: "Educación", icon: "📚", color: "from-indigo-500/20" },
  gifts: { label: "Regalos", icon: "🎁", color: "from-red-500/20" },
  vehicle: { label: "Auto", icon: "🚙", color: "from-green-500/20" },
  subscription: { label: "Suscripción", icon: "📺", color: "from-violet-500/20" },
  other: { label: "Otro", icon: "📋", color: "from-gray-500/20" },
};

// Categorías permitidas para gastos puntuales (excluye las que se registran desde otros módulos)
const GENERAL_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "food", "transport", "entertainment", "utilities", "health", "shopping", "home", "education", "other"
];

const TYPE_CONFIG: Record<ExpenseType, { label: string; icon: typeof DollarSign }> = {
  all: { label: "Todos", icon: DollarSign },
  general: { label: "Puntuales", icon: CreditCard },
  subscription: { label: "Suscripciones", icon: Repeat },
  vehicle: { label: "Auto", icon: Car },
  gift: { label: "Regalos", icon: Gift },
};

const SUBSCRIPTION_TYPES = {
  streaming: { label: "Streaming", icon: "📺" },
  utility: { label: "Servicios", icon: "💡" },
  internet: { label: "Internet", icon: "📶" },
  insurance: { label: "Seguros", icon: "🛡️" },
  membership: { label: "Membresías", icon: "🎫" },
  software: { label: "Software", icon: "💻" },
  other: { label: "Otro", icon: "📋" },
};

type DateFilter = "thisMonth" | "last3Months" | "all";

const DATE_FILTER_CONFIG: Record<DateFilter, { label: string }> = {
  thisMonth: { label: "Este mes" },
  last3Months: { label: "Últimos 3 meses" },
  all: { label: "Todo" },
};

export function ExpensesPage() {
  const { currentFamily } = useFamily();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ExpenseType>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("thisMonth");
  const [showNewExpense, setShowNewExpense] = useState(false);
  const [showNewSubscription, setShowNewSubscription] = useState(false);
  const [showPaySubscription, setShowPaySubscription] = useState<Id<"subscriptions"> | null>(null);
  const { confirm, ConfirmModal } = useConfirmModal();

  const expenses = useQuery(
    api.expenses.getExpenses,
    currentFamily 
      ? { familyId: currentFamily._id, type: activeTab === "all" ? undefined : activeTab } 
      : "skip"
  );

  const subscriptions = useQuery(
    api.expenses.getSubscriptions,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const summary = useQuery(
    api.expenses.getExpenseSummary,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const deleteExpense = useMutation(api.expenses.deleteExpense);
  const deleteSubscription = useMutation(api.expenses.deleteSubscription);

  // Filtrar gastos por fecha
  const filteredExpenses = expenses?.filter((expense) => {
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

  // Determinar acción principal según tab
  const getAddAction = () => {
    switch (activeTab) {
      case "subscription":
        return { label: "Nueva suscripción", action: () => setShowNewSubscription(true) };
      case "vehicle":
        return { label: "Ir a Autos", action: () => window.location.href = "/vehicles" };
      case "gift":
        return { label: "Ir a Regalos", action: () => window.location.href = "/gifts" };
      default:
        return { label: "Nuevo gasto", action: () => setShowNewExpense(true) };
    }
  };

  const addAction = getAddAction();

  return (
    <div className="pb-4">
      <PageHeader
        title="Gastos"
        subtitle="Control de gastos familiares"
        action={
          activeTab === "all" || activeTab === "general" ? (
            <div className="dropdown dropdown-end">
              <button tabIndex={0} className="btn btn-primary btn-sm gap-1">
                <Plus className="w-4 h-4" />
                Nuevo
              </button>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52">
                <li><a onClick={() => setShowNewExpense(true)}>💳 Gasto puntual</a></li>
                <li><a onClick={() => setShowNewSubscription(true)}>🔄 Nueva suscripción</a></li>
              </ul>
            </div>
          ) : (
            <button onClick={addAction.action} className="btn btn-primary btn-sm gap-1">
              <Plus className="w-4 h-4" />
              {addAction.label}
            </button>
          )
        }
      />

      {/* Summary */}
      {summary && (
        <div className="px-4 mb-4">
          <div className="card bg-gradient-to-r from-emerald-500/20 to-green-500/10 border border-emerald-500/30">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-base-content/60">Este mes</div>
                  <div className="text-2xl font-bold text-emerald-600">
                    ${summary.totalThisMonth.toLocaleString()}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-base-content/60">{summary.countThisMonth} gastos</div>
                </div>
              </div>
              {/* By Type Summary */}
              {summary.byType && Object.keys(summary.byType).length > 0 && (
                <div className="flex gap-3 mt-2 pt-2 border-t border-base-content/10 text-xs">
                  {Object.entries(summary.byType).map(([type, data]) => (
                    <div key={type} className="flex items-center gap-1">
                      <span className="opacity-60">{TYPE_CONFIG[type as ExpenseType]?.label || type}:</span>
                      <span className="font-medium">${(data as { total: number }).total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs + Date Filter */}
      <div className="px-4 mb-4 space-y-2">
        {/* Type Tabs */}
        <div className="flex gap-1 bg-base-200 p-1 rounded-xl overflow-x-auto">
          {(Object.entries(TYPE_CONFIG) as [ExpenseType, typeof TYPE_CONFIG[ExpenseType]][]).map(([type, config]) => {
            const isActive = activeTab === type;
            return (
              <button
                key={type}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-primary text-primary-content shadow-sm" 
                    : "text-base-content/60 hover:text-base-content hover:bg-base-300"
                }`}
                onClick={() => setActiveTab(type)}
              >
                <config.icon className={`w-4 h-4 ${isActive ? "" : "opacity-60"}`} />
                <span className="hidden sm:inline">{config.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Date Filter */}
        <div className="flex items-center justify-between">
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
          {filteredExpenses && filteredExpenses.length > 0 && (
            <span className="text-xs text-base-content/50">
              {filteredExpenses.length} gasto{filteredExpenses.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Subscriptions Section (when on subscription tab) */}
      {activeTab === "subscription" && subscriptions && subscriptions.length > 0 && (
        <div className="px-4 mb-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Repeat className="w-4 h-4" /> Suscripciones activas
          </h3>
          <div className="space-y-2 stagger-children">
            {subscriptions.filter(s => s.isActive !== false).map((sub) => (
              <div
                key={sub._id}
                className="card bg-base-100 border border-base-300 animate-fade-in"
              >
                <div className="card-body p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{SUBSCRIPTION_TYPES[sub.type as keyof typeof SUBSCRIPTION_TYPES]?.icon || "📋"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{sub.name}</div>
                      <div className="text-xs text-base-content/60">
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
                          await deleteSubscription({ subscriptionId: sub._id });
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
          <div className="divider text-xs text-base-content/40">Historial de pagos</div>
        </div>
      )}

      {/* Expenses List */}
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
                onClick={() => activeTab === "subscription" ? setShowNewSubscription(true) : setShowNewExpense(true)}
                className="btn btn-primary btn-sm"
              >
                {activeTab === "subscription" ? "Agregar suscripción" : "Agregar gasto"}
              </button>
            }
          />
        ) : (
          <div className="space-y-2 stagger-children">
            {filteredExpenses.map((expense) => {
              const config = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.other;
              const TypeIcon = TYPE_CONFIG[expense.type as ExpenseType]?.icon || DollarSign;
              return (
                <div
                  key={expense._id}
                  className={`card bg-gradient-to-r ${config.color} to-transparent border border-base-300 animate-fade-in`}
                >
                  <div className="card-body p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{config.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{expense.description}</div>
                        <div className="flex items-center gap-2 text-xs text-base-content/60">
                          <span className="badge badge-sm badge-ghost gap-1">
                            <TypeIcon className="w-2 h-2" />
                            {TYPE_CONFIG[expense.type as ExpenseType]?.label || expense.type}
                          </span>
                          <span>{new Date(expense.date).toLocaleDateString("es-MX")}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${expense.amount.toLocaleString()}</div>
                      </div>
                      <button
                        onClick={async () => {
                          const confirmed = await confirm({
                            title: "Eliminar gasto",
                            message: `¿Eliminar "${expense.description}"?`,
                            confirmText: "Eliminar",
                            variant: "danger",
                            icon: "trash",
                          });
                          if (confirmed) {
                            await deleteExpense({ expenseId: expense._id });
                          }
                        }}
                        className="btn btn-ghost btn-xs btn-circle text-error"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Add More Button - always visible when there are expenses */}
            {(activeTab === "all" || activeTab === "general") && (
              <button
                onClick={() => setShowNewExpense(true)}
                className="btn btn-outline btn-primary btn-block btn-sm mt-4 gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar otro gasto
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewExpense && currentFamily && (
        <NewExpenseModal
          familyId={currentFamily._id}
          onClose={() => setShowNewExpense(false)}
        />
      )}

      {showNewSubscription && currentFamily && (
        <NewSubscriptionModal
          familyId={currentFamily._id}
          onClose={() => setShowNewSubscription(false)}
        />
      )}

      {showPaySubscription && currentFamily && user && (
        <PaySubscriptionModal
          subscriptionId={showPaySubscription}
          familyId={currentFamily._id}
          userId={user._id}
          subscriptions={subscriptions || []}
          onClose={() => setShowPaySubscription(null)}
        />
      )}

      <ConfirmModal />
    </div>
  );
}

function NewExpenseModal({
  familyId,
  onClose,
}: {
  familyId: Id<"families">;
  onClose: () => void;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(false);

  const createExpense = useMutation(api.expenses.createExpense);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    setIsLoading(true);
    try {
      await createExpense({
        familyId,
        type: "general",
        description: description.trim(),
        amount: parseFloat(amount),
        category,
        date: new Date(date).getTime(),
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Nuevo gasto</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Descripción *</span></label>
            <input
              type="text"
              placeholder="¿En qué gastaste?"
              className="input input-bordered w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="form-control">
              <label className="label"><span className="label-text">Monto *</span></label>
              <input
                type="number"
                placeholder="0.00"
                className="input input-bordered w-full"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
              />
            </div>
            <DateInput
              label="Fecha"
              value={date}
              onChange={setDate}
            />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Categoría</span></label>
            <div className="grid grid-cols-3 gap-2">
              {GENERAL_EXPENSE_CATEGORIES.map((key) => {
                const config = CATEGORY_CONFIG[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={`btn btn-sm gap-1 ${category === key ? "btn-primary" : "btn-ghost"}`}
                  >
                    <span>{config.icon}</span>
                    <span className="text-xs truncate">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || !description.trim() || !amount}>
              {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}

// New Subscription Modal
function NewSubscriptionModal({
  familyId,
  onClose,
}: {
  familyId: Id<"families">;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"streaming" | "utility" | "internet" | "insurance" | "membership" | "software" | "other">("streaming");
  const [amount, setAmount] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "bimonthly" | "quarterly" | "annual" | "variable">("monthly");
  const [dueDay, setDueDay] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createSubscription = useMutation(api.expenses.createSubscription);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await createSubscription({
        familyId,
        name: name.trim(),
        type,
        amount: amount ? parseFloat(amount) : undefined,
        billingCycle,
        dueDay: dueDay ? parseInt(dueDay) : undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Nueva suscripción</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Nombre *</span></label>
            <input
              type="text"
              placeholder="Ej: Netflix, Spotify, CFE"
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Tipo</span></label>
            <select 
              className="select select-bordered w-full" 
              value={type} 
              onChange={(e) => setType(e.target.value as typeof type)}
            >
              <option value="streaming">📺 Streaming</option>
              <option value="utility">💡 Servicios (Luz, Agua, Gas)</option>
              <option value="internet">📶 Internet/Teléfono</option>
              <option value="insurance">🛡️ Seguros</option>
              <option value="membership">🎫 Membresías</option>
              <option value="software">💻 Software</option>
              <option value="other">📋 Otro</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="form-control">
              <label className="label"><span className="label-text">Monto estimado</span></label>
              <input
                type="number"
                placeholder="Variable"
                className="input input-bordered w-full"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Día de pago</span></label>
              <input
                type="number"
                placeholder="1-31"
                className="input input-bordered w-full"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                min="1"
                max="31"
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Ciclo de facturación</span></label>
            <select 
              className="select select-bordered w-full" 
              value={billingCycle} 
              onChange={(e) => setBillingCycle(e.target.value as typeof billingCycle)}
            >
              <option value="monthly">Mensual</option>
              <option value="bimonthly">Bimestral</option>
              <option value="quarterly">Trimestral</option>
              <option value="annual">Anual</option>
              <option value="variable">Variable</option>
            </select>
          </div>

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || !name.trim()}>
              {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}

// Pay Subscription Modal
function PaySubscriptionModal({
  subscriptionId,
  familyId,
  userId,
  subscriptions,
  onClose,
}: {
  subscriptionId: Id<"subscriptions">;
  familyId: Id<"families">;
  userId: Id<"users">;
  subscriptions: Array<{ _id: Id<"subscriptions">; name: string; amount?: number }>;
  onClose: () => void;
}) {
  const subscription = subscriptions.find(s => s._id === subscriptionId);
  const [amount, setAmount] = useState(subscription?.amount?.toString() || "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { success } = useToast();

  const recordPayment = useMutation(api.expenses.recordSubscriptionPayment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setIsLoading(true);
    try {
      await recordPayment({
        subscriptionId,
        familyId,
        amount: parseFloat(amount),
        date: new Date(date).getTime(),
        paidBy: userId,
        notes: notes.trim() || undefined,
      });
      success(`Pago de ${subscription?.name} registrado`);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Registrar pago</h3>
        <p className="text-base-content/60 text-sm mb-4">
          Registrar pago de <span className="font-semibold">{subscription?.name}</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="form-control">
              <label className="label"><span className="label-text">Monto *</span></label>
              <input
                type="number"
                placeholder="0.00"
                className="input input-bordered w-full"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                autoFocus
              />
            </div>
            <DateInput
              label="Fecha"
              value={date}
              onChange={setDate}
            />
          </div>

          <div className="form-control">
            <label className="label"><span className="label-text">Notas (opcional)</span></label>
            <input
              type="text"
              placeholder="Ej: Periodo Dic 2025"
              className="input input-bordered w-full"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || !amount}>
              {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Registrar pago"}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
