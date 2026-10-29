// Support messages between users and the Shopilier team.
export const MESSAGE_KINDS = ["question", "complaint", "billing", "website"];
export const MAX_MESSAGE = 2000;
export const CONVERSATION_ID = /^[\w-]{1,64}$/;

export type ConversationRow = {
  id: string; user_id: string; subject: string; kind: string; status: string;
  admin_unread: number; user_unread: number; created_at: string; updated_at: string;
  last?: string | null; last_from?: string | null;
  user_name?: string; user_email?: string; user_business?: string; user_category?: string; user_plan?: string; user_billing?: string; user_joined?: string;
};

// Columns the master panel sees about the user on each conversation
export const USER_COLS = "u.name AS user_name, u.email AS user_email, u.business AS user_business, u.category AS user_category, u.plan AS user_plan, u.billing AS user_billing, u.created_at AS user_joined";

export const publicConversation = (c: ConversationRow) => ({
  id: c.id, subject: c.subject, kind: c.kind, status: c.status, last: c.last ?? undefined,
  unread: !!c.user_unread, adminUnread: !!c.admin_unread, createdAt: c.created_at, updatedAt: c.updated_at,
  user: c.user_email ? { name: c.user_name, email: c.user_email, business: c.user_business, category: c.user_category, plan: c.user_plan, billing: c.user_billing, joined: c.user_joined } : undefined,
});

export async function thread(env: CloudflareEnv, conv: ConversationRow) {
  const { results } = await env.DB.prepare("SELECT sender, body, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at")
    .bind(conv.id).all<{ sender: string; body: string; created_at: string }>();
  return { conversation: publicConversation(conv), messages: results.map((m) => ({ from: m.sender, body: m.body, at: m.created_at })) };
}
