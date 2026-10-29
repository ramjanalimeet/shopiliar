import { CONVERSATION_ID, ConversationRow, USER_COLS } from "./messages";

export const adminConversation = async (env: CloudflareEnv, id: string) =>
  CONVERSATION_ID.test(id)
    ? env.DB.prepare(`SELECT c.*, ${USER_COLS} FROM conversations c JOIN users u ON u.id = c.user_id WHERE c.id = ?`).bind(id).first<ConversationRow>()
    : null;
