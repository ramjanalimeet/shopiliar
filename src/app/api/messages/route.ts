import { currentUser } from "@/lib/auth";
import { api, clean, json, readJson } from "@/lib/http";
import { ConversationRow, MAX_MESSAGE, MESSAGE_KINDS, publicConversation } from "@/lib/messages";

// A user's conversations with the Shopilier team
export const GET = api(async (request, env) => {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401);
  const { results } = await env.DB.prepare(
    `SELECT c.*, (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last
     FROM conversations c WHERE c.user_id = ? ORDER BY c.updated_at DESC LIMIT 100`
  ).bind(user.id).all<ConversationRow>();
  return json({ conversations: results.map(publicConversation) });
});

// Start a new conversation
export const POST = api(async (request, env) => {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401);
  const now = new Date().toISOString();
  const body = await readJson(request);
  const subject = clean(body.subject, 120), text = clean(body.body, MAX_MESSAGE);
  if (!subject || !text) return json({ error: "Please add a subject and a message." }, 400);
  const cid = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO conversations (id, user_id, subject, kind, status, admin_unread, user_unread, created_at, updated_at) VALUES (?, ?, ?, ?, 'open', 1, 0, ?, ?)")
      .bind(cid, user.id, subject, MESSAGE_KINDS.includes(body.kind as string) ? body.kind : "question", now, now),
    env.DB.prepare("INSERT INTO messages (id, conversation_id, sender, body, created_at) VALUES (?, ?, 'user', ?, ?)").bind(crypto.randomUUID(), cid, text, now),
  ]);
  return json({ id: cid }, 201);
}, { limit: true });
