import { currentUser, SESSION_COOKIE } from "@/lib/auth";
import { b64, hashPassword, randomBytes, safeEqual, sha256, unb64 } from "@/lib/crypto";
import { api, getCookie, json, readJson } from "@/lib/http";

export const POST = api(async (request, env) => {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401);
  const body = await readJson(request);
  const password = String(body.password || "");
  if (password.length < 8 || password.length > 200) return json({ error: "Password must be at least 8 characters." }, 400);
  // Accounts made with Google have no password yet and can set one without the current one
  if (user.password_hash) {
    const hash = await hashPassword(String(body.current || "").slice(0, 200), unb64(user.password_salt));
    if (!safeEqual(hash, user.password_hash)) return json({ error: "Your current password is wrong." }, 400);
  }
  const salt = randomBytes(16);
  const keep = await sha256(getCookie(request, SESSION_COOKIE) || "");
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?").bind(await hashPassword(password, salt), b64(salt), user.id),
    // Sign out every other device
    env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash != ?").bind(user.id, keep),
  ]);
  return json({ ok: true });
}, { limit: true });
