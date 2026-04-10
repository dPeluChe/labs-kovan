import { useState } from "react";
import { useFamily } from "../contexts/FamilyContext";
import { DollarSign, HandCoins } from "lucide-react";
import { ExpensesView } from "../components/finances/ExpensesView";
import { LoansView } from "../components/finances/LoansView";

export function FinancesPage() {
  const { currentFamily } = useFamily();
  const [activeSection, setActiveSection] = useState<"expenses" | "loans">("expenses");

  if (!currentFamily) return null;

  return (
    <div className="pb-4">
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
