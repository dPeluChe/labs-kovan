import { v } from "convex/values";
import { action } from "../../_generated/server";

export const getGoogleAuthUrl = action({
  args: { redirectUri: v.string() },
  handler: async (_ctx, args) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new Error("Google Client ID not configured on server");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: args.redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/calendar",
      access_type: "offline",
      prompt: "consent",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },
});

export const exchangeGoogleAuthCode = action({
  args: { code: v.string(), redirectUri: v.string() },
  handler: async (_ctx, args) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error("Missing Google OAuth Credentials in Convex Env Variables");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: args.code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: args.redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Google Token Error:", tokens);
      throw new Error(`Failed to exchange code: ${tokens.error_description || tokens.error}`);
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      scope: tokens.scope,
    };
  },
});
