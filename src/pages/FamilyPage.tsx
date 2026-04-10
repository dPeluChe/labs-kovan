import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { useConfirmModal } from "../hooks/useConfirmModal";
import {
  ArrowLeft,
  Users,
  Plus,
  Trash2,
  Mail,
  Crown,
  Shield,
  User,
  Clock,
} from "lucide-react";
import { InviteModal } from "../components/family/InviteModal";

export function FamilyPage() {
  const navigate = useNavigate();
  const { currentFamily } = useFamily();
  const { user, sessionToken } = useAuth();
  const [showInvite, setShowInvite] = useState(false);
  const { confirm, ConfirmModal } = useConfirmModal();

  const members = useQuery(
    api.families.getFamilyMembers,
    currentFamily && sessionToken ? { familyId: currentFamily._id, sessionToken } : "skip"
  );

  const pendingInvites = useQuery(
    api.families.getPendingInvites,
    currentFamily && sessionToken ? { familyId: currentFamily._id, sessionToken } : "skip"
  );

  const removeMember = useMutation(api.families.removeMember);
  const cancelInvite = useMutation(api.families.cancelInvite);

  if (!currentFamily || !user) return <PageLoader />;

  const isOwner = currentFamily.role === "owner";
  const isAdmin = currentFamily.role === "owner" || currentFamily.role === "admin";

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-amber-500" />;
      case "admin":
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-base-content/40" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner":
        return "Dueño";
      case "admin":
        return "Admin";
      default:
        return "Miembro";
    }
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-base-100 border-b border-base-300">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm btn-circle">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">
            {currentFamily.emoji} {currentFamily.name}
          </h1>
          <p className="text-xs text-base-content/60">Gestionar miembros</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInvite(true)}
            className="btn btn-primary btn-sm gap-1"
          >
            <Plus className="w-4 h-4" />
            Invitar
          </button>
        )}
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Members */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Miembros ({members?.length || 0})
          </h3>

          {members === undefined ? (
            <PageLoader />
          ) : members.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Sin miembros"
              description="Invita a tu familia"
            />
          ) : (
            <div className="space-y-2 stagger-children">
              {members.filter((m): m is NonNullable<typeof m> => m !== null).map((member) => (
                <div
                  key={member._id}
                  className="card bg-base-100 shadow-sm border border-base-300 animate-fade-in"
                >
                  <div className="card-body p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center text-base-content/70 font-semibold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">{member.name}</span>
                          {getRoleIcon(member.role)}
                        </div>
                        <p className="text-xs text-base-content/60 truncate">
                          {member.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-sm badge-ghost">
                          {getRoleLabel(member.role)}
                        </span>
                        {isOwner && member.role !== "owner" && member._id !== user._id && (
                          <button
                            onClick={async () => {
                              const confirmed = await confirm({
                                title: "Eliminar miembro",
                                message: `¿Estás seguro de que quieres eliminar a ${member.name} de la familia? Perderá acceso a todos los datos familiares.`,
                                confirmText: "Eliminar",
                                cancelText: "Cancelar",
                                variant: "danger",
                                icon: "trash",
                              });

                              if (confirmed) {
                                if (!sessionToken) return;
                                removeMember({ membershipId: member.membershipId, sessionToken });
                              }
                            }}
                            className="btn btn-ghost btn-xs btn-circle text-error"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Invites */}
        {isAdmin && pendingInvites && pendingInvites.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Invitaciones pendientes ({pendingInvites.length})
            </h3>

            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div
                  key={invite._id}
                  className="card bg-base-100 shadow-sm border border-warning/30"
                >
                  <div className="card-body p-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-warning/10 p-2 rounded-lg">
                        <Mail className="w-5 h-5 text-warning" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{invite.email}</p>
                        <p className="text-xs text-base-content/60">
                          Invitado el {new Date(invite.createdAt).toLocaleDateString("es-MX")}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (!sessionToken) return;
                          cancelInvite({ inviteId: invite._id, sessionToken });
                        }}
                        className="btn btn-ghost btn-xs btn-circle text-error"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showInvite && currentFamily && (
        <InviteModal
          familyId={currentFamily._id}
          familyName={currentFamily.name}
          sessionToken={sessionToken}
          onClose={() => setShowInvite(false)}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal />
    </div>
  );
}
