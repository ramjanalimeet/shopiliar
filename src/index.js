// Shopiliar Worker: serves the static site from public/ and the account API.
// Accounts, sessions and each user's store dashboard live in D1 (see schema.sql).
const SESSION_COOKIE = "shopiliar_session";
const REMEMBER_DAYS = 30;
const SESSION_HOURS = 24; // "Remember me" unticked
const PBKDF2_ITERATIONS = 100000; // the maximum Workers allows
const MAX_STORE_BYTES = 1_000_000;
const PLANS = ["starter", "business", "pro"];
const SLUG = /^[a-z0-9-]{1,60}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try {
        return await api(request, env, url);
      } catch (err) {
        console.error(err);
        return json({ error: "Something went wrong. Please try again." }, 500);
      }
    }
    // The store dashboard needs a signed-in user
    if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
      if (!(await currentUser(request, env))) {
        const next = encodeURIComponent(url.pathname + url.search);
        return Response.redirect(new URL("/signin.html?next=" + next, url), 302);
      }
      const asset = await env.ASSETS.fetch(request);
      const res = new Response(asset.body, asset);
      res.headers.set("Cache-Control", "no-store");
      return res;
    }
    return env.ASSETS.fetch(request);
  },
};

async function api(request, env, url) {
  const route = request.method + " " + url.pathname;
  if (request.method !== "GET") {
    // Cookies are SameSite=Lax; also refuse cross-site writes outright
    if (request.headers.get("Origin") !== url.origin) return json({ error: "Bad origin." }, 403);
    if (!(request.headers.get("Content-Type") || "").includes("application/json")) return json({ error: "Expected JSON." }, 415);
  }
  if ((route === "POST /api/signup" || route === "POST /api/signin") && env.AUTH_LIMITER) {
    const { success } = await env.AUTH_LIMITER.limit({ key: request.headers.get("CF-Connecting-IP") || "unknown" });
    if (!success) return json({ error: "Too many attempts. Please wait a minute and try again." }, 429);
  }

  switch (route) {
    case "POST /api/signup": return signup(request, env);
    case "POST /api/signin": return signin(request, env);
    case "POST /api/signout": return signout(request, env);
    case "GET /api/me": return me(request, env);
    case "PUT /api/store": return saveStore(request, env);
    default: return json({ error: "Not found." }, 404);
  }
}

async function signup(request, env) {
  const body = await readJson(request);
  const name = clean(body.name, 80);
  const email = clean(body.email, 254).toLowerCase();
  const password = String(body.password || "");
  if (!name) return json({ error: "Please enter your name." }, 400);
  if (!EMAIL.test(email)) return json({ error: "Please enter a valid email." }, 400);
  if (password.length < 8 || password.length > 200) return json({ error: "Password must be at least 8 characters." }, 400);

  const exists = await env.DB.prepare("SELECT 1 FROM users WHERE email = ?").bind(email).first();
  if (exists) return json({ error: "An account with this email already exists. Please sign in." }, 409);

  const salt = randomBytes(16);
  const user = {
    id: crypto.randomUUID(),
    email,
    name,
    business: clean(body.business, 80) || name + "'s Store",
    plan: PLANS.includes(body.plan) ? body.plan : "starter",
    billing: body.billing === "yearly" ? "yearly" : "monthly",
    template: SLUG.test(body.template || "") ? body.template : "luxe-store",
    created_at: new Date().toISOString(),
  };
  try {
    await env.DB.prepare(
      "INSERT INTO users (id, email, name, business, password_hash, password_salt, plan, billing, template, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(user.id, user.email, user.name, user.business, await hashPassword(password, salt), b64(salt), user.plan, user.billing, user.template, user.created_at).run();
  } catch (err) {
    // Lost a race with another sign-up for the same email
    if (String(err).includes("UNIQUE")) return json({ error: "An account with this email already exists. Please sign in." }, 409);
    throw err;
  }
  return withSession(env, user.id, body.remember !== false, json({ account: publicAccount(user) }, 201));
}

async function signin(request, env) {
  const body = await readJson(request);
  const email = clean(body.email, 254).toLowerCase();
  const password = String(body.password || "").slice(0, 200);
  const row = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  // Hash even when the email is unknown so response time doesn't reveal which emails exist
  const salt = row ? unb64(row.password_salt) : new Uint8Array(16);
  const hash = await hashPassword(password, salt);
  if (!row || !safeEqual(hash, row.password_hash)) return json({ error: "Wrong email or password." }, 401);

  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND expires_at < ?").bind(row.id, Date.now()).run();
  return withSession(env, row.id, body.remember === true, json({ account: publicAccount(row) }));
}

async function signout(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  const res = json({ ok: true });
  res.headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return res;
}

async function me(request, env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401);
  const store = await env.DB.prepare("SELECT data FROM stores WHERE user_id = ?").bind(user.id).first();
  return json({ account: publicAccount(user), store: store ? JSON.parse(store.data) : null });
}

