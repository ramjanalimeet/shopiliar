import { publicAccount, UserRow, withSession } from "@/lib/auth";
import { hashPassword, safeEqual, unb64 } from "@/lib/crypto";
import { api, clean, json, readJson } from "@/lib/http";

export const POST = api(async (request, env) => {
  const body = await readJson(request);
  const email = clean(body.email, 254).toLowerCase();
  const password = String(body.password || "").slice(0, 200);
  const row = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<UserRow>();
  // Hash even when the email is unknown so response time doesn't reveal which emails exist
  const salt = row?.password_salt ? unb64(row.password_salt) : new Uint8Array(16);
  const hash = await hashPassword(password, salt);
  if (row && !row.password_hash) return json({ error: "This account signs in with Google. Use Continue with Google." }, 401);
  if (!row || !safeEqual(hash, row.password_hash)) return json({ error: "Wrong email or password." }, 401);

  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND expires_at < ?").bind(row.id, Date.now()).run();
  return withSession(env, row.id, body.remember === true, json({ account: publicAccount(row) }));
}, { limit: true });
