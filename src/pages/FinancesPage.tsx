import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { SkeletonPageContent } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { useConfirmModal } from "../hooks/useConfirmModal";
import { DollarSign, Plus, Trash2, HandCoins, Repeat } from "lucide-react";
import { DateInput } from "../components/ui/DateInput";
import { AnimatedTabs } from "../components/ui/AnimatedTabs";
import type { Id, Doc } from "../../convex/_generated/dataModel";
import { MobileModal } from "../components/ui/MobileModal";
import { ExpenseCard } from "../components/finances/ExpenseCard";
import { ExpenseFormModal } from "../components/finances/ExpenseFormModal";
import {
  TYPE_CONFIG,
  SUBSCRIPTION_TYPES
} from "../components/finances/constants";
import type { ExpenseType } from "../components/finances/constants";

type DateFilter = "thisMonth" | "last3Months" | "all";
const DATE_FILTER_CONFIG: Record<DateFilter, { label: string }> = {
  thisMonth: { label: "Este mes" },
  last3Months: { label: "3 meses" },
  all: { label: "Todo" },
};

export function FinancesPage() {
  const { currentFamily } = useFamily();
  const [activeSection, setActiveSection] = useState<"expenses" | "loans">("expenses");

  if (!currentFamily) return null;

  return (
    <div className="pb-4">
      {/* Top Navigation */}
      <div className="navbar bg-base-100 sticky top-0 z-10 px-4 min-h-[4rem]">
        <div className="flex-1">
          <h1 className="text-xl font-bold">Finanzas</h1>
        </div>
        <div className="flex-none">
          <div className="join bg-base-200 p-1 rounded-lg">
            <button
              className={`join-item btn btn-sm border-0 ${activeSection === "expenses" ? "btn-active btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveSection("expenses")}
            >
              <DollarSign className="w-4 h-4" /> Gastos
            </button>
            <button
              className={`join-item btn btn-sm border-0 ${activeSection === "loans" ? "btn-active btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveSection("loans")}
            >
              <HandCoins className="w-4 h-4" /> Préstamos
            </button>
          </div>
        </div>
      </div>

      <div className="mt-2">
        {activeSection === "expenses" ? <ExpensesView /> : <LoansView />}
      </div>
    </div>
  );
}

function LoansView() {
  const { currentFamily } = useFamily();
  const [showNewLoan, setShowNewLoan] = useState(false);
  const [paymentLoanId, setPaymentLoanId] = useState<Id<"loans"> | null>(null);
  const { confirm } = useConfirmModal();

  const loans = useQuery(api.loans.list, currentFamily ? { familyId: currentFamily._id } : "skip");
  const deleteLoan = useMutation(api.loans.deleteLoan);

  if (!loans) return <SkeletonPageContent cards={3} />;

  // Calculate totals
  const totalLent = loans.reduce((sum: number, l: Doc<"loans">) => l.type === "lent" && l.balance > 1 ? sum + l.balance : sum, 0);
  const totalBorrowed = loans.reduce((sum: number, l: Doc<"loans">) => l.type === "borrowed" && l.balance > 1 ? sum + l.balance : sum, 0);

  return (
    <div className="px-4 space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card bg-green-500/10 border border-green-500/20">
          <div className="card-body p-3">
            <div className="text-xs opacity-70">Me deben</div>
            <div className="text-xl font-bold text-green-600">${totalLent.toLocaleString()}</div>
          </div>
        </div>
        <div className="card bg-red-500/10 border border-red-500/20">
          <div className="card-body p-3">
            <div className="text-xs opacity-70">Debo</div>
            <div className="text-xl font-bold text-red-600">${totalBorrowed.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn btn-primary btn-sm gap-2" onClick={() => setShowNewLoan(true)}>
          <Plus className="w-4 h-4" /> Nuevo Préstamo
        </button>
      </div>

      {loans.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title="Sin préstamos activos"
          description="Lleva el control de quién te debe y a quién le debes."
          action={
            <button onClick={() => setShowNewLoan(true)} className="btn btn-primary btn-sm">
              Registrar primero
            </button>
          }
        />
      ) : (
        <div className="space-y-3 stagger-children">
          {loans.map((loan: Doc<"loans">) => (
            <div key={loan._id} className={`card border-l-4 ${loan.type === "lent" ? "border-l-green-500" : "border-l-red-500"} bg-base-100 shadow-sm`}>
              <div className="card-body p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge badge-sm ${loan.type === "lent" ? "badge-success badge-outline" : "badge-error badge-outline"}`}>
                        {loan.type === "lent" ? "Presté a" : "Me prestó"}
                      </span>
                      <h3 className="font-bold text-lg">{loan.personName}</h3>
                    </div>
                    {loan.balance < 1 ? (
                      <span className="badge badge-ghost text-xs">Saldado</span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm opacity-60">Falta:</span>
                        <span className="font-bold text-lg">${loan.balance.toLocaleString()}</span>
                        <span className="text-xs opacity-40 line-through ml-1">${loan.amount.toLocaleString()}</span>
                      </div>
                    )}
                    {loan.dueDate && (
                      <div className="text-xs text-base-content/50 mt-1">
                        Vence: {new Date(loan.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {loan.balance > 1 && (
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => setPaymentLoanId(loan._id)}
                      >
                        Abonar
                      </button>
                    )}
                    <button
                      className="btn btn-ghost btn-xs text-base-content/40 hover:text-error"
                      onClick={async () => {
                        if (await confirm({ title: "Borrar préstamo", message: "Esto eliminará el registro y sus abonos.", variant: "danger" })) {
                          deleteLoan({ loanId: loan._id });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {currentFamily && showNewLoan && (
        <NewLoanModal familyId={currentFamily._id} onClose={() => setShowNewLoan(false)} />
      )}

      {currentFamily && paymentLoanId && (
        <PaymentModal
          loanId={paymentLoanId}
          familyId={currentFamily._id}
          onClose={() => setPaymentLoanId(null)}
        />
      )}
    </div>
  );
}

function NewLoanModal({ familyId, onClose }: { familyId: Id<"families">, onClose: () => void }) {
  const createLoan = useMutation(api.loans.create);
  const [type, setType] = useState<"lent" | "borrowed">("lent");
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!person || !amount) return;
    setIsLoading(true);
    try {
      await createLoan({
        familyId,
        type,
        personName: person,
        amount: parseFloat(amount),
        date: new Date(date).getTime(),
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileModal isOpen={true} onClose={onClose} title="Nuevo Préstamo">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="tabs tabs-boxed">
          <a className={`tab flex-1 ${type === "lent" ? "tab-active" : ""}`} onClick={() => setType("lent")}>Presté dinero</a>
          <a className={`tab flex-1 ${type === "borrowed" ? "tab-active" : ""}`} onClick={() => setType("borrowed")}>Me prestaron</a>
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">¿A quién / Quién?</span></label>
          <input className="input input-bordered" placeholder="Nombre de la persona" value={person} onChange={e => setPerson(e.target.value)} autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="form-control">
            <label className="label"><span className="label-text">Monto</span></label>
            <input className="input input-bordered" type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <DateInput label="Fecha" value={date} onChange={setDate} />
        </div>

        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={isLoading || !person || !amount}>Guardar</button>
        </div>
      </form>
    </MobileModal>
  );
}

function PaymentModal({ loanId, familyId, onClose }: { loanId: Id<"loans">, familyId: Id<"families">, onClose: () => void }) {
  const addPayment = useMutation(api.loans.addPayment);
  // unused familyId warning
  console.log("Family context:", familyId);

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setIsLoading(true);
    try {
      await addPayment({
        loanId,
        amount: parseFloat(amount),
        date: new Date(date).getTime(),
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileModal isOpen={true} onClose={onClose} title="Registrar Abono">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label"><span className="label-text">Monto abonado</span></label>
          <input className="input input-bordered" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
        </div>
        <DateInput label="Fecha" value={date} onChange={setDate} />
        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={isLoading || !amount}>Registrar</button>
        </div>
      </form>
    </MobileModal>
  );
}

function ExpensesView() {
  const { currentFamily } = useFamily();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ExpenseType>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("thisMonth");
  const [showNewExpense, setShowNewExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Doc<"expenses"> | undefined>(undefined);
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
        return { label: "Nuevo gasto", action: handleCreateExpense };
    }
  };

  const addAction = getAddAction();

  const tabs = (Object.entries(TYPE_CONFIG) as [ExpenseType, typeof TYPE_CONFIG[ExpenseType]][]).map(([type, config]) => ({
    id: type,
    icon: <config.icon className="w-5 h-5" />,
    label: config.label
  }));

  return (
    <>
      <div className="px-4 mb-4">
        {/* Type Tabs */}
        <div className="mb-2 overflow-x-auto">
          <AnimatedTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as ExpenseType)}
            className="mb-2"
          />
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-4">
          {/* Date Filter */}
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

        {/* Summary Card */}
        {summary && (activeTab === "all" || activeTab === "general") && (
          <div className="card bg-gradient-to-r from-emerald-500/20 to-green-500/10 border border-emerald-500/30 mb-4">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-base-content/60">Este mes</div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {summary.totalThisMonth?.toLocaleString("es-MX", { style: "currency", currency: "MXN" }) || "$0.00"}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-base-content/60">{summary.countThisMonth} gastos</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subscriptions Section (when on subscription tab) */}
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
                onDelete={async (id) => await deleteExpense({ expenseId: id })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewExpense && currentFamily && (
        <ExpenseFormModal
          familyId={currentFamily._id}
          onClose={() => setShowNewExpense(false)}
          expenseToEdit={editingExpense}
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
          subscriptions={subscriptions || []}
          onClose={() => setShowPaySubscription(null)}
        />
      )}

      <ConfirmModal />
    </>
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
    <MobileModal isOpen={true} onClose={onClose} title="Nueva suscripción">
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
            {Object.entries(SUBSCRIPTION_TYPES).map(([key, config]) => (
              <option key={key} value={key}>{config.icon} {config.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="form-control">
            <label className="label"><span className="label-text">Monto</span></label>
            <input
              type="number"
              placeholder="0.00"
              className="input input-bordered w-full"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
            />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Ciclo</span></label>
            <select
              className="select select-bordered w-full"
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as typeof billingCycle)}
            >
              <option value="monthly">Mensual</option>
              <option value="bimonthly">Bimestral</option>
              <option value="annual">Anual</option>
              <option value="variable">Variable</option>
            </select>
          </div>
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Día de pago (1-31)</span></label>
          <input
            type="number"
            placeholder="Ej: 15"
            className="input input-bordered w-full"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            min="1"
            max="31"
          />
        </div>

        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={isLoading || !name.trim()}>
            {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
          </button>
        </div>
      </form>
    </MobileModal>
  );
}

function PaySubscriptionModal({
  subscriptionId,
  familyId,
  subscriptions,
  onClose,
}: {
  subscriptionId: Id<"subscriptions">;
  familyId: Id<"families">;
  userId?: Id<"users">;
  subscriptions: Doc<"subscriptions">[];
  onClose: () => void;
}) {
  const sub = subscriptions.find(s => s._id === subscriptionId);
  const [amount, setAmount] = useState(sub?.amount?.toString() || "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(false);

  const createExpense = useMutation(api.expenses.createExpense);

  if (!sub) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setIsLoading(true);
    try {
      await createExpense({
        familyId,
        type: "subscription",
        description: `Pago de ${sub.name}`,
        amount: parseFloat(amount),
        category: "subscription",
        date: new Date(date).getTime(),
        subscriptionId: subscriptionId,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileModal isOpen={true} onClose={onClose} title={`Registrar pago de ${sub.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label"><span className="label-text">Monto a pagar</span></label>
          <input
            type="number"
            className="input input-bordered w-full"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            autoFocus
          />
        </div>
        <DateInput
          label="Fecha del pago"
          value={date}
          onChange={setDate}
        />
        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={isLoading || !amount}>
            {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Registrar"}
          </button>
        </div>
      </form>
    </MobileModal>
  );
}
