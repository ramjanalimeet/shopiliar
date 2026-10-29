import { currentUser } from "@/lib/auth";
import { api, json } from "@/lib/http";
import { ensureMedia, MAX_IMAGE_BYTES, MAX_IMAGES_PER_USER, MEDIA_TYPES } from "@/lib/media";

// Images uploaded in the website editor (signed in, JPG/PNG/WebP/GIF up to 1.5 MB, 300 per account)
export const POST = api(async (request, env) => {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401);
  const type = (request.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
  if (!MEDIA_TYPES[type]) return json({ error: "Please upload a JPG, PNG, WebP or GIF image." }, 415);
  const data = await request.arrayBuffer();
  if (!data.byteLength) return json({ error: "The image is empty." }, 400);
  if (data.byteLength > MAX_IMAGE_BYTES) return json({ error: "That image is too large. Try a smaller one." }, 413);
  await ensureMedia(env);
  const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM media WHERE user_id = ?").bind(user.id).first<{ n: number }>();
  if ((count?.n || 0) >= MAX_IMAGES_PER_USER) return json({ error: `You've reached the limit of ${MAX_IMAGES_PER_USER} images.` }, 413);
  const id = crypto.randomUUID().replace(/-/g, "");
  await env.DB.prepare("INSERT INTO media (id, user_id, type, data, size, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(id, user.id, type, data, data.byteLength, new Date().toISOString()).run();
  return json({ url: "/media/" + id });
}, { json: false });
