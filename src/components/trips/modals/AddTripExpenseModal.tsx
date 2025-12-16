import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { MobileModal } from "../../ui/MobileModal";
import { Input } from "../../ui/Input";
import { DateInput } from "../../ui/DateInput";

// We can reuse the category config from FinancesPage or redefine/import it.
// For now, let's redefine a simple list relevant for trips.
const TRIP_CATEGORIES = [
    { id: "food", label: "Comida", icon: "🍔" },
    { id: "transport", label: "Transporte", icon: "🚕" },
    { id: "entertainment", label: "Entretenimiento", icon: "🎫" },
    { id: "shopping", label: "Compras", icon: "🛍️" },
    { id: "accommodation", label: "Hospedaje", icon: "🏨" }, // Not existing in schema? Schema has hotel in bookings. Expense might just be "other" or "trip".
    // Schema category is: food, transport, entertainment, utilities, health, shopping, home, education, gifts, vehicle, subscription, other, trip.
    // I should match schema categories.
    { id: "trip", label: "General", icon: "✈️" },
    { id: "other", label: "Otro", icon: "📋" },
];

export function AddTripExpenseModal({ tripId, familyId, onClose }: { tripId: Id<"trips">, familyId: Id<"families">, onClose: () => void }) {
    const createExpense = useMutation(api.expenses.createExpense);

    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("trip"); // Default to trip
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim() || !amount) return;

        setIsLoading(true);
        try {
            await createExpense({
                familyId,
                type: "trip", // Explicitly trip type
                tripId,       // Link to trip
                description: description.trim(),
                amount: parseFloat(amount),
                category: category as "trip" | "food" | "transport" | "entertainment" | "shopping" | "other", // Cast to valid subset
                date: new Date(date).getTime(),
            });
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MobileModal isOpen onClose={onClose} title="Nuevo Gasto de Viaje">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Descripción *"
                    placeholder="¿En qué gastaste?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-3">
                    <Input
                        label="Monto *"
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <DateInput
                        label="Fecha"
                        value={date}
                        onChange={setDate}
                    />
                </div>

                <div className="form-control">
                    <label className="label"><span className="label-text">Categoría</span></label>
                    <div className="grid grid-cols-3 gap-2">
                        {TRIP_CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setCategory(cat.id)}
                                className={`btn btn-sm h-auto py-2 gap-1 ${category === cat.id ? "btn-primary" : "btn-outline btn-neutral border-base-300 font-normal"}`}
                            >
                                <span className="text-lg">{cat.icon}</span>
                                <span className="text-xs">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="modal-action">
                    <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={isLoading || !description.trim() || !amount}>
                        {isLoading ? <span className="loading loading-spinner" /> : "Guardar"}
                    </button>
                </div>
            </form>
        </MobileModal>
    );
}
