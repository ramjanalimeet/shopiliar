// Create with AI: writes the first version of a website (template, headline, text) from a short
// description, using Workers AI when the AI binding is available and simple rules otherwise,
// so sign-up never gets stuck.
import { clean } from "./http";

// Tried in order; Cloudflare retires models over time (plain llama-3.1-8b-instruct went in May 2026)
const AI_MODELS = ["@cf/meta/llama-3.1-8b-instruct-fast", "@cf/zai-org/glm-4.7-flash"];
export const TEMPLATE_IDS = ["luxe-store", "saas-landing", "launchly-landing", "bistro-restaurant", "growify-agency", "fixly-services", "nova-portfolio", "writely-blog", "mia-personal"];

export type SiteDraft = { template: string; headline: string; sub: string; cta: string; about: string; source: "ai" | "basic"; fallback?: string };

type LooseAi = { run(model: string, input: Record<string, unknown>): Promise<unknown> };

export async function draftSite(env: CloudflareEnv, input: { name: string; about: string; city: string }): Promise<SiteDraft> {
  const { name, about, city } = input;
  const basic = basicSite(name, about);
  // "fallback" says why the simple version was used (not shown to users; helps when checking the setup)
  if (!env.AI) return { ...basic, source: "basic", fallback: "no-ai-binding" };
  const messages = [
    { role: "system", content: "You write short, friendly website copy for small businesses in Bangladesh. Reply with one JSON object only, no other text." },
    { role: "user", content: `Business name: ${name}\nCity: ${city}\nType: online shop\nWhat they do: ${about}\n\n` +
      `Return JSON with keys: "template" (one of ${TEMPLATE_IDS.map((t) => `"${t}"`).join(", ")} - pick the closest style), "headline" (max 50 characters), "sub" (one sentence, max 100 characters), "cta" (button text, max 18 characters), "about" (2 sentences for an About section, max 260 characters).` },
  ];
  let lastError = "";
  for (const model of AI_MODELS) {
    try {
      const out = (await (env.AI as unknown as LooseAi).run(model, { max_tokens: 600, messages })) as Record<string, unknown> | string | null;
      // Text models return { response: "…" }, OpenAI-style ones { choices: [{ message }] }, some the object itself
      const o = out && typeof out === "object" ? (out as Record<string, unknown>) : null;
      const choice = (o?.choices as Array<{ message?: { content?: unknown } }> | undefined)?.[0]?.message?.content;
      const raw = o?.response ?? choice ?? out;
      if (raw && typeof raw === "object" && (raw as Record<string, unknown>).headline) return aiResult(raw as Record<string, unknown>, basic);
      const text = String(raw ?? "");
      try {
        return aiResult(JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)), basic);
      } catch {
        console.error("AI site: reply wasn't JSON", model, text.slice(0, 300));
        lastError = "ai-reply-not-json";
      }
    } catch (err) {
      console.error("AI site failed", model, err);
      lastError = "ai-error: " + String((err as Error)?.message || err).slice(0, 120);
    }
  }
  return { ...basic, source: "basic", fallback: lastError };
}

function aiResult(parsed: Record<string, unknown>, basic: ReturnType<typeof basicSite>): SiteDraft {
  const pick = (v: unknown, max: number, fallback: string) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : fallback);
  return {
    template: TEMPLATE_IDS.includes(parsed.template as string) ? (parsed.template as string) : basic.template,
    headline: pick(parsed.headline, 60, basic.headline),
    sub: pick(parsed.sub, 120, basic.sub),
    cta: pick(parsed.cta, 20, basic.cta),
    about: pick(parsed.about, 300, basic.about),
    source: "ai",
  };
}

function basicSite(name: string, about: string) {
  const has = (...words: string[]) => words.some((w) => about.toLowerCase().includes(w));
  const template = has("software", "app", "saas", "tech") ? "saas-landing" : has("launch", "pre-order", "preorder") ? "launchly-landing"
    : has("restaurant", "cafe", "café", "food", "bakery", "coffee") ? "bistro-restaurant" : "luxe-store";
  const first = about.split(/(?<=[.!?])\s/)[0].slice(0, 110);
  return {
    template,
    headline: `Shop ${name} online`.slice(0, 60),
    sub: first,
    cta: "Shop Now",
    about: `${clean(name, 60)} — ${about}`.slice(0, 300),
  };
}
