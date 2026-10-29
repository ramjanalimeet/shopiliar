export const GOOGLE_STATE_COOKIE = "shopiliar_google";
export const googleRedirectUri = (url: URL) => url.origin + "/api/auth/google/callback";
// Only send people back to pages inside their dashboard
export const nextPath = (v: string | null | undefined) => (/^\/admin(\/|$)/.test(v || "") ? (v as string) : "/admin");
