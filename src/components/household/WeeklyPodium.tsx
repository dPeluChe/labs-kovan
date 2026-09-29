import { m } from "framer-motion";
import { Avatar } from "../ui/Avatar";

interface LeaderboardEntry {
  rank: number;
  userName: string;
  userPhoto?: string;
  points: number;
  activities: number;
}

interface WeeklyPodiumProps {
  leaderboard: LeaderboardEntry[];
  weekStart: number;
}

function formatWeekRange(weekStart: number) {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);

  const formatDay = (d: Date) =>
    d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });

  return `${formatDay(start)} - ${formatDay(end)}`;
}

function PodiumAvatar({
  entry,
  size,
  delay,
}: {
  entry: LeaderboardEntry;
  size: "lg" | "md";
  delay: number;
}) {
  const sizeClasses = size === "lg" ? "w-16 h-16" : "w-12 h-12";
  const medalEmoji = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉";

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", bounce: 0.3 }}
      className="flex flex-col items-center gap-1"
    >
      <div className="relative">
        {entry.userPhoto ? (
          <img
            src={entry.userPhoto}
            alt={entry.userName}
            className={`${sizeClasses} rounded-full object-cover ring-2 ring-primary/30`}
          />
        ) : (
          <div
            className={`${sizeClasses} rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary`}
          >
            {entry.userName.charAt(0)}
          </div>
        )}
        <span className="absolute -top-1 -right-1 text-lg">{medalEmoji}</span>
      </div>
      <span className="font-semibold text-sm truncate max-w-[80px]">
        {entry.userName}
      </span>
      <m.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.2 }}
        className="badge badge-primary badge-sm"
      >
        {entry.points} pts
      </m.span>
      <span className="text-xs text-subtle">
        {entry.activities} {entry.activities === 1 ? "act." : "acts."}
      </span>
    </m.div>
  );
}

export function WeeklyPodium({ leaderboard, weekStart }: WeeklyPodiumProps) {
  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-8 text-subtle">
        <p className="text-4xl mb-2">🏠</p>
        <p className="font-medium">Sin actividad esta semana</p>
        <p className="text-sm">Registra actividades para ver el ranking!</p>
      </div>
    );
  }

  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];
  const rest = leaderboard.slice(3);

  return (
    <div className="space-y-4">
      {/* Week label */}
      <p className="text-center text-sm text-muted">
        Semana: {formatWeekRange(weekStart)}
      </p>

      {/* Podium */}
      <div className="flex items-end justify-center gap-4 pt-4 pb-2">
        {/* 2nd place */}
        {second && (
          <div className="flex flex-col items-center">
            <PodiumAvatar entry={second} size="md" delay={0.2} />
            <m.div
              initial={{ clipPath: "inset(100% 0 0 0)" }}
              animate={{ clipPath: "inset(0% 0 0 0)" }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="w-20 h-[60px] bg-base-200 rounded-t-lg mt-2 flex items-end justify-center pb-1"
            >
              <span className="font-bold text-faint">2</span>
            </m.div>
          </div>
        )}

        {/* 1st place */}
        {first && (
          <div className="flex flex-col items-center">
            <PodiumAvatar entry={first} size="lg" delay={0} />
            <m.div
              initial={{ clipPath: "inset(100% 0 0 0)" }}
              animate={{ clipPath: "inset(0% 0 0 0)" }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="w-24 h-20 bg-primary/20 rounded-t-lg mt-2 flex items-end justify-center pb-1"
            >
              <span className="font-bold text-primary">1</span>
            </m.div>
          </div>
        )}

        {/* 3rd place */}
        {third && (
          <div className="flex flex-col items-center">
            <PodiumAvatar entry={third} size="md" delay={0.4} />
            <m.div
              initial={{ clipPath: "inset(100% 0 0 0)" }}
              animate={{ clipPath: "inset(0% 0 0 0)" }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="w-20 h-10 bg-base-200 rounded-t-lg mt-2 flex items-end justify-center pb-1"
            >
              <span className="font-bold text-faint">3</span>
            </m.div>
          </div>
        )}
      </div>

      {/* Rest of ranking */}
      {rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((entry) => (
            <div
              key={entry.userName}
              className="flex items-center gap-3 p-3 surface-muted"
            >
              <span className="font-bold text-faint w-6 text-center">
                {entry.rank}
              </span>
              <Avatar src={entry.userPhoto} name={entry.userName} size="sm" />
              <span className="font-medium flex-1">{entry.userName}</span>
              <span className="badge badge-ghost badge-sm">
                {entry.activities} acts.
              </span>
              <span className="font-bold text-primary">{entry.points} pts</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
