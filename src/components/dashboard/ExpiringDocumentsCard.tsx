import { FileText } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";
import { DashboardCard } from "./DashboardCard";

export function ExpiringDocumentsCard({ documents, now }: { documents: Doc<"documents">[]; now: number }) {
  if (documents.length === 0) return null;

  return (
    <DashboardCard
      icon={FileText}
      title="Documentos por vencer"
      to="/documents"
      color="bg-orange-500/10 text-orange-600"
    >
      <ul className="space-y-1">
        {documents.slice(0, 3).map((doc) => {
          const daysLeft = Math.ceil(((doc.expiryDate || 0) - now) / (1000 * 60 * 60 * 24));
          const isExpired = daysLeft < 0;
          return (
            <li key={doc._id} className="text-sm flex justify-between items-center">
              <span className="truncate font-medium">{doc.title}</span>
              <span className={`text-xs font-bold ${isExpired ? "text-error" : "text-warning"}`}>
                {isExpired ? "Vencido" : `${daysLeft} días`}
              </span>
            </li>
          );
        })}
      </ul>
    </DashboardCard>
  );
}
