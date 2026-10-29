import { adminApi } from "@/lib/admin-api";
import { clean, json, readJson } from "@/lib/http";
import { ConversationRow, MAX_MESSAGE, publicConversation, USER_COLS } from "@/lib/messages";

// Every conversation, newest first
export const GET = adminApi(async (_request, env) => {
  const { results } = await env.DB.prepare(
    `SELECT c.*, ${USER_COLS}, (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last,
       (SELECT sender FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_from
     FROM conversations c JOIN users u ON u.id = c.user_id ORDER BY c.updated_at DESC LIMIT 300`
  ).all<ConversationRow>();
  return json({ conversations: results.map((c) => ({ ...publicConversation(c), lastFrom: c.last_from })) });
});

// Start a conversation with a user
export const POST = adminApi(async (request, env) => {
  const now = new Date().toISOString();
  const body = await readJson(request);
  const subject = clean(body.subject, 120), text = clean(body.body, MAX_MESSAGE);
  const user = await env.DB.prepare("SELECT id FROM users WHERE id = ?").bind(String(body.userId || "")).first<{ id: string }>();
  if (!user) return json({ error: "Pick a user." }, 400);
  if (!subject || !text) return json({ error: "Please add a subject and a message." }, 400);
  const cid = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO conversations (id, user_id, subject, kind, status, admin_unread, user_unread, created_at, updated_at) VALUES (?, ?, ?, 'question', 'open', 0, 1, ?, ?)").bind(cid, user.id, subject, now, now),
    env.DB.prepare("INSERT INTO messages (id, conversation_id, sender, body, created_at) VALUES (?, ?, 'admin', ?, ?)").bind(crypto.randomUUID(), cid, text, now),
  ]);
  return json({ id: cid }, 201);
});
