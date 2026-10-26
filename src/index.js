// Shopilier Worker: serves the static site from public/ and the account API.
// Accounts, sessions and each user's store dashboard live in D1 (see schema.sql).
const SESSION_COOKIE = "shopiliar_session";
const REMEMBER_DAYS = 30;
const SESSION_HOURS = 24; // "Remember me" unticked
const PBKDF2_ITERATIONS = 100000; // the maximum Workers allows
const MAX_STORE_BYTES = 1_000_000;
const PLANS = ["starter", "business", "pro"];
// Every account is an e-commerce store (the users.category column is kept as "ecommerce")
const CATEGORY = "ecommerce";
// Starting template when none was picked
const DEFAULT_TEMPLATE = "luxe-store";
const SLUG = /^[a-z0-9-]{1,60}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GOOGLE_STATE_COOKIE = "shopiliar_google";
// Images uploaded in the website editor (stored in D1, served from /media/<id>)
const MEDIA_TYPES = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif" };
const MAX_IMAGE_BYTES = 1_500_000;
const MAX_IMAGES_PER_USER = 300;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/master-admin/api/")) {
      try {
        return url.pathname.startsWith("/api/") ? await api(request, env, url) : await adminApi(request, env, url);
      } catch (err) {
        console.error(err);
        return json({ error: "Something went wrong. Please try again." }, 500);
      }
    }
    if (url.pathname.startsWith("/media/") && request.method === "GET") return media(env, url);
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
    // Image uploads send the image itself; everything else is JSON
    if (route !== "POST /api/upload" && !(request.headers.get("Content-Type") || "").includes("application/json")) return json({ error: "Expected JSON." }, 415);
  }
  if ((route === "POST /api/signup" || route === "POST /api/signin" || route === "POST /api/password" || route === "POST /api/ai/site" || route.startsWith("POST /api/messages")) && env.AUTH_LIMITER) {
    const { success } = await env.AUTH_LIMITER.limit({ key: request.headers.get("CF-Connecting-IP") || "unknown" });
    if (!success) return json({ error: "Too many attempts. Please wait a minute and try again." }, 429);
  }

  // Support messages: /api/messages and /api/messages/<id>
  const msg = /^\/api\/messages(?:\/([\w-]{1,64}))?$/.exec(url.pathname);
  if (msg) return userMessages(request, env, msg[1]);

  switch (route) {
    case "POST /api/signup": return signup(request, env);
    case "POST /api/signin": return signin(request, env);
    case "POST /api/signout": return signout(request, env);
    case "GET /api/me": return me(request, env);
    case "GET /api/auth/google": return googleStart(env, url);
    case "GET /api/auth/google/callback": return googleCallback(request, env, url);
    case "PUT /api/store": return saveStore(request, env);
    case "POST /api/password": return changePassword(request, env);
    case "POST /api/ai/site": return aiSite(request, env);
    case "POST /api/upload": return uploadImage(request, env);
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
    category: CATEGORY,
    plan: PLANS.includes(body.plan) ? body.plan : "starter",
    billing: body.billing === "yearly" ? "yearly" : "monthly",
    template: SLUG.test(body.template || "") ? body.template : DEFAULT_TEMPLATE,
    created_at: new Date().toISOString(),
  };
  try {
    await env.DB.prepare(
      "INSERT INTO users (id, email, name, business, password_hash, password_salt, category, plan, billing, template, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(user.id, user.email, user.name, user.business, await hashPassword(password, salt), b64(salt), user.category, user.plan, user.billing, user.template, user.created_at).run();
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
  if (row && !row.password_hash) return json({ error: "This account signs in with Google. Use Continue with Google." }, 401);
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
    category: CATEGORY,
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
    env.DB.prepare("UPDATE users SET name = ?, business = ?, email = ?, category = ?, plan = ?, billing = ?, template = ? WHERE id = ?")
      .bind(next.name, next.business, next.email, next.category, next.plan, next.billing, next.template, user.id),
    env.DB.prepare("INSERT INTO stores (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at")
      .bind(user.id, JSON.stringify(body.store), now),
  ]);
  return json({ account: publicAccount({ ...user, ...next }), savedAt: now });
}

