import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { PageHeader } from "../components/ui/PageHeader";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { DollarSign, Plus, Trash2 } from "lucide-react";
import { DateInput } from "../components/ui/DateInput";
import type { Id } from "../../convex/_generated/dataModel";

type ExpenseCategory = "food" | "transport" | "entertainment" | "utilities" | "health" | "shopping" | "other";

const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; icon: string; color: string }> = {
  food: { label: "Comida", icon: "🍔", color: "from-orange-500/20" },
  transport: { label: "Transporte", icon: "🚗", color: "from-blue-500/20" },
  entertainment: { label: "Entretenimiento", icon: "🎬", color: "from-purple-500/20" },
  utilities: { label: "Servicios", icon: "💡", color: "from-yellow-500/20" },
  health: { label: "Salud", icon: "💊", color: "from-red-500/20" },
  shopping: { label: "Compras", icon: "🛍️", color: "from-pink-500/20" },
  other: { label: "Otro", icon: "📋", color: "from-gray-500/20" },
};

export function ExpensesPage() {
  const { currentFamily } = useFamily();
  const [showNewExpense, setShowNewExpense] = useState(false);

  const expenses = useQuery(
    api.expenses.getExpenses,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const summary = useQuery(
    api.expenses.getExpenseSummary,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const deleteExpense = useMutation(api.expenses.deleteExpense);

  if (!currentFamily) return <PageLoader />;

  return (
    <div className="pb-4">
      <PageHeader
        title="Gastos"
        subtitle="Control de gastos familiares"
        action={
          <button
            onClick={() => setShowNewExpense(true)}
            className="btn btn-primary btn-sm gap-1"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        }
      />

      {/* Summary */}
      {summary && (
        <div className="px-4 mb-4">
          <div className="card bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/30">
            <div className="card-body p-4">
              <div className="text-sm text-base-content/60">Este mes</div>
              <div className="text-2xl font-bold text-green-600">
                ${summary.totalThisMonth.toLocaleString()}
              </div>
              <div className="text-xs text-base-content/60">
                {summary.countThisMonth} gastos registrados
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-4">
        {expenses === undefined ? (
          <PageLoader />
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="Sin gastos"
            description="Registra tus gastos para llevar control"
            action={
              <button
                onClick={() => setShowNewExpense(true)}
                className="btn btn-primary btn-sm"
              >
                Agregar gasto
              </button>
            }
          />
        ) : (
          <div className="space-y-2">
            {expenses.map((expense) => {
              const config = CATEGORY_CONFIG[expense.category as ExpenseCategory];
              return (
                <div
                  key={expense._id}
                  className={`card bg-gradient-to-r ${config.color} to-transparent border border-base-300`}
                >
                  <div className="card-body p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{config.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{expense.description}</div>
                        <div className="flex items-center gap-2 text-xs text-base-content/60">
                          <span className="badge badge-sm badge-ghost">{config.label}</span>
                          <span>{new Date(expense.date).toLocaleDateString("es-MX")}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">${expense.amount.toLocaleString()}</div>
                      </div>
                      <button
                        onClick={() => deleteExpense({ expenseId: expense._id })}
                        className="btn btn-ghost btn-xs btn-circle text-error"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNewExpense && currentFamily && (
        <NewExpenseModal
          familyId={currentFamily._id}
          onClose={() => setShowNewExpense(false)}
        />
      )}
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
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(CATEGORY_CONFIG) as [ExpenseCategory, typeof CATEGORY_CONFIG[ExpenseCategory]][]).map(
                ([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={`btn btn-sm ${category === key ? "btn-primary" : "btn-ghost"}`}
                  >
                    {config.icon}
                  </button>
                )
              )}
            </div>
            <span className="text-xs text-center mt-1">{CATEGORY_CONFIG[category].label}</span>
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
