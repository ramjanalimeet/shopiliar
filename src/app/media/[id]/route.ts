import { getEnv } from "@/lib/cf";
import { ensureMedia, ensureTemplateMedia, MEDIA_ID, MEDIA_TYPES, TEMPLATE_MEDIA_ID } from "@/lib/media";

// Serves an image uploaded in the website editor (or in the master dashboard's template builder)
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tpl = TEMPLATE_MEDIA_ID.test(id);
  if (!MEDIA_ID.test(id) && !tpl) return new Response("Not found", { status: 404 });
  let row: { type: string; data: ArrayBuffer } | null = null;
  try {
    const env = await getEnv();
    if (tpl) await ensureTemplateMedia(env); else await ensureMedia(env);
    row = await env.DB.prepare(`SELECT type, data FROM ${tpl ? "template_media" : "media"} WHERE id = ?`).bind(id).first<{ type: string; data: ArrayBuffer }>();
  } catch (err) { console.error(err); }
  if (!row || !MEDIA_TYPES[row.type]) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: { "Content-Type": row.type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