async function changePassword(request, env) {
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
  const keep = await sha256(getCookie(request, SESSION_COOKIE));
  await env.DB.batch([
    env.DB.prepare("UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?").bind(await hashPassword(password, salt), b64(salt), user.id),
    // Sign out every other device
    env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash != ?").bind(user.id, keep),
  ]);
  return json({ ok: true });
}

// ---------- Support messages ----------
// Users talk to the Shopilier team from their dashboard; the master panel answers.
const MESSAGE_KINDS = ["question", "complaint", "billing", "website"];
const MAX_MESSAGE = 2000;

async function userMessages(request, env, id) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401);
  const now = new Date().toISOString();
  if (!id && request.method === "GET") {
    const { results } = await env.DB.prepare(
      `SELECT c.*, (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last
       FROM conversations c WHERE c.user_id = ? ORDER BY c.updated_at DESC LIMIT 100`
    ).bind(user.id).all();
    return json({ conversations: results.map(publicConversation) });
  }
  if (!id && request.method === "POST") {
    const body = await readJson(request);
    const subject = clean(body.subject, 120), text = clean(body.body, MAX_MESSAGE);
    if (!subject || !text) return json({ error: "Please add a subject and a message." }, 400);
    const cid = crypto.randomUUID();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO conversations (id, user_id, subject, kind, status, admin_unread, user_unread, created_at, updated_at) VALUES (?, ?, ?, ?, 'open', 1, 0, ?, ?)")
        .bind(cid, user.id, subject, MESSAGE_KINDS.includes(body.kind) ? body.kind : "question", now, now),
      env.DB.prepare("INSERT INTO messages (id, conversation_id, sender, body, created_at) VALUES (?, ?, 'user', ?, ?)").bind(crypto.randomUUID(), cid, text, now),
    ]);
    return json({ id: cid }, 201);
  }
  const conv = id && await env.DB.prepare("SELECT * FROM conversations WHERE id = ? AND user_id = ?").bind(id, user.id).first();
  if (!conv) return json({ error: "Conversation not found." }, 404);
  if (request.method === "GET") {
    await env.DB.prepare("UPDATE conversations SET user_unread = 0 WHERE id = ?").bind(id).run();
    return json(await thread(env, { ...conv, user_unread: 0 }));
  }
  if (request.method === "POST") {
    const text = clean((await readJson(request)).body, MAX_MESSAGE);
    if (!text) return json({ error: "Write a message first." }, 400);
    // A new message reopens a resolved conversation
    await env.DB.batch([
      env.DB.prepare("INSERT INTO messages (id, conversation_id, sender, body, created_at) VALUES (?, ?, 'user', ?, ?)").bind(crypto.randomUUID(), id, text, now),
      env.DB.prepare("UPDATE conversations SET status = 'open', admin_unread = 1, updated_at = ? WHERE id = ?").bind(now, id),
    ]);
    return json(await thread(env, { ...conv, status: "open", updated_at: now }));
  }
  return json({ error: "Not found." }, 404);
}

async function thread(env, conv) {
  const { results } = await env.DB.prepare("SELECT sender, body, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at").bind(conv.id).all();
  return { conversation: publicConversation(conv), messages: results.map((m) => ({ from: m.sender, body: m.body, at: m.created_at })) };
}

const publicConversation = (c) => ({
  id: c.id, subject: c.subject, kind: c.kind, status: c.status, last: c.last ?? undefined,
  unread: !!c.user_unread, adminUnread: !!c.admin_unread, createdAt: c.created_at, updatedAt: c.updated_at,
  user: c.user_email ? { name: c.user_name, email: c.user_email, business: c.user_business, category: c.user_category, plan: c.user_plan, billing: c.user_billing, joined: c.user_joined } : undefined,
});

