import type { Metadata } from "next";
import "@/styles/templates.css";
import SiteFooter from "@/components/site/SiteFooter";
import TemplatesBrowser from "@/components/site/TemplatesBrowser";

export const metadata: Metadata = {
  title: "Templates — Shopilier",
  description: "Free online store templates for Bangladeshi businesses: fashion, beauty, electronics, food, home, jewellery and more. Pick one, add products and go live today.",
};

export default function TemplatesPage() {
  return (
    <>
      <TemplatesBrowser>
        <section className="tpl-head">
          <span className="pill">Templates for online stores</span>
          <h1 className="tpl-title">Store templates made for <span className="gradient-text">selling</span></h1>
          <p className="tpl-sub">Every template is built for selling online in Bangladesh — bKash, Nagad and cash on delivery included. Pick one for free, add your products and go live today. Switch designs any time without losing anything.</p>
        </section>
      </TemplatesBrowser>
      <SiteFooter />
    </>
  );
}
