"use client";
// The footer and Contact page are built ahead of time with Shopilier's default contact details and social links.
// After the page loads, this puts in the ones saved in the master dashboard (Settings → Website), and hides
// any social link that was left empty there.
import { useEffect } from "react";

type Platform = { supportEmail: string; supportPhone: string; whatsapp: string; social: Record<string, string> };

export default function PlatformLinks() {
  useEffect(() => {
    let gone = false;
    fetch("/api/platform").then((r) => (r.ok ? (r.json() as Promise<Platform>) : null)).then((p) => {
      if (!p || gone) return;
      const digits = (x: string) => x.replace(/\D/g, "");
      document.querySelectorAll<HTMLElement>("[data-platform]").forEach((el) => {
        const k = el.dataset.platform || "";
        if (k === "email") {
          el.setAttribute("href", "mailto:" + p.supportEmail);
          const t = el.querySelector("[data-platform-text]"); if (t) t.textContent = p.supportEmail;
        } else if (k === "phone" || k === "whatsapp") {
          const v = k === "phone" ? p.supportPhone : p.whatsapp;
          el.hidden = !v;
          if (v) {
            el.setAttribute("href", k === "phone" ? "tel:" + digits(v) : "https://wa.me/" + (digits(v).startsWith("0") ? "88" : "") + digits(v));
            const t = el.querySelector("[data-platform-text]"); if (t) t.textContent = v;
          }
        } else if (k in p.social) {
          const v = p.social[k];
          el.hidden = !v;
          if (v) el.setAttribute("href", v);
        }
      });
    }).catch(() => {});
    return () => { gone = true; };
  }, []);
  return null;
}
