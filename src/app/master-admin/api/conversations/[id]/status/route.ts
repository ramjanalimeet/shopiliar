import { adminApi } from "@/lib/admin-api";
import { adminConversation } from "@/lib/admin-conversations";
import { json, readJson } from "@/lib/http";
import { thread } from "@/lib/messages";

// Open or close a conversation
export const POST = async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return adminApi(async (req, env) => {
    const conv = await adminConversation(env, id);
    if (!conv) return json({ error: "Conversation not found." }, 404);
    const status = (await readJson(req)).status === "closed" ? "closed" : "open";
    await env.DB.prepare("UPDATE conversations SET status = ? WHERE id = ?").bind(status, conv.id).run();
    return json(await thread(env, { ...conv, status }));
  })(request);
};
