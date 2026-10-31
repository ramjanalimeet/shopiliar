import { adminApi } from "@/lib/admin-api";
import { clean, json, readJson } from "@/lib/http";
import { EMAIL, isPlan, templateOf } from "@/lib/plans";

type Row = { id: string; name: string; email: string; business: string; plan: string; billing: string; template: string };

// Change a user's name, business, email, plan, billing or template
export const PATCH = async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return adminApi(async (req, env) => {
    const user = await env.DB.prepare("SELECT id, name, email, business, plan, billing, template FROM users WHERE id = ?").bind(id).first<Row>();
    if (!user) return json({ error: "User not found." }, 404);
    const b = await readJson(req);
    const next = {
      name: clean(b.name, 80) || user.name,
      business: clean(b.business, 80) || user.business,
      email: clean(b.email, 254).toLowerCase() || user.email,
      plan: isPlan(b.plan) ? b.plan : user.plan,
      billing: b.billing === "yearly" || b.billing === "monthly" ? b.billing : user.billing,
      template: templateOf(b.template, user.template),
    };
    if (!EMAIL.test(next.email)) return json({ error: "Please enter a valid email." }, 400);
    if (next.email !== user.email) {
      const taken = await env.DB.prepare("SELECT 1 FROM users WHERE email = ? AND id != ?").bind(next.email, id).first();
      if (taken) return json({ error: "That email is already used by another account." }, 409);
    }
    await env.DB.prepare("UPDATE users SET name = ?, business = ?, email = ?, plan = ?, billing = ?, template = ? WHERE id = ?")
      .bind(next.name, next.business, next.email, next.plan, next.billing, next.template, id).run();
    return json({ user: { id, ...next } });
  })(request);
};

// Delete a user and everything that belongs to them: website, sessions, photos and support messages.
// The dashboard asks for the business name to be typed first; the same name must be sent here.
export const DELETE = async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return adminApi(async (req, env) => {
    const user = await env.DB.prepare("SELECT id, business FROM users WHERE id = ?").bind(id).first<{ id: string; business: string }>();
    if (!user) return json({ error: "User not found." }, 404);
    const b = await readJson(req);
    if (String(b.confirm ?? "").trim() !== user.business.trim()) return json({ error: "Type the business name exactly to delete this user." }, 400);
    const db = env.DB;
    await db.batch([
      db.prepare("DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = ?)").bind(id),
      db.prepare("DELETE FROM conversations WHERE user_id = ?").bind(id),
      db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id),
      db.prepare("DELETE FROM stores WHERE user_id = ?").bind(id),
      db.prepare("DELETE FROM users WHERE id = ?").bind(id),
    ]);
    // Photos live in a table that only exists once someone has uploaded one
    try { await db.prepare("DELETE FROM media WHERE user_id = ?").bind(id).run(); } catch { /* no media table yet */ }
    return json({ ok: true });
  })(request);
};
