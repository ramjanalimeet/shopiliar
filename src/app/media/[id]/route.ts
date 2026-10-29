import { getEnv } from "@/lib/cf";
import { ensureMedia, MEDIA_ID, MEDIA_TYPES } from "@/lib/media";

// Serves an image uploaded in the website editor
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!MEDIA_ID.test(id)) return new Response("Not found", { status: 404 });
  let row: { type: string; data: ArrayBuffer } | null = null;
  try {
    const env = await getEnv();
    await ensureMedia(env);
    row = await env.DB.prepare("SELECT type, data FROM media WHERE id = ?").bind(id).first<{ type: string; data: ArrayBuffer }>();
  } catch (err) { console.error(err); }
  if (!row || !MEDIA_TYPES[row.type]) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: { "Content-Type": row.type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
