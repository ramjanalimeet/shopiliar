import { SiteKit } from "@/dashboard/site";
import { designOf } from "@/lib/designs";
import { getEnv } from "@/lib/cf";
import { templateById } from "@/lib/catalog";
import { getDesign } from "@/lib/platform";

// The real storefront for a template, on sample products: the Templates page shows it in its card and its
// Preview popup, so visitors see exactly the website they get (menu, slides, cart and checkout all work).
// A design saved in the master dashboard's template builder is used when there is one; otherwise the
// template's built-in starter website.
export const dynamic = "force-dynamic";
const hasStarter = (id: string) => Object.prototype.hasOwnProperty.call(SiteKit.STARTERS, id);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = templateById(id);
  if (!t) return new Response("Not found", { status: 404 });
  let saved = null;
  try { saved = designOf(await getDesign(await getEnv(), t.id)); } catch { /* no database here: use the built-in design */ }
  if (!saved && !hasStarter(t.id)) return new Response("Not found", { status: 404 });
  const sample = SiteKit.previewStore(t, t.brand);
  // The design's own name (in texts like "Why <name>?") shows as the template's sample brand
  const from = JSON.stringify(String(saved?.site.name || "")).slice(1, -1), to = JSON.stringify(t.brand).slice(1, -1);
  const rename = <T,>(x: T): T => { const s = JSON.stringify(x); return JSON.parse(from ? s.split(from).join(to) : s); };
  const site = saved ? { ...rename(saved.site), name: t.brand } : sample.site;
  const pages = saved ? rename(saved.pages) : sample.pages;
  if (saved) SiteKit.ensure(site, pages, { products: sample.products });
  // origin "" keeps every address on this site (/assets/site.css, page links)
  const html = SiteKit.storeHTML(site, pages, { products: sample.products, origin: "", hints: true });
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex", "Cache-Control": "public, max-age=60" } });
}
