import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { MobileModal } from "../ui/MobileModal";
import { Input } from "../ui/Input";
import { DateInput } from "../ui/DateInput";

interface PaymentModalProps {
  sessionToken: string;
  loanId: Id<"loans">;
  onClose: () => void;
}

export function PaymentModal({ sessionToken, loanId, onClose }: PaymentModalProps) {
  const addPayment = useMutation(api.loans.addPayment);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setIsLoading(true);
    try {
      if (!sessionToken) return;
      await addPayment({
        sessionToken,
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
        <Input
          label="Monto abonado"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />
        <DateInput label="Fecha" value={date} onChange={setDate} />
        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading || !amount}>
            Registrar
          </button>
        </div>
      </form>
    </MobileModal>
  );
}
