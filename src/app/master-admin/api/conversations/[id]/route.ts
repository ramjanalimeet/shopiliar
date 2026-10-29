import { adminApi } from "@/lib/admin-api";
import { adminConversation } from "@/lib/admin-conversations";
import { clean, json, readJson } from "@/lib/http";
import { MAX_MESSAGE, thread } from "@/lib/messages";

type Ctx = { params: Promise<{ id: string }> };

// Read a conversation (marks it read for the team)
export const GET = async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  return adminApi(async (_req, env) => {
    const conv = await adminConversation(env, id);
    if (!conv) return json({ error: "Conversation not found." }, 404);
    await env.DB.prepare("UPDATE conversations SET admin_unread = 0 WHERE id = ?").bind(conv.id).run();
    return json(await thread(env, { ...conv, admin_unread: 0 }));
  })(request);
};

// Reply to the user
export const POST = async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  return adminApi(async (req, env) => {
    const conv = await adminConversation(env, id);
    if (!conv) return json({ error: "Conversation not found." }, 404);
    const now = new Date().toISOString();
    const text = clean((await readJson(req)).body, MAX_MESSAGE);
    if (!text) return json({ error: "Write a reply first." }, 400);
    await env.DB.batch([
      env.DB.prepare("INSERT INTO messages (id, conversation_id, sender, body, created_at) VALUES (?, ?, 'admin', ?, ?)").bind(crypto.randomUUID(), conv.id, text, now),
      env.DB.prepare("UPDATE conversations SET user_unread = 1, admin_unread = 0, updated_at = ? WHERE id = ?").bind(now, conv.id),
    ]);
    return json(await thread(env, { ...conv, admin_unread: 0, updated_at: now }));
  })(request);
};
