import { adminApi } from "@/lib/admin-api";
import { json, readJson } from "@/lib/http";
import { getSettings, saveSettings } from "@/lib/platform";

// The master dashboard's Settings: read and save
export const GET = adminApi(async (_request, env) => json({ settings: await getSettings(env) }));
export const PUT = adminApi(async (request, env) => json({ settings: await saveSettings(env, await readJson(request)) }));
