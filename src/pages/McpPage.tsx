import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { KeyRound, Plug, Ban } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../contexts/AuthContext";
import { useFamily } from "../contexts/FamilyContext";
import { DetailHeader } from "../components/ui/DetailHeader";
import { SectionTitle } from "../components/ui/SectionTitle";
import { CircleAddButton } from "../components/ui/CircleAddButton";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { PageLoader } from "../components/ui/LoadingSpinner";
import { useToast } from "../components/ui/Toast";
import { CreateTokenModal } from "../components/mcp/CreateTokenModal";
import { McpConnectionGuide } from "../components/mcp/McpConnectionGuide";

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function McpPage() {
  const navigate = useNavigate();
  const { user, sessionToken } = useAuth();
  const { currentFamily } = useFamily();
  const { success, error } = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [tokenToRevoke, setTokenToRevoke] = useState<Id<"apiTokens"> | null>(null);

  const tokens = useQuery(
    api.apiTokens.listApiTokens,
    sessionToken ? { sessionToken } : "skip"
  );
  const revokeApiToken = useMutation(api.apiTokens.revokeApiToken);

  if (!user || !sessionToken || !currentFamily) return <PageLoader />;

  const activeTokens = tokens?.filter((t) => !t.revokedAt) ?? [];
  const revokedTokens = tokens?.filter((t) => t.revokedAt) ?? [];

  const handleRevoke = async () => {
    if (!tokenToRevoke) return;
    try {
      await revokeApiToken({ sessionToken, tokenId: tokenToRevoke });
      success("Llave revocada");
    } catch (e) {
      error(e instanceof Error ? e.message : "No se pudo revocar la llave");
    } finally {
      setTokenToRevoke(null);
    }
  };

  return (
    <div className="pb-4">
      <DetailHeader
        title="Conexiones MCP"
        subtitle="Conecta tus agentes IA a Kovan"
        onBack={() => navigate(-1)}
      />

      <div className="px-4 py-4 space-y-6">
        <div className="surface-card p-4 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <Plug className="w-5 h-5" />
          </div>
          <p className="text-sm text-muted">
            Kovan expone un servidor MCP para que asistentes como Claude consulten y registren
            datos de tu familia en lenguaje natural: gastos, regalos, vehículos, lugares, recetas
            y más. El acceso se controla con llaves personales que puedes revocar cuando quieras.
          </p>
        </div>

        <div className="space-y-3">
          <SectionTitle
            icon={<KeyRound className="w-4 h-4" />}
            action={<CircleAddButton onClick={() => setShowCreate(true)} label="Nueva llave" />}
          >
            Mis llaves
          </SectionTitle>

          {tokens === undefined ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner" />
            </div>
          ) : activeTokens.length === 0 ? (
            <EmptyState
              icon={KeyRound}
              title="Sin llaves activas"
              description="Crea una llave para conectar Claude u otro cliente MCP a tu familia."
              action={
                <button onClick={() => setShowCreate(true)} className="btn btn-primary btn-sm">
                  Crear llave
                </button>
              }
            />
          ) : (
            <div className="space-y-2">
              {activeTokens.map((token) => (
                <div key={token._id} className="surface-row flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-strong truncate">{token.name}</p>
                    <p className="text-xs text-subtle font-mono">{token.tokenPrefix}…</p>
                    <p className="text-xs text-subtle">
                      Creada el {formatDate(token.createdAt)}
                      {token.lastUsedAt
                        ? ` · Último uso ${formatDate(token.lastUsedAt)}`
                        : " · Sin usar"}
                    </p>
                  </div>
                  <button
                    onClick={() => setTokenToRevoke(token._id)}
                    className="btn btn-ghost btn-sm text-error gap-1"
                  >
                    <Ban className="w-4 h-4" />
                    Revocar
                  </button>
                </div>
              ))}
            </div>
          )}

          {revokedTokens.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-subtle">
                Llaves revocadas ({revokedTokens.length})
              </summary>
              <div className="space-y-2 mt-2">
                {revokedTokens.map((token) => (
                  <div key={token._id} className="surface-row flex items-center gap-3 opacity-60">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate line-through">{token.name}</p>
                      <p className="text-xs text-subtle font-mono">{token.tokenPrefix}…</p>
                    </div>
                    <span className="badge badge-ghost badge-sm">
                      Revocada {token.revokedAt ? formatDate(token.revokedAt) : ""}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        <McpConnectionGuide />
      </div>

      <CreateTokenModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        sessionToken={sessionToken}
        familyId={currentFamily._id}
      />

      <ConfirmModal
        isOpen={tokenToRevoke !== null}
        onClose={() => setTokenToRevoke(null)}
        onConfirm={() => void handleRevoke()}
        title="Revocar llave"
        message="Los clientes que usen esta llave perderán acceso de inmediato. Esta acción no se puede deshacer."
        confirmText="Revocar"
        variant="danger"
        icon="warning"
      />
    </div>
  );
}
