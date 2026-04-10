import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { MobileModal } from "../ui/MobileModal";
import { Avatar } from "../ui/Avatar";
import { useFamily } from "../../contexts/FamilyContext";
import { useAuth } from "../../contexts/AuthContext";

interface LogActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Doc<"householdActivities">;
}

export function LogActivityModal({ isOpen, onClose, activity }: LogActivityModalProps) {
  const { currentFamily } = useFamily();
  const { user, sessionToken } = useAuth();
  const [selectedUser, setSelectedUser] = useState<Id<"users"> | "">("");
  const [notes, setNotes] = useState("");

  const membersRaw = useQuery(
    api.families.getFamilyMembers,
    currentFamily && sessionToken
      ? { familyId: currentFamily._id, sessionToken }
      : "skip"
  );
  const members = membersRaw?.filter(
    (m): m is NonNullable<typeof m> => m !== null
  );

  const logActivity = useMutation(api.household.logActivity);

  const handleSubmit = async () => {
    if (!currentFamily || !user || !selectedUser) return;

    await logActivity({
      familyId: currentFamily._id,
      activityId: activity._id,
      userId: selectedUser as Id<"users">,
      loggedBy: user._id,
      notes: notes || undefined,
    });

    setSelectedUser("");
    setNotes("");
    onClose();
  };

  return (
    <MobileModal isOpen={isOpen} onClose={onClose} title={`${activity.emoji} ${activity.name}`}>
      <div className="space-y-4">
        <div className="text-center">
          <div className="badge badge-primary badge-lg">+{activity.points} pts</div>
        </div>

        {/* Who did it? */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Quién hizo esta actividad?</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {members?.map((member) => (
              <button
                key={member._id}
                onClick={() => setSelectedUser(member._id)}
                className={`btn btn-sm h-auto py-3 ${
                  selectedUser === member._id
                    ? "btn-primary"
                    : "btn-ghost border border-base-300"
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <Avatar src={member.photoUrl} name={member.name} size="sm" />
                  <span className="text-xs truncate max-w-full">
                    {member.name ?? "Usuario"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Nota (opcional)</span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Lavó todos los trastes de la comida"
            className="input input-bordered input-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="btn btn-ghost flex-1">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedUser}
            className="btn btn-primary flex-1"
          >
            Registrar
          </button>
        </div>
      </div>
    </MobileModal>
  );
}
