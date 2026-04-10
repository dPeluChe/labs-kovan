import { useState } from "react";
import { useFamily } from "../contexts/FamilyContext";
import { DollarSign, HandCoins } from "lucide-react";
import { StickyHeader } from "../components/ui/StickyHeader";
import { ExpensesView } from "../components/finances/ExpensesView";
import { LoansView } from "../components/finances/LoansView";

export function FinancesPage() {
  const { currentFamily } = useFamily();
  const [activeSection, setActiveSection] = useState<"expenses" | "loans">("expenses");

  if (!currentFamily) return null;

  return (
    <div className="pb-4">
      <StickyHeader
        title="Finanzas"
        action={
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
        }
      />

      <div className="mt-2">
        {activeSection === "expenses" ? <ExpensesView /> : <LoansView />}
      </div>
    </div>
  );
}
