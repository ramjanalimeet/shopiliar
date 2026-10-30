import { SiteKit } from "@/dashboard/site";
import { TEMPLATES, templateById } from "@/lib/catalog";

// The real storefront for a template, on a sample store: the Templates page shows it in its card and its
// Preview popup, so visitors see exactly the website they get (menu, slides, cart and checkout all work).
// Only templates with a starter website have one; it's built once at deploy time.
export const dynamic = "force-static";
const hasStarter = (id: string) => Object.prototype.hasOwnProperty.call(SiteKit.STARTERS, id);
export const dynamicParams = false;

export function generateStaticParams() {
  return TEMPLATES.filter((t) => hasStarter(t.id)).map((t) => ({ id: t.id }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = templateById(id);
  if (!t || !hasStarter(t.id)) return new Response("Not found", { status: 404 });
  const { site, pages, products } = SiteKit.previewStore(t, t.brand);
  // origin "" keeps every address on this site (/assets/site.css, page links)
  const html = SiteKit.storeHTML(site, pages, { products, origin: "", hints: true });
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" } });
}
