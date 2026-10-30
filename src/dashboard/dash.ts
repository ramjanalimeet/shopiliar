// @ts-nocheck — ported as-is from the original dashboard script; types can be tightened over time.
import { ICONS } from "./icons";

// Shared helpers for the Shopilier dashboards (/admin and /master-admin).
export const Dash = (() => {
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const taka = (n) => "৳" + Math.round(Number(n) || 0).toLocaleString("en-IN");
  const uid = (p = "id") => p + "_" + Math.random().toString(36).slice(2, 9);
  const day = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString();
  const initials = (name) => String(name || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const AVATAR = ["#f97316", "#0ea5e9", "#8b5cf6", "#ec4899", "#14b8a6", "#eab308", "#ef4444", "#6366f1"];
  const avatar = (name, size = "") => {
    let h = 0;
    for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return `<span class="avatar ${size}" style="background:${AVATAR[h % AVATAR.length]}">${esc(initials(name))}</span>`;
  };
  const tag = (label, color = "gray") => `<span class="tag ${color}">${esc(label)}</span>`;

  const load = (key, seed) => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed != null) return parsed;
    } catch (e) { /* storage blocked or corrupt: fall back to seed */ }
    const data = typeof seed === "function" ? seed() : seed;
    if (data != null) save(key, data);
    return data;
  };
  const save = (key, data) => {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* storage unavailable */ }
  };
  const remove = (key) => { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } };

  let toastEl, toastTimer;
  const toast = (msg) => {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  };

  // Form dialog. onSubmit(values, close) — return false to keep it open.
  const dialog = ({ title, body, submit = "Save", danger = false, size = "", onSubmit, onOpen }) => {
    const wrap = document.createElement("div");
    wrap.className = "overlay";
    wrap.innerHTML = `
      <form class="dialog ${size}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="dialog-head"><h3>${esc(title)}</h3><button type="button" class="icon-btn" data-close aria-label="Close">${icon("x")}</button></div>
        <div class="dialog-body">${body}</div>
        <div class="dialog-foot">
          <button type="button" class="btn" data-close>${submit ? "Cancel" : "Close"}</button>
          ${submit ? `<button type="submit" class="btn ${danger ? "btn-danger" : "btn-primary"}">${esc(submit)}</button>` : ""}
        </div>
      </form>`;
    const prevFocus = document.activeElement;
    const close = () => { wrap.remove(); document.removeEventListener("keydown", onKey); if (prevFocus) prevFocus.focus(); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    wrap.addEventListener("click", (e) => { if (e.target === wrap || e.target.closest("[data-close]")) close(); });
    const form = wrap.querySelector("form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const values = {};
      new FormData(form).forEach((v, k) => { values[k] = typeof v === "string" ? v.trim() : v; });
      form.querySelectorAll("input[type=checkbox][name]").forEach((c) => { values[c.name] = c.checked; });
      if (onSubmit && onSubmit(values, close, form) === false) return;
      close();
    });
    document.body.appendChild(wrap);
    if (onOpen) onOpen(form);
    const first = form.querySelector(".dialog-body input, .dialog-body select, .dialog-body textarea");
    (first || form.querySelector("[type=submit]") || form).focus();
    return { close, form };
  };

  const confirm = (title, text, label = "Delete") => new Promise((resolve) => {
    let ok = false;
    const d = dialog({ title, body: `<p class="muted">${esc(text)}</p>`, submit: label, danger: true, onSubmit: () => { ok = true; } });
    const obs = new MutationObserver(() => { if (!d.form.isConnected) { obs.disconnect(); resolve(ok); } });
    obs.observe(document.body, { childList: true });
  });

  // Hash router: routes = { name: { title, render() } }
  const router = (routes, fallback, afterRender) => {
    const app = document.querySelector(".app");
    const go = () => {
      const name = location.hash.replace(/^#\/?/, "").split("?")[0] || fallback;
      const route = routes[name] ? name : fallback;
      document.querySelectorAll("[data-route]").forEach((a) => a.classList.toggle("on", a.dataset.route === route));
      const crumb = document.getElementById("crumb");
      if (crumb) crumb.textContent = routes[route].title;
      const view = document.getElementById("view");
      view.innerHTML = routes[route].render();
      if (routes[route].mount) routes[route].mount(view);
      document.querySelector(".scroll").scrollTop = 0;
      app.classList.remove("nav-open");
      document.title = routes[route].title + " · " + document.body.dataset.appName;
      if (afterRender) afterRender(route);
    };
    window.addEventListener("hashchange", go);
    document.querySelector(".menu-btn").addEventListener("click", () => app.classList.toggle("nav-open"));
    document.querySelector(".scroll").addEventListener("click", () => app.classList.remove("nav-open"));
    go();
    return go;
  };

  const bars = (points) => {
    const max = Math.max(1, ...points.map((p) => p.v));
    return `<div class="bars">${points.map((p) => `<div title="${esc(p.label)}: ${esc(p.text ?? p.v)}"><i style="height:${Math.round((p.v / max) * 100)}%"></i><span>${esc(p.label)}</span></div>`).join("")}</div>`;
  };

  const icon = (name, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  // Fill <span data-icon="name"></span> placeholders in static markup
  const hydrateIcons = (root = document) => root.querySelectorAll("[data-icon]").forEach((el) => { el.outerHTML = icon(el.dataset.icon); });

  // Template catalog shared by both dashboards (mirrors the public Templates page).
  const TEMPLATES = () => [
    { id: "luxe-store", name: "Fashion & Clothing", category: "Fashion & Clothing", desc: "An elegant store for clothing, sarees, shoes and accessories.", layout: "split", bg: "#f7f4f0", text: "#111111", accent: "#111111", headline: "Modern Fashion For Everyone", sub: "Premium quality. Timeless style.", cta: "Shop Now", status: "published", uses: 214, created: daysAgo(120) },
    { id: "saas-landing", name: "Electronics & Gadgets", category: "Electronics & Gadgets", desc: "A clean, modern store for phones, gadgets and accessories, with warranty details.", layout: "center", bg: "#efedfd", text: "#121735", accent: "#4b5cf0", headline: "Gadgets For Everyday Life", sub: "Phones, earbuds and smart home devices — with warranty and fast delivery.", cta: "Shop Now", status: "published", uses: 96, created: daysAgo(90) },
    { id: "mia-personal", name: "Beauty & Cosmetics", category: "Beauty & Cosmetics", desc: "A warm, friendly store for skincare, cosmetics and beauty products.", layout: "center", bg: "#fdf6ef", text: "#3b2418", accent: "#e0794f", headline: "Skincare That Loves You Back", sub: "Natural beauty, made for Bangladeshi skin.", cta: "Shop Skincare", status: "published", uses: 18, created: daysAgo(20) },
    { id: "bistro-restaurant", name: "Grocery & Food", category: "Grocery & Food", desc: "A bold store for groceries, fresh food and daily essentials with same-day delivery.", layout: "bleed", bg: "#16110d", text: "#ffffff", accent: "#e8743b", headline: "Fresh Food At Your Door", sub: "Vegetables, fish and pantry staples, delivered the same day.", cta: "Shop Now", status: "published", uses: 158, created: daysAgo(80) },
    { id: "growify-agency", name: "Home & Furniture", category: "Home & Furniture", desc: "A calm, spacious store for furniture, lighting and home decor.", layout: "split", bg: "#fbfbfa", text: "#111111", accent: "#2f6b2a", headline: "Furniture For Modern Living", sub: "Sofas, tables and decor, delivered across Bangladesh.", cta: "Shop Furniture", status: "published", uses: 61, created: daysAgo(60) },
    { id: "nova-portfolio", name: "Jewelry & Accessories", category: "Jewelry & Accessories", desc: "A minimal, premium store for jewelry, watches and accessories.", layout: "split", bg: "#fafafa", text: "#111111", accent: "#111111", headline: "Jewelry Made To Be Remembered", sub: "Gold, silver and pearl pieces for every occasion.", cta: "Shop Jewelry", status: "published", uses: 73, created: daysAgo(70) },
    { id: "writely-blog", name: "Single Product", category: "Single Product", desc: "A story-led one-page shop for a single hero product, with features and reviews.", layout: "split", bg: "#ffffff", text: "#111111", accent: "#3d6b8f", headline: "One Bag For Every Trail", sub: "A 40-litre backpack built for Bandarban to Sajek.", cta: "Pre-order Now", status: "published", uses: 44, created: daysAgo(50) },
    { id: "fixly-services", name: "Single Product", category: "Single Product", desc: "A one-page shop that sells one product, with what's inside, a warranty and FAQ.", layout: "split", bg: "#eef4ff", text: "#0b1b46", accent: "#1d4ed8", headline: "The Only Tool Kit You'll Ever Need", sub: "Everything for home repairs, in one box.", cta: "Order Now", status: "published", uses: 37, created: daysAgo(40) },
    { id: "launchly-landing", name: "Single Product", category: "Single Product", desc: "A bold launch page for one product, with pre-orders and early-bird pricing.", layout: "center", bg: "#0b0b1a", text: "#ffffff", accent: "#ff3d8b", headline: "One Product. Done Right.", sub: "Wireless earbuds with a 30-hour battery and a 2-year warranty.", cta: "Pre-order Now", status: "published", uses: 29, created: daysAgo(30) },
  ];
  const CATEGORIES = ["Fashion & Clothing", "Electronics & Gadgets", "Beauty & Cosmetics", "Grocery & Food", "Home & Furniture", "Jewelry & Accessories", "Single Product"];
  // Plans (prices per month in Taka). null means unlimited.
  //   pages/products/staff: how many the plan allows
  //   domain: can connect a custom domain (every plan also has its free shopilier.com sub-domain)
  //   freeDomain: a free custom domain comes with yearly billing
  //   support: chat with the Shopilier team from the dashboard
  const PLANS = () => ({
    starter: { name: "Starter", price: 149, pages: 10, products: 10, staff: 2, domain: true, freeDomain: false, support: true, blurb: "For getting started online" },
    business: { name: "Business", price: 549, pages: null, products: 100, staff: 10, domain: true, freeDomain: true, support: true, blurb: "For growing businesses" },
    pro: { name: "Pro", price: 2499, pages: null, products: null, staff: null, domain: true, freeDomain: true, support: true, blurb: "Everything unlimited" },
  });
  // null means unlimited
  const limitText = (n) => (n == null ? "Unlimited" : String(n));
  const withinLimit = (limit, count) => limit == null || count < limit;

  // Ad and analytics pixels a store owner can connect from Marketing.
  // IDs are checked against `pattern`, so they are safe to drop into the snippets below.
  const PIXELS = [
    { id: "meta", name: "Meta Pixel", covers: "Facebook, Instagram, Messenger & Threads ads", color: "#0866ff", letter: "f", logo: "M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z", label: "Pixel ID", placeholder: "123456789012345", pattern: /^\d{10,20}$/, where: "Meta Events Manager → Data sources → your pixel → Settings." },
    { id: "ga4", name: "Google Analytics 4", covers: "Visitors, traffic sources and sales reports", color: "#e37400", letter: "GA", logo: "M22.84 2.9982v17.9987c.0086 1.6473-1.3197 2.9897-2.967 2.9984a2.9808 2.9808 0 01-.3677-.0208c-1.528-.226-2.6477-1.5558-2.6105-3.1V3.1204c-.0369-1.5458 1.0856-2.8762 2.6157-3.1 1.6361-.1915 3.1178.9796 3.3093 2.6158.014.1201.0208.241.0202.3619zM4.1326 18.0548c-1.6417 0-2.9726 1.331-2.9726 2.9726C1.16 22.6691 2.4909 24 4.1326 24s2.9726-1.3309 2.9726-2.9726-1.331-2.9726-2.9726-2.9726zm7.8728-9.0098c-.0171 0-.0342 0-.0513.0003-1.6495.0904-2.9293 1.474-2.891 3.1256v7.9846c0 2.167.9535 3.4825 2.3505 3.763 1.6118.3266 3.1832-.7152 3.5098-2.327.04-.1974.06-.3983.0593-.5998v-8.9585c.003-1.6474-1.33-2.9852-2.9773-2.9882z", label: "Measurement ID", placeholder: "G-XXXXXXXXXX", pattern: /^G-[A-Z0-9]{4,12}$/, upper: true, where: "Google Analytics → Admin → Data streams → your website." },
    { id: "gads", name: "Google Ads", covers: "Search, YouTube, Shopping & Display ads", color: "#4285f4", letter: "G", logo: "M3.9998 22.9291C1.7908 22.9291 0 21.1383 0 18.9293s1.7908-3.9998 3.9998-3.9998 3.9998 1.7908 3.9998 3.9998-1.7908 3.9998-3.9998 3.9998zm19.4643-6.0004L15.4632 3.072C14.3586 1.1587 11.9121.5028 9.9988 1.6074S7.4295 5.1585 8.5341 7.0718l8.0009 13.8567c1.1046 1.9133 3.5511 2.5679 5.4644 1.4646 1.9134-1.1046 2.568-3.5511 1.4647-5.4644zM7.5137 4.8438L1.5645 15.1484A4.5 4.5 0 0 1 4 14.4297c2.5597-.0075 4.6248 2.1585 4.4941 4.7148l3.2168-5.5723-3.6094-6.25c-.4499-.7793-.6322-1.6394-.5878-2.4784z", label: "Conversion ID", placeholder: "AW-123456789", pattern: /^AW-\d{6,12}$/, upper: true, where: "Google Ads → Goals → Conversions → Tag setup → Google tag." },
    { id: "gtm", name: "Google Tag Manager", covers: "Manage many tags from one place", color: "#246fdb", letter: "TM", logo: "M12.003 0a3 3 0 0 0-2.121 5.121l6.865 6.865-4.446 4.541 1.745 1.836a3.432 3.432 0 0 1 .7.739l.012.011-.001.002a3.432 3.432 0 0 1 .609 1.953 3.432 3.432 0 0 1-.09.78l7.75-7.647c.031-.029.067-.05.098-.08.023-.023.038-.052.06-.076a2.994 2.994 0 0 0-.06-4.166l-9-9A2.99 2.99 0 0 0 12.003 0zM8.63 2.133L.88 9.809a2.998 2.998 0 0 0 0 4.238l7.7 7.75a3.432 3.432 0 0 1-.077-.729 3.432 3.432 0 0 1 3.431-3.431 3.432 3.432 0 0 1 .826.101l-5.523-5.81 4.371-4.373-2.08-2.08c-.903-.904-1.193-2.183-.898-3.342zm3.304 16.004a2.932 2.932 0 0 0-2.931 2.931A2.932 2.932 0 0 0 11.934 24a2.932 2.932 0 0 0 2.932-2.932 2.932 2.932 0 0 0-2.932-2.931z", label: "Container ID", placeholder: "GTM-XXXXXXX", pattern: /^GTM-[A-Z0-9]{4,10}$/, upper: true, where: "Tag Manager → your container ID at the top of the workspace." },
    { id: "tiktok", name: "TikTok Pixel", covers: "TikTok ads", color: "#000000", letter: "T", logo: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z", label: "Pixel ID", placeholder: "C4ABCDEFGHIJK12345", pattern: /^[A-Z0-9]{15,25}$/, upper: true, where: "TikTok Ads Manager → Tools → Events → Web events → your pixel." },
    { id: "snapchat", name: "Snap Pixel", covers: "Snapchat ads", color: "#fffc00", letter: "S", logo: "M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z", label: "Pixel ID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", pattern: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/, lower: true, where: "Snapchat Ads Manager → Events Manager → your pixel." },
    { id: "pinterest", name: "Pinterest Tag", covers: "Pinterest ads", color: "#bd081c", letter: "P", logo: "M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z", label: "Tag ID", placeholder: "2612345678901", pattern: /^\d{10,16}$/, where: "Pinterest Ads → Conversions → Tag manager." },
    { id: "x", name: "X (Twitter) Pixel", covers: "X ads", color: "#000000", letter: "X", logo: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z", label: "Pixel ID", placeholder: "o1abc", pattern: /^[a-z0-9]{4,12}$/, lower: true, where: "X Ads → Tools → Events manager → your pixel." },
    { id: "linkedin", name: "LinkedIn Insight Tag", covers: "LinkedIn ads", color: "#0a66c2", letter: "in", logo: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z", label: "Partner ID", placeholder: "1234567", pattern: /^\d{4,10}$/, where: "LinkedIn Campaign Manager → Analyze → Insight Tag." },
    { id: "microsoft", name: "Microsoft Advertising (UET)", covers: "Bing, Microsoft Start & Outlook ads", color: "#258ffa", letter: "M", logo: "M20.176 15.406a6.48 6.48 0 01-1.736 4.414c1.338-1.47.803-3.869-1.003-4.635-.862-.305-2.488-.85-3.367-1.158a1.834 1.834 0 01-.932-.818c-.381-.975-1.163-2.968-1.548-3.948-.095-.285-.31-.625-.265-.938.046-.598.724-1.003 1.276-.754l3.682 1.888c.621.292 1.305.692 1.796 1.172a6.486 6.486 0 012.097 4.777zm-1.44 1.888c-.264-1.194-1.135-1.744-2.216-2.028-1.527.902-4.853 2.878-6.952 4.13-1.103.68-2.13 1.35-2.919 1.242a2.866 2.866 0 01-2.77-2.325c-.012-.048-.008-.03-.001.01a6.4 6.4 0 00.947 2.653 6.498 6.498 0 005.486 3.022c1.908.062 3.536-1.153 5.099-2.096.292-.188.804-.496 1.332-.831l1.423-1.51c.553-.577.764-1.426.571-2.267zm-12.04 2.97c.422 0 .822-.1 1.173-.29.355-.215.964-.579 1.7-1.018L9.57 4.502c0-.99-.497-1.864-1.257-2.382-.08-.059-2.91-1.901-2.99-1.956-.605-.432-1.523.045-1.5.797v14.887l.417 2.36a2.488 2.488 0 002.455 2.056z", label: "UET tag ID", placeholder: "12345678", pattern: /^\d{5,12}$/, where: "Microsoft Advertising → Tools → UET tag." },
    { id: "reddit", name: "Reddit Pixel", covers: "Reddit ads", color: "#ff4500", letter: "r", logo: "M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286C.775 23.225 1.097 24 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0Zm4.388 3.199c1.104 0 1.999.895 1.999 1.999 0 1.105-.895 2-1.999 2-.946 0-1.739-.657-1.947-1.539v.002c-1.147.162-2.032 1.15-2.032 2.341v.007c1.776.067 3.4.567 4.686 1.363.473-.363 1.064-.58 1.707-.58 1.547 0 2.802 1.254 2.802 2.802 0 1.117-.655 2.081-1.601 2.531-.088 3.256-3.637 5.876-7.997 5.876-4.361 0-7.905-2.617-7.998-5.87-.954-.447-1.614-1.415-1.614-2.538 0-1.548 1.255-2.802 2.803-2.802.645 0 1.239.218 1.712.585 1.275-.79 2.881-1.291 4.64-1.365v-.01c0-1.663 1.263-3.034 2.88-3.207.188-.911.993-1.595 1.959-1.595Zm-8.085 8.376c-.784 0-1.459.78-1.506 1.797-.047 1.016.64 1.429 1.426 1.429.786 0 1.371-.369 1.418-1.385.047-1.017-.553-1.841-1.338-1.841Zm7.406 0c-.786 0-1.385.824-1.338 1.841.047 1.017.634 1.385 1.418 1.385.785 0 1.473-.413 1.426-1.429-.046-1.017-.721-1.797-1.506-1.797Zm-3.703 4.013c-.974 0-1.907.048-2.77.135-.147.015-.241.168-.183.305.483 1.154 1.622 1.964 2.953 1.964 1.33 0 2.47-.81 2.953-1.964.057-.137-.037-.29-.184-.305-.863-.087-1.795-.135-2.769-.135Z", label: "Pixel ID", placeholder: "a2_abc123xyz", pattern: /^([at]2_)?[a-z0-9_]{5,20}$/, lower: true, where: "Reddit Ads → Events Manager → your pixel." },
  ];
  // The platform's own logo (from Simple Icons), white on its brand color
  const pixelLogo = (p, cls = "") => `<span class="pixel-logo ${cls}" style="background:${p.color};color:${p.id === "snapchat" ? "#111" : "#fff"}" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="currentColor" d="${p.logo}"/></svg></span>`;
  const normalizePixelId = (p, v) => { v = String(v || "").trim(); return p.upper ? v.toUpperCase() : p.lower ? v.toLowerCase() : v; };

  // The code added to every page of a published store: { head, body }
  const trackingCode = (marketing = {}) => {
    const on = {};
    PIXELS.forEach((p) => {
      const px = (marketing.pixels || {})[p.id];
      if (px && px.on && p.pattern.test(px.id)) on[p.id] = px.id;
    });
    const head = [];
    const body = [];
    if (on.gtm) {
      head.push(`<!-- Google Tag Manager -->\n<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${on.gtm}');</script>`);
      body.push(`<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${on.gtm}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`);
    }
    const gtagIds = [on.ga4, on.gads].filter(Boolean);
    if (gtagIds.length) {
      head.push(`<!-- Google tag (Analytics / Ads) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=${gtagIds[0]}"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${gtagIds.map((id) => `gtag('config','${id}');`).join("")}</script>`);
    }
    if (on.meta) {
      head.push(`<!-- Meta Pixel -->\n<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${on.meta}');fbq('track','PageView');</script>`);
      body.push(`<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${on.meta}&ev=PageView&noscript=1"></noscript>`);
    }
    if (on.tiktok) head.push(`<!-- TikTok Pixel -->\n<script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${on.tiktok}');ttq.page();}(window,document,'ttq');</script>`);
    if (on.snapchat) head.push(`<!-- Snap Pixel -->\n<script>(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script',r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);})(window,document,'https://sc-static.net/scevent.min.js');snaptr('init','${on.snapchat}');snaptr('track','PAGE_VIEW');</script>`);
    if (on.pinterest) {
      head.push(`<!-- Pinterest Tag -->\n<script>!function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");pintrk('load','${on.pinterest}');pintrk('page');</script>`);
      body.push(`<noscript><img height="1" width="1" style="display:none" alt="" src="https://ct.pinterest.com/v3/?event=init&tid=${on.pinterest}&noscript=1"></noscript>`);
    }
    if (on.x) head.push(`<!-- X Pixel -->\n<script>!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments)},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');twq('config','${on.x}');</script>`);
    if (on.linkedin) {
      head.push(`<!-- LinkedIn Insight Tag -->\n<script>_linkedin_partner_id="${on.linkedin}";window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push(_linkedin_partner_id);(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s=document.getElementsByTagName("script")[0];var b=document.createElement("script");b.type="text/javascript";b.async=true;b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";s.parentNode.insertBefore(b,s)})(window.lintrk);</script>`);
      body.push(`<noscript><img height="1" width="1" style="display:none" alt="" src="https://px.ads.linkedin.com/collect/?pid=${on.linkedin}&fmt=gif"></noscript>`);
    }
    if (on.microsoft) head.push(`<!-- Microsoft Advertising UET -->\n<script>(function(w,d,t,r,u){var f,n,i;w[u]=w[u]||[],f=function(){var o={ti:"${on.microsoft}",enableAutoSpaTracking:true};o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad")},n=d.createElement(t),n.src=r,n.async=1,n.onload=n.onreadystatechange=function(){var s=this.readyState;s&&s!=="loaded"&&s!=="complete"||(f(),n.onload=n.onreadystatechange=null)},i=d.getElementsByTagName(t)[0],i.parentNode.insertBefore(n,i)})(window,document,"script","https://bat.bing.com/bat.js","uetq");</script>`);
    if (on.reddit) head.push(`<!-- Reddit Pixel -->\n<script>!function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);rdt('init','${on.reddit}');rdt('track','PageVisit');</script>`);
    if (marketing.headCode) head.push("<!-- Your custom code -->\n" + marketing.headCode);
    if (marketing.bodyCode) body.push("<!-- Your custom code -->\n" + marketing.bodyCode);
    return { head: head.join("\n\n"), body: body.join("\n\n") };
  };

  // ---------- Charts (Home pages) ----------
  // ↑/↓ change against the previous period, as a coloured badge
  const delta = (cur, prev, points = false) => {
    if (!prev) return `<span class="delta flat">${cur ? "New" : "—"}</span>`;
    const change = points ? cur - prev : ((cur - prev) / prev) * 100;
    const dir = change >= 0 ? "up" : "down";
    return `<span class="delta ${dir}">${icon(dir === "up" ? "arrowUp" : "arrowDown")}${Math.abs(Math.round(change))}${points ? " pts" : "%"}</span>`;
  };
  const shortDay = (t) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  // Smooth line through points (Catmull-Rom as cubic Béziers). Control points stay
  // between their two neighbours so the curve never overshoots, e.g. below ৳0.
  const smooth = (pts) => pts.map((p, i) => {
    if (!i) return `M${p[0].toFixed(1)},${p[1].toFixed(1)}`;
    const p0 = pts[i - 2] || pts[i - 1], p1 = pts[i - 1], p3 = pts[i + 1] || p;
    const lo = Math.min(p1[1], p[1]), hi = Math.max(p1[1], p[1]), clampY = (v) => Math.min(hi, Math.max(lo, v));
    const c1 = [p1[0] + (p[0] - p0[0]) / 6, clampY(p1[1] + (p[1] - p0[1]) / 6)], c2 = [p[0] - (p3[0] - p1[0]) / 6, clampY(p[1] - (p3[1] - p1[1]) / 6)];
    return `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  }).join("");
  // Daily line chart for this period against the previous one. valueFor(from, to) gives a day's value.
  const lineChart = (days, now, span, valueFor, money = true) => {
    const n = days, W = 760, H = 250, L = 50, R = 10, T = 10, B = 30;
    const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
    const daily = (offset) => Array.from({ length: n }, (_, i) => {
      const from = dayStart.getTime() - (n - 1 - i) * 864e5 - offset;
      return valueFor(from, from + 864e5);
    });
    const now1 = daily(0), prev1 = daily(span);
    const step = (v) => { const raw = v / 5, mag = 10 ** Math.floor(Math.log10(raw)); return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw); };
    const tick = step(Math.max(money ? 500 : 5, ...now1, ...prev1));
    const top = tick * 5;
    const x = (i) => L + (i / Math.max(1, n - 1)) * (W - L - R);
    const y = (v) => T + (1 - v / top) * (H - T - B);
    const pts = (arr) => arr.map((v, i) => [x(i), y(v)]);
    const cur = money ? "৳" : "";
    const short = (v) => v >= 1000 ? cur + (v / 1000).toFixed(v % 1000 ? 1 : 0).replace(/\.0$/, "") + "K" : cur + v;
    const labels = Array.from({ length: 8 }, (_, k) => Math.round((k / 7) * (n - 1)));
    const line = smooth(pts(now1));
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Per day, this period and the previous one">
      <defs><linearGradient id="sales-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#0e7a4b" stop-opacity=".2"/><stop offset="1" stop-color="#0e7a4b" stop-opacity="0"/></linearGradient></defs>
      ${Array.from({ length: 6 }, (_, k) => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(k * tick)}" y2="${y(k * tick)}"/><text x="${L - 10}" y="${y(k * tick) + 4}" text-anchor="end">${short(k * tick)}</text>`).join("")}
      ${labels.map((i) => `<line class="grid" x1="${x(i)}" x2="${x(i)}" y1="${T}" y2="${H - B}"/><text x="${x(i)}" y="${H - 8}" text-anchor="middle">${shortDay(dayStart.getTime() - (n - 1 - i) * 864e5)}</text>`).join("")}
      <path d="${line}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z" fill="url(#sales-fill)"/>
      <path class="prev" d="${smooth(pts(prev1))}"/>
      <path class="now" d="${line}"/>
      <circle class="dot" cx="${x(n - 1)}" cy="${y(now1[n - 1])}" r="4.5"/>
    </svg>`;
  };

  // Mini website renderer used for live previews.
  // site: { name, bg, text, accent, font, layout, headline, sub, cta, showProducts, showAbout, showContact, about, phone, email, address }
  const FONTS = {
    modern: 'ui-sans-serif, -apple-system, "Segoe UI", Inter, Helvetica, Arial, sans-serif',
    classic: 'Georgia, "Times New Roman", serif',
    friendly: '"Trebuchet MS", "Segoe UI", Verdana, sans-serif',
  };
  // products: { name, price, color, status }
  const SOCIAL_NAMES = { facebook: "Facebook", instagram: "Instagram", youtube: "YouTube", tiktok: "TikTok" };
  const siteHTML = (site, products = [], pages = []) => {
    const navPages = (pages.length ? pages.filter((p) => p.inNav).map((p) => p.title) : ["Home", "Shop", "About", "Contact"]).slice(0, 5);
    const prods = products.filter((p) => p.status !== "draft").slice(0, 6);
    const dark = isDark(site.bg);
    const socials = Object.entries(site.social || {}).filter(([k, v]) => v && SOCIAL_NAMES[k]);
    return `<div class="sp sp-${esc(site.layout || "split")}" style="--sp-bg:${esc(site.bg)};--sp-text:${esc(site.text)};--sp-accent:${esc(site.accent)};--sp-font:${FONTS[site.font] || FONTS.modern};--sp-soft:${dark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.04)"}">
      <header class="sp-nav"><b>${esc(site.name || "My Store")}</b><nav>${navPages.map((p) => `<span>${esc(p)}</span>`).join("")}</nav><span class="sp-burger">☰</span></header>
      <section class="sp-hero">
        <div class="sp-copy"><h1>${esc(site.headline)}</h1><p>${esc(site.sub)}</p><span class="sp-btn">${esc(site.cta || "Shop Now")}</span></div>
        <div class="sp-art"></div>
      </section>
      ${site.showProducts !== false ? `<section class="sp-sec"><h2>Products</h2>${prods.length ? `<div class="sp-grid">${prods.map((p) => `<div class="sp-item"><span class="sp-img" style="background:${esc(p.color || "#ddd")}"></span><b>${esc(p.name)}</b><em>${taka(p.price)}</em></div>`).join("")}</div>` : `<p class="sp-empty">Your products will appear here.</p>`}</section>` : ""}
      ${site.showAbout !== false ? `<section class="sp-sec sp-about"><h2>About us</h2><p>${esc(site.about || "Tell customers your story.")}</p></section>` : ""}
      ${site.showContact !== false ? `<section class="sp-sec sp-contact"><h2>Contact</h2><p>${[site.phone, site.email, site.address].filter(Boolean).map(esc).join(" · ") || "Add your phone, email and address."}</p></section>` : ""}
      <footer class="sp-foot">${socials.length ? `<span class="sp-social">${socials.map(([k]) => `<span>${SOCIAL_NAMES[k]}</span>`).join("")}</span>` : ""}© ${new Date().getFullYear()} ${esc(site.name || "My Store")} · Made with Shopilier</footer>
    </div>`;
  };
  const isDark = (hex) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ""));
    if (!m) return false;
    const n = parseInt(m[1], 16);
    return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 128;
  };

  return { esc, taka, uid, day, daysAgo, initials, avatar, tag, load, save, remove, toast, dialog, confirm, router, bars, icon, hydrateIcons, delta, lineChart, TEMPLATES, CATEGORIES, PLANS, PIXELS, pixelLogo, normalizePixelId, trackingCode, limitText, withinLimit, siteHTML, isDark };
})();
