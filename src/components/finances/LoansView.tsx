import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { useFamily } from "../../contexts/FamilyContext";
import { useAuth } from "../../contexts/AuthContext";
import { useConfirmModal } from "../../hooks/useConfirmModal";
import { SkeletonPageContent } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { Plus, Trash2, HandCoins } from "lucide-react";
import { NewLoanModal } from "./NewLoanModal";
import { PaymentModal } from "./PaymentModal";

export function LoansView() {
  const { currentFamily } = useFamily();
  const { sessionToken } = useAuth();
  const [showNewLoan, setShowNewLoan] = useState(false);
  const [paymentLoanId, setPaymentLoanId] = useState<Id<"loans"> | null>(null);
  const { confirm } = useConfirmModal();

  const loans = useQuery(
    api.loans.list,
    currentFamily && sessionToken ? { sessionToken, familyId: currentFamily._id } : "skip"
  );
  const deleteLoan = useMutation(api.loans.deleteLoan);

  if (!loans) return <SkeletonPageContent cards={3} />;

  const totalLent = loans.reduce((sum: number, l: Doc<"loans">) => l.type === "lent" && l.balance > 1 ? sum + l.balance : sum, 0);
  const totalBorrowed = loans.reduce((sum: number, l: Doc<"loans">) => l.type === "borrowed" && l.balance > 1 ? sum + l.balance : sum, 0);

  return (
    <div className="px-4 space-y-4">
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
                          if (sessionToken) deleteLoan({ sessionToken, loanId: loan._id });
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
        <NewLoanModal sessionToken={sessionToken ?? ""} familyId={currentFamily._id} onClose={() => setShowNewLoan(false)} />
      )}

      {currentFamily && paymentLoanId && (
        <PaymentModal
          sessionToken={sessionToken ?? ""}
          loanId={paymentLoanId}
          onClose={() => setPaymentLoanId(null)}
        />
      )}
    </div>
  );
}
