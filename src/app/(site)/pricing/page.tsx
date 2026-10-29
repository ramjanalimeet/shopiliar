import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/pricing.css";
import PricingCards from "@/components/site/PricingCards";
import SiteFooter from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Pricing — Shopilier",
  description: "Shopilier plans in Bangladeshi Taka: Starter (৳149) with 10 products and 2 staff, Business (৳549) with 100+ products and 10+ staff, or Pro (৳2,499) with everything unlimited. Every plan includes a free sub-domain, a custom domain and support.",
};

const Yes = () => <span className="yes" aria-label="Included"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg></span>;
const No = () => <span className="no" aria-label="Not included">—</span>;
type Cell = ReactNode;
// Feature rows of the comparison table: Starter, Business, Pro
const ROWS: [string, Cell, Cell, Cell][] = [
  ["Website pages", "10", "Unlimited", "Unlimited"],
  ["Products", "10", "100+", "Unlimited"],
  ["Sales", "Unlimited", "Unlimited", "Unlimited"],
  ["Staff accounts", "2", "10+", "Unlimited"],
  ["Free sub-domain", <Yes key="y" />, <Yes key="y" />, <Yes key="y" />],
  ["Custom domain", <Yes key="y" />, <Yes key="y" />, <Yes key="y" />],
  ["Free custom domain", <No key="n" />, "Yearly plan", "Yearly plan"],
  ["Free website", <Yes key="y" />, <Yes key="y" />, <Yes key="y" />],
  ["Free CMS access", <Yes key="y" />, <Yes key="y" />, <Yes key="y" />],
  ["Support chat", <Yes key="y" />, <Yes key="y" />, <Yes key="y" />],
];
const FAQ: [string, string][] = [
  ["Which plan should I start with?", "Starter (৳149/month) gives you a 10 page website, 10 products, 2 staff accounts and your free sub-domain. Move up to Business when you need more products and staff, or Pro for no limits at all."],
  ["Which currency are the prices in?", "All prices are in Bangladeshi Taka (৳ BDT)."],
  ["What do I get with a yearly plan?", "You pay for 12 months at once. On Business and Pro plans, the yearly plan also comes with a free custom domain."],
  ["Can I use my own domain?", "Yes, on every plan you can connect a domain like www.yourbusiness.com. Every plan also comes with a free sub-domain at yourstore.shopilier.com."],
  ["What is CMS access?", "The CMS is your dashboard for editing pages, adding products and updating your website — no coding needed. It's free on every plan."],
  ["Can I change my plan later?", "Yes. You can move to a bigger or smaller plan whenever your business needs change — your website and products stay as they are."],
  ["How does support work?", "Every plan includes free support: message the Shopilier team from the chat button in your dashboard. The Help Center is open to everyone too."],
];

export default function PricingPage() {
  return (
    <>
      <main className="container price-page">
        <section className="page-head">
          <span className="pill bn">প্ল্যান ও মূল্য</span>
          <h1 className="bn">মাত্র ৳১৪৯ থেকে শুরু করুন,<br /><span className="gradient-text">নিজের গতিতে</span> বড় হোন</h1>
          <p className="bn">লুকানো কোনো খরচ নেই — সব দাম টাকায়। আজই আপনার দোকান খুলুন, ব্যবসা বাড়লে এক ক্লিকেই প্ল্যান বদলে নিন।</p>
        </section>

        <PricingCards />

        <section className="perks" aria-label="Included in every plan">
          <div className="perk">
            <span className="perk-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M7 6.5h.01M10 6.5h.01" /></svg></span>
            <div><h3>Free website</h3><p>Your online store and your free sub-domain are included with every plan.</p></div>
          </div>
          <div className="perk">
            <span className="perk-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13 7l4 4" /></svg></span>
            <div><h3>Free CMS access</h3><p>Edit pages and products yourself — no coding needed.</p></div>
          </div>
          <div className="perk">
            <span className="perk-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13v-1a8 8 0 0116 0v1" /><rect x="3" y="13" width="4" height="6" rx="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" /><path d="M19 19c0 1.5-2 2.5-5 2.5" /></svg></span>
            <div><h3>Support on every plan</h3><p>Chat with our team from your dashboard on Starter, Business and Pro.</p></div>
          </div>
        </section>

        <section className="compare">
          <h2>Compare plans</h2>
          <div className="compare-wrap">
            <table data-cat="ecommerce">
              <caption className="sr-only">Shopilier plans</caption>
              <thead><tr><th scope="col">Features</th><th scope="col">Starter<small>৳149/mo</small></th><th scope="col" className="hl">Business<small>৳549/mo</small></th><th scope="col">Pro<small>৳2,499/mo</small></th></tr></thead>
              <tbody>
                {ROWS.map(([name, ...cells]) => (
                  <tr key={name}><th scope="row">{name}</th>{cells.map((c, i) => <td key={i}>{c}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="faq">
          <h2>Frequently asked questions</h2>
          {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
