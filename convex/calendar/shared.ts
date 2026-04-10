import { api } from "../_generated/api";

async function assertActionFamilyAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  sessionToken: string,
  familyId: string
) {
  const families = await ctx.runQuery(api.families.getUserFamilies, { sessionToken });
  const hasAccess = (families as Array<{ _id: string }>).some((f) => f._id === familyId);
  if (!hasAccess) {
    throw new Error("No tienes acceso a esta familia");
  }
}

async function refreshAccessToken(refreshToken: string) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Missing Google OAuth Credentials");
  }
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Token refresh failed: ${err.error_description || err.error}`);
  }
  return await response.json();
}

export { assertActionFamilyAccess, refreshAccessToken };
