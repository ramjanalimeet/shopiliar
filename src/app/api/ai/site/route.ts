import { draftSite } from "@/lib/ai";
import { api, clean, json, readJson } from "@/lib/http";

export const POST = api(async (request, env) => {
  const body = await readJson(request);
  const name = clean(body.name, 60);
  const about = clean(body.about, 500);
  const city = clean(body.city, 40) || "Bangladesh";
  if (!name || about.length < 10) return json({ error: "Tell us your business name and a sentence about what you do." }, 400);
  return json(await draftSite(env, { name, about, city }));
}, { limit: true });
