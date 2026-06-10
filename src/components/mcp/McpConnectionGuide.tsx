import { useState } from "react";
import { Copy, Check, TerminalSquare, MonitorSmartphone, Globe } from "lucide-react";
import { SectionTitle } from "../ui/SectionTitle";
import { useToast } from "../ui/Toast";

/**
 * El endpoint MCP vive en el deployment de Convex bajo el dominio *.convex.site
 * (las HTTP actions no usan *.convex.cloud). Si la app está detrás de un dominio
 * propio con rewrite hacia Convex, ese dominio es el que se comparte.
 */
function getMcpEndpoint(): string {
  const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
  if (!convexUrl) return "https://<tu-deployment>.convex.site/mcp";
  return `${convexUrl.replace(".convex.cloud", ".convex.site")}/mcp`;
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  const { success } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      success("Copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // El usuario puede seleccionar y copiar manualmente
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-subtle">{label}</span>
        <button
          onClick={() => void handleCopy()}
          className="btn btn-ghost btn-xs gap-1"
          aria-label={`Copiar ${label}`}
        >
          {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
          Copiar
        </button>
      </div>
      <pre className="p-3 rounded-lg bg-base-200 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
    </div>
  );
}

export function McpConnectionGuide() {
  const endpoint = getMcpEndpoint();

  const claudeCodeCommand = `claude mcp add --transport http kovan ${endpoint} --header "Authorization: Bearer TU_LLAVE"`;

  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        kovan: {
          command: "npx",
          args: ["-y", "mcp-remote", endpoint, "--header", "Authorization: Bearer TU_LLAVE"],
        },
      },
    },
    null,
    2
  );

  return (
    <div className="space-y-4">
      <SectionTitle icon={<Globe className="w-4 h-4" />}>Cómo conectarte</SectionTitle>

      <div className="surface-card p-4 space-y-4">
        <p className="text-sm text-muted">
          Genera una llave arriba y úsala como <span className="font-mono">Bearer</span> en el header{" "}
          <span className="font-mono">Authorization</span>. Reemplaza{" "}
          <span className="font-mono">TU_LLAVE</span> en los ejemplos.
        </p>

        <CodeBlock label="Endpoint MCP (Streamable HTTP)" code={endpoint} />

        <div className="flex items-center gap-2 text-sm font-medium text-body">
          <TerminalSquare className="w-4 h-4" />
          Claude Code
        </div>
        <CodeBlock label="Comando" code={claudeCodeCommand} />

        <div className="flex items-center gap-2 text-sm font-medium text-body">
          <MonitorSmartphone className="w-4 h-4" />
          Claude Desktop (claude_desktop_config.json)
        </div>
        <CodeBlock label="Configuración" code={claudeDesktopConfig} />

        <p className="text-xs text-subtle">
          Cada llave da acceso a los datos de la familia con la que fue creada. Si una llave se
          filtra, revócala aquí y genera una nueva.
        </p>
      </div>
    </div>
  );
}
