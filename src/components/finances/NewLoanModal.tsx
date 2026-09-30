import { useState, type FormEvent, useRef} from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { MobileModal } from "../ui/MobileModal";
import { DateInput } from "../ui/DateInput";
import { Input } from "../ui/Input";

interface NewLoanModalProps {
  sessionToken: string;
  familyId: Id<"families">;
  onClose: () => void;
}

export function NewLoanModal({ sessionToken, familyId, onClose }: NewLoanModalProps) {
  const submitSeq = useRef(0);
  const createLoan = useMutation(api.loans.create);
  const [type, setType] = useState<"lent" | "borrowed">("lent");
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    const seq = ++submitSeq.current;
    e.preventDefault();
    if (!person || !amount) return;
    setIsLoading((cur) => (seq === submitSeq.current ? true : cur));
    try {
      if (!sessionToken) return;
      await createLoan({
        sessionToken,
        familyId,
        type,
        personName: person,
        amount: parseFloat(amount),
        date: new Date(date).getTime(),
      });
      if (seq === submitSeq.current) onClose();
    } finally {
      setIsLoading((cur) => (seq === submitSeq.current ? false : cur));
    }
  };

  return (
    <MobileModal isOpen={true} onClose={onClose} title="Nuevo Préstamo">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="tabs tabs-boxed">
          <button type="button" className={`tab flex-1 ${type === "lent" ? "tab-active" : ""}`} onClick={() => setType("lent")}>
            Presté dinero
          </button>
          <button type="button" className={`tab flex-1 ${type === "borrowed" ? "tab-active" : ""}`} onClick={() => setType("borrowed")}>
            Me prestaron
          </button>
        </div>

        <Input
          label="¿A quién / Quién?"
          placeholder="Nombre de la persona"
          value={person}
          onChange={(e) => setPerson(e.target.value)}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Monto"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <DateInput label="Fecha" value={date} onChange={setDate} />
        </div>

        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading || !person || !amount}>
            Guardar
          </button>
        </div>
      </form>
    </MobileModal>
  );
}
