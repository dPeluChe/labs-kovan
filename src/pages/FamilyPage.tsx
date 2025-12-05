import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
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

export function FamilyPage() {
  const navigate = useNavigate();
  const { currentFamily } = useFamily();
  const { user } = useAuth();
  const [showInvite, setShowInvite] = useState(false);

  const members = useQuery(
    api.families.getFamilyMembers,
    currentFamily ? { familyId: currentFamily._id } : "skip"
  );

  const pendingInvites = useQuery(
    api.families.getPendingInvites,
    currentFamily ? { familyId: currentFamily._id } : "skip"
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
            <div className="space-y-2">
              {members.filter((m): m is NonNullable<typeof m> => m !== null).map((member) => (
                <div
                  key={member._id}
                  className="card bg-base-100 shadow-sm border border-base-300"
                >
                  <div className="card-body p-3">
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className="bg-primary/10 text-primary rounded-full w-10">
                          <span className="text-lg">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
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
                            onClick={() => {
                              if (confirm(`¿Eliminar a ${member.name} de la familia?`)) {
                                removeMember({ membershipId: member.membershipId });
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
                        onClick={() => cancelInvite({ inviteId: invite._id })}
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
          userId={user._id}
          onClose={() => setShowInvite(false)}
        />
      )}
    </div>
  );
}

function InviteModal({
  familyId,
  userId,
  onClose,
}: {
  familyId: string;
  userId: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const sendInvite = useMutation(api.families.sendInvite);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setMessage("");
    try {
      const result = await sendInvite({
        familyId: familyId as Parameters<typeof sendInvite>[0]["familyId"],
        email: email.trim().toLowerCase(),
        invitedBy: userId as Parameters<typeof sendInvite>[0]["invitedBy"],
      });

      if (result.added) {
        setMessage("✅ Usuario agregado a la familia");
        setTimeout(onClose, 1500);
      } else {
        setMessage("📧 Invitación creada. El usuario podrá unirse cuando inicie sesión.");
        setTimeout(onClose, 2000);
      }
    } catch (error) {
      setMessage(`❌ ${error instanceof Error ? error.message : "Error al invitar"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Invitar a la familia</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Email del usuario *</span>
            </label>
            <input
              type="email"
              placeholder="ejemplo@email.com"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                Si el usuario ya existe, se agregará automáticamente.
                Si no, recibirá la invitación al registrarse.
              </span>
            </label>
          </div>

          {message && (
            <div className="alert">
              <span>{message}</span>
            </div>
          )}

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose} disabled={isLoading}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Invitar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
