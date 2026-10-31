import { adminApi } from "@/lib/admin-api";
import { json } from "@/lib/http";
import { ensureTemplateMedia, MAX_IMAGE_BYTES, MEDIA_TYPES } from "@/lib/media";

// Photos for template designs, uploaded in the master dashboard's template builder (JPG/PNG/WebP/GIF up to 1.5 MB)
export const POST = adminApi(async (request, env) => {
  const type = (request.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
  if (!MEDIA_TYPES[type]) return json({ error: "Please upload a JPG, PNG, WebP or GIF image." }, 415);
  const data = await request.arrayBuffer();
  if (!data.byteLength) return json({ error: "The image is empty." }, 400);
  if (data.byteLength > MAX_IMAGE_BYTES) return json({ error: "That image is too large. Try a smaller one." }, 413);
  await ensureTemplateMedia(env);
  const id = "t" + crypto.randomUUID().replace(/-/g, "");
  await env.DB.prepare("INSERT INTO template_media (id, type, data, size, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(id, type, data, data.byteLength, new Date().toISOString()).run();
  return json({ url: "/media/" + id });
}, { json: false });
