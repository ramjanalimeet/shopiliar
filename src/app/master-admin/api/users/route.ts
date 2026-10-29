import { adminApi } from "@/lib/admin-api";
import { json } from "@/lib/http";

type Row = { id: string; name: string; email: string; business: string; category: string; plan: string; billing: string; created_at: string };

export const GET = adminApi(async (_request, env) => {
  const { results } = await env.DB.prepare("SELECT id, name, email, business, category, plan, billing, created_at FROM users ORDER BY created_at DESC LIMIT 500").all<Row>();
  return json({ users: results.map((u) => ({ id: u.id, name: u.name, email: u.email, business: u.business, category: u.category, plan: u.plan, billing: u.billing, joined: u.created_at })) });
});
