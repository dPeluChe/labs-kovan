import { useState } from "react";
import { useMutation } from "convex/react";
import { Copy, Check, KeyRound, AlertTriangle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { MobileModal } from "../ui/MobileModal";
import { useToast } from "../ui/Toast";

interface CreateTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionToken: string;
  familyId: Id<"families">;
}

export function CreateTokenModal({ isOpen, onClose, sessionToken, familyId }: CreateTokenModalProps) {
  const { success, error } = useToast();
  const createApiToken = useMutation(api.apiTokens.createApiToken);

  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    setName("");
    setCreatedToken(null);
    setCopied(false);
    onClose();
  };

  const handleCreate = async () => {
    if (!name.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const result = await createApiToken({ sessionToken, familyId, name: name.trim() });
      setCreatedToken(result.token);
    } catch (e) {
      error(e instanceof Error ? e.message : "No se pudo crear la llave");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!createdToken) return;
    try {
      await navigator.clipboard.writeText(createdToken);
      setCopied(true);
      success("Llave copiada al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      error("No se pudo copiar. Selecciona y copia manualmente.");
    }
  };

  if (!isOpen) return null;

  // Paso 2: mostrar la llave recién creada (única vez)
  if (createdToken) {
    return (
      <MobileModal isOpen onClose={handleClose} title="Llave creada">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 text-warning">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm text-body">
              Copia esta llave ahora. Por seguridad <strong>no se volverá a mostrar</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-base-200 font-mono text-xs break-all">
            <span className="flex-1">{createdToken}</span>
            <button
              onClick={() => void handleCopy()}
              className="btn btn-ghost btn-sm btn-circle shrink-0"
              aria-label="Copiar llave"
            >
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <button onClick={handleClose} className="btn btn-primary w-full">
            Listo, ya la guardé
          </button>
        </div>
      </MobileModal>
    );
  }

  // Paso 1: nombrar la llave
  return (
    <MobileModal isOpen onClose={handleClose} title="Nueva llave MCP">
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Dale un nombre descriptivo según dónde la vas a usar (ej. "Claude Desktop", "Claude Code laptop").
          Puedes revocarla en cualquier momento.
        </p>

        <label className="form-control w-full">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
            placeholder="Nombre de la llave"
            maxLength={60}
            className="input input-bordered w-full"
            autoFocus
          />
        </label>

        <button
          onClick={() => void handleCreate()}
          disabled={!name.trim() || isCreating}
          className="btn btn-primary w-full gap-2"
        >
          {isCreating ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <KeyRound className="w-4 h-4" />
          )}
          Generar llave
        </button>
      </div>
    </MobileModal>
  );
}
