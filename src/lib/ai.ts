// Create with AI: writes the first version of a website (template, headline, text) from a short
// description, using Workers AI when the AI binding is available and simple rules otherwise,
// so sign-up never gets stuck.
import { clean } from "./http";

// Tried in order; Cloudflare retires models over time (plain llama-3.1-8b-instruct went in May 2026)
const AI_MODELS = ["@cf/meta/llama-3.1-8b-instruct-fast", "@cf/zai-org/glm-4.7-flash"];
// Template ids and what each one is for (see src/lib/catalog.ts)
export const TEMPLATE_NAMES: Record<string, string> = {
  "luxe-store": "Fashion & Clothing", "saas-landing": "Electronics & Gadgets", "mia-personal": "Beauty & Cosmetics", "bistro-restaurant": "Grocery & Food",
  "growify-agency": "Home & Furniture", "nova-portfolio": "Jewelry & Accessories", "writely-blog": "Single Product (story-led)", "fixly-services": "Single Product (what's inside, warranty)", "launchly-landing": "Single Product (launch, pre-orders)",
};
export const TEMPLATE_IDS = Object.keys(TEMPLATE_NAMES);

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
      `Return JSON with keys: "template" (one of ${TEMPLATE_IDS.map((t) => `"${t}" for ${TEMPLATE_NAMES[t]}`).join(", ")} - pick the closest fit), "headline" (max 50 characters), "sub" (one sentence, max 100 characters), "cta" (button text, max 18 characters), "about" (2 sentences for an About section, max 260 characters).` },
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
  const template = has("phone", "mobile", "gadget", "electronic", "laptop", "earbud") ? "saas-landing"
    : has("beauty", "cosmetic", "skincare", "skin care", "makeup", "perfume") ? "mia-personal"
    : has("grocery", "food", "restaurant", "cafe", "café", "bakery", "sweet", "fish", "rice") ? "bistro-restaurant"
    : has("furniture", "home decor", "decor", "sofa", "lamp") ? "growify-agency"
    : has("jewel", "gold", "silver", "watch", "accessor") ? "nova-portfolio"
    : has("launch", "pre-order", "preorder", "single product", "one product") ? "launchly-landing" : "luxe-store";
  const first = about.split(/(?<=[.!?])\s/)[0].slice(0, 110);
  return {
    template,
    headline: `Shop ${name} online`.slice(0, 60),
    sub: first,
    cta: "Shop Now",
    about: `${clean(name, 60)} — ${about}`.slice(0, 300),
  };
}
