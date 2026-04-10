import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface LogEntry {
  _id: Id<"householdActivityLogs">;
  activityEmoji: string;
  activityName: string;
  userName: string;
  userPhoto?: string;
  loggedByName?: string;
  points: number;
  date: number;
  notes?: string;
}

interface ActivityFeedProps {
  logs: LogEntry[];
  onDelete?: (logId: Id<"householdActivityLogs">) => void;
}

export function ActivityFeed({ logs, onDelete }: ActivityFeedProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-base-content/50">
        <p className="text-4xl mb-2">📋</p>
        <p className="font-medium">Sin registros aún</p>
        <p className="text-sm">Registra una actividad para empezar</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div
          key={log._id}
          className="flex items-start gap-3 p-3 rounded-xl bg-base-100 border border-base-300"
        >
          <span className="text-2xl">{log.activityEmoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {log.userPhoto ? (
                <img
                  src={log.userPhoto}
                  alt={log.userName}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-base-300 flex items-center justify-center text-[10px] font-bold">
                  {log.userName.charAt(0)}
                </div>
              )}
              <span className="font-medium text-sm">{log.userName}</span>
              <span className="badge badge-primary badge-xs">+{log.points}</span>
            </div>
            <p className="text-sm text-base-content/70">{log.activityName}</p>
            {log.notes && (
              <p className="text-xs text-base-content/50 mt-0.5">"{log.notes}"</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-base-content/40">
                {formatDistanceToNow(new Date(log.date), { addSuffix: true, locale: es })}
              </span>
              {log.loggedByName && (
                <span className="text-xs text-base-content/40">
                  - registrado por {log.loggedByName}
                </span>
              )}
            </div>
          </div>
          {onDelete && (
            <button
              onClick={() => onDelete(log._id)}
              className="btn btn-ghost btn-xs btn-square text-base-content/30 hover:text-error"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
