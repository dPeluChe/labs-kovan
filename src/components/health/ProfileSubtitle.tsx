import { CakeIcon } from "lucide-react";
import { calculateAge } from "../../utils/dates";

interface ProfileSubtitleProps {
  nickname?: string | null;
  relation?: string;
  birthDate?: number;
}

export function ProfileSubtitle({ nickname, relation, birthDate }: ProfileSubtitleProps) {
  return (
    <div className="flex items-center gap-2">
      {nickname && <span className="italic">"{nickname}"</span>}
      <span>{relation}</span>
      {birthDate && (
        <>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CakeIcon className="w-3 h-3" />
            {calculateAge(birthDate)}
          </span>
        </>
      )}
    </div>
  );
}