async function saveStore(request, env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401);
  const text = await request.text();
  if (text.length > MAX_STORE_BYTES) return json({ error: "Your store data is too large to save." }, 413);
  let body;
  try { body = JSON.parse(text); } catch { return json({ error: "Expected JSON." }, 400); }
  if (!body || typeof body.store !== "object" || Array.isArray(body.store)) return json({ error: "Missing store." }, 400);

  const a = body.account || {};
  const next = {
    name: clean(a.name, 80) || user.name,
    business: clean(a.business, 80) || user.business,
    email: clean(a.email, 254).toLowerCase() || user.email,
    plan: PLANS.includes(a.plan) ? a.plan : user.plan,
    billing: a.billing === "yearly" || a.billing === "monthly" ? a.billing : user.billing,
    template: SLUG.test(a.template || "") ? a.template : user.template,
  };
  if (!EMAIL.test(next.email)) return json({ error: "Please enter a valid email." }, 400);
  if (next.email !== user.email) {
    const taken = await env.DB.prepare("SELECT 1 FROM users WHERE email = ? AND id != ?").bind(next.email, user.id).first();
    if (taken) return json({ error: "That email is already used by another account." }, 409);
  }

  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET name = ?, business = ?, email = ?, plan = ?, billing = ?, template = ? WHERE id = ?")
      .bind(next.name, next.business, next.email, next.plan, next.billing, next.template, user.id),
    env.DB.prepare("INSERT INTO stores (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at")
      .bind(user.id, JSON.stringify(body.store), now),
  ]);
  return json({ account: publicAccount({ ...user, ...next }), savedAt: now });
}

// ---------- Sessions ----------
async function currentUser(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;
  return env.DB.prepare(
    "SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?"
  ).bind(await sha256(token), Date.now()).first();
}

async function withSession(env, userId, remember, res) {
  const token = b64(randomBytes(32));
  const ttl = remember ? REMEMBER_DAYS * 864e5 : SESSION_HOURS * 36e5;
  await env.DB.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(await sha256(token), userId, Date.now() + ttl).run();
  // Without "remember me" the cookie ends with the browser session
  const maxAge = remember ? `; Max-Age=${ttl / 1000}` : "";
  res.headers.append("Set-Cookie", `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax${maxAge}`);
  return res;
}

const publicAccount = (u) => ({
  name: u.name, business: u.business, email: u.email, plan: u.plan, billing: u.billing, template: u.template, createdAt: u.created_at,
});

// ---------- Helpers ----------
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});
const readJson = async (request) => { try { return (await request.json()) || {}; } catch { return {}; } };
const clean = (v, max) => String(v ?? "").trim().slice(0, max);

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

const randomBytes = (n) => crypto.getRandomValues(new Uint8Array(n));
const b64 = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const sha256 = async (text) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));

async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS }, key, 256));
}

function safeEqual(a, b) {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  return x.length === y.length && crypto.subtle.timingSafeEqual(x, y);
}
