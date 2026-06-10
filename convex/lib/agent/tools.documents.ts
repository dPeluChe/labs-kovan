import { api } from "../../_generated/api";
import type { ToolDefinition, ToolContext } from "./tools.types";

type DocumentType =
    | "identity"
    | "travel"
    | "financial"
    | "insurance"
    | "education"
    | "health"
    | "other";

const TYPE_LABEL: Record<DocumentType, string> = {
    identity: "identidad",
    travel: "viaje",
    financial: "financiero",
    insurance: "seguro",
    education: "educación",
    health: "salud",
    other: "otro",
};

const DEFAULT_WINDOW_DAYS = 90;
const DAY_MS = 1000 * 60 * 60 * 24;

export const getExpiringDocumentsTool: ToolDefinition = {
    name: "getExpiringDocuments",
    description: "Consultar qué documentos de la familia están vencidos o por vencer (pasaportes, visas, seguros, identificaciones). Devuelve SOLO metadata (título, tipo, fecha de vencimiento, persona); nunca el contenido del documento.",
    parameters: {
        type: "object" as const,
        properties: {
            withinDays: {
                type: "number" as const,
                description: `Ventana de días hacia adelante a revisar (default ${DEFAULT_WINDOW_DAYS})`
            }
        },
        required: []
    }
};

export async function handleGetExpiringDocuments(context: ToolContext, args: Record<string, unknown>) {
    const { withinDays } = args as { withinDays?: number };
    const windowDays = typeof withinDays === "number" && Number.isFinite(withinDays) && withinDays > 0
        ? withinDays
        : DEFAULT_WINDOW_DAYS;

    const base = {
        sessionToken: context.sessionToken,
        familyId: context.familyId,
    };

    const [documents, profiles] = await Promise.all([
        context.ctx.runQuery(api.documents.list, base),
        context.ctx.runQuery(api.health.getPersonProfiles, base),
    ]);

    const personName = new Map(profiles.map((p) => [p._id, p.name]));
    const now = Date.now();
    const cutoff = now + windowDays * DAY_MS;

    // Solo metadata: nunca exponer files/storageIds ni números de documento.
    const expiring = documents
        .filter((doc) => !doc.isArchived && doc.expiryDate !== undefined && doc.expiryDate <= cutoff)
        .sort((a, b) => (a.expiryDate ?? 0) - (b.expiryDate ?? 0));

    if (expiring.length === 0) {
        return {
            success: true,
            message: `Ningún documento vence en los próximos ${windowDays} días. 🎉`
        };
    }

    const lines = expiring.map((doc) => {
        const expiry = doc.expiryDate as number;
        const date = new Date(expiry).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
        const daysLeft = Math.ceil((expiry - now) / DAY_MS);
        const status = daysLeft < 0 ? `VENCIDO hace ${Math.abs(daysLeft)} días ⚠️` : `vence ${date} (${daysLeft} días)`;
        const person = doc.personId ? personName.get(doc.personId) : undefined;
        const owner = person ? ` — ${person}` : "";
        return `- ${doc.title} (${TYPE_LABEL[doc.type as DocumentType] ?? doc.type})${owner}: ${status}`;
    });

    return {
        success: true,
        message: `Documentos vencidos o por vencer en ${windowDays} días (${expiring.length}):\n${lines.join("\n")}`
    };
}
