import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useFamily } from "../contexts/FamilyContext";
import { useAuth } from "../contexts/AuthContext";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { EmptyState } from "../components/ui/EmptyState";
import { useConfirmModal } from "../components/ui/ConfirmModal";
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
  Share2,
  Copy,
  Check,
  Link,
} from "lucide-react";
import { useToast } from "../components/ui/Toast";

export function FamilyPage() {
  const navigate = useNavigate();
  const { currentFamily } = useFamily();
  const { user } = useAuth();
  const [showInvite, setShowInvite] = useState(false);
  const { confirm, ConfirmModal } = useConfirmModal();

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
          familyName={currentFamily.name}
          userId={user._id}
          onClose={() => setShowInvite(false)}
        />
      )}
      
      {/* Confirm Modal */}
      <ConfirmModal />
    </div>
  );
}

function InviteModal({
  familyId,
  familyName,
  userId,
  onClose,
}: {
  familyId: string;
  familyName: string;
  userId: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  const sendInvite = useMutation(api.families.sendInvite);

  // Generate invite link
  const baseUrl = window.location.origin;
  const inviteLink = `${baseUrl}/?invite=${familyId}`;
  const registerLink = `${baseUrl}/`;

  const handleCopyLink = async (link: string, type: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      success(`Link copiado: ${type}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      success(`Link copiado: ${type}`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async (link: string, title: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Te invito a unirte a mi familia "${familyName}" en Kovan`,
          url: link,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      handleCopyLink(link, title);
    }
  };

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

        {/* Share Links */}
        <div className="space-y-3 mb-6">
          <p className="text-sm text-base-content/70">Comparte un link de invitación:</p>
          
          {/* Invite to this family */}
          <div className="card bg-base-200 p-3">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Link className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Unirse a "{familyName}"</p>
                <p className="text-xs text-base-content/60 truncate">{inviteLink}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleCopyLink(inviteLink, "Invitar a familia")}
                  className="btn btn-ghost btn-sm btn-circle"
                  title="Copiar link"
                >
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleShare(inviteLink, "Unirse a mi familia")}
                  className="btn btn-ghost btn-sm btn-circle"
                  title="Compartir"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Invite to create their own family */}
          <div className="card bg-base-200 p-3">
            <div className="flex items-center gap-3">
              <div className="bg-success/10 p-2 rounded-lg">
                <Users className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Crear su propia familia</p>
                <p className="text-xs text-base-content/60 truncate">{registerLink}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleCopyLink(registerLink, "Registrarse")}
                  className="btn btn-ghost btn-sm btn-circle"
                  title="Copiar link"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShare(registerLink, "Únete a Kovan")}
                  className="btn btn-ghost btn-sm btn-circle"
                  title="Compartir"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="divider text-xs text-base-content/50">O invita por email</div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Email del usuario</span>
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
                Si ya tiene cuenta, se agregará automáticamente.
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
              Cerrar
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
