import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useToast } from "../ui/Toast";
import { MobileModal } from "../ui/MobileModal";
import { Mail, Share2, Copy, Check, Link, Users } from "lucide-react";

interface InviteModalProps {
  familyId: Id<"families">;
  familyName: string;
  sessionToken: string | null;
  onClose: () => void;
}

export function InviteModal({
  familyId,
  familyName,
  sessionToken,
  onClose,
}: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string>("");
  const [generatedForEmail, setGeneratedForEmail] = useState<string>("");
  const { success } = useToast();

  const sendInvite = useMutation(api.families.sendInvite);
  const baseUrl = window.location.origin;
  const inviteLink = generatedInviteLink;
  const registerLink = `${baseUrl}/`;

  const handleCopyLink = async (link: string, type: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      success(`Link copiado: ${type}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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
        // User cancelled or share error
      }
    } else {
      handleCopyLink(link, title);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setMessage("");
    try {
      if (!sessionToken) throw new Error("Sesión inválida");
      const result = await sendInvite({
        sessionToken,
        familyId,
        email: email.trim().toLowerCase(),
      });
      const normalizedEmail = email.trim().toLowerCase();
      const tokenInviteLink = `${baseUrl}/login?inviteToken=${result.inviteToken}`;
      setGeneratedInviteLink(tokenInviteLink);
      setGeneratedForEmail(normalizedEmail);

      setMessage("📧 Invitación creada. Comparte el link seguro generado abajo.");
      await handleCopyLink(tokenInviteLink, "Invitación segura");
    } catch (error) {
      setMessage(`❌ ${error instanceof Error ? error.message : "Error al invitar"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileModal isOpen={true} onClose={onClose} title="Invitar a la familia">
      <div className="space-y-3 mb-6">
        <p className="text-sm text-base-content/70">Comparte un link de invitación:</p>

        <div className="card bg-base-200 p-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Link className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Unirse a "{familyName}"</p>
              {inviteLink ? (
                <p className="text-xs text-base-content/60 truncate">{inviteLink}</p>
              ) : (
                <p className="text-xs text-base-content/60">
                  Primero genera la invitación por email para crear un link seguro.
                </p>
              )}
              {generatedForEmail && (
                <p className="text-[11px] text-primary mt-1 truncate">
                  Ligado a: {generatedForEmail}
                </p>
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => inviteLink && handleCopyLink(inviteLink, "Invitar a familia")}
                className="btn btn-ghost btn-sm btn-circle"
                title="Copiar link"
                disabled={!inviteLink}
              >
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={() => inviteLink && handleShare(inviteLink, "Unirse a mi familia")}
                className="btn btn-ghost btn-sm btn-circle"
                title="Compartir"
                disabled={!inviteLink}
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

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
              Se enviará una invitación segura atada a este correo.
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
    </MobileModal>
  );
}