// ---------- Master admin API (/master-admin/api/*) ----------
// Cloudflare Access guards /master-admin; the Worker also checks Access's signed
// token so these routes can never be reached without your Access login.
async function adminApi(request, env, url) {
  const admin = await accessEmail(request, env);
  if (!admin) return json({ error: "Not allowed." }, 403);
  if (request.method !== "GET") {
    if (request.headers.get("Origin") !== url.origin) return json({ error: "Bad origin." }, 403);
    if (!(request.headers.get("Content-Type") || "").includes("application/json")) return json({ error: "Expected JSON." }, 415);
  }
  const now = new Date().toISOString();
  const path = url.pathname.slice("/master-admin/api".length);
  const USER_COLS = "u.name AS user_name, u.email AS user_email, u.business AS user_business, u.category AS user_category, u.plan AS user_plan, u.billing AS user_billing, u.created_at AS user_joined";

  if (path === "/conversations" && request.method === "GET") {
    const { results } = await env.DB.prepare(
      `SELECT c.*, ${USER_COLS}, (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last,
         (SELECT sender FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_from
       FROM conversations c JOIN users u ON u.id = c.user_id ORDER BY c.updated_at DESC LIMIT 300`
    ).all();
    return json({ conversations: results.map((c) => ({ ...publicConversation(c), lastFrom: c.last_from })) });
  }
  if (path === "/conversations" && request.method === "POST") {
    // Start a conversation with a user
    const body = await readJson(request);
    const subject = clean(body.subject, 120), text = clean(body.body, MAX_MESSAGE);
    const user = await env.DB.prepare("SELECT id FROM users WHERE id = ?").bind(String(body.userId || "")).first();
    if (!user) return json({ error: "Pick a user." }, 400);
    if (!subject || !text) return json({ error: "Please add a subject and a message." }, 400);
    const cid = crypto.randomUUID();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO conversations (id, user_id, subject, kind, status, admin_unread, user_unread, created_at, updated_at) VALUES (?, ?, ?, 'question', 'open', 0, 1, ?, ?)").bind(cid, user.id, subject, now, now),
      env.DB.prepare("INSERT INTO messages (id, conversation_id, sender, body, created_at) VALUES (?, ?, 'admin', ?, ?)").bind(crypto.randomUUID(), cid, text, now),
    ]);
    return json({ id: cid }, 201);
  }
  if (path === "/users" && request.method === "GET") {
    const { results } = await env.DB.prepare("SELECT id, name, email, business, category, plan, billing, created_at FROM users ORDER BY created_at DESC LIMIT 500").all();
    return json({ users: results.map((u) => ({ id: u.id, name: u.name, email: u.email, business: u.business, category: u.category, plan: u.plan, billing: u.billing, joined: u.created_at })) });
  }
  const m = /^\/conversations\/([\w-]{1,64})(\/status)?$/.exec(path);
  if (m) {
    const conv = await env.DB.prepare(`SELECT c.*, ${USER_COLS} FROM conversations c JOIN users u ON u.id = c.user_id WHERE c.id = ?`).bind(m[1]).first();
    if (!conv) return json({ error: "Conversation not found." }, 404);
    if (!m[2] && request.method === "GET") {
      await env.DB.prepare("UPDATE conversations SET admin_unread = 0 WHERE id = ?").bind(conv.id).run();
      return json(await thread(env, { ...conv, admin_unread: 0 }));
    }
    if (!m[2] && request.method === "POST") {
      const text = clean((await readJson(request)).body, MAX_MESSAGE);
      if (!text) return json({ error: "Write a reply first." }, 400);
      await env.DB.batch([
        env.DB.prepare("INSERT INTO messages (id, conversation_id, sender, body, created_at) VALUES (?, ?, 'admin', ?, ?)").bind(crypto.randomUUID(), conv.id, text, now),
        env.DB.prepare("UPDATE conversations SET user_unread = 1, admin_unread = 0, updated_at = ? WHERE id = ?").bind(now, conv.id),
      ]);
      return json(await thread(env, { ...conv, admin_unread: 0, updated_at: now }));
    }
    if (m[2] && request.method === "POST") {
      const status = (await readJson(request)).status === "closed" ? "closed" : "open";
      await env.DB.prepare("UPDATE conversations SET status = ? WHERE id = ?").bind(status, conv.id).run();
      return json(await thread(env, { ...conv, status }));
    }
  }
  return json({ error: "Not found." }, 404);
}

