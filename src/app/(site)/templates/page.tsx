import type { Metadata } from "next";
import "@/styles/templates.css";
import SiteFooter from "@/components/site/SiteFooter";
import TemplatesBrowser from "@/components/site/TemplatesBrowser";

export const metadata: Metadata = {
  title: "Templates — Shopilier",
  description: "Premium online store templates for Bangladeshi businesses: fashion, electronics, beauty, grocery, home, jewelry and single-product shops. Pick one, add products and go live today.",
};

export default function TemplatesPage() {
  return (
    <>
      <TemplatesBrowser>
        <section className="tpl-head">
          <span className="pill">Templates for online stores</span>
          <h1 className="tpl-title bn">অনলাইনে ব্যবসার জন্য <span className="gradient-text">প্রিমিয়াম</span> টেমপ্লেট</h1>
        </section>
      </TemplatesBrowser>
      <SiteFooter />
    </>
  );
}
