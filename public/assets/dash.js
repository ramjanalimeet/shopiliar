// Shared helpers for the Shopiliar dashboards (/admin and /master-admin).
// Data is kept in this browser (localStorage) until a backend is connected.
const Dash = (() => {
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const taka = (n) => "৳" + Math.round(Number(n) || 0).toLocaleString("en-IN");
  const uid = (p = "id") => p + "_" + Math.random().toString(36).slice(2, 9);
  const day = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString();
  const initials = (name) => String(name || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const AVATAR = ["#d9730d", "#0b6e99", "#6940a5", "#ad1a72", "#0f7b6c", "#dfab01", "#e03e3e", "#64473a"];
  const avatar = (name) => {
    let h = 0;
    for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return `<span class="avatar" style="background:${AVATAR[h % AVATAR.length]}">${esc(initials(name))}</span>`;
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
        <div class="dialog-head"><h3>${esc(title)}</h3><button type="button" class="icon-btn" data-close aria-label="Close">✕</button></div>
        <div class="dialog-body">${body}</div>
        <div class="dialog-foot">
          <button type="button" class="btn" data-close>Cancel</button>
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
      document.getElementById("crumb").textContent = routes[route].title;
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

  const bars = (title, total, points) => {
    const max = Math.max(1, ...points.map((p) => p.v));
    return `<div class="chart"><div class="chart-head"><b>${esc(title)}</b><span class="muted">${esc(total)}</span></div>
      <div class="bars">${points.map((p) => `<div title="${esc(p.label)}: ${esc(p.text ?? p.v)}"><i style="height:${Math.round((p.v / max) * 100)}%"></i><span>${esc(p.label)}</span></div>`).join("")}</div></div>`;
  };

  // Template catalog shared by both dashboards (mirrors the public Templates page).
  const TEMPLATES = () => [
    { id: "luxe-store", name: "Luxe Store", category: "Online Store", desc: "A modern and elegant online store template for fashion, beauty and lifestyle brands.", layout: "split", bg: "#f7f4f0", text: "#111111", accent: "#111111", headline: "Modern Fashion For Everyone", sub: "Premium quality. Timeless style.", cta: "Shop Now", status: "published", uses: 214, created: daysAgo(120) },
    { id: "saas-landing", name: "SaaS Landing", category: "Landing Page", desc: "A clean and modern template for SaaS, startup and tech businesses.", layout: "center", bg: "#efedfd", text: "#121735", accent: "#4b5cf0", headline: "Build Better Products Faster", sub: "All the tools you need to launch, grow and manage your business.", cta: "Get Started", status: "published", uses: 96, created: daysAgo(90) },
    { id: "bistro-restaurant", name: "Bistro Restaurant", category: "Food & Drink", desc: "A stylish template for restaurants, cafes and food businesses.", layout: "bleed", bg: "#16110d", text: "#ffffff", accent: "#e8743b", headline: "Good Food Brings People Together", sub: "Fresh ingredients. Amazing taste. Unforgettable experience.", cta: "View Menu", status: "published", uses: 158, created: daysAgo(80) },
    { id: "nova-portfolio", name: "Nova Portfolio", category: "Portfolio", desc: "A minimalist portfolio template for creatives, designers and professionals.", layout: "split", bg: "#fafafa", text: "#111111", accent: "#111111", headline: "Product Designer & Creative Thinker", sub: "I design digital experiences that make a difference.", cta: "View My Work", status: "published", uses: 73, created: daysAgo(70) },
    { id: "growify-agency", name: "Growify Agency", category: "Agency", desc: "A modern template for agencies, consultancies and service-based businesses.", layout: "split", bg: "#fbfbfa", text: "#111111", accent: "#2f6b2a", headline: "We Help Brands Grow Online", sub: "Strategy, design, and development to take your business further.", cta: "Get Started", status: "published", uses: 61, created: daysAgo(60) },
    { id: "writely-blog", name: "Writely Blog", category: "Blog", desc: "A clean blog template for writers, creators and thought leaders.", layout: "split", bg: "#ffffff", text: "#111111", accent: "#3d6b8f", headline: "Stories, Ideas and Insights", sub: "A blog about design, business, productivity and life.", cta: "Read the Latest", status: "published", uses: 44, created: daysAgo(50) },
    { id: "fixly-services", name: "Fixly Services", category: "Services", desc: "A trustworthy template for repair, cleaning and local service businesses.", layout: "split", bg: "#eef4ff", text: "#0b1b46", accent: "#1d4ed8", headline: "Fast, Reliable Home Services", sub: "Book trusted local pros in under 60 seconds.", cta: "Book a Service", status: "published", uses: 37, created: daysAgo(40) },
    { id: "launchly-landing", name: "Launchly", category: "Landing Page", desc: "A bold one-page template to launch a product and collect sign-ups.", layout: "center", bg: "#0b0b1a", text: "#ffffff", accent: "#ff3d8b", headline: "Launch Your Idea This Weekend", sub: "Everything you need to go from idea to paying customers.", cta: "Get Early Access", status: "published", uses: 29, created: daysAgo(30) },
    { id: "mia-personal", name: "Mia Personal", category: "Personal", desc: "A warm personal site for your bio, links and contact details.", layout: "center", bg: "#fdf6ef", text: "#3b2418", accent: "#e0794f", headline: "Hi, I'm Mia", sub: "Writer, speaker & coffee lover.", cta: "Say Hello", status: "published", uses: 18, created: daysAgo(20) },
  ];
  const CATEGORIES = ["Online Store", "Business", "Portfolio", "Food & Drink", "Services", "Blog", "Agency", "Landing Page", "Personal"];
  const PLANS = () => ({
    starter: { name: "Starter", price: 149, pages: 5, products: 3 },
    business: { name: "Business", price: 549, pages: 100, products: 150 },
    pro: { name: "Pro", price: 2449, pages: null, products: null },
  });
  // null means unlimited
  const limitText = (n) => (n == null ? "Unlimited" : String(n));
  const withinLimit = (limit, count) => limit == null || count < limit;

  // Mini website renderer used for live previews.
  // site: { name, bg, text, accent, font, layout, headline, sub, cta, showProducts, showAbout, showContact, about, phone, email, address }
  const FONTS = {
    modern: 'ui-sans-serif, -apple-system, "Segoe UI", Inter, Helvetica, Arial, sans-serif',
    classic: 'Georgia, "Times New Roman", serif',
    friendly: '"Trebuchet MS", "Segoe UI", Verdana, sans-serif',
  };
  const siteHTML = (site, products = [], pages = []) => {
    const navPages = (pages.length ? pages.filter((p) => p.inNav).map((p) => p.title) : ["Home", "Shop", "About", "Contact"]).slice(0, 5);
    const prods = products.filter((p) => p.status !== "draft").slice(0, 6);
    const dark = isDark(site.bg);
    return `<div class="sp sp-${esc(site.layout || "split")}" style="--sp-bg:${esc(site.bg)};--sp-text:${esc(site.text)};--sp-accent:${esc(site.accent)};--sp-font:${FONTS[site.font] || FONTS.modern};--sp-soft:${dark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.04)"}">
      <header class="sp-nav"><b>${esc(site.name || "My Store")}</b><nav>${navPages.map((p) => `<span>${esc(p)}</span>`).join("")}</nav><span class="sp-burger">☰</span></header>
      <section class="sp-hero">
        <div class="sp-copy"><h1>${esc(site.headline)}</h1><p>${esc(site.sub)}</p><span class="sp-btn">${esc(site.cta || "Shop Now")}</span></div>
        <div class="sp-art"></div>
      </section>
      ${site.showProducts !== false ? `<section class="sp-sec"><h2>Products</h2>${prods.length ? `<div class="sp-grid">${prods.map((p) => `<div class="sp-item"><span class="sp-img" style="background:${esc(p.color || "#ddd")}"></span><b>${esc(p.name)}</b><em>${taka(p.price)}</em></div>`).join("")}</div>` : `<p class="sp-empty">Your products will appear here.</p>`}</section>` : ""}
      ${site.showAbout !== false ? `<section class="sp-sec sp-about"><h2>About us</h2><p>${esc(site.about || "Tell customers your story.")}</p></section>` : ""}
      ${site.showContact !== false ? `<section class="sp-sec sp-contact"><h2>Contact</h2><p>${[site.phone, site.email, site.address].filter(Boolean).map(esc).join(" · ") || "Add your phone, email and address."}</p></section>` : ""}
      <footer class="sp-foot">© ${new Date().getFullYear()} ${esc(site.name || "My Store")} · Made with Shopiliar</footer>
    </div>`;
  };
  const isDark = (hex) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ""));
    if (!m) return false;
    const n = parseInt(m[1], 16);
    return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 128;
  };

  return { esc, taka, uid, day, daysAgo, initials, avatar, tag, load, save, remove, toast, dialog, confirm, router, bars, TEMPLATES, CATEGORIES, PLANS, limitText, withinLimit, siteHTML, isDark };
})();
