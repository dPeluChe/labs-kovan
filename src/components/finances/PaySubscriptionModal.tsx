import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { MobileModal } from "../ui/MobileModal";
import { Input } from "../ui/Input";
import { DateInput } from "../ui/DateInput";

interface PaySubscriptionModalProps {
  sessionToken: string | null;
  subscriptionId: Id<"subscriptions">;
  familyId: Id<"families">;
  subscriptions: Doc<"subscriptions">[];
  onClose: () => void;
}

export function PaySubscriptionModal({
  sessionToken,
  subscriptionId,
  familyId,
  subscriptions,
  onClose,
}: PaySubscriptionModalProps) {
  const sub = subscriptions.find((s) => s._id === subscriptionId);
  const [amount, setAmount] = useState(sub?.amount?.toString() || "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(false);

  const createExpense = useMutation(api.expenses.createExpense);

  if (!sub) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setIsLoading(true);
    try {
      if (!sessionToken) return;
      await createExpense({
        sessionToken,
        familyId,
        type: "subscription",
        description: `Pago de ${sub.name}`,
        amount: parseFloat(amount),
        category: "subscription",
        date: new Date(date).getTime(),
        subscriptionId,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileModal isOpen={true} onClose={onClose} title={`Registrar pago de ${sub.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Monto a pagar"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
          autoFocus
        />
        <DateInput label="Fecha del pago" value={date} onChange={setDate} />
        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading || !amount}>
            {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Registrar"}
          </button>
        </div>
      </form>
    </MobileModal>
  );
}
