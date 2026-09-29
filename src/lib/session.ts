// El sessionToken vive solo en memoria (nunca en web storage). La
// persistencia entre recargas usa una cookie HttpOnly en el dominio
// *.convex.site, servida por los endpoints /auth/session de convex/http.ts.
// Navegadores que bloquean cookies de terceros degradan a sesión por pestaña.
function sessionEndpoint(): string | null {
  const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
  if (!convexUrl) return null;
  return `${convexUrl.replace(".convex.cloud", ".convex.site")}/auth/session`;
}

export async function restoreSession(): Promise<string | null> {
  const endpoint = sessionEndpoint();
  if (!endpoint) return null;
  const response = await fetch(endpoint, { credentials: "include" });
  if (!response.ok) return null;
  const body = (await response.json()) as { sessionToken?: unknown };
  return typeof body.sessionToken === "string" ? body.sessionToken : null;
}

export async function persistSession(sessionToken: string): Promise<void> {
  const endpoint = sessionEndpoint();
  if (!endpoint) return;
  await fetch(endpoint, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionToken }),
  });
}

export async function clearPersistedSession(): Promise<void> {
  const endpoint = sessionEndpoint();
  if (!endpoint) return;
  await fetch(endpoint, { method: "DELETE", credentials: "include" });
}
