import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { DollarSign, Plus } from "lucide-react";
import { useState } from "react";
import { AddTripExpenseModal } from "../modals/AddTripExpenseModal";
// Reuse existing Expense Creation components? 
// Or make a simple one here. Better to reuse eventually, but for speed, create simple modal wrapper.
// Actually, let's just list expenses and have a simpler "Add Expense" inline or modal.

export function TripFinancesTab({ tripId }: { tripId: Id<"trips"> }) {
    const expenses = useQuery(api.expenses.getExpensesByTrip, { tripId });
    const trip = useQuery(api.trips.getTrip, { tripId });
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
    // Assuming we have a modal to add expense linked to trip.

    // Calculate totals
    const totalSpent = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const budget = trip?.budget || 0;
    const progress = budget > 0 ? (totalSpent / budget) * 100 : 0;
    const remaining = budget - totalSpent;

    if (expenses === undefined || trip === undefined) return <div className="p-10 flex justify-center"><span className="loading loading-dots loading-md" /></div>;
    if (trip === null) return <div>Trip not found</div>;

    return (
        <div className="space-y-6">
            {/* Summary Card */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-5">
                    <h3 className="font-bold text-lg mb-2">Presupuesto</h3>

                    <div className="flex items-end gap-2 mb-1">
                        <span className="text-3xl font-bold">${totalSpent.toLocaleString()}</span>
                        {budget > 0 && (
                            <span className="text-sm text-base-content/60 mb-2">
                                de ${budget.toLocaleString()}
                            </span>
                        )}
                    </div>

                    {budget > 0 && (
                        <>
                            <progress
                                className={`progress w-full h-3 ${remaining < 0 ? 'progress-error' : 'progress-primary'}`}
                                value={totalSpent}
                                max={budget}
                            />
                            <div className="flex justify-between text-xs mt-1 font-medium">
                                <span>{progress.toFixed(0)}% Utilizado</span>
                                <span className={remaining < 0 ? "text-error" : "text-success"}>
                                    {remaining < 0 ? "Excedido" : "Disponible"}: ${Math.abs(remaining).toLocaleString()}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Expenses List */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold">Gastos Recientes</h4>
                    <button
                        onClick={() => setIsAddExpenseOpen(true)}
                        className="btn btn-xs btn-primary gap-1"
                    >
                        <Plus className="w-3 h-3" /> Registrar
                    </button>
                </div>

                {expenses.length === 0 ? (
                    <div className="text-center py-8 text-base-content/50 bg-base-100 rounded-xl border border-dashed border-base-200">
                        <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No hay gastos registrados aún.</p>
                        <button onClick={() => setIsAddExpenseOpen(true)} className="btn btn-link btn-sm mt-1">
                            Registrar el primero
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {expenses.map(expense => (
                            <div key={expense._id} className="flex items-center justify-between p-3 bg-base-100 border border-base-200 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-500/10 text-emerald-600 p-2 rounded-lg">
                                        <DollarSign className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">{expense.description}</div>
                                        <div className="flex items-center gap-2 text-[10px] text-base-content/60">
                                            <span>{new Date(expense.date).toLocaleDateString()}</span>
                                            {expense.category && expense.category !== "trip" && (
                                                <span className="badge badge-ghost badge-xs text-[9px] h-4">{expense.category}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <span className="font-bold text-sm">
                                    ${expense.amount.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Note: User can add expenses via the main "+" FAB or Finances page, 
                but we should probably add a quick action here too. 
                For now, display only as requested.
            */}
            {isAddExpenseOpen && (
                <AddTripExpenseModal
                    tripId={tripId}
                    familyId={trip.familyId}
                    onClose={() => setIsAddExpenseOpen(false)}
                />
            )}
        </div>
    );
}
