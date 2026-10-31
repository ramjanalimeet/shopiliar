import { adminApi } from "@/lib/admin-api";
import { MAX_DESIGN_BYTES, TEMPLATE_ID, designOf } from "@/lib/designs";
import { json } from "@/lib/http";
import { deleteDesign, getDesign, saveDesign } from "@/lib/platform";

type Ctx = { params: Promise<{ id: string }> };

// The template builder: read, save, or go back to the template's built-in design
export const GET = async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  return adminApi(async (_req, env) => (TEMPLATE_ID.test(id) ? json({ design: await getDesign(env, id) }) : json({ error: "Unknown template." }, 404)))(request);
};
export const PUT = async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  return adminApi(async (req, env) => {
    if (!TEMPLATE_ID.test(id)) return json({ error: "Unknown template." }, 404);
    const text = await req.text();
    if (text.length > MAX_DESIGN_BYTES) return json({ error: "This design is too large to save. Use fewer or smaller images." }, 413);
    let raw: unknown;
    try { raw = JSON.parse(text); } catch { return json({ error: "Expected JSON." }, 400); }
    const design = designOf(raw);
    if (!design) return json({ error: "That isn't a complete design." }, 400);
    await saveDesign(env, id, design);
    return json({ ok: true, savedAt: new Date().toISOString() });
  })(request);
};
export const DELETE = async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  return adminApi(async (_req, env) => {
    if (!TEMPLATE_ID.test(id)) return json({ error: "Unknown template." }, 404);
    await deleteDesign(env, id);
    return json({ ok: true });
  })(request);
};
