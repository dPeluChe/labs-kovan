import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { MobileModal } from "../ui/MobileModal";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { SUBSCRIPTION_TYPES } from "./constants";

interface NewSubscriptionModalProps {
  sessionToken: string | null;
  familyId: Id<"families">;
  onClose: () => void;
}

export function NewSubscriptionModal({
  sessionToken,
  familyId,
  onClose,
}: NewSubscriptionModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"streaming" | "utility" | "internet" | "insurance" | "membership" | "software" | "other">("streaming");
  const [amount, setAmount] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "bimonthly" | "quarterly" | "annual" | "variable">("monthly");
  const [dueDay, setDueDay] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createSubscription = useMutation(api.expenses.createSubscription);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      if (!sessionToken) return;
      await createSubscription({
        sessionToken,
        familyId,
        name: name.trim(),
        type,
        amount: amount ? parseFloat(amount) : undefined,
        billingCycle,
        dueDay: dueDay ? parseInt(dueDay, 10) : undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileModal isOpen={true} onClose={onClose} title="Nueva suscripción">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre *"
          placeholder="Ej: Netflix, Spotify, CFE"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <Select
          label="Tipo"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
        >
          {Object.entries(SUBSCRIPTION_TYPES).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label} {config.icon}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Monto"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
          />
          <Select
            label="Ciclo"
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value as typeof billingCycle)}
          >
            <option value="monthly">Mensual</option>
            <option value="bimonthly">Bimestral</option>
            <option value="annual">Anual</option>
            <option value="variable">Variable</option>
          </Select>
        </div>

        <Input
          label="Día de pago (1-31)"
          type="number"
          placeholder="Ej: 15"
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value)}
          min={1}
          max={31}
        />

        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading || !name.trim()}>
            {isLoading ? <span className="loading loading-spinner loading-sm" /> : "Guardar"}
          </button>
        </div>
      </form>
    </MobileModal>
  );
}
