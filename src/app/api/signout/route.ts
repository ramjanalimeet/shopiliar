import { clearSessionCookie, SESSION_COOKIE } from "@/lib/auth";
import { sha256 } from "@/lib/crypto";
import { api, getCookie, json } from "@/lib/http";

export const POST = api(async (request, env) => {
  const token = getCookie(request, SESSION_COOKIE);
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  return clearSessionCookie(json({ ok: true }));
});