// Verifies the Cf-Access-Jwt-Assertion token Cloudflare Access adds to requests it let through.
let accessKeys = null;
async function accessEmail(request, env) {
  if (env.ACCESS_DEV_BYPASS === "1") return "dev@localhost"; // local `wrangler dev` only; never set in production
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return null;
  try {
    const [h, p, sig] = token.split(".");
    const header = JSON.parse(new TextDecoder().decode(unb64(h)));
    const claims = JSON.parse(new TextDecoder().decode(unb64(p)));
    const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!aud.includes(env.ACCESS_AUD) || claims.iss !== `https://${env.ACCESS_TEAM_DOMAIN}` || claims.exp * 1000 < Date.now()) return null;
    if (!accessKeys || Date.now() - accessKeys.at > 36e5 || !accessKeys.keys.some((k) => k.kid === header.kid)) {
      const res = await fetch(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`);
      accessKeys = { at: Date.now(), keys: (await res.json()).keys || [] };
    }
    const jwk = accessKeys.keys.find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey("jwk", { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256" }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, unb64(sig), new TextEncoder().encode(h + "." + p));
    return ok ? claims.email || "admin" : null;
  } catch (err) {
    console.error("Access token check failed", err);
    return null;
  }
}

// ---------- Create with AI ----------
// Writes the first version of a website (template, headline, text) from a short
// description, using Workers AI when the AI binding is available and simple
// rules otherwise, so sign-up never gets stuck.
// Tried in order; Cloudflare retires models over time (plain llama-3.1-8b-instruct went in May 2026)
const AI_MODELS = ["@cf/meta/llama-3.1-8b-instruct-fast", "@cf/zai-org/glm-4.7-flash"];
const TEMPLATE_IDS = ["luxe-store", "saas-landing", "launchly-landing", "bistro-restaurant", "growify-agency", "fixly-services", "nova-portfolio", "writely-blog", "mia-personal"];

async function aiSite(request, env) {
  const body = await readJson(request);
  const name = clean(body.name, 60);
  const about = clean(body.about, 500);
  const city = clean(body.city, 40) || "Bangladesh";
  if (!name || about.length < 10) return json({ error: "Tell us your business name and a sentence about what you do." }, 400);

  const basic = basicSite(name, about);
  // "fallback" says why the simple version was used (not shown to users; helps when checking the setup)
  if (!env.AI) return json({ ...basic, source: "basic", fallback: "no-ai-binding" });
  const messages = [
    { role: "system", content: "You write short, friendly website copy for small businesses in Bangladesh. Reply with one JSON object only, no other text." },
    { role: "user", content: `Business name: ${name}\nCity: ${city}\nType: online shop\nWhat they do: ${about}\n\n` +
      `Return JSON with keys: "template" (one of ${TEMPLATE_IDS.map((t) => `"${t}"`).join(", ")} - pick the closest style), "headline" (max 50 characters), "sub" (one sentence, max 100 characters), "cta" (button text, max 18 characters), "about" (2 sentences for an About section, max 260 characters).` },
  ];
  let lastError = "";
  for (const model of AI_MODELS) {
    try {
      const out = await env.AI.run(model, { max_tokens: 600, messages });
      // Text models return { response: "…" }, OpenAI-style ones { choices: [{ message }] }, some the object itself
      const raw = out?.response ?? out?.choices?.[0]?.message?.content ?? out;
      if (raw && typeof raw === "object" && raw.headline) return json(aiResult(raw, basic));
      const text = String(raw ?? "");
      try {
        return json(aiResult(JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)), basic));
      } catch {
        console.error("AI site: reply wasn't JSON", model, text.slice(0, 300));
        lastError = "ai-reply-not-json";
      }
    } catch (err) {
      console.error("AI site failed", model, err);
      lastError = "ai-error: " + String(err?.message || err).slice(0, 120);
    }
  }
  return json({ ...basic, source: "basic", fallback: lastError });
}

function aiResult(parsed, basic) {
  const pick = (v, max, fallback) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : fallback);
  return {
    template: TEMPLATE_IDS.includes(parsed.template) ? parsed.template : basic.template,
    headline: pick(parsed.headline, 60, basic.headline),
    sub: pick(parsed.sub, 120, basic.sub),
    cta: pick(parsed.cta, 20, basic.cta),
    about: pick(parsed.about, 300, basic.about),
    source: "ai",
  };
}

function basicSite(name, about) {
  const has = (...words) => words.some((w) => about.toLowerCase().includes(w));
  const template = has("software", "app", "saas", "tech") ? "saas-landing" : has("launch", "pre-order", "preorder") ? "launchly-landing"
    : has("restaurant", "cafe", "café", "food", "bakery", "coffee") ? "bistro-restaurant" : "luxe-store";
  const first = about.split(/(?<=[.!?])\s/)[0].slice(0, 110);
  return {
    template,
    headline: `Shop ${name} online`.slice(0, 60),
    sub: first,
    cta: "Shop Now",
    about: `${name} — ${about}`.slice(0, 300),
  };
}

// ---------- Google sign-in (OAuth 2.0 / OpenID Connect) ----------
// Needs the GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET secrets, and
// <site>/api/auth/google/callback listed as a redirect URI in Google Cloud.
const googleRedirectUri = (url) => url.origin + "/api/auth/google/callback";
const nextPath = (v) => (/^\/admin(\/|$)/.test(v || "") ? v : "/admin/");

async function googleStart(env, url) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return redirect(url, "/signin.html?error=google_off");
  const state = b64(randomBytes(24));
  // Remember what was picked on the Templates / Pricing pages for a new account
  const pick = {
    state,
    next: nextPath(url.searchParams.get("next")),
    plan: url.searchParams.get("plan"),
    billing: url.searchParams.get("billing"),
    template: url.searchParams.get("template"),
  };
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: googleRedirectUri(url),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  const res = redirect(url, auth.href);
  res.headers.append("Set-Cookie", `${GOOGLE_STATE_COOKIE}=${b64(new TextEncoder().encode(JSON.stringify(pick)))}; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  return res;
}

async function googleCallback(request, env, url) {
  const fail = (code) => {
    const res = redirect(url, "/signin.html?error=" + code);
    res.headers.append("Set-Cookie", `${GOOGLE_STATE_COOKIE}=; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    return res;
  };
  let pick = null;
  try { pick = JSON.parse(new TextDecoder().decode(unb64(getCookie(request, GOOGLE_STATE_COOKIE) || ""))); } catch { /* missing or bad cookie */ }
  const code = url.searchParams.get("code");
  if (!pick || !code || url.searchParams.get("state") !== pick.state) return fail("google");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: googleRedirectUri(url), grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) { console.error("Google token exchange failed", tokenRes.status, await tokenRes.text()); return fail("google"); }
  const { id_token } = await tokenRes.json();
  // The ID token came straight from Google over TLS, so its claims can be read without checking the signature
  let claims;
  try { claims = JSON.parse(new TextDecoder().decode(unb64(id_token.split(".")[1]))); } catch { return fail("google"); }
  const issuerOk = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
  if (!issuerOk || claims.aud !== env.GOOGLE_CLIENT_ID || claims.exp * 1000 < Date.now()) return fail("google");
  if (!claims.email || claims.email_verified !== true) return fail("google_email");

  const email = String(claims.email).toLowerCase();
  let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  if (!user) {
    const name = clean(claims.name, 80) || email.split("@")[0];
    user = {
      id: crypto.randomUUID(), email, name, business: name + "'s Store",
      category: CATEGORY,
      plan: PLANS.includes(pick.plan) ? pick.plan : "starter",
      billing: pick.billing === "yearly" ? "yearly" : "monthly",
      template: SLUG.test(pick.template || "") ? pick.template : DEFAULT_TEMPLATE,
      created_at: new Date().toISOString(),
    };
    // No password: this account signs in with Google (an empty hash never matches)
    await env.DB.prepare(
      "INSERT INTO users (id, email, name, business, password_hash, password_salt, category, plan, billing, template, created_at) VALUES (?, ?, ?, ?, '', '', ?, ?, ?, ?, ?) ON CONFLICT(email) DO NOTHING"
    ).bind(user.id, user.email, user.name, user.business, user.category, user.plan, user.billing, user.template, user.created_at).run();
    user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  }

  const res = redirect(url, nextPath(pick.next));
  res.headers.append("Set-Cookie", `${GOOGLE_STATE_COOKIE}=; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return withSession(env, user.id, true, res);
}

// ---------- Sessions ----------
// The media table is created on first use, so no manual database step is needed
let mediaReady = false;
async function ensureMedia(env) {
  if (mediaReady) return;
  await env.DB.batch([
    env.DB.prepare("CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, type TEXT NOT NULL, data BLOB NOT NULL, size INTEGER NOT NULL, created_at TEXT NOT NULL)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS media_user ON media(user_id)"),
  ]);
  mediaReady = true;
}

async function uploadImage(request, env) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401);
  const type = (request.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
  if (!MEDIA_TYPES[type]) return json({ error: "Please upload a JPG, PNG, WebP or GIF image." }, 415);
  const data = await request.arrayBuffer();
  if (!data.byteLength) return json({ error: "The image is empty." }, 400);
  if (data.byteLength > MAX_IMAGE_BYTES) return json({ error: "That image is too large. Try a smaller one." }, 413);
  await ensureMedia(env);
  const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM media WHERE user_id = ?").bind(user.id).first();
  if ((count?.n || 0) >= MAX_IMAGES_PER_USER) return json({ error: `You've reached the limit of ${MAX_IMAGES_PER_USER} images.` }, 413);
  const id = crypto.randomUUID().replace(/-/g, "");
  await env.DB.prepare("INSERT INTO media (id, user_id, type, data, size, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(id, user.id, type, data, data.byteLength, new Date().toISOString()).run();
  return json({ url: "/media/" + id });
}

async function media(env, url) {
  const id = url.pathname.slice("/media/".length);
  if (!/^[a-f0-9]{32}$/.test(id)) return new Response("Not found", { status: 404 });
  let row = null;
  try {
    await ensureMedia(env);
    row = await env.DB.prepare("SELECT type, data FROM media WHERE id = ?").bind(id).first();
  } catch (err) { console.error(err); }
  if (!row || !MEDIA_TYPES[row.type]) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: { "Content-Type": row.type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}

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
  name: u.name, business: u.business, email: u.email, category: CATEGORY, plan: u.plan, billing: u.billing, template: u.template, createdAt: u.created_at,
  hasPassword: !!u.password_hash,
});

// ---------- Helpers ----------
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});
// Response.redirect() has read-only headers, so build it by hand to add cookies
const redirect = (url, to) => new Response(null, { status: 302, headers: { Location: new URL(to, url).href, "Cache-Control": "no-store" } });
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
