import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MobileModal } from "../ui/MobileModal";
import { DateInput } from "../ui/DateInput";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { CATEGORY_CONFIG, GENERAL_EXPENSE_CATEGORIES } from "./constants";
import type { ExpenseCategory } from "./constants";

interface ExpenseFormModalProps {
    familyId: Id<"families">;
    onClose: () => void;
    isOpen?: boolean; // MobileModal handles this but good to have
    expenseToEdit?: Doc<"expenses">;
}

export function ExpenseFormModal({
    familyId,
    onClose,
    isOpen = true,
    expenseToEdit,
}: ExpenseFormModalProps) {
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState<ExpenseCategory>("food");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [isLoading, setIsLoading] = useState(false);

    // Populate form for edit
    useEffect(() => {
        if (expenseToEdit) {
            setDescription(expenseToEdit.description);
            setAmount(expenseToEdit.amount.toString());
            setCategory(expenseToEdit.category as ExpenseCategory);
            setDate(new Date(expenseToEdit.date).toISOString().split("T")[0]);
        } else {
            setDescription("");
            setAmount("");
            setCategory("food");
            setDate(new Date().toISOString().split("T")[0]);
        }
    }, [expenseToEdit]);

    const createExpense = useMutation(api.expenses.createExpense);
    const updateExpense = useMutation(api.expenses.updateExpense);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim() || !amount) return;

        setIsLoading(true);
        try {
            if (expenseToEdit) {
                await updateExpense({
                    expenseId: expenseToEdit._id,
                    // familyId is usually not required for update if using per-doc auth or separate checks
                    // Removing it as lint complains
                    description: description.trim(),
                    amount: parseFloat(amount),
                    category,
                    date: new Date(date).getTime(),
                    // Persist other fields if necessary or let backend handle merge
                });
            } else {
                await createExpense({
                    familyId,
                    type: "general",
                    description: description.trim(),
                    amount: parseFloat(amount),
                    category,
                    date: new Date(date).getTime(),
                });
            }
            onClose();
        } catch (error) {
            console.error("Error saving expense", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MobileModal isOpen={isOpen} onClose={onClose} title={expenseToEdit ? "Editar gasto" : "Nuevo gasto"}>
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
                                    className={`btn btn - sm gap - 1 ${category === key ? "btn-primary" : "btn-ghost"} `}
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
                        {isLoading ? <span className="loading loading-spinner loading-sm" /> : (expenseToEdit ? "Guardar Cambios" : "Guardar")}
                    </button>
                </div>
            </form>
        </MobileModal>
    );
}
