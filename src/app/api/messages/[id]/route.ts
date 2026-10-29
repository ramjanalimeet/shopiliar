import { currentUser } from "@/lib/auth";
import { api, clean, json, readJson } from "@/lib/http";
import { CONVERSATION_ID, ConversationRow, MAX_MESSAGE, thread } from "@/lib/messages";

type Ctx = { params: Promise<{ id: string }> };

const conversationFor = async (env: CloudflareEnv, id: string, userId: string) =>
  CONVERSATION_ID.test(id) ? env.DB.prepare("SELECT * FROM conversations WHERE id = ? AND user_id = ?").bind(id, userId).first<ConversationRow>() : null;

// Read a conversation (marks it read)
export const GET = async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  return api(async (req, env) => {
    const user = await currentUser(req, env);
    if (!user) return json({ error: "Not signed in." }, 401);
    const conv = await conversationFor(env, id, user.id);
    if (!conv) return json({ error: "Conversation not found." }, 404);
    await env.DB.prepare("UPDATE conversations SET user_unread = 0 WHERE id = ?").bind(id).run();
    return json(await thread(env, { ...conv, user_unread: 0 }));
  })(request);
};

// Reply in a conversation (a new message reopens a resolved one)
export const POST = async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  return api(async (req, env) => {
    const user = await currentUser(req, env);
    if (!user) return json({ error: "Not signed in." }, 401);
    const conv = await conversationFor(env, id, user.id);
    if (!conv) return json({ error: "Conversation not found." }, 404);
    const now = new Date().toISOString();
    const text = clean((await readJson(req)).body, MAX_MESSAGE);
    if (!text) return json({ error: "Write a message first." }, 400);
    await env.DB.batch([
      env.DB.prepare("INSERT INTO messages (id, conversation_id, sender, body, created_at) VALUES (?, ?, 'user', ?, ?)").bind(crypto.randomUUID(), id, text, now),
      env.DB.prepare("UPDATE conversations SET status = 'open', admin_unread = 1, updated_at = ? WHERE id = ?").bind(now, id),
    ]);
    return json(await thread(env, { ...conv, status: "open", updated_at: now }));
  }, { limit: true })(request);
};
