import { cookies } from "next/headers";
import { b64, hashPassword, randomBytes, sha256, unb64 } from "./crypto";
import { getCookie } from "./http";
import { CATEGORY, currentPlan } from "./plans";

export const SESSION_COOKIE = "shopiliar_session";
export const REMEMBER_DAYS = 30;
export const SESSION_HOURS = 24; // "Remember me" unticked

export type UserRow = {
  id: string;
  email: string;
  name: string;
  business: string;
  password_hash: string;
  password_salt: string;
  category: string;
  plan: string;
  billing: string;
  template: string;
  created_at: string;
};

/** The signed-in user for a session token, or null. */
export async function userForToken(token: string | null | undefined, env: CloudflareEnv) {
  if (!token) return null;
  return env.DB.prepare(
    "SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?"
  ).bind(await sha256(token), Date.now()).first<UserRow>();
}

/** The signed-in user behind an API request. */
export const currentUser = (request: Request, env: CloudflareEnv) => userForToken(getCookie(request, SESSION_COOKIE), env);

/** The signed-in user while rendering a page (server components). */
export async function currentUserFromCookies(env: CloudflareEnv) {
  const jar = await cookies();
  return userForToken(jar.get(SESSION_COOKIE)?.value, env);
}

/** Starts a session for the user and sets its cookie on the response. */
export async function withSession(env: CloudflareEnv, userId: string, remember: boolean, res: Response) {
  const token = b64(randomBytes(32));
  const ttl = remember ? REMEMBER_DAYS * 864e5 : SESSION_HOURS * 36e5;
  await env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(await sha256(token), userId, Date.now() + ttl).run();
  // Without "remember me" the cookie ends with the browser session
  const maxAge = remember ? `; Max-Age=${ttl / 1000}` : "";
  res.headers.append("Set-Cookie", `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax${maxAge}`);
  return res;
}

export const clearSessionCookie = (res: Response) => {
  res.headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return res;
};

export const publicAccount = (u: Omit<UserRow, "id" | "password_salt"> & { password_hash?: string }) => ({
  name: u.name, business: u.business, email: u.email, category: CATEGORY, plan: currentPlan(u.plan), billing: u.billing, template: u.template, createdAt: u.created_at,
  hasPassword: !!u.password_hash,
});

export const verifyPassword = async (password: string, row: Pick<UserRow, "password_hash" | "password_salt">) =>
  hashPassword(password, unb64(row.password_salt));
