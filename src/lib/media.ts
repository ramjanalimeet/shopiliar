// Images uploaded in the website editor (stored in D1, served from /media/<id>)
export const MEDIA_TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif" };
export const MAX_IMAGE_BYTES = 1_500_000;
export const MAX_IMAGES_PER_USER = 300;
export const MEDIA_ID = /^[a-f0-9]{32}$/;
// Photos uploaded in the master dashboard's template builder: "t" + 32 hex characters, in their own table
export const TEMPLATE_MEDIA_ID = /^t[a-f0-9]{32}$/;
let templateMediaReady = false;
export async function ensureTemplateMedia(env: CloudflareEnv) {
  if (templateMediaReady) return;
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS template_media (id TEXT PRIMARY KEY, type TEXT NOT NULL, data BLOB NOT NULL, size INTEGER NOT NULL, created_at TEXT NOT NULL)").run();
  templateMediaReady = true;
}

// The media table is created on first use, so no manual database step is needed
let mediaReady = false;
export async function ensureMedia(env: CloudflareEnv) {
  if (mediaReady) return;
  await env.DB.batch([
    env.DB.prepare("CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, type TEXT NOT NULL, data BLOB NOT NULL, size INTEGER NOT NULL, created_at TEXT NOT NULL)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS media_user ON media(user_id)"),
  ]);
  mediaReady = true;
}
