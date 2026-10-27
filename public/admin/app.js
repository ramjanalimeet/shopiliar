// Shopilier store owner dashboard (/admin)
(async () => {
  const { esc, taka, uid, day, daysAgo, avatar, tag, load, toast, PIXELS, normalizePixelId, trackingCode, dialog, confirm, router, bars, icon, hydrateIcons, limitText, withinLimit } = Dash;
  const PLANS = Dash.PLANS();
  const SIGN_IN = "/signin.html?next=" + encodeURIComponent(location.pathname + location.search);

  // ---------- Data (saved to the signed-in account by the Worker) ----------
  let me;
  try {
    const res = await fetch("/api/me");
    if (res.status === 401) { location.href = SIGN_IN; return; }
    if (!res.ok) throw new Error();
    me = await res.json();
  } catch (e) {
    document.getElementById("view").innerHTML = '<p class="muted" style="padding:24px">Couldn\'t load your store. Check your connection and refresh the page.</p>';
    return;
  }
  const account = me.account;
  const catalog = (load("shopiliar.master", null) || {}).templates || Dash.TEMPLATES();
  const findTemplate = (id) => catalog.find((t) => t.id === id) || catalog[0];

  const seedStore = () => {
    const t = findTemplate(account.template);
    const products = [
      { name: "Accent Chair", price: 12500, stock: 8, category: "Living room", color: "#c8a98a" },
      { name: "Table Lamp", price: 3200, stock: 24, category: "Lighting", color: "#e9e4da" },
      { name: "Coffee Table", price: 9800, stock: 5, category: "Living room", color: "#8a6a4f" },
      { name: "Wall Art Print", price: 1500, stock: 40, category: "Decor", color: "#d9cfc4" },
      { name: "Minimal Chair", price: 6900, stock: 0, category: "Dining", color: "#b98a63" },
      { name: "Linen Cushion", price: 950, stock: 60, category: "Decor", color: "#ece3d3" },
    ].slice(0, account.demo ? PLANS[account.plan].products ?? 6 : 0)
      .map((p, i) => ({ id: uid("p"), status: "active", created: daysAgo(30 - i), ...p }));
    const people = [
      ["Sarah Rahman", "01711-234567", "Dhaka"], ["Tanvir Hasan", "01819-456789", "Chattogram"], ["Nusrat Jahan", "01912-345678", "Sylhet"],
      ["Rafiq Ahmed", "01611-987654", "Dhaka"], ["Mitu Akter", "01556-112233", "Khulna"], ["Imran Hossain", "01715-778899", "Rajshahi"],
    ];
    const customers = (account.demo ? people : []).map(([name, phone, city], i) => ({
      id: uid("c"), name, phone, city, email: name.toLowerCase().replace(/\s+/g, ".") + "@gmail.com", joined: daysAgo(40 - i * 5),
    }));
    // Real sign-ups start with an empty store; the demo store gets sample orders.
    const statuses = !account.demo ? [] : ["Delivered", "Delivered", "Shipped", "Paid", "Pending", "Delivered", "Cancelled", "Shipped", "Pending", "Paid"];
    const payments = ["bKash", "Cash on delivery", "Nagad", "bKash", "Cash on delivery", "Card"];
    const orders = statuses.map((status, i) => {
      const p = products[i % products.length];
      const qty = (i % 3) + 1;
      return {
        id: uid("o"), number: 1050 - i, customer: customers[i % customers.length].name, phone: customers[i % customers.length].phone,
        items: [{ name: p.name, qty, price: p.price }], total: p.price * qty, payment: payments[i % payments.length], status, date: daysAgo(i * 1.6),
      };
    });
    return {
      site: {
        name: account.business || "My Store", template: t.id, layout: t.layout, bg: t.bg, text: t.text, accent: t.accent, font: "modern",
        headline: t.headline, sub: t.sub, cta: t.cta, showProducts: true, showAbout: true, showContact: true,
        about: "We make simple, beautiful things for everyday life — designed and delivered across Bangladesh.",
        phone: "01700-000000", email: account.email, address: "Dhaka, Bangladesh",
      },
      published: false, publishedAt: null,
      products, customers, orders,
      pages: [
        { id: uid("pg"), title: "Home", slug: "", inNav: true, locked: true },
        { id: uid("pg"), title: "Shop", slug: "shop", inNav: true },
        { id: uid("pg"), title: "About", slug: "about", inNav: true },
        { id: uid("pg"), title: "Contact", slug: "contact", inNav: true },
      ],
      settings: {
        subdomain: (account.business || "mystore").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "mystore",
        domain: "", domainStatus: "", phone: "01700-000000", address: "Dhaka, Bangladesh",
        payments: { cod: true, bkash: true, nagad: false, card: false }, orderEmails: true,
      },
      visitors: Array.from({ length: 14 }, (_, i) => account.demo ? 180 + Math.round(Math.sin(i / 2) * 60 + i * 14) : 0),
      customized: false,
    };
  };
  const newStore = () => {
    const fresh = seedStore();
    // Text written in the sign-up flow (Create with AI) becomes the first version of the website
    let start = null;
    try { start = JSON.parse(sessionStorage.getItem("shopilier.start") || "null"); sessionStorage.removeItem("shopilier.start"); } catch (e) { /* storage blocked */ }
    // Only text from a sign-up in the last hour, so an old draft never lands in someone else's new store
    if (start && Date.now() - (start.at || 0) < 36e5) {
      ["headline", "sub", "cta", "about"].forEach((k) => { if (start[k]) fresh.site[k] = String(start[k]).slice(0, 300); });
      fresh.customized = !!start.headline;
    }
    return fresh;
  };
  const store = me.store || newStore();
  store.discounts ||= [];
  store.orders ||= []; store.products ||= []; store.customers ||= [];
  store.marketing ||= { pixels: {}, headCode: "", bodyCode: "" };
  store.backups ||= [];
  // Older versions of the history saved identical copies over and over. For each distinct website keep
  // your named backups; with none, the newest published copy; with neither, the newest automatic copy.
  {
    const groups = new Map();
    store.backups.forEach((b) => { const k = JSON.stringify(b.data); groups.set(k, [...(groups.get(k) || []), b]); });
    const keep = new Set();
    groups.forEach((list) => {
      const manual = list.filter((b) => b.kind === "manual");
      if (manual.length) manual.forEach((b) => keep.add(b));
      else keep.add(list.find((b) => b.kind === "publish") || list[0]); // the list is newest first
    });
    store.backups = store.backups.filter((b) => keep.has(b));
  }
  store.site.social ||= {};
  store.site.seo ||= { title: "", description: "" };
  // Pages are built from sections (hero, products, …) edited in the website editor
  SiteKit.ensure(store.site, store.pages, { products: store.products });
  let saveTimer = null, saving = Promise.resolve();
  const saveNow = () => {
    clearTimeout(saveTimer);
    saveTimer = null;
    saving = saving.then(async () => {
      const res = await fetch("/api/store", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store, account }) });
      if (res.status === 401) { location.href = SIGN_IN; return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // e.g. the new email belongs to another account: go back to what's saved
        if (res.status === 409) { const fresh = await fetch("/api/me").then((r) => r.json()); Object.assign(account, fresh.account); refreshChrome(); }
        throw new Error(data.error || "Couldn't save your changes. Check your connection.");
      }
      Object.assign(account, data.account);
      return true;
    }).catch((err) => { toast(err.message); return false; });
    return saving;
  };
  const persist = () => { refreshChrome(); clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 400); };
  // Send a pending save when the tab is closed
  window.addEventListener("pagehide", () => {
    if (!saveTimer) return;
    clearTimeout(saveTimer);
    fetch("/api/store", { method: "PUT", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ store, account }) }).catch(() => {});
  });

  // A template picked on the Templates page while signed in (/admin/?template=id)
  const picked = new URLSearchParams(location.search).get("template");
  if (picked && catalog.some((t) => t.id === picked) && picked !== store.site.template) {
    const t = findTemplate(picked);
    SiteKit.applyTemplate(store.site, store.pages, t);
    account.template = t.id;
    if (me.store) setTimeout(() => toast("Template changed to " + t.name));
  }
  if (picked) history.replaceState(null, "", location.pathname + location.hash);
  if (!me.store || picked) saveNow();
  const plan = () => PLANS[account.plan] || PLANS.starter;
  // Business and Pro get a free domain with yearly billing
  const hasFreeDomain = () => account.billing === "yearly" && account.plan !== "starter";

  // ---------- Chrome ----------
  // Active products with 3 or fewer left (0 = sold out)
  const lowStock = () => store.products.filter((p) => p.status !== "draft" && p.stock <= 3);
  let bellMenu = null, paintBell = () => {};
  let unreadReplies = 0;
  const refreshChrome = () => {
    const pending = store.orders.filter((o) => o.status === "Pending").length;
    document.querySelectorAll("[data-badge]").forEach((el) => { el.textContent = pending || ""; });
    const alerts = pending + lowStock().length + unreadReplies;
    document.getElementById("bell-count").textContent = alerts ? (alerts > 9 ? "9+" : alerts) : "";
    if (bellMenu && !bellMenu.hidden) paintBell();
    document.getElementById("me-avatar").innerHTML = avatar(account.name);
    document.getElementById("me-name").textContent = account.name.split(" ")[0];
    document.getElementById("me-store").textContent = siteUrl();
    document.getElementById("menu-name").textContent = account.name;
    document.getElementById("me-email").textContent = account.email;
    document.getElementById("me-plan").textContent = plan().name + " · " + (account.billing === "yearly" ? "Yearly" : "Monthly");
  };
  const profileBtn = document.getElementById("profile-btn");
  const profileMenu = document.getElementById("profile-menu");
  const toggleMenu = (open) => { profileMenu.hidden = !open; profileBtn.setAttribute("aria-expanded", String(open)); };
  profileBtn.addEventListener("click", (e) => { e.stopPropagation(); if (bellMenu) bellMenu.hidden = true; document.querySelectorAll(".dd-menu").forEach((m) => { m.hidden = true; }); toggleMenu(profileMenu.hidden); });
  document.addEventListener("click", (e) => { if (!profileMenu.hidden && !e.target.closest(".profile")) toggleMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !profileMenu.hidden) { toggleMenu(false); profileBtn.focus(); } });
  profileMenu.addEventListener("click", (e) => { if (e.target.closest("a")) toggleMenu(false); });
  document.getElementById("logout").addEventListener("click", async () => {
    const ok = await confirm("Log out?", "You'll go back to the sign-in page. Your store stays saved in your account.", "Log out");
    if (!ok) return;
    toggleMenu(false);
    if (saveTimer) await saveNow();
    await fetch("/api/signout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {});
    location.href = "/signin.html";
  });

  // ---------- Helpers ----------
  const ORDER_STATUS = { Pending: "yellow", Paid: "blue", Shipped: "purple", Delivered: "green", Cancelled: "red" };
  const PAYMENT_LABEL = SiteKit.PAYMENTS;
  // The Checkout page shows the payment methods turned on in Settings → Payments
  const syncPayments = () => { store.site.payments = Object.keys(PAYMENT_LABEL).filter((k) => store.settings.payments[k]).map((k) => PAYMENT_LABEL[k]); };
  syncPayments();
  // The Checkout page is part of every website, so it doesn't count toward the plan's pages
  const pageCount = () => store.pages.filter((p) => !p.system).length;
  const PAY_COLOR = { "Cash on delivery": "gray", bKash: "pink", Nagad: "orange", Card: "blue" };
  const sales = (orders) => orders.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);
  const siteUrl = () => store.settings.domain && store.settings.domainStatus === "connected" ? store.settings.domain : store.settings.subdomain + ".shopilier.com";
  const orderNo = (o) => "#" + o.number;
  const head = (title, desc, actions = "") => `<div class="page"><div class="page-head">${title ? `<div><h1>${title}</h1>${desc ? `<p>${desc}</p>` : ""}</div>` : ""}<div class="page-actions">${actions}</div></div>`;
  const statusTag = (s) => `<span class="tag dot ${ORDER_STATUS[s]}">${esc(s)}</span>`;
  const searchBox = (action, value, label) => `<label class="box-search">${icon("search")}<input data-action="${action}" value="${esc(value)}" placeholder="${label}" aria-label="${label}"></label>`;
  const limitCallout = (kind, used, limit) => limit == null ? "" : used >= limit
    ? `<div class="callout yellow"><span class="ico">${icon("alert")}</span><div><b>You've used all ${limit} ${kind} on the ${plan().name} plan.</b> <a class="u" href="#" data-settings="billing">Upgrade your plan</a> to add more.</div></div>`
    : "";
  const usage = (kind, used, limit) => limit == null ? `<span class="muted small">Unlimited ${kind}</span>` : `<span class="muted small">${used} / ${limit} ${kind}</span>`;

  // ---------- Home helpers ----------
  // Home shows a preset range (rolling days) or one calendar month, chosen in the top bar
  let period = { days: 30 };
  const RANGES = [[7, "Last 7 days"], [30, "Last 30 days"], [90, "Last 90 days"], [365, "Last 12 months"]];
  const monthName = (y, m) => new Date(y, m, 1).toLocaleString("en-GB", { month: "long", year: "numeric" });
  // from/to and the period before it, plus what the chart needs (number of days, end, offset to the previous period)
  const periodInfo = () => {
    const now = Date.now();
    if (period.month) {
      const { y, m } = period.month;
      const from = new Date(y, m, 1).getTime(), to = Math.min(new Date(y, m + 1, 1).getTime(), now);
      const prevFrom = new Date(y, m - 1, 1).getTime();
      return { from, to, prevFrom, prevTo: prevFrom + (to - from), days: Math.max(1, Math.ceil((to - from) / 864e5)), chartEnd: to - 1, span: from - prevFrom,
        vs: `vs. ${new Date(y, m - 1, 1).toLocaleString("en-GB", { month: "long" })}` };
    }
    const span = period.days * 864e5;
    return { from: now - span, to: now, prevFrom: now - 2 * span, prevTo: now - span, days: period.days, chartEnd: now, span, vs: `vs. previous ${period.days} days` };
  };
  // store.visitors holds the last 14 days, oldest first
  const visitorsBetween = (from, to) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const n = store.visitors.length;
    return store.visitors.reduce((sum, v, i) => { const t = today.getTime() - (n - 1 - i) * 864e5; return t >= new Date(from).setHours(0, 0, 0, 0) && t < to ? sum + v : sum; }, 0);
  };
  const inPeriod = (orders, from, to) => orders.filter((o) => { const t = new Date(o.date).getTime(); return t >= from && t < to; });
  const delta = Dash.delta;
  // Share of this period's customers who had ordered before
  const returning = (orders, from) => {
    const names = [...new Set(orders.map((o) => o.customer.toLowerCase()))];
    if (!names.length) return 0;
    const counts = {};
    orders.forEach((o) => { const k = o.customer.toLowerCase(); counts[k] = (counts[k] || 0) + 1; });
    const back = names.filter((n) => counts[n] > 1 || store.orders.some((o) => o.customer.toLowerCase() === n && new Date(o.date).getTime() < from));
    return (back.length / names.length) * 100;
  };
  // Daily line chart for this period against the previous one (shared with the master dashboard)
  const lineChart = (days, now, span, valueFor, money = true) => Dash.lineChart(days, now, span, valueFor, money);
  // Website preview with the store's products
  const stamp = (d) => d ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Not yet";
  // Any change to the website itself (design, text, pages, menu, preferences)
  // It also means the website no longer matches any saved version
  const touchSite = () => { store.siteSavedAt = new Date().toISOString(); store.currentVersion = null; };

  // ---------- Versions & backups of the website ----------
  const MAX_BACKUPS = 20;
  const snapshot = () => JSON.parse(JSON.stringify({ site: store.site, pages: store.pages }));
  // store.currentVersion: id of the saved version the website matches right now (cleared by any edit)
  // Falls back to comparing content, so it's known even right after the page loads
  const currentBackup = () => {
    const byId = store.backups.find((b) => b.id === store.currentVersion);
    if (byId) return byId;
    const now = JSON.stringify({ site: store.site, pages: store.pages });
    return store.backups.find((b) => JSON.stringify(b.data) === now);
  };
  const addBackup = (name, kind) => {
    const b = { id: uid("v"), name, kind, at: new Date().toISOString(), template: store.site.template, data: snapshot() };
    store.backups.unshift(b);
    store.currentVersion = b.id;
    // Over the limit: drop the oldest automatic copy first, then the oldest backup
    while (store.backups.length > MAX_BACKUPS) {
      const i = store.backups.map((b) => b.kind).lastIndexOf("auto");
      store.backups.splice(i >= 0 ? i : store.backups.length - 1, 1);
    }
    return b;
  };
  // What a version is called in the list; automatic ones always get the same short name
  // A name you give a version (Rename) wins; otherwise automatic ones get a plain name
  // A backup's title is the name you gave it, or else its date in large text
  // (names the app used to fill in by itself count as no name)
  const DEFAULT_NAME = /^(backup|my saved copy|backup \d.*)$/i;
  const named = (b) => b.title || (b.kind === "manual" && b.name && !DEFAULT_NAME.test(b.name) ? b.name : "");
  const versionTitle = (b) => named(b) || new Date(b.at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).replace(" at ", ", ");
  const versionHow = (b) => (b.kind === "auto" ? "Saved automatically" : b.kind === "publish" ? "Saved when you published" : "Saved by you");
  // The active backup: the one your website matches; with unsaved edits, the one that's live
  const activeBackup = () => currentBackup() || (store.published ? store.backups.find((b) => b.id === store.liveVersion) || store.backups.find((b) => b.kind === "publish") : null);
  // "Today at 3:56 pm", "Yesterday at …", "25 Oct 2026 at …"
  const versionWhen = (d) => {
    const t = new Date(d), start = new Date(d); start.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((today - start) / 864e5);
    return `${diff === 0 ? "Today" : diff === 1 ? "Yesterday" : day(d)} at ${t.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  };
  let showAllVersions = false;
  const closeVersionMenus = () => document.querySelectorAll(".v-menu").forEach((m) => { m.hidden = true; m.previousElementSibling.setAttribute("aria-expanded", "false"); });
  // Full-size and phone previews scale a real-width page down to fit their frame
  const fitPreviews = (root) => {
    const screens = root.querySelectorAll(".th-screen");
    const fit = () => screens.forEach((sc) => {
      const k = sc.clientWidth / Number(sc.dataset.w), f = sc.firstElementChild;
      f.style.transform = `scale(${k})`;
      f.style.height = (k ? sc.clientHeight / k : 0) + "px";
    });
    fit();
    const ro = new ResizeObserver(fit);
    screens.forEach((sc) => ro.observe(sc));
    return ro;
  };
  let previewObserver = null;
  const devicePreviews = (site, pages) => {
    const html = esc(SiteKit.documentHTML(site, pages, { products: store.products }));
    return `<div class="theme-stage">
      <div class="th-desktop"><div class="th-bar"><i></i><i></i><i></i><span>${esc(siteUrl())}</span></div><div class="th-screen" data-w="1280"><iframe class="th-canvas" style="width:1280px" srcdoc="${html}" title="Desktop preview" tabindex="-1" loading="lazy"></iframe></div></div>
      <div class="th-phone"><div class="th-screen" data-w="390"><iframe class="th-canvas" style="width:390px" srcdoc="${html}" title="Phone preview" tabindex="-1" loading="lazy"></iframe></div></div>
    </div>`;
  };
  const salesChart = (p) => lineChart(p.days, p.chartEnd, p.span, (from, to) => sales(inPeriod(store.orders, from, to)));
  const topProducts = (orders) => {
    if (!store.products.length) return `<p class="empty-note">No products yet. <a class="link" href="#/products" data-action="add-product">Add your first product</a></p>`;
    const sold = {};
    orders.filter((o) => o.status !== "Cancelled").forEach((o) => o.items.forEach((it) => {
      const s = sold[it.name] || (sold[it.name] = { qty: 0, revenue: 0 });
      s.qty += it.qty; s.revenue += it.qty * it.price;
    }));
    const list = store.products.map((p) => ({ p, ...(sold[p.name] || { qty: 0, revenue: 0 }) }))
      .sort((a, b) => b.revenue - a.revenue || b.qty - a.qty).slice(0, 4);
    return `<ul class="top-list">${list.map(({ p, qty, revenue }) => `<li><span class="top-img" style="background:${esc(p.color || "#eee")}">${icon("products")}</span><span class="t"><b>${esc(p.name)}</b><span>${qty} sold</span></span><span class="v">${taka(revenue)}</span></li>`).join("")}</ul>`;
  };
  const feature = (ico, title, text, action = '<button class="btn" disabled>Coming soon</button>') =>
    `<div class="card feature"><span class="mk-ico">${icon(ico)}</span><h3>${title}</h3><p>${text}</p>${action}</div>`;


  const orderRows = (orders, compact = false) => orders.length ? orders.map((o) => `
    <tr>
      <td><button class="t-title" data-action="view-order" data-id="${o.id}">${orderNo(o)}</button>${compact ? "" : `<span class="sub">${o.items.map((it) => esc(it.name) + " × " + it.qty).join(", ")}</span>`}</td>
      <td><span class="t-title" style="font-weight:500">${avatar(o.customer, "sm")}${esc(o.customer)}</span></td>
      <td class="muted">${day(o.date)}</td>
      ${compact ? "" : `<td>${tag(o.payment, PAY_COLOR[o.payment] || "gray")}</td>`}
      <td class="t-right" style="font-weight:600;color:var(--ink)">${taka(o.total)}</td>
      <td>${compact ? statusTag(o.status) : `<select class="select" style="height:32px;width:auto;font-size:13px" data-action="order-status" data-id="${o.id}" aria-label="Order status">${Object.keys(ORDER_STATUS).map((s) => `<option${s === o.status ? " selected" : ""}>${s}</option>`).join("")}</select>`}</td>
      ${compact ? "" : `<td class="t-actions"><button class="icon-btn" data-action="view-order" data-id="${o.id}" aria-label="View order">${icon("eye")}</button><button class="icon-btn danger" data-action="delete-order" data-id="${o.id}" aria-label="Delete order">${icon("trash")}</button></td>`}
    </tr>`).join("") : `<tr><td colspan="7" class="table-empty">No orders yet. They'll appear here as soon as customers buy.</td></tr>`;
  const orderTable = (orders, compact = false) => `<div class="table-wrap"><table class="table">
      <thead><tr><th>Order</th><th>Customer</th><th>Date</th>${compact ? "" : "<th>Payment</th>"}<th class="t-right">Total</th><th>Status</th>${compact ? "" : '<th class="t-actions"></th>'}</tr></thead>
      <tbody>${orderRows(orders, compact)}</tbody></table></div>`;

  // ---------- Views ----------
  let orderFilter = "All", orderSearch = "", productView = "table", productSearch = "";

  // Backups, newest first. The active one is highlighted in the brand green; each row has
  // Preview (opens it in a new tab) and a ⋯ menu with Publish, Rename and Delete.
  const versionList = () => {
    if (!store.backups.length) return `<div class="versions-empty">${icon("history")}<b>No backups yet</b><span>Click <b>Save a backup</b> to keep your website as it is now. A backup is also saved every time you publish.</span></div>`;
    const list = showAllVersions ? store.backups : store.backups.slice(0, 6), active = activeBackup();
    const rows = list.map((b) => {
      const on = b === active;
      return `<div class="version${on ? " current" : ""}">
        <span class="v-dot ${b.kind}">${icon(on ? "check" : b.kind === "publish" ? "rocket" : b.kind === "auto" ? "history" : "archive")}</span>
        <div class="v-text">
          <span class="v-title"><b>${esc(versionTitle(b))}</b>${on ? '<span class="v-badge">Active</span>' : ""}</span>
          <span class="muted small">${versionHow(b)}${named(b) ? ` · ${versionWhen(b.at)}` : ""}</span>
        </div>
        <div class="v-actions">
          <button class="btn btn-sm" data-action="preview-version" data-id="${b.id}" title="Open this backup in a new tab">${icon("external")}Preview</button>
          <div class="v-more">
            <button class="icon-btn" data-action="version-menu" data-id="${b.id}" aria-haspopup="menu" aria-expanded="false" aria-label="More options for ${esc(versionTitle(b))}" title="More options">${icon("dots")}</button>
            <div class="v-menu" role="menu" hidden>
              <button role="menuitem" data-action="publish-version" data-id="${b.id}">${icon("rocket")}<span><b>Publish</b><small>${b === currentBackup() ? "Put your website live as it is now" : "Bring this backup back and put it live"}</small></span></button>
              <button role="menuitem" data-action="rename-version" data-id="${b.id}">${icon("edit")}<span><b>Rename</b><small>Give this backup a name</small></span></button>
              <button role="menuitem" class="danger" data-action="delete-version" data-id="${b.id}">${icon("trash")}<span><b>Delete</b><small>Remove this backup for good</small></span></button>
            </div>
          </div>
        </div>
      </div>`;
    }).join("");
    const more = store.backups.length > 6 ? `<button class="versions-more" data-action="toggle-versions">${showAllVersions ? "Show fewer" : `Show all ${store.backups.length} backups`}${icon("chevronDown")}</button>` : "";
    return `<div class="versions">${rows}</div>${more}`;
  };
  // Make the website a saved version (the current website is kept first, unless it's already saved)
  const restoreVersion = (b) => {
    if (!currentBackup()) addBackup("", "auto");
    const data = JSON.parse(JSON.stringify(b.data));
    store.site = data.site; store.pages = data.pages;
    store.site.social ||= {}; store.site.seo ||= { title: "", description: "" };
    SiteKit.ensure(store.site, store.pages, { products: store.products });
    syncPayments();
    account.template = store.site.template;
    store.customized = true; touchSite(); store.currentVersion = b.id;
  };

  const routes = {
    home: {
      title: "Home",
      render: () => {
        const p = periodInfo();
        const cur = inPeriod(store.orders, p.from, p.to), prev = inPeriod(store.orders, p.prevFrom, p.prevTo);
        // Visitor numbers only go back 14 days, so compare only when the previous period fits inside them
        const visits = visitorsBetween(p.from, p.to);
        const visitsPrev = p.prevFrom >= Date.now() - 14 * 864e5 ? visitorsBetween(p.prevFrom, p.prevTo) : null;
        const vsText = `<span class="muted">${p.vs}</span>`;
        const stat = (label, value, ico, color, d) => `<div class="stat"><div class="stat-top"><span class="stat-label">${label}</span><span class="stat-ico ${color}">${icon(ico)}</span></div><div class="stat-value">${value}</div><div class="stat-delta">${d}</div></div>`;
        const curSales = sales(cur), prevSales = sales(prev);
        const ret = returning(cur, p.from), retPrev = returning(prev, p.prevFrom);
        return `<div class="page">
          ${store.published ? "" : `<div class="callout yellow"><span class="ico">${icon("rocket")}</span><div><b>Your website isn't live yet.</b> Customize it, then publish when you're ready.</div><a class="btn btn-sm btn-dark" href="#/website">Customize &amp; publish</a></div>`}
          <div class="stats">
            ${stat("Total sales", taka(curSales), "bag", "c1", delta(curSales, prevSales) + vsText)}
            ${stat("Total orders", cur.length.toLocaleString("en-IN"), "cart", "c2", delta(cur.length, prev.length) + vsText)}
            ${stat("Online store sessions", visits.toLocaleString("en-IN"), "barchart", "c3", store.published || visits ? (visitsPrev ? delta(visits, visitsPrev) + vsText : '<span class="muted">Visitor counts cover the last 14 days</span>') : '<span class="muted">Counting starts when you publish</span>')}
            ${stat("Returning customers", ret.toFixed(1).replace(/\.0$/, "") + "%", "customers", "c4", delta(ret, retPrev, true) + vsText)}
          </div>
          <div class="home-grid">
            <div class="home-main">
              <div class="card"><div class="card-head"><span class="card-title">Sales overview</span><a class="btn" href="#/analytics">View report</a></div>
                <div class="card-body">
                  <div class="sales-top"><span class="sales-total">${taka(curSales)}</span><span class="stat-delta" style="margin:0">${delta(curSales, prevSales)}${vsText}</span>
                    <span class="legend"><span><i></i>This period</span><span><i class="prev"></i>Previous period</span></span></div>
                  ${salesChart(p)}
                </div></div>
              <div class="card"><div class="card-head"><span class="card-title">Recent orders</span><a class="link" href="#/orders">View all</a></div>
                <div class="table-wrap"><table class="orders-mini">
                  <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
                  <tbody>${store.orders.length ? store.orders.slice(0, 5).map((o) => {
                    const n = o.items.reduce((a, it) => a + it.qty, 0);
                    return `<tr><td><button class="ord" data-action="view-order" data-id="${o.id}">${orderNo(o)}</button></td><td>${esc(o.customer)}</td><td>${n} item${n === 1 ? "" : "s"}</td><td>${taka(o.total)}</td><td><span class="pill ${esc(o.status)}">${esc(o.status)}</span></td></tr>`;
                  }).join("") : `<tr><td colspan="5" class="table-empty">No orders yet. They'll appear here as soon as customers buy.</td></tr>`}</tbody>
                </table></div></div>
            </div>
            <div class="home-side">
              <div class="card"><div class="card-body" style="padding-top:20px">
                <div class="live-top"><span class="card-title">Visitors</span><span class="live-dot ${store.published ? "" : "off"}">${store.published ? "Live" : "Offline"}</span></div>
                <div class="live-value">${store.visitors.reduce((a, b) => a + b, 0).toLocaleString("en-IN")}</div>
                <div class="muted">visitors in the last 14 days</div>
                <div class="spark">${(() => { const max = Math.max(1, ...store.visitors); return store.visitors.map((v) => `<i style="height:${Math.max(7, (v / max) * 100)}%" title="${v}"></i>`).join(""); })()}</div>
              </div></div>
              <div class="card"><div class="card-head"><span class="card-title">Top products</span><a class="link" href="#/products">View all</a></div>
                <div class="card-body">${topProducts(cur)}</div></div>
              <div class="card"><div class="card-head"><a class="card-title card-title-link" href="#/marketing">Marketing${icon("chevronRight")}</a></div>
                <div class="card-body"><div class="mk-list">
                  <button class="mk-item" data-action="add-discount"><span class="mk-ico">${icon("tag")}</span><span class="t"><b>Create discount</b><span>Run a promotion to boost sales</span></span>${icon("chevronRight")}</button>
                  <a class="mk-item" href="#/marketing"><span class="mk-ico">${icon("mail")}</span><span class="t"><b>Create email campaign</b><span>Reach more customers</span></span>${icon("chevronRight")}</a>
                  <a class="mk-item" href="#/marketing"><span class="mk-ico">${icon("megaphone")}</span><span class="t"><b>Create ad campaign</b><span>Grow your audience</span></span>${icon("chevronRight")}</a>
                </div></div></div>
            </div>
          </div>
        </div>`;
      },
    },

    marketing: {
      title: "Marketing",
      render: () => {
        const mk = store.marketing;
        const connected = PIXELS.filter((p) => mk.pixels[p.id]?.id).length;
        return `${head("Marketing", "Connect your ad accounts so you can measure and run paid campaigns.",
          `<button class="btn" data-action="view-code">${icon("code")}View installed code</button><button class="btn btn-primary" data-action="add-discount">${icon("plus")}Create discount</button>`)}
          <div class="callout blue"><span class="ico">${icon("info")}</span><div>Pixels and custom code are added to <b>every page of your website</b> once it's published, so your ad platforms can count visits and build audiences.</div></div>
          <div class="card"><div class="card-head"><span class="card-title">Ad &amp; analytics pixels<small>${connected} of ${PIXELS.length} connected</small></span></div>
            <div class="pixel-list">${PIXELS.map((p) => {
              const px = mk.pixels[p.id];
              const status = !px?.id ? '<span class="tag gray">Not connected</span>' : px.on ? '<span class="tag dot green">Active</span>' : '<span class="tag dot yellow">Paused</span>';
              return `<div class="pixel">
                <span class="pixel-logo" style="background:${p.color}${p.id === "snapchat" ? ";color:#111" : ""}">${esc(p.letter)}</span>
                <span class="t"><b>${esc(p.name)}</b><span>${esc(p.covers)}</span>${px?.id ? `<code>${esc(p.label)}: ${esc(px.id)}</code>` : ""}</span>
                ${status}
                ${px?.id ? `<label class="switch" title="${px.on ? "Pause" : "Turn on"}"><input type="checkbox" data-action="pixel-on" data-id="${p.id}" ${px.on ? "checked" : ""} aria-label="${esc(p.name)} on"><i></i></label>` : ""}
                <button class="btn btn-sm${px?.id ? "" : " btn-primary"}" data-action="pixel-edit" data-id="${p.id}">${px?.id ? "Edit" : "Connect"}</button>
                ${px?.id ? `<button class="icon-btn danger" data-action="pixel-remove" data-id="${p.id}" aria-label="Remove ${esc(p.name)}">${icon("trash")}</button>` : ""}
              </div>`;
            }).join("")}</div></div>
          <div class="card"><div class="card-head"><span class="card-title">Custom code</span></div>
            <form class="card-body" id="code-form">
              <p class="muted" style="margin-bottom:14px">For any other platform or tool (for example Quora, Taboola, Hotjar or a chat widget). Paste the code they give you. Only use code from services you trust: it runs on every page of your website.</p>
              <div class="field"><label for="head-code">Code for the &lt;head&gt; of every page</label><textarea class="textarea code" id="head-code" name="headCode" maxlength="20000" placeholder="<script>…</script>" spellcheck="false">${esc(mk.headCode)}</textarea></div>
              <div class="field"><label for="body-code">Code for the end of the &lt;body&gt;</label><textarea class="textarea code" id="body-code" name="bodyCode" maxlength="20000" placeholder="<noscript>…</noscript>" spellcheck="false">${esc(mk.bodyCode)}</textarea></div>
              <div style="display:flex;justify-content:flex-end"><button class="btn btn-primary" type="submit">Save code</button></div>
            </form></div>
          <div class="feature-grid" style="margin-top:20px">
            ${feature("tag", "Discount codes", `Codes like EID20 for a percentage or Taka off. You have ${store.discounts.length}.`, `<a class="btn" href="#/discounts">Manage discounts</a>`)}
            ${feature("mail", "Email campaigns", "Send news and offers to your customers by email.")}
            ${feature("phone", "SMS campaigns", "Text offers straight to your customers' phones.")}
          </div>
        </div>`;
      },
      mount: (view) => {
        view.querySelector("#code-form").addEventListener("submit", (e) => {
          e.preventDefault();
          store.marketing.headCode = e.target.elements.headCode.value.trim();
          store.marketing.bodyCode = e.target.elements.bodyCode.value.trim();
          persist();
          toast("Custom code saved");
        });
      },
    },

    discounts: {
      title: "Discounts",
      render: () => `${head("Discounts", "Codes customers can use for money off.", `<button class="btn btn-primary" data-action="add-discount">${icon("plus")}Create discount</button>`)}
        <div class="card"><div class="table-wrap"><table class="table">
          <thead><tr><th>Code</th><th>Discount</th><th>Status</th><th>Created</th><th class="t-actions"></th></tr></thead>
          <tbody>${store.discounts.length ? store.discounts.map((d) => `<tr>
            <td class="t-title">${esc(d.code)}</td>
            <td>${d.type === "percent" ? esc(d.value) + "% off" : taka(d.value) + " off"}${d.min ? `<span class="sub">On orders over ${taka(d.min)}</span>` : ""}</td>
            <td><label class="switch" title="${d.active ? "Active" : "Paused"}"><input type="checkbox" data-action="discount-active" data-id="${d.id}" ${d.active ? "checked" : ""} aria-label="Active"><i></i></label></td>
            <td class="muted">${day(d.created)}</td>
            <td class="t-actions"><button class="icon-btn danger" data-action="delete-discount" data-id="${d.id}" aria-label="Delete discount">${icon("trash")}</button></td>
          </tr>`).join("") : `<tr><td colspan="5" class="table-empty">No discounts yet. Create one to run a promotion.</td></tr>`}</tbody>
        </table></div></div></div>`,
    },

    orders: {
      title: "Orders",
      render: () => {
        const tabs = ["All", ...Object.keys(ORDER_STATUS)];
        const q = orderSearch.toLowerCase();
        const list = store.orders
          .filter((o) => orderFilter === "All" || o.status === orderFilter)
          .filter((o) => !q || (o.customer + " " + o.number + " " + o.phone + " " + o.items.map((i) => i.name).join(" ")).toLowerCase().includes(q));
        return `${head("Orders", "Track every order from pending to delivered. Change a status right in the table.", `<button class="btn btn-primary" data-action="add-order">${icon("plus")}New order</button>`)}
          <div class="card">
            <div class="card-head"><div class="seg" style="margin-right:auto">${tabs.map((t) => `<button class="${t === orderFilter ? "on" : ""}" data-action="order-tab" data-tab="${t}">${t}<span>${t === "All" ? store.orders.length : store.orders.filter((o) => o.status === t).length}</span></button>`).join("")}</div>
            ${searchBox("order-search", orderSearch, "Search orders")}</div>
            ${orderTable(list)}
          </div>
        </div>`;
      },
    },

    products: {
      title: "Products",
      render: () => {
        const q = productSearch.toLowerCase();
        const list = store.products.filter((p) => !q || (p.name + " " + p.category).toLowerCase().includes(q));
        const canAdd = withinLimit(plan().products, store.products.length);
        return `${head("Products", "Everything you sell. Click a product to edit it.", `${usage("products", store.products.length, plan().products)}<button class="btn btn-primary" data-action="add-product" ${canAdd ? "" : "disabled"}>${icon("plus")}Add product</button>`)}
          ${limitCallout("products", store.products.length, plan().products)}
          <div class="card">
            <div class="card-head">
              <div class="seg" style="margin-right:auto">
                <button class="${productView === "table" ? "on" : ""}" data-action="product-view" data-view="table">${icon("list")}List</button>
                <button class="${productView === "gallery" ? "on" : ""}" data-action="product-view" data-view="gallery">${icon("grid")}Grid</button>
              </div>
              ${searchBox("product-search", productSearch, "Search products")}
            </div>
            ${productView === "table" ? `
            <div class="table-wrap"><table class="table">
              <thead><tr><th>Product</th><th>Category</th><th class="t-right">Price</th><th class="t-right">Stock</th><th>Status</th><th class="t-actions"></th></tr></thead>
              <tbody>${list.length ? list.map((p) => `
                <tr>
                  <td><button class="t-title" data-action="edit-product" data-id="${p.id}"><span class="thumb" style="background:${esc(p.color)}"></span>${esc(p.name)}</button></td>
                  <td>${tag(p.category || "General", "brown")}</td>
                  <td class="t-right" style="font-weight:600;color:var(--ink)">${taka(p.price)}</td>
                  <td class="t-right">${p.stock > 0 ? p.stock : '<span class="tag red">Out of stock</span>'}</td>
                  <td>${p.status === "draft" ? '<span class="tag dot gray">Draft</span>' : '<span class="tag dot green">Active</span>'}</td>
                  <td class="t-actions"><button class="icon-btn" data-action="edit-product" data-id="${p.id}" aria-label="Edit ${esc(p.name)}">${icon("edit")}</button><button class="icon-btn danger" data-action="delete-product" data-id="${p.id}" aria-label="Delete ${esc(p.name)}">${icon("trash")}</button></td>
                </tr>`).join("") : `<tr><td colspan="6" class="table-empty">No products yet — add your first one.</td></tr>`}</tbody>
            </table></div>` : `
            <div class="card-body"><div class="gallery">${list.map((p) => `
              <div class="g-card">
                <div class="g-cover" style="background:${esc(p.color)}">${p.status === "draft" ? '<span class="tag gray">Draft</span>' : ""}</div>
                <div class="g-body"><div class="g-title">${esc(p.name)}</div><div class="g-meta"><b style="color:var(--ink)">${taka(p.price)}</b>${tag(p.category || "General", "brown")}<span class="muted small">${p.stock} in stock</span></div>
                <div class="g-actions"><button class="btn btn-sm" data-action="edit-product" data-id="${p.id}">${icon("edit")}Edit</button><button class="icon-btn danger" data-action="delete-product" data-id="${p.id}" aria-label="Delete ${esc(p.name)}">${icon("trash")}</button></div></div>
              </div>`).join("") || '<p class="muted">No products yet.</p>'}</div></div>`}
          </div>
        </div>`;
      },
    },

    customers: {
      title: "Customers",
      render: () => {
        const stats = (c) => { const os = store.orders.filter((o) => o.customer === c.name); return { count: os.length, spent: sales(os) }; };
        return `${head("Customers", "People who bought from you. Totals update automatically from your orders.", `<button class="btn btn-primary" data-action="add-customer">${icon("plus")}Add customer</button>`)}
          <div class="card"><div class="card-head"><span class="card-title">All customers<small>${store.customers.length}</small></span></div>
          <div class="table-wrap"><table class="table">
            <thead><tr><th>Customer</th><th>Phone</th><th>City</th><th class="t-right">Orders</th><th class="t-right">Total spent</th><th>Since</th><th class="t-actions"></th></tr></thead>
            <tbody>${store.customers.length ? store.customers.map((c) => { const s = stats(c); return `
              <tr><td><span class="t-title">${avatar(c.name)}<span>${esc(c.name)}<span class="sub">${esc(c.email || "")}</span></span></span></td><td class="muted">${esc(c.phone)}</td><td>${c.city ? tag(c.city, "blue") : '<span class="muted">—</span>'}</td>
              <td class="t-right">${s.count}</td><td class="t-right" style="font-weight:600;color:var(--ink)">${taka(s.spent)}</td><td class="muted">${day(c.joined)}</td>
              <td class="t-actions"><button class="icon-btn danger" data-action="delete-customer" data-id="${c.id}" aria-label="Delete ${esc(c.name)}">${icon("trash")}</button></td></tr>`; }).join("") : '<tr><td colspan="7" class="table-empty">No customers yet.</td></tr>'}</tbody>
          </table></div></div>
        </div>`;
      },
    },

    analytics: {
      title: "Analytics",
      render: () => {
        const days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(Date.now() - (6 - i) * 864e5);
          const v = sales(store.orders.filter((o) => new Date(o.date).toDateString() === d.toDateString()));
          return { label: d.toLocaleDateString("en-GB", { weekday: "short" }), v, text: taka(v) };
        });
        const vis = store.visitors.map((v, i) => ({ label: String(new Date(Date.now() - (13 - i) * 864e5).getDate()), v }));
        const top = {};
        store.orders.filter((o) => o.status !== "Cancelled").forEach((o) => o.items.forEach((it) => { top[it.name] = (top[it.name] || 0) + it.qty * it.price; }));
        const topList = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const sources = [["Facebook", 46], ["Google", 24], ["Direct", 18], ["Instagram", 12]];
        const done = store.orders.filter((o) => o.status !== "Cancelled");
        return `${head("Analytics", "How your website and sales are doing.")}
          <div class="stats">
            <div class="stat"><div class="stat-top"><span class="stat-label">Revenue</span><span class="stat-ico c1">${icon("money")}</span></div><div class="stat-value">${taka(sales(store.orders))}</div><div class="stat-delta">All time</div></div>
            <div class="stat"><div class="stat-top"><span class="stat-label">Average order</span><span class="stat-ico c2">${icon("orders")}</span></div><div class="stat-value">${taka(done.length ? sales(done) / done.length : 0)}</div><div class="stat-delta">${done.length} orders</div></div>
            <div class="stat"><div class="stat-top"><span class="stat-label">Visitors · 14 days</span><span class="stat-ico c3">${icon("eye")}</span></div><div class="stat-value">${store.visitors.reduce((a, b) => a + b, 0).toLocaleString("en-IN")}</div><div class="stat-delta">Sample data</div></div>
            <div class="stat"><div class="stat-top"><span class="stat-label">Customers</span><span class="stat-ico c4">${icon("customers")}</span></div><div class="stat-value">${store.customers.length}</div><div class="stat-delta">All time</div></div>
          </div>
          <div class="grid-2" style="margin-top:18px">
            <div class="card"><div class="card-head"><span class="card-title">Sales<small>last 7 days</small></span><span class="muted">${taka(days.reduce((a, b) => a + b.v, 0))}</span></div><div class="card-body">${bars(days)}</div></div>
            <div class="card"><div class="card-head"><span class="card-title">Visitors<small>last 14 days</small></span></div><div class="card-body">${bars(vis)}</div></div>
          </div>
          <div class="grid-2" style="margin-top:18px">
            <div class="card"><div class="card-head"><span class="card-title">Top products</span></div><div class="table-wrap"><table class="table" style="min-width:0"><thead><tr><th>Product</th><th class="t-right">Sales</th></tr></thead><tbody>${topList.map(([n, v]) => `<tr><td class="t-title">${esc(n)}</td><td class="t-right">${taka(v)}</td></tr>`).join("") || '<tr><td colspan="2" class="table-empty">No sales yet</td></tr>'}</tbody></table></div></div>
            <div class="card"><div class="card-head"><span class="card-title">Traffic sources</span><span class="muted small">Sample data</span></div><div class="card-body">${sources.map(([n, p]) => `<div class="meter"><div class="meter-top"><span>${n}</span><span class="muted">${p}%</span></div><div class="progress"><i style="width:${p}%"></i></div></div>`).join("")}</div></div>
          </div>
        </div>`;
      },
    },

    themes: {
      title: "Themes",
      render: () => {
        const t = findTemplate(store.site.template);
        const s = store.site;
        return `${head("Themes", "", `<button class="btn" data-action="view-store">${icon("eye")}View your store</button>`)}
          <div class="card theme-card">
            ${devicePreviews(s, store.pages)}
            <div class="theme-info">
              <span class="theme-thumb" style="background:linear-gradient(135deg,${esc(s.bg)} 55%,${esc(s.accent)})"></span>
              <div class="theme-meta">
                <div class="theme-name"><b>${esc(t.name)}</b><span class="tag green">Current theme</span>${store.published ? "" : '<span class="tag dot yellow">Not published</span>'}</div>
                <span class="muted small">Last saved: ${stamp(store.siteSavedAt || store.publishedAt)}</span>
              </div>
              <a class="btn btn-dark" href="#/website">${icon("brush")}Customize</a>
            </div>
          </div>

          <div class="card versions-card">
            <div class="card-head"><div class="versions-title"><span class="card-title">Website backups</span><span class="muted small">Go back to an older look any time. Your products and orders never change.</span></div>
              <button class="btn" data-action="create-backup">${icon("archive")}Save a backup</button></div>
            ${versionList()}
          </div>
        </div>`;
      },
      mount: (view) => { if (previewObserver) previewObserver.disconnect(); previewObserver = fitPreviews(view); },
    },

    navigation: {
      title: "Navigation",
      render: () => {
        const menu = store.pages.filter((p) => p.inNav);
        // The real header of the website, so the preview matches it exactly
        const bar = esc(SiteKit.documentHTML(store.site, store.pages, { page: store.pages[0], products: store.products, headerOnly: true }));
        return `${head("Navigation", "The menu at the top of your website. Drag ⋮⋮ to change the order, or use ⋯ to edit an item.",
          `<button class="btn btn-primary" data-action="nav-add-item">${icon("plus")}Add menu item</button>`)}
          <div class="card nav-live">
            <div class="nav-live-head"><span class="nav-live-dot">Live preview</span><span class="muted small">This is how the menu looks on your website</span></div>
            <div class="nav-live-frame"><div class="nav-live-inner"><iframe class="nav-frame" srcdoc="${bar}" title="Menu preview" tabindex="-1"></iframe></div></div>
          </div>
          <div class="card">
            <div class="card-head"><span class="card-title">Main menu</span><span class="muted small">${menu.length} ${menu.length === 1 ? "item" : "items"} · the first 5 show on your website</span></div>
            ${menu.length ? `<ul class="nav-list" id="nav-list">${menu.map((p, i) => `
              <li class="nav-row" data-id="${p.id}">
                <button type="button" class="nav-handle" aria-label="Move ${esc(p.title)}: drag, or use the up and down arrow keys" title="Drag to reorder">${icon("grip")}</button>
                <span class="nav-ico">${icon(p.slug ? "pages" : "home")}</span>
                <div class="nav-text"><b>${esc(p.title)}</b><span>${esc(siteUrl())}/${esc(p.slug)}</span></div>
                ${i >= 5 ? '<span class="tag">Not shown: only 5 fit</span>' : ""}
                <div class="v-more">
                  <button class="icon-btn" data-action="version-menu" aria-haspopup="menu" aria-expanded="false" aria-label="More options for ${esc(p.title)}" title="More options">${icon("dots")}</button>
                  <div class="v-menu" role="menu" hidden>
                    <button role="menuitem" data-action="nav-edit" data-id="${p.id}">${icon("edit")}<span><b>Edit</b><small>Change the name or link</small></span></button>
                    ${i ? `<button role="menuitem" data-action="nav-move" data-dir="-1" data-id="${p.id}">${icon("arrowUp")}<span><b>Move up</b></span></button>` : ""}
                    ${i < menu.length - 1 ? `<button role="menuitem" data-action="nav-move" data-dir="1" data-id="${p.id}">${icon("arrowDown")}<span><b>Move down</b></span></button>` : ""}
                    <button role="menuitem" class="danger" data-action="nav-remove" data-id="${p.id}">${icon("x")}<span><b>Remove from menu</b><small>The page itself stays</small></span></button>
                  </div>
                </div>
              </li>`).join("")}</ul>`
              : `<div class="versions-empty">${icon("menu")}<b>Your menu is empty</b><span>Click <b>Add menu item</b> to put a page in the top menu.</span></div>`}
          </div>
        </div>`;
      },
      mount: (view) => {
        // Fit the 1280px-wide header into the card and size it to the header's height.
        // On small screens it stays readable (at least 55%) and the bar scrolls sideways.
        const frame = view.querySelector(".nav-frame"), box = view.querySelector(".nav-live-frame"), inner = view.querySelector(".nav-live-inner");
        const fit = () => {
          const k = Math.max(box.clientWidth / 1280, 0.55), doc = frame.contentDocument;
          const h = doc && doc.body ? doc.body.scrollHeight : 76;
          frame.style.transform = `scale(${k})`; frame.style.height = h + "px";
          inner.style.width = 1280 * k + "px"; inner.style.height = h * k + "px";
        };
        frame.addEventListener("load", fit); fit();
        new ResizeObserver(fit).observe(box);

        // Drag ⋮⋮ to reorder (mouse or touch); arrow keys on the handle do the same
        const list = view.querySelector("#nav-list");
        if (!list) return;
        const save = () => {
          const order = [...list.querySelectorAll(".nav-row")].map((r) => store.pages.find((p) => p.id === r.dataset.id));
          store.pages = [...order, ...store.pages.filter((p) => !p.inNav)];
          touchSite(); persist(); go();
        };
        let drag = null;
        list.addEventListener("pointerdown", (e) => {
          const h = e.target.closest(".nav-handle");
          if (!h || e.button > 0) return;
          e.preventDefault();
          drag = { row: h.closest(".nav-row"), moved: false };
          drag.row.classList.add("dragging"); list.classList.add("is-dragging");
          h.setPointerCapture(e.pointerId);
        });
        list.addEventListener("pointermove", (e) => {
          if (!drag) return;
          const rows = [...list.querySelectorAll(".nav-row:not(.dragging)")];
          const before = rows.find((r) => { const b = r.getBoundingClientRect(); return e.clientY < b.top + b.height / 2; });
          if (before !== drag.row.nextElementSibling) { list.insertBefore(drag.row, before || null); drag.moved = true; }
        });
        const drop = () => {
          if (!drag) return;
          const moved = drag.moved;
          drag.row.classList.remove("dragging"); list.classList.remove("is-dragging"); drag = null;
          if (moved) { save(); toast("Menu order saved"); }
        };
        list.addEventListener("pointerup", drop);
        list.addEventListener("pointercancel", drop);
        list.addEventListener("keydown", (e) => {
          const h = e.target.closest(".nav-handle");
          if (!h || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
          e.preventDefault();
          const row = h.closest(".nav-row"), id = row.dataset.id;
          const sib = e.key === "ArrowUp" ? row.previousElementSibling : row.nextElementSibling;
          if (!sib) return;
          if (e.key === "ArrowUp") list.insertBefore(row, sib); else list.insertBefore(sib, row);
          save();
          view.querySelector(`.nav-row[data-id="${id}"] .nav-handle`).focus();
        });
      },
    },

    // Preferences: the website's important settings in one place. Everything saves as you type.
    preferences: {
      title: "Preferences",
      render: () => {
        const s = store.site, seo = s.seo, so = s.social, h = s.header, f = s.footer;
        const title = seo.title || s.name || "My Store", desc = seo.description || "";
        const v = (x) => esc(x ?? "");
        const text = (k, label, val, o = {}) => `<div class="field"><label for="p-${k}">${label}</label><input class="input" id="p-${k}" data-k="${k}" value="${v(val)}" maxlength="${o.max || 120}" placeholder="${v(o.ph)}"${o.type ? ` type="${o.type}"` : ""}>${o.hint ? `<span class="pf-hint">${o.hint}</span>` : ""}</div>`;
        const image = (k, label, val, hint) => {
          const src = SiteKit.safeImg(val);
          return `<div class="field"><label>${label}</label><div class="pf-image">
            <span class="pf-thumb">${src ? `<img src="${esc(src)}" alt="">` : icon("image")}</span>
            <div><div class="pf-image-btns"><label class="btn btn-sm">${icon("plus")}${src ? "Replace" : "Upload"}<input type="file" accept="image/*" hidden data-upload="${k}"></label>${src ? `<button type="button" class="btn btn-sm" data-clear="${k}">Remove</button>` : ""}</div>
            <span class="pf-hint">${hint}</span></div></div></div>`;
        };
        const seg = (k, label, opts, val) => `<div class="field"><label>${label}</label><div class="pf-seg">${opts.map(([x, l, st]) => `<button type="button" class="${val === x ? "on" : ""}" data-set="${k}" data-v="${x}"${st ? ` style="${st}"` : ""}>${l}</button>`).join("")}</div></div>`;
        const color = (k, label, val) => `<label class="pf-color"><input type="color" data-k="${k}" value="${v(val)}"><span><b>${label}</b><small>${v(val)}</small></span></label>`;
        const PALETTES = [["Classic", "#ffffff", "#111111", "#111111"], ["Sand", "#f7f4f0", "#2b211a", "#8a5a3b"], ["Ocean", "#eef6fb", "#0b2a3f", "#0b6e99"], ["Forest", "#f3f7f1", "#1c3326", "#2f6b2a"], ["Berry", "#fdf3f6", "#3d1527", "#ad1a72"], ["Night", "#14141c", "#ffffff", "#ff7a59"]];
        // The first four always show; others are added with "Add social media"
        const BASE = ["facebook", "instagram", "youtube", "tiktok"];
        const shown = [...BASE, ...Object.keys(so).filter((k) => !BASE.includes(k) && SiteKit.SOCIALS[k])];
        const more = Object.keys(SiteKit.SOCIALS).filter((k) => !shown.includes(k));
        return `${head("Preferences", "Your website's important settings in one place. Changes save automatically.", `<span class="pf-saved" id="pf-saved">${icon("check")}All changes saved</span>`)}
          <form id="prefs-form" autocomplete="off" onsubmit="return false">
            <div class="pf-stack">
              <div class="card"><div class="card-head"><span class="card-title">Store details<small>Header, footer and Contact section</small></span></div><div class="card-body">
                  ${text("name", "Website name", s.name, { max: 40, ph: "My Store" })}
                  ${image("header.logo", "Logo", h.logo, "Shown instead of the name in the header. A wide PNG with a clear background works best.")}
                  <div class="row">${text("phone", "Phone", s.phone, { max: 30, ph: "01XXX-XXXXXX" })}${text("email", "Email", s.email, { max: 120, ph: "hello@yourstore.com", type: "email" })}</div>
                  ${text("address", "Address", s.address, { max: 160, ph: "House, road, area, city" })}
              </div></div>
              <div class="card"><div class="card-head"><span class="card-title">Social media<small>Shown in your website's footer</small></span></div><div class="card-body">
                  ${shown.map((k) => `<div class="pf-social"><span class="pf-social-ico">${SiteKit.socialIcon(k)}</span><div class="field"><label for="p-${k}">${SiteKit.SOCIALS[k].name}</label><input class="input" id="p-${k}" data-k="social.${k}" type="url" maxlength="200" value="${v(so[k])}" placeholder="${SiteKit.SOCIALS[k].ph}"></div>${BASE.includes(k) ? "" : `<button type="button" class="icon-btn pf-social-x" data-remove-social="${k}" aria-label="Remove ${SiteKit.SOCIALS[k].name}" title="Remove">${icon("x")}</button>`}</div>`).join("")}
                  ${more.length ? `<div class="v-more pf-add-social"><button type="button" class="btn" data-action="version-menu" aria-haspopup="menu" aria-expanded="false">${icon("plus")}Add social media</button>
                    <div class="v-menu" role="menu" hidden>${more.map((k) => `<button type="button" role="menuitem" data-add-social="${k}"><span class="pf-menu-ico">${SiteKit.socialIcon(k)}</span><span><b>${SiteKit.SOCIALS[k].name}</b></span></button>`).join("")}</div></div>` : ""}
                  ${text("footer.copyright", "Footer copyright line", f.copyright, { max: 120, ph: `© ${new Date().getFullYear()} ${s.name || "My Store"}. All rights reserved.` })}
              </div></div>
              <div class="card"><div class="card-head"><span class="card-title">Search engine listing</span></div><div class="card-body">
                  <div class="serp"><span class="serp-url">${esc(siteUrl())}</span><b class="serp-title" id="serp-title">${esc(title)}</b><span class="serp-desc" id="serp-desc">${esc(desc || "Add a description so people know what you sell.")}</span></div>
                  ${text("seo.title", "Title in Google", seo.title, { max: 70, ph: s.name || "My Store", hint: `<span data-count="seo.title">${seo.title.length}</span> of 70 characters` })}
                  <div class="field"><label for="p-desc">Description</label><textarea class="textarea" id="p-desc" data-k="seo.description" maxlength="160" placeholder="e.g. Handmade furniture delivered across Bangladesh.">${esc(seo.description)}</textarea><span class="pf-hint"><span data-count="seo.description">${seo.description.length}</span> of 160 characters</span></div>
                  ${image("seo.image", "Share image", seo.image, "Shown when your link is shared on Facebook, WhatsApp or Messenger. 1200 × 630 works best.")}
              </div></div>
              <div class="card"><div class="card-head"><span class="card-title">Announcement bar<small>A short message at the very top of every page</small></span>
                <label class="switch" style="margin-left:auto"><input type="checkbox" data-k="header.announcement.show" ${h.announcement.show ? "checked" : ""} aria-label="Show the announcement bar"><i></i></label></div><div class="card-body">
                  <div class="pf-announce-demo ${h.announcement.show ? "" : "off"}" style="background:${esc(s.accent)};color:${SiteKit.isDark(s.accent) ? "#fff" : "#111"}" id="pf-announce-demo">${esc(h.announcement.text || "Your message")}</div>
                  ${text("header.announcement.text", "Message", h.announcement.text, { max: 90, ph: "Free delivery on orders over ৳2,000" })}
              </div></div>
              <div class="card"><div class="card-head"><span class="card-title">Look &amp; feel<small>Colors, fonts and buttons for your whole website</small></span></div>
                <div class="card-body pf-look">
                  <div>
                    <div class="field"><label>Color sets</label><div class="pf-palettes">${PALETTES.map(([n, bg, tx, ac]) => `<button type="button" data-palette="${bg},${tx},${ac}" class="${s.bg === bg && s.accent === ac ? "on" : ""}"><i style="background:${bg}"></i><i style="background:${ac}"></i>${n}</button>`).join("")}</div></div>
                    <div class="pf-colors">${color("bg", "Background", s.bg)}${color("text", "Text", s.text)}${color("accent", "Buttons", s.accent)}</div>
                    ${seg("headingFont", "Heading font", Object.entries(SiteKit.FONTS).map(([k, x]) => [k, x.label, `font-family:${esc(x.css)}`]), s.headingFont)}
                    ${seg("bodyFont", "Body font", Object.entries(SiteKit.FONTS).filter(([k]) => k !== "elegant").map(([k, x]) => [k, x.label, `font-family:${esc(x.css)}`]), s.bodyFont)}
                    ${seg("radius", "Button corners", [["sharp", "Square"], ["soft", "Soft"], ["round", "Round"]], s.radius)}
                  </div>
                  <div class="pf-preview"><span class="pf-preview-label">Live preview</span><div class="th-screen" data-w="1280"><iframe class="th-canvas" style="width:1280px" id="pf-frame" srcdoc="${esc(SiteKit.documentHTML(s, store.pages, { page: store.pages[0], products: store.products }))}" title="Website preview" tabindex="-1"></iframe></div></div>
                </div>
              </div>
              <div class="card pf-status ${store.published ? "live" : ""}">
                <span class="pf-status-ico">${icon(store.published ? "check" : "rocket")}</span>
                <div class="pf-status-text"><b>${store.published ? "Your website is live" : "Your website isn't live yet"}</b>
                  <span>${esc(siteUrl())}${store.published ? ` · published ${stamp(store.publishedAt)}` : " · publish it to let customers visit"}</span></div>
                <div class="pf-status-btns"><button type="button" class="btn" data-action="view-store">${icon("external")}View your store</button><button type="button" class="btn btn-primary" data-action="publish">${icon("rocket")}${store.published ? "Publish changes" : "Publish website"}</button></div>
              </div>
            </div>
          </form>
        </div>`;
      },
      mount: (view) => {
        if (previewObserver) previewObserver.disconnect();
        previewObserver = fitPreviews(view);
        const form = view.querySelector("#prefs-form"), saved = view.querySelector("#pf-saved");
        const get = (o, k) => k.split(".").reduce((a, x) => (a == null ? a : a[x]), o);
        const set = (o, k, val) => { const ks = k.split("."), last = ks.pop(); ks.reduce((a, x) => (a[x] ??= {}), o)[last] = val; };
        let t = 0, pt = 0;
        const changed = (rerender) => {
          saved.classList.add("saving"); saved.lastChild.textContent = "Saving…";
          touchSite(); persist();
          clearTimeout(t); t = setTimeout(() => { saved.classList.remove("saving"); saved.lastChild.textContent = "All changes saved"; }, 900);
          if (rerender) { const y = document.querySelector(".scroll").scrollTop; go(); document.querySelector(".scroll").scrollTop = y; return; }
          // Typing: refresh the live preview after a short pause
          clearTimeout(pt); pt = setTimeout(() => { const fr = view.querySelector("#pf-frame"); if (fr) fr.srcdoc = SiteKit.documentHTML(store.site, store.pages, { page: store.pages[0], products: store.products }); }, 500);
        };
        form.addEventListener("input", (e) => {
          const el = e.target, k = el.dataset.k;
          if (!k || el.type === "checkbox") return;
          set(store.site, k, el.value);
          if (k === "phone" || k === "address") store.settings[k] = el.value;
          if (k === "seo.title" || k === "name") view.querySelector("#serp-title").textContent = store.site.seo.title || store.site.name || "My Store";
          if (k === "seo.description") view.querySelector("#serp-desc").textContent = store.site.seo.description || "Add a description so people know what you sell.";
          if (k === "header.announcement.text") view.querySelector("#pf-announce-demo").textContent = el.value || "Your message";
          if (el.type === "color") el.closest(".pf-color").querySelector("small").textContent = el.value;
          view.querySelectorAll(`[data-count="${k}"]`).forEach((c) => { c.textContent = el.value.length; });
          changed(false);
        });
        form.addEventListener("change", async (e) => {
          const el = e.target;
          if (el.type === "checkbox" && el.dataset.k) { set(store.site, el.dataset.k, el.checked); changed(true); }
          if (el.type === "color") changed(true);
          if (el.dataset.upload && el.files[0]) {
            const btn = el.closest(".btn"); btn.classList.add("busy");
            try { set(store.site, el.dataset.upload, await SiteEditor.upload(el.files[0])); changed(true); toast("Image uploaded"); }
            catch (err) { toast(err.message); btn.classList.remove("busy"); }
          }
        });
        form.addEventListener("click", (e) => {
          const b = e.target.closest("button");
          if (!b) return;
          if (b.dataset.set) { set(store.site, b.dataset.set, b.dataset.v); changed(true); }
          else if (b.dataset.palette) { const [bg, tx, ac] = b.dataset.palette.split(","); Object.assign(store.site, { bg, text: tx, accent: ac }); changed(true); }
          else if (b.dataset.clear) { set(store.site, b.dataset.clear, ""); changed(true); }
          else if (b.dataset.addSocial) {
            const k = b.dataset.addSocial;
            store.site.social[k] = ""; changed(true);
            setTimeout(() => document.getElementById("p-" + k)?.focus(), 0);
          } else if (b.dataset.removeSocial) { delete store.site.social[b.dataset.removeSocial]; changed(true); }
        });
      },
    },

    website: {
      title: "Edit website",
      render: () => '<div class="ed-root"></div>',
      mount: (view) => SiteEditor.mount(view.querySelector(".ed-root"), {
        store, account, catalog, icon, toast, confirm, dialog, touchSite, persist,
        publish: () => actions.publish(),
        canAddPage: () => withinLimit(plan().pages, pageCount()),
      }),
    },

    pages: {
      title: "Pages",
      render: () => {
        const lim = plan().pages, n = pageCount(), canAdd = withinLimit(lim, n);
        const meter = lim == null ? `<span class="pg-usage">${n} pages · unlimited</span>`
          : `<span class="pg-usage"><span>${n} of ${lim} pages</span><i><b style="width:${Math.min(100, (n / lim) * 100)}%"></b></i></span>`;
        return `${head("Pages", "Every page of your website. Click Edit to change what's on a page.", `${meter}<button class="btn btn-primary" data-action="add-page" ${canAdd ? "" : "disabled"}>${icon("plus")}Add page</button>`)}
          ${limitCallout("pages", n, lim)}
          <div class="pg-grid">${store.pages.map((p) => {
            const count = (p.sections || []).filter((x) => !x.hidden).length;
            return `<article class="pg-card">
              <a class="pg-thumb th-screen" data-w="1280" href="#/website?page=${p.id}" aria-label="Edit ${esc(p.title)}" tabindex="-1">
                <iframe class="th-canvas" style="width:1280px" srcdoc="${esc(SiteKit.documentHTML(store.site, store.pages, { page: p, products: store.products }))}" title="${esc(p.title)} preview" tabindex="-1" loading="lazy"></iframe>
              </a>
              <div class="pg-body">
                <div class="pg-name"><b>${esc(p.title)}</b>${p.system === "checkout" ? '<span class="tag">Checkout</span>' : p.locked ? '<span class="tag green">Home page</span>' : ""}</div>
                <span class="pg-link">${esc(siteUrl())}/${esc(p.slug)}</span>
                <div class="pg-meta"><span class="pg-chip ${p.inNav ? "on" : ""}">${p.system ? "Opens from the cart" : p.inNav ? "In menu" : "Not in menu"}</span><span class="pg-chip">${count} ${count === 1 ? "section" : "sections"}</span></div>
              </div>
              <div class="pg-actions">
                <a class="btn btn-sm btn-primary" href="#/website?page=${p.id}">${icon("brush")}Edit</a>
                <div class="v-more">
                  <button class="icon-btn" data-action="version-menu" aria-haspopup="menu" aria-expanded="false" aria-label="More options for ${esc(p.title)}" title="More options">${icon("dots")}</button>
                  <div class="v-menu" role="menu" hidden>
                    <button role="menuitem" data-action="page-view" data-id="${p.id}">${icon("external")}<span><b>View</b><small>Open this page in a new tab</small></span></button>
                    <button role="menuitem" data-action="nav-edit" data-id="${p.id}">${icon("edit")}<span><b>Rename</b><small>Change the name or link</small></span></button>
                    ${p.system ? "" : `<button role="menuitem" data-action="page-toggle-nav" data-id="${p.id}">${icon("menu")}<span><b>${p.inNav ? "Hide from menu" : "Show in menu"}</b><small>${p.inNav ? "The page stays, it just leaves the top menu" : "Add it to your website's top menu"}</small></span></button>`}
                    ${p.system ? `<button role="menuitem" data-action="page-reset" data-id="${p.id}">${icon("undo")}<span><b>Reset</b><small>Go back to the original checkout page</small></span></button>` : ""}
                    ${p.locked ? "" : `<button role="menuitem" class="danger" data-action="delete-page" data-id="${p.id}">${icon("trash")}<span><b>Delete</b><small>Remove this page from your website</small></span></button>`}
                  </div>
                </div>
              </div>
            </article>`;
          }).join("")}
            ${canAdd ? `<button class="pg-card pg-new" data-action="add-page">${icon("plus")}<b>Add a page</b><span>About, FAQ, Size guide…</span></button>` : ""}
          </div>
        </div>`;
      },
      mount: (view) => { if (previewObserver) previewObserver.disconnect(); previewObserver = fitPreviews(view); },
    },
  };


  // ---------- Actions ----------
  // Re-render the page, and the Settings popup when it's open
  const go = () => { rerender(); if (settingsEl) settingsEl.refresh(); };
  let rerender;

  const productDialog = (p) => {
    const colors = ["#c8a98a", "#e9e4da", "#8a6a4f", "#d9cfc4", "#b6d3ea", "#dbeddb", "#f5e0e9", "#2f2f2f"];
    dialog({
      title: p ? "Edit product" : "New product",
      body: `<div class="field"><label>Name</label><input class="input" name="name" required maxlength="60" value="${esc(p?.name)}"></div>
        <div class="row"><div class="field"><label>Price (৳)</label><input class="input" name="price" type="number" min="0" step="1" required value="${esc(p?.price ?? "")}"></div>
        <div class="field"><label>Stock</label><input class="input" name="stock" type="number" min="0" step="1" value="${esc(p?.stock ?? 10)}"></div></div>
        <div class="row"><div class="field"><label>Category</label><input class="input" name="category" maxlength="30" value="${esc(p?.category ?? "General")}"></div>
        <div class="field"><label>Status</label><select class="select" name="status"><option value="active">Active</option><option value="draft"${p?.status === "draft" ? " selected" : ""}>Draft (hidden)</option></select></div></div>
        <div class="field"><label>Photo color (until you upload photos)</label><div style="display:flex;gap:6px">${colors.map((c, i) => `<label style="cursor:pointer"><input type="radio" name="color" value="${c}" ${(p ? p.color === c : i === 0) ? "checked" : ""} style="accent-color:${c}"> <span style="display:inline-block;width:18px;height:18px;border-radius:4px;background:${c};vertical-align:middle;border:1px solid var(--border)"></span></label>`).join("")}</div></div>`,
      submit: p ? "Save" : "Add product",
      onSubmit: (v) => {
        const data = { name: v.name, price: Math.max(0, Number(v.price) || 0), stock: Math.max(0, parseInt(v.stock, 10) || 0), category: v.category || "General", status: v.status, color: v.color || colors[0] };
        if (p) Object.assign(p, data);
        else store.products.unshift({ id: uid("p"), created: new Date().toISOString(), ...data });
        persist(); go(); toast(p ? "Product saved" : "Product added");
      },
    });
  };

  const orderDialog = () => {
    const active = store.products.filter((p) => p.status !== "draft");
    if (!active.length) { toast("Add a product first"); return; }
    dialog({
      title: "New order",
      body: `<div class="row"><div class="field"><label>Customer name</label><input class="input" name="customer" required list="cust-list"><datalist id="cust-list">${store.customers.map((c) => `<option value="${esc(c.name)}">`).join("")}</datalist></div>
        <div class="field"><label>Phone</label><input class="input" name="phone" placeholder="01XXX-XXXXXX"></div></div>
        <div class="row"><div class="field"><label>Product</label><select class="select" name="product">${active.map((p) => `<option value="${p.id}">${esc(p.name)} — ${taka(p.price)}</option>`).join("")}</select></div>
        <div class="field"><label>Quantity</label><input class="input" name="qty" type="number" min="1" value="1"></div></div>
        <div class="row"><div class="field"><label>Payment</label><select class="select" name="payment">${Object.values(PAYMENT_LABEL).map((l) => `<option>${l}</option>`).join("")}</select></div>
        <div class="field"><label>Status</label><select class="select" name="status">${Object.keys(ORDER_STATUS).map((s) => `<option>${s}</option>`).join("")}</select></div></div>`,
      submit: "Create order",
      onSubmit: (v) => {
        const p = store.products.find((x) => x.id === v.product);
        const qty = Math.max(1, parseInt(v.qty, 10) || 1);
        const number = Math.max(1000, ...store.orders.map((o) => o.number)) + 1;
        store.orders.unshift({ id: uid("o"), number, customer: v.customer, phone: v.phone, items: [{ name: p.name, qty, price: p.price }], total: p.price * qty, payment: v.payment, status: v.status, date: new Date().toISOString() });
        if (!store.customers.some((c) => c.name.toLowerCase() === v.customer.toLowerCase())) {
          store.customers.unshift({ id: uid("c"), name: v.customer, phone: v.phone, city: "", email: "", joined: new Date().toISOString() });
        }
        p.stock = Math.max(0, p.stock - qty);
        persist(); go(); toast("Order #" + number + " created");
      },
    });
  };

  const pageDialog = (pg) => dialog({
    title: pg ? "Rename page" : "New page",
    body: `<div class="field"><label>Page title</label><input class="input" name="title" required maxlength="40" value="${esc(pg?.title)}" placeholder="e.g. FAQ"></div>`,
    submit: pg ? "Save" : "Add page",
    onSubmit: (v) => {
      const slug = v.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "page";
      if (pg) { pg.title = v.title; if (!pg.locked) pg.slug = slug; }
      else { const np = { id: uid("pg"), title: v.title, slug, inNav: true }; np.sections = SiteKit.pageSections(np, { site: store.site, products: store.products }); store.pages.push(np); }
      touchSite(); persist(); go(); toast(pg ? "Page renamed" : "Page added");
    },
  });

  const pixelById = (id) => PIXELS.find((p) => p.id === id);
  // ---------- Chat with the Shopilier team ----------
  // The chat button sits at the bottom right; unread replies show as a badge on it
  let inbox = null;
  const chatFab = document.getElementById("chat-fab"), chatPanel = document.getElementById("chat-panel"), chatRoot = document.getElementById("chat-root");
  const setMsgBadge = (n) => { unreadReplies = n || 0; document.getElementById("msg-count").textContent = n ? (n > 9 ? "9+" : n) : ""; refreshChrome(); };
  const checkMessages = () => ShopilierInbox.unread("user").then(setMsgBadge);
  checkMessages();
  setInterval(() => { if (chatPanel.hidden) checkMessages(); }, 60000);
  const openChat = () => {
    toggleMenu(false);
    chatPanel.hidden = false;
    chatFab.setAttribute("aria-expanded", "true");
    document.body.classList.add("chat-open");
    if (!inbox) inbox = ShopilierInbox(chatRoot, { mode: "user", onUnread: setMsgBadge });
    chatPanel.querySelector("#chat-close").focus();
  };
  // Closing clears the inbox, which also stops it checking for new replies
  const closeChat = () => {
    chatPanel.hidden = true;
    chatFab.setAttribute("aria-expanded", "false");
    document.body.classList.remove("chat-open");
    chatRoot.innerHTML = ""; inbox = null;
    checkMessages();
    chatFab.focus();
  };
  chatFab.addEventListener("click", () => (chatPanel.hidden ? openChat() : closeChat()));
  document.getElementById("chat-close").addEventListener("click", closeChat);
  document.getElementById("chat-new").addEventListener("click", () => { if (!inbox) openChat(); inbox.newMessage(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !chatPanel.hidden && !document.querySelector(".overlay")) closeChat(); });

  const actions = {
    "open-chat": () => { if (settingsEl) settingsEl.close(); openChat(); },
    "pixel-edit": (el) => {
      const p = pixelById(el.dataset.id), px = store.marketing.pixels[p.id];
      dialog({
        title: (px?.id ? "Edit " : "Connect ") + p.name,
        body: `<p class="muted" style="margin-bottom:14px">${esc(p.covers)}.</p>
          <div class="field"><label for="px-id">${esc(p.label)}</label><input class="input" id="px-id" name="id" required placeholder="${esc(p.placeholder)}" value="${esc(px?.id || "")}" autocomplete="off" spellcheck="false"></div>
          <p class="muted small" style="margin:-6px 0 14px">Where to find it: ${esc(p.where)}</p>`,
        submit: px?.id ? "Save" : "Connect",
        onSubmit: (v) => {
          const id = normalizePixelId(p, v.id);
          if (!p.pattern.test(id)) { toast(`That doesn't look like a ${p.label} — it should look like ${p.placeholder}`); return false; }
          store.marketing.pixels[p.id] = { id, on: true };
          persist(); go(); toast(p.name + (px?.id ? " saved" : " connected"));
        },
      });
    },
    "pixel-remove": async (el) => {
      const p = pixelById(el.dataset.id);
      if (await confirm(`Remove ${p.name}?`, "Its code will be taken off your website.", "Remove")) { delete store.marketing.pixels[p.id]; persist(); go(); toast(p.name + " removed"); }
    },
    "view-code": () => {
      const code = trackingCode(store.marketing);
      dialog({
        title: "Code added to your website",
        size: "lg",
        submit: "",
        body: !code.head && !code.body ? `<p class="muted" style="padding-bottom:14px">Nothing yet. Connect a pixel or add custom code first.</p>`
          : `<p class="muted" style="margin-bottom:10px">This goes in the &lt;head&gt; of every page:</p><pre class="code-view">${esc(code.head || "—")}</pre>
             <p class="muted" style="margin:14px 0 10px">And this at the end of the &lt;body&gt;:</p><pre class="code-view" style="margin-bottom:14px">${esc(code.body || "—")}</pre>`,
      });
    },
    "add-discount": () => dialog({
      title: "Create discount",
      body: `<div class="field"><label>Code</label><input class="input" name="code" required maxlength="20" placeholder="e.g. EID20" style="text-transform:uppercase"></div>
        <div class="row"><div class="field"><label>Type</label><select class="select" name="type"><option value="percent">Percentage off</option><option value="fixed">Taka off (৳)</option></select></div>
        <div class="field"><label>Amount</label><input class="input" name="value" type="number" min="1" step="1" required placeholder="20"></div></div>
        <div class="field"><label>Minimum order (৳, optional)</label><input class="input" name="min" type="number" min="0" step="1" placeholder="0"></div>`,
      submit: "Create discount",
      onSubmit: (v, close, form) => {
        const code = v.code.toUpperCase().replace(/\s+/g, "");
        if (store.discounts.some((d) => d.code === code)) { toast("That code already exists"); return false; }
        const value = Math.max(1, Number(v.value) || 0);
        if (v.type === "percent" && value > 100) { toast("A percentage can't be more than 100"); return false; }
        store.discounts.unshift({ id: uid("d"), code, type: v.type, value, min: Math.max(0, Number(v.min) || 0), active: true, created: new Date().toISOString() });
        persist();
        if (location.hash === "#/discounts") go(); else location.hash = "#/discounts";
        toast("Discount " + code + " created");
      },
    }),
    "delete-discount": async (el) => {
      const d = store.discounts.find((x) => x.id === el.dataset.id);
      if (await confirm("Delete discount?", `${d.code} will stop working.`)) { store.discounts = store.discounts.filter((x) => x !== d); persist(); go(); }
    },
    "add-product": () => {
      if (!withinLimit(plan().products, store.products.length)) { toast(`Your ${plan().name} plan allows ${plan().products} products — upgrade to add more`); return; }
      productDialog(null);
    },
    "edit-product": (el) => productDialog(store.products.find((p) => p.id === el.dataset.id)),
    "delete-product": async (el) => {
      const p = store.products.find((x) => x.id === el.dataset.id);
      if (await confirm("Delete product?", `“${p.name}” will be removed from your store.`)) { store.products = store.products.filter((x) => x !== p); persist(); go(); toast("Product deleted"); }
    },
    "product-view": (el) => { productView = el.dataset.view; go(); },
    "order-tab": (el) => { orderFilter = el.dataset.tab; go(); },
    "add-order": orderDialog,
    "view-order": (el) => {
      const o = store.orders.find((x) => x.id === el.dataset.id);
      dialog({
        title: "Order " + orderNo(o), submit: "",
        body: `<p>${tag(o.status, ORDER_STATUS[o.status])} <span class="muted small">${day(o.date)}</span></p>
          <div class="divider"></div><p><b>${esc(o.customer)}</b><br><span class="muted">${esc(o.phone || "No phone")}</span></p><div class="divider"></div>
          ${o.items.map((it) => `<div style="display:flex;justify-content:space-between"><span>${esc(it.name)} × ${it.qty}</span><span>${taka(it.price * it.qty)}</span></div>`).join("")}
          <div class="divider"></div><div style="display:flex;justify-content:space-between;font-weight:600"><span>Total · ${esc(o.payment)}</span><span>${taka(o.total)}</span></div>`,
      });
    },
    "delete-order": async (el) => {
      const o = store.orders.find((x) => x.id === el.dataset.id);
      if (await confirm("Delete order?", `Order ${orderNo(o)} from ${o.customer} will be deleted.`)) { store.orders = store.orders.filter((x) => x !== o); persist(); go(); toast("Order deleted"); }
    },
    "add-customer": () => dialog({
      title: "New customer",
      body: `<div class="field"><label>Name</label><input class="input" name="name" required></div><div class="row"><div class="field"><label>Phone</label><input class="input" name="phone"></div><div class="field"><label>City</label><input class="input" name="city"></div></div><div class="field"><label>Email</label><input class="input" type="email" name="email"></div>`,
      submit: "Add customer",
      onSubmit: (v) => { store.customers.unshift({ id: uid("c"), ...v, joined: new Date().toISOString() }); persist(); go(); toast("Customer added"); },
    }),
    "delete-customer": async (el) => {
      const c = store.customers.find((x) => x.id === el.dataset.id);
      if (await confirm("Delete customer?", `${c.name} will be removed from your customer list. Their past orders stay.`)) { store.customers = store.customers.filter((x) => x !== c); persist(); go(); }
    },
    "publish": () => {
      store.published = true; store.publishedAt = new Date().toISOString();
      // Only keep a copy when this exact website isn't saved already
      if (!currentBackup()) addBackup("Published version", "publish");
      store.liveVersion = currentBackup()?.id || null;
      persist(); if (location.hash !== "#/website") go(); toast("🚀 Website published");
    },
    "view-store": () => {
      const html = SiteKit.storeHTML(store.site, store.pages, { products: store.products });
      window.open(URL.createObjectURL(new Blob([html], { type: "text/html" })), "_blank");
    },
    "create-backup": () => dialog({
      title: "Save a backup of your website",
      body: `<p class="muted" style="margin-bottom:14px">Keeps your website exactly as it looks now, so you can come back to it later.</p>
        <div class="field"><label>Name (optional, the date is used if you leave it empty)</label><input class="input" name="name" maxlength="60" placeholder="e.g. Before Eid sale changes"></div>`,
      submit: "Save backup",
      onSubmit: (v) => {
        const same = currentBackup();
        if (same && same.kind === "manual") { toast(`Already saved as “${versionTitle(same)}”`); return; }
        // An automatic copy of this exact website becomes the named backup instead of a duplicate
        if (same) store.backups = store.backups.filter((x) => x !== same);
        addBackup(v.name || "", "manual"); persist(); go(); toast("Backup saved");
      },
    }),
    // Opens the saved version as a website in a new tab, with a bar saying what it is
    "preview-version": (el) => {
      const b = store.backups.find((x) => x.id === el.dataset.id);
      const data = JSON.parse(JSON.stringify(b.data));
      SiteKit.ensure(data.site, data.pages, { products: store.products });
      data.site.payments = store.site.payments;
      const bar = `<div style="position:sticky;top:0;z-index:100;display:flex;justify-content:center;gap:8px;padding:10px 16px;background:#0e7a4b;color:#fff;font:600 14px/1.4 Inter,system-ui,sans-serif">Preview of the backup “${esc(versionTitle(b))}”. This is a backup, not your live website.</div>`;
      const html = SiteKit.storeHTML(data.site, data.pages, { products: store.products }).replace(/<body([^>]*)>/, (m) => m + bar);
      window.open(URL.createObjectURL(new Blob([html], { type: "text/html" })), "_blank");
    },
    "version-menu": (el) => {
      const menu = el.nextElementSibling, open = menu.hidden;
      closeVersionMenus();
      menu.hidden = !open; el.setAttribute("aria-expanded", String(open));
      menu.classList.remove("up");
      // Open upwards when there's no room below but there is above
      if (open) {
        const box = document.querySelector(".scroll").getBoundingClientRect(), m = menu.getBoundingClientRect(), b = el.getBoundingClientRect();
        if (m.bottom > box.bottom - 8 && b.top - box.top > m.height + 8) menu.classList.add("up");
      }
      if (open) menu.querySelector("button").focus();
    },
    "publish-version": async (el) => {
      closeVersionMenus();
      const b = store.backups.find((x) => x.id === el.dataset.id), cur = b === currentBackup();
      const ok = await confirm(cur ? "Publish your website?" : "Publish this backup?",
        cur ? "Your website goes live exactly as it is now." : `Your website will change back to “${versionTitle(b)}” (${versionWhen(b.at)}) and go live. Your current website stays in this list, so you can switch back.`, "Publish");
      if (!ok) return;
      if (!cur) restoreVersion(b);
      actions.publish();
    },
    "rename-version": (el) => {
      closeVersionMenus();
      const b = store.backups.find((x) => x.id === el.dataset.id);
      dialog({
        title: "Rename",
        body: `<div class="field"><label>Backup name</label><input class="input" name="name" maxlength="60" value="${esc(named(b))}" placeholder="${esc(versionTitle({ at: b.at }))}"></div>
          <p class="muted small" style="margin:-6px 0 14px">Leave it empty to show the date instead.</p>`,
        submit: "Save",
        onSubmit: (v) => { b.title = v.name; if (!v.name && b.kind === "manual") b.name = ""; persist(); go(); toast(v.name ? "Backup renamed" : "Name removed"); },
      });
    },
    "delete-version": async (el) => {
      closeVersionMenus();
      const b = store.backups.find((x) => x.id === el.dataset.id);
      if (await confirm("Delete this backup?", `“${versionTitle(b)}” (${versionWhen(b.at)}) will be deleted. You can't undo this.`)) {
        store.backups = store.backups.filter((x) => x !== b);
        if (store.currentVersion === b.id) store.currentVersion = null;
        // (if another saved version has the same content, it shows as Current instead)
        persist(); go(); toast("Backup deleted");
      }
    },
    "toggle-versions": () => { showAllVersions = !showAllVersions; go(); },
    "nav-move": (el) => {
      closeVersionMenus();
      const menu = store.pages.filter((p) => p.inNav);
      const i = menu.findIndex((p) => p.id === el.dataset.id), other = menu[i + Number(el.dataset.dir)];
      if (!other) return;
      const a = store.pages.indexOf(menu[i]), b = store.pages.indexOf(other);
      [store.pages[a], store.pages[b]] = [store.pages[b], store.pages[a]];
      touchSite(); persist(); go();
    },
    "nav-remove": (el) => {
      closeVersionMenus();
      const pg = store.pages.find((p) => p.id === el.dataset.id);
      pg.inNav = false; touchSite(); persist(); go(); toast(pg.title + " removed from the menu");
    },
    // Edit a menu item: its name and its link (the home page always stays at /)
    "nav-edit": (el) => {
      closeVersionMenus();
      const pg = store.pages.find((p) => p.id === el.dataset.id);
      dialog({
        title: "Edit menu item",
        body: `<div class="field"><label>Name</label><input class="input" name="title" required maxlength="40" value="${esc(pg.title)}"></div>
          <div class="field"><label>Link</label><div class="slug-field"><span>${esc(siteUrl())}/</span><input class="input" name="slug" maxlength="60" value="${esc(pg.slug)}" ${pg.locked ? `disabled title="${pg.system ? "The checkout page always stays at /checkout" : "The home page always stays at /"}"` : 'placeholder="about-us"'} spellcheck="false" autocomplete="off"></div>
          <p class="muted small" style="margin-top:6px">${pg.locked ? (pg.system ? "The checkout page's link can't change." : "The home page's link can't change.") : "Use lowercase letters, numbers and dashes."}</p></div>`,
        submit: "Save",
        onSubmit: (v) => {
          if (!pg.locked) {
            const slug = String(v.slug || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            if (!slug) { toast("Please add a link, e.g. about-us"); return false; }
            if (store.pages.some((p) => p !== pg && p.slug === slug)) { toast(`Another page already uses /${slug}`); return false; }
            pg.slug = slug;
          }
          pg.title = v.title; touchSite(); persist(); go(); toast("Menu item saved");
        },
      });
    },
    // Put a hidden page in the menu, or make a new page for it
    "nav-add-item": () => {
      const hidden = store.pages.filter((p) => !p.inNav && !p.system), canNew = withinLimit(plan().pages, pageCount());
      if (!hidden.length && !canNew) { toast(`Your ${plan().name} plan allows ${plan().pages} pages — upgrade to add more`); return; }
      dialog({
        title: "Add menu item",
        body: `${hidden.length ? `<label class="add-choice"><input type="radio" name="kind" value="page" checked><span><b>A page you already have</b>
            <select class="select" name="page">${hidden.map((p) => `<option value="${p.id}">${esc(p.title)} (/${esc(p.slug)})</option>`).join("")}</select></span></label>` : ""}
          ${canNew ? `<label class="add-choice"><input type="radio" name="kind" value="new" ${hidden.length ? "" : "checked"}><span><b>A new page</b>
            <input class="input" name="title" maxlength="40" placeholder="Page name, e.g. FAQ"></span></label>` : ""}`,
        submit: "Add to menu",
        onSubmit: (v) => {
          let pg;
          if (v.kind === "new") {
            if (!v.title) { toast("Please give the new page a name"); return false; }
            let slug = v.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "page";
            while (store.pages.some((p) => p.slug === slug)) slug += "-2";
            pg = { id: uid("pg"), title: v.title, slug, inNav: true };
            pg.sections = SiteKit.pageSections(pg, { site: store.site, products: store.products });
          } else pg = store.pages.find((p) => p.id === v.page);
          pg.inNav = true;
          // New items go to the end of the menu
          const menu = store.pages.filter((p) => p.inNav && p !== pg);
          store.pages = [...menu, pg, ...store.pages.filter((p) => !p.inNav)];
          touchSite(); persist(); go(); toast(pg.title + " added to the menu");
        },
        onOpen: (form) => {
          // Typing a new page name picks "A new page"
          const t = form.querySelector('input[name="title"]');
          if (t) t.addEventListener("focus", () => { form.querySelector('input[value="new"]').checked = true; });
          const sel = form.querySelector('select[name="page"]');
          if (sel) sel.addEventListener("focus", () => { form.querySelector('input[value="page"]').checked = true; });
        },
      });
    },
    "add-page": () => {
      if (!withinLimit(plan().pages, pageCount())) { toast(`Your ${plan().name} plan allows ${plan().pages} pages — upgrade to add more`); return; }
      pageDialog(null);
    },
    "edit-page": (el) => pageDialog(store.pages.find((p) => p.id === el.dataset.id)),
    "page-view": (el) => {
      closeVersionMenus();
      const html = SiteKit.storeHTML(store.site, store.pages, { products: store.products, start: el.dataset.id });
      window.open(URL.createObjectURL(new Blob([html], { type: "text/html" })), "_blank");
    },
    "page-toggle-nav": (el) => {
      closeVersionMenus();
      const pg = store.pages.find((p) => p.id === el.dataset.id);
      pg.inNav = !pg.inNav; touchSite(); persist(); go(); toast(pg.title + (pg.inNav ? " is now in the menu" : " was hidden from the menu"));
    },
    // The Checkout page can't be deleted, only put back to how it started
    "page-reset": async (el) => {
      closeVersionMenus();
      const pg = store.pages.find((x) => x.id === el.dataset.id);
      if (!(await confirm("Reset checkout page?", "Your changes to the checkout page will be undone and it goes back to the original design. Your website's colors and fonts stay.", "Reset"))) return;
      pg.sections = SiteKit.pageSections(pg, { site: store.site, products: store.products });
      touchSite(); persist(); go(); toast("Checkout page reset");
    },
    "delete-page": async (el) => {
      closeVersionMenus();
      const pg = store.pages.find((x) => x.id === el.dataset.id);
      if (pg.locked) return;
      if (await confirm("Delete page?", `The “${pg.title}” page will be removed from your website.`)) { store.pages = store.pages.filter((x) => x !== pg); touchSite(); persist(); go(); }
    },
    "connect-domain": () => {
      const v = document.getElementById("s-domain").value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      if (v && !/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(v)) { toast("That doesn't look like a domain — try www.yourbusiness.com"); return; }
      store.settings.domain = v; store.settings.domainStatus = v ? "pending" : "";
      persist(); go(); toast(v ? "Domain saved — waiting for DNS" : "Custom domain removed");
    },
    "change-plan": () => {
      const planOptions = Object.entries(PLANS).map(([id, p]) => `<option value="${id}"${id === account.plan ? " selected" : ""}>${p.name} — ${taka(p.price)}/month</option>`).join("");
      dialog({
        title: "Change plan",
        body: `<div class="field"><label>Plan</label><select class="select" name="plan">${planOptions}</select></div>
          <div class="field"><label>Billing</label><select class="select" name="billing"><option value="monthly">Monthly</option><option value="yearly"${account.billing === "yearly" ? " selected" : ""}>Yearly (free custom domain on Business &amp; Pro)</option></select></div>`,
        submit: "Update plan",
        onSubmit: (v) => { account.plan = v.plan; account.billing = v.billing; persist(); go(); toast(`Plan updated to ${PLANS[v.plan].name}`); },
      });
    },
    "set-plan": (el) => { account.plan = el.dataset.plan; persist(); go(); toast("Plan updated to " + PLANS[account.plan].name); },
    "reset-all": async () => {
      if (!(await confirm("Reset store?", "All products, orders, customers, pages and website changes will be deleted.", "Reset store"))) return;
      const fresh = seedStore();
      Object.keys(store).forEach((k) => delete store[k]);
      Object.assign(store, fresh);
      await saveNow(); location.reload();
    },
  };

  // ---------- Settings popup ----------
  const SETTINGS_TABS = [
    ["general", "General", "store"],
    ["billing", "Plan & billing", "billing"],
    ["domain", "Domain", "globe"],
    ["payments", "Payments", "money"],
    ["notifications", "Notifications", "bellRing"],
    ["security", "Account & security", "lock"],
    ["help", "Help Center", "help"],
  ];
  const settingsTab = {
    general: () => `<form data-form="general">
        <h2>General</h2><p class="muted">Your store details. Customers see these on your website.</p>
        <div class="row">
          <div class="field"><label for="s-business">Store name</label><input class="input" id="s-business" name="business" required maxlength="80" value="${esc(account.business)}"></div>
          <div class="field"><label for="s-owner">Your name</label><input class="input" id="s-owner" name="owner" required maxlength="80" value="${esc(account.name)}"></div>
          <div class="field"><label for="s-email">Account email</label><input class="input" id="s-email" name="email" type="email" required value="${esc(account.email)}"></div>
          <div class="field"><label for="s-phone">Store phone</label><input class="input" id="s-phone" name="phone" maxlength="30" value="${esc(store.settings.phone)}"></div>
        </div>
        <div class="field"><label for="s-address">Store address</label><input class="input" id="s-address" name="address" maxlength="160" value="${esc(store.settings.address)}"></div>
        <div class="row">
          <div class="field"><label>Currency</label><input class="input" value="Bangladeshi Taka (৳)" disabled></div>
          <div class="field"><label>Time zone</label><input class="input" value="Asia/Dhaka (GMT+6)" disabled></div>
        </div>
        <div class="s-foot"><button class="btn btn-primary" type="submit">Save</button></div>
      </form>`,
    billing: () => {
      const p = plan(), yearly = account.billing === "yearly";
      return `<h2>Plan &amp; billing</h2><p class="muted">Your plan and how much of it you're using.</p>
        <div class="s-card">
          <div class="s-plan"><div><span class="tag green">${esc(p.name)} plan</span>
            <div class="stat-value" style="margin-top:8px">${yearly ? taka(p.price * 12) + '<span class="muted" style="font-size:14px;font-weight:500"> /year</span>' : taka(p.price) + '<span class="muted" style="font-size:14px;font-weight:500"> /month</span>'}</div>
            <p class="muted small">${yearly ? "Billed yearly" : "Billed monthly"}${hasFreeDomain() ? " · includes a free custom domain" : ""}</p></div>
            <button class="btn btn-primary" type="button" data-action="change-plan">Change plan</button></div>
          ${[["Pages", pageCount(), p.pages], ["Products", store.products.length, p.products]].map(([n, used, lim]) => `
            <div class="meter" style="margin-top:14px"><div class="meter-top"><span>${n}</span><span class="muted">${used} of ${limitText(lim)}</span></div>
            <div class="progress"><i style="width:${lim == null ? 4 : Math.min(100, (used / lim) * 100)}%;${lim != null && used >= lim ? "background:var(--danger)" : ""}"></i></div></div>`).join("")}
        </div>
        <div class="table-wrap s-card" style="padding:0"><table class="table" style="min-width:520px"><thead><tr><th>Plan</th><th class="t-right">Monthly</th><th>Pages</th><th>Products</th><th>Sales</th><th class="t-actions"></th></tr></thead>
          <tbody>${Object.entries(PLANS).map(([id, pl]) => `<tr><td><span class="t-title">${esc(pl.name)} ${id === account.plan ? '<span class="tag blue">Current</span>' : ""}</span></td><td class="t-right">${taka(pl.price)}</td><td>${limitText(pl.pages)}</td><td>${limitText(pl.products)}</td><td>Unlimited</td>
            <td class="t-actions">${id === account.plan ? "" : `<button class="btn btn-sm" type="button" data-action="set-plan" data-plan="${id}">Switch</button>`}</td></tr>`).join("")}</tbody></table></div>
        <p class="muted small">Online payment for plans isn't connected yet, so switching plans changes your limits straight away.</p>`;
    },
    domain: () => {
      const st = store.settings, freeDomain = hasFreeDomain();
      return `<h2>Domain</h2><p class="muted">Where customers find your website.</p>
        <div class="s-card"><b>Free address</b><p class="muted" style="margin-top:4px">${esc(st.subdomain)}.shopilier.com</p></div>
        ${freeDomain ? `<div class="callout green"><span class="ico">${icon("gift")}</span><div><b>Your yearly ${esc(plan().name)} plan includes a free custom domain.</b></div></div>` : ""}
        <div class="s-card">
          <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap">
            <div class="field" style="flex:1;margin:0;min-width:200px"><label for="s-domain">Custom domain</label><input class="input" id="s-domain" placeholder="www.yourbusiness.com" value="${esc(st.domain)}"></div>
            <button type="button" class="btn btn-primary" data-action="connect-domain">${st.domain ? "Update" : "Connect"}</button>
          </div>
          ${st.domain ? `<p style="margin-top:10px">${st.domainStatus === "connected" ? '<span class="tag dot green">Connected</span>' : '<span class="tag dot yellow">Waiting for DNS</span>'} <span class="muted small">${esc(st.domain)}</span></p>` : ""}
        </div>`;
    },
    payments: () => `<form data-form="payments">
        <h2>Payments</h2><p class="muted">Choose how customers can pay you.</p>
        <div class="s-card" style="padding-top:4px;padding-bottom:4px">${Object.entries(PAYMENT_LABEL).map(([k, l]) => `<div class="set-row"><span>${l}</span><label class="switch"><input type="checkbox" name="pay_${k}" ${store.settings.payments[k] ? "checked" : ""} aria-label="${l}"><i></i></label></div>`).join("")}</div>
        <div class="s-foot"><button class="btn btn-primary" type="submit">Save</button></div>
      </form>`,
    notifications: () => `<form data-form="notifications">
        <h2>Notifications</h2><p class="muted">What we tell you about, and where.</p>
        <div class="s-card" style="padding-top:4px;padding-bottom:4px">
          <div class="set-row"><span>Email me when a new order arrives<small>Sent to ${esc(account.email)}</small></span><label class="switch"><input type="checkbox" name="orderEmails" ${store.settings.orderEmails ? "checked" : ""} aria-label="Order emails"><i></i></label></div>
          <div class="set-row"><span>Email me when a product is running out<small>When stock drops to 3 or fewer</small></span><label class="switch"><input type="checkbox" name="stockEmails" ${store.settings.stockEmails ? "checked" : ""} aria-label="Low stock emails"><i></i></label></div>
        </div>
        <div class="s-foot"><button class="btn btn-primary" type="submit">Save</button></div>
      </form>`,
    security: () => `<form data-form="password">
        <h2>Account &amp; security</h2><p class="muted">Signed in as <b>${esc(account.email)}</b>.</p>
        <div class="s-card">
          <b>${account.hasPassword ? "Change password" : "Set a password"}</b>
          <p class="muted small" style="margin:2px 0 12px">${account.hasPassword ? "You'll stay signed in here. Other devices are signed out." : "You sign in with Google. Add a password to sign in with your email too."}</p>
          ${account.hasPassword ? `<div class="field"><label for="s-cur">Current password</label><input class="input" id="s-cur" name="current" type="password" required autocomplete="current-password"></div>` : ""}
          <div class="field"><label for="s-new">New password</label><input class="input" id="s-new" name="password" type="password" minlength="8" required autocomplete="new-password" placeholder="At least 8 characters"></div>
          <button class="btn btn-primary" type="submit">${account.hasPassword ? "Change password" : "Set password"}</button>
        </div>
      </form>
      <div class="s-card danger">
        <b>Reset store</b>
        <p class="muted small" style="margin:2px 0 12px">Deletes all products, orders, customers, pages and website changes. Your account stays.</p>
        <button class="btn btn-danger" type="button" data-action="reset-all">Reset store</button>
      </div>`,
  };

  settingsTab.help = () => `<h2>Help Center</h2><p class="muted">Answers to common questions.</p>
      <div class="s-card help-list">
        ${[
          ["How do I add a product?", "Go to Products and click Add product. Give it a name, price and stock, then save."],
          ["How do I change how my website looks?", "Open Online Store → Themes and click Customize. Click any part of your website to edit it, add sections, and preview it on desktop, tablet and mobile."],
          ["How do I publish my website?", "In the website editor, click Publish website. Your site goes live at your free shopilier.com address."],
          ["Can I go back to an earlier version of my website?", "Yes. Online Store → Themes → Website backups. Click Save a backup any time; a backup is also saved every time you publish. Click Preview to look at a backup, or ⋯ → Publish to bring it back."],
          ["Can I use my own domain?", "Yes. Open Settings → Domain and add your domain. Yearly Business and Pro plans include a free domain."],
          ["How do I record an order from Facebook or phone?", "Go to Orders and click New order. Stock goes down automatically."],
          ["How do I change my plan?", "Open Settings → Plan & billing and choose Switch next to the plan you want."],
          ["How do I contact the Shopilier team?", "Click the green chat button at the bottom right of your dashboard. Pick what it's about (a question, a complaint, billing or a website problem) and we'll reply right there."],
        ].map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}
      </div>
      <div class="s-card help-chat"><div><b>Still need help?</b><p class="muted small">Send a message to the Shopilier team.</p></div><button class="btn btn-primary" type="button" data-action="open-chat">${icon("chat")}Chat with us</button></div>`;

  let settingsEl = null;
  const openSettings = (tab = "general") => {
    if (!settingsTab[tab]) tab = "general";
    toggleMenu(false);
    if (settingsEl) settingsEl.remove();
    const prevFocus = document.activeElement;
    const wrap = document.createElement("div");
    wrap.className = "overlay settings-overlay";
    wrap.innerHTML = `<div class="dialog settings" role="dialog" aria-modal="true" aria-label="Settings">
        <aside class="s-nav"><div class="s-title">Settings</div>${SETTINGS_TABS.map(([id, label, ico]) => `<button type="button" data-tab="${id}">${icon(ico)}${label}</button>`).join("")}</aside>
        <section class="s-body"><button type="button" class="icon-btn s-close" data-close aria-label="Close settings">${icon("x")}</button><div class="s-content"></div></section>
      </div>`;
    const content = wrap.querySelector(".s-content");
    const show = (name) => {
      tab = name;
      wrap.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("on", b.dataset.tab === name));
      content.innerHTML = settingsTab[name]();
    };
    const close = () => { wrap.remove(); settingsEl = null; document.removeEventListener("keydown", onKey, true); rerender(); if (prevFocus) prevFocus.focus(); };
    // Capture Escape first so a dialog opened on top (e.g. Change plan) closes on its own
    const onKey = (e) => { if (e.key === "Escape" && !document.querySelector(".overlay:not(.settings-overlay)")) close(); };
    document.addEventListener("keydown", onKey, true);
    wrap.addEventListener("click", async (e) => {
      if (e.target === wrap || e.target.closest("[data-close]")) return close();
      const t = e.target.closest("[data-tab]");
      if (t) return show(t.dataset.tab);
      const a = e.target.closest("[data-action]");
      if (a && actions[a.dataset.action]) { e.preventDefault(); await actions[a.dataset.action](a); }
    });
    wrap.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target, d = new FormData(f);
      if (f.dataset.form === "general") {
        const oldName = account.business;
        account.business = d.get("business").trim() || account.business;
        // A website still named after the store follows the new store name
        if (store.site.name === oldName) store.site.name = account.business;
        account.name = d.get("owner").trim() || account.name;
        account.email = d.get("email").trim() || account.email;
        store.settings.phone = d.get("phone").trim();
        store.settings.address = d.get("address").trim();
        // the same details Preferences shows on the website
        store.site.phone = store.settings.phone; store.site.address = store.settings.address; touchSite();
      } else if (f.dataset.form === "payments") {
        Object.keys(PAYMENT_LABEL).forEach((k) => { store.settings.payments[k] = f.elements["pay_" + k].checked; });
        syncPayments(); touchSite();
      } else if (f.dataset.form === "notifications") {
        store.settings.orderEmails = f.elements.orderEmails.checked;
        store.settings.stockEmails = f.elements.stockEmails.checked;
      } else if (f.dataset.form === "password") {
        const btn = f.querySelector("[type=submit]");
        btn.disabled = true;
        const res = await fetch("/api/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current: d.get("current") || "", password: d.get("password") }) });
        const data = await res.json().catch(() => ({}));
        btn.disabled = false;
        if (!res.ok) { toast(data.error || "Couldn't change your password."); return; }
        account.hasPassword = true;
        show("security");
        toast("Password saved");
        return;
      }
      persist();
      const ok = await saveNow();
      show(tab);
      if (ok) toast("Settings saved");
    });
    wrap.refresh = () => show(tab);
    wrap.close = close;
    document.body.appendChild(wrap);
    settingsEl = wrap;
    show(tab);
    wrap.querySelector(`[data-tab="${tab}"]`).focus();
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-settings]");
    if (!b) return;
    e.preventDefault();
    document.querySelector(".app").classList.remove("nav-open");
    openSettings(b.dataset.settings);
  });
  // Old links like #/settings or #/billing open the popup
  // and #/help opens its Settings section; #/messages opens the chat
  const settingsFromHash = () => {
    const m = /^#\/(settings|billing|help|messages)$/.exec(location.hash);
    if (!m) return false;
    history.replaceState(null, "", "#/home");
    if (m[1] === "messages") openChat();
    else openSettings(m[1] === "settings" ? "general" : m[1]);
    return true;
  };
  window.addEventListener("hashchange", settingsFromHash);

  const view = document.getElementById("view");
  view.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el || el.tagName === "SELECT" || el.tagName === "INPUT") return;
    const fn = actions[el.dataset.action];
    if (fn) { e.preventDefault(); fn(el); }
  });
  view.addEventListener("change", (e) => {
    const el = e.target;
    if (el.dataset.action === "pixel-on") {
      const p = pixelById(el.dataset.id);
      store.marketing.pixels[p.id].on = el.checked; persist(); go(); toast(`${p.name} ${el.checked ? "is active" : "is paused"}`);
    }
    if (el.dataset.action === "discount-active") {
      const d = store.discounts.find((x) => x.id === el.dataset.id);
      d.active = el.checked; persist(); toast(`${d.code} ${d.active ? "is active" : "is paused"}`);
    }
    if (el.dataset.action === "order-status") {
      const o = store.orders.find((x) => x.id === el.dataset.id);
      o.status = el.value; persist(); toast(`Order #${o.number} marked ${o.status}`);
    }
    if (el.dataset.action === "page-nav") {
      const pg = store.pages.find((x) => x.id === el.dataset.id);
      pg.inNav = el.checked; touchSite(); persist();
    }
  });
  view.addEventListener("input", (e) => {
    const el = e.target;
    if (el.dataset.action === "order-search" || el.dataset.action === "product-search") {
      if (el.dataset.action === "order-search") orderSearch = el.value; else productSearch = el.value;
      const pos = el.selectionStart;
      go();
      const again = view.querySelector(`[data-action="${el.dataset.action}"]`);
      again.focus(); again.setSelectionRange(pos, pos);
    }
  });

  // Top bar search: products when it matches one, otherwise orders
  document.getElementById("top-search").addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const q = e.target.value.trim();
    const isProduct = q && store.products.some((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    if (isProduct) { productSearch = q; location.hash = "#/products"; } else { orderSearch = q; orderFilter = "All"; location.hash = "#/orders"; }
    if (location.hash === (isProduct ? "#/products" : "#/orders")) go();
  });

  // ---------- Home date filters (top bar) ----------
  // Two dropdowns: a preset range (list with a tick) and a month picker (months in a grid by year)
  const filters = document.getElementById("top-filters"), ddRange = document.getElementById("dd-range"), ddMonth = document.getElementById("dd-month");
  const SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const paintFilters = () => {
    const d = new Date(), pm = period.month;
    ddRange.querySelector(".dd-label").textContent = pm ? "Date range" : RANGES.find(([n]) => n === period.days)[1];
    ddMonth.querySelector(".dd-label").textContent = pm ? monthName(pm.y, pm.m) : "Month";
    ddRange.classList.toggle("on", !pm); ddMonth.classList.toggle("on", !!pm);
    ddRange.querySelector(".dd-menu").innerHTML = RANGES.map(([n, l]) => {
      const on = !pm && period.days === n;
      return `<button type="button" class="dd-item${on ? " on" : ""}" role="option" aria-selected="${on}" data-range="${n}"><span>${l}</span>${on ? icon("check") : ""}</button>`;
    }).join("");
    // The last 12 months, grouped by year (newest year first)
    const months = Array.from({ length: 12 }, (_, i) => { const t = new Date(d.getFullYear(), d.getMonth() - i, 1); return { y: t.getFullYear(), m: t.getMonth() }; });
    const years = [...new Set(months.map((x) => x.y))];
    ddMonth.querySelector(".dd-menu").innerHTML = years.map((y) => `<div class="dd-year">${y}</div><div class="dd-grid">${months.filter((x) => x.y === y).sort((a, b) => a.m - b.m).map(({ m }) => {
      const on = !!pm && pm.y === y && pm.m === m;
      return `<button type="button" class="dd-month${on ? " on" : ""}${y === d.getFullYear() && m === d.getMonth() ? " now" : ""}" role="option" aria-selected="${on}" aria-label="${monthName(y, m)}" data-month="${y}-${m}">${SHORT[m]}</button>`;
    }).join("")}</div>`).join("") + (pm ? `<button type="button" class="dd-clear" data-month="">Clear month · back to last 30 days</button>` : "");
  };
  const closeDropdowns = (except) => [ddRange, ddMonth].forEach((dd) => {
    if (dd === except) return;
    dd.querySelector(".dd-menu").hidden = true; dd.querySelector(".top-select").setAttribute("aria-expanded", "false");
  });
  [ddRange, ddMonth].forEach((dd) => {
    const btn = dd.querySelector(".top-select"), menu = dd.querySelector(".dd-menu");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = menu.hidden;
      closeDropdowns(dd); toggleMenu(false); if (bellMenu) bellMenu.hidden = true;
      menu.hidden = !open; btn.setAttribute("aria-expanded", String(open));
      if (open) (menu.querySelector(".on") || menu.querySelector("button")).focus();
    });
    menu.addEventListener("click", (e) => {
      const it = e.target.closest("[data-range], [data-month]");
      if (!it) return;
      if (it.dataset.range) period = { days: Number(it.dataset.range) };
      else if (!it.dataset.month) period = { days: 30 };
      else { const [y, m] = it.dataset.month.split("-").map(Number); period = { month: { y, m } }; }
      closeDropdowns(); paintFilters(); go(); btn.focus();
    });
    // Arrow keys move between options; Escape closes
    menu.addEventListener("keydown", (e) => {
      const items = [...menu.querySelectorAll("button")], i = items.indexOf(document.activeElement);
      const step = { ArrowDown: dd === ddMonth ? 3 : 1, ArrowUp: dd === ddMonth ? -3 : -1, ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (step) { e.preventDefault(); items[Math.max(0, Math.min(items.length - 1, i + step))].focus(); }
      if (e.key === "Escape") { e.stopPropagation(); closeDropdowns(); btn.focus(); }
    });
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".dd")) closeDropdowns(); });
  paintFilters();

  // ⋯ menus in the version list close on a click elsewhere or Escape
  document.addEventListener("click", (e) => { if (!e.target.closest(".v-more")) closeVersionMenus(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeVersionMenus(); });

  // ---------- Notifications (bell) ----------
  const bellBtn = document.getElementById("bell");
  bellMenu = document.getElementById("bell-menu");
  paintBell = () => {
    const pending = store.orders.filter((o) => o.status === "Pending"), low = lowStock();
    const items = [
      ...pending.slice(0, 5).map((o) => `<a class="bell-item" href="#/orders" data-close-bell><span class="bell-ico c2">${icon("cart")}</span><span><b>New order ${orderNo(o)} is pending</b><small>${esc(o.customer)} · ${taka(o.total)} · ${day(o.date)}</small></span></a>`),
      ...low.slice(0, 5).map((p) => `<a class="bell-item" href="#/products" data-close-bell><span class="bell-ico c4">${icon("alert")}</span><span><b>${esc(p.name)} ${p.stock ? `has ${p.stock} left` : "is sold out"}</b><small>Update the stock in Products</small></span></a>`),
      unreadReplies ? `<button class="bell-item" type="button" data-bell-chat><span class="bell-ico c1">${icon("chat")}</span><span><b>${unreadReplies} new ${unreadReplies === 1 ? "reply" : "replies"} from the Shopilier team</b><small>Open the chat to read</small></span></button>` : "",
      store.published ? "" : `<a class="bell-item" href="#/website" data-close-bell><span class="bell-ico c3">${icon("rocket")}</span><span><b>Your website isn't live yet</b><small>Customize it, then publish</small></span></a>`,
    ].filter(Boolean);
    const more = pending.length > 5 ? `<a class="bell-more" href="#/orders" data-close-bell>See all ${pending.length} pending orders</a>` : "";
    bellMenu.innerHTML = `<div class="bell-head"><b>Notifications</b>${items.length ? `<span class="muted small">${items.length}</span>` : ""}</div>
      ${items.length ? `<div class="bell-list">${items.join("")}</div>${more}` : `<div class="bell-empty">${icon("check")}<b>You're all caught up</b><span>New orders, low stock and replies show up here.</span></div>`}`;
  };
  const toggleBell = (open) => {
    if (open) { toggleMenu(false); closeDropdowns(); paintBell(); }
    bellMenu.hidden = !open; bellBtn.setAttribute("aria-expanded", String(open));
  };
  bellBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleBell(bellMenu.hidden); });
  bellMenu.addEventListener("click", (e) => {
    if (e.target.closest("[data-bell-chat]")) { toggleBell(false); openChat(); }
    else if (e.target.closest("[data-close-bell]")) toggleBell(false);
  });
  document.addEventListener("click", (e) => { if (!bellMenu.hidden && !e.target.closest(".bell-wrap")) toggleBell(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !bellMenu.hidden) { toggleBell(false); bellBtn.focus(); } });

  // Online Store in the sidebar opens and closes its own menu (Themes, Pages, Navigation, Preferences)
  const STORE_ROUTES = ["themes", "pages", "navigation", "preferences", "website"];
  const storeToggle = document.getElementById("store-toggle"), storeSub = document.getElementById("store-sub");
  const setStoreOpen = (open) => { storeSub.hidden = !open; storeToggle.setAttribute("aria-expanded", String(open)); };
  storeToggle.addEventListener("click", () => {
    const open = storeSub.hidden;
    setStoreOpen(open);
    if (open && !STORE_ROUTES.includes(location.hash.replace(/^#\/?/, ""))) location.hash = "#/themes";
  });
  const afterRender = (route) => {
    filters.hidden = route !== "home";
    const inStore = STORE_ROUTES.includes(route);
    if (inStore) setStoreOpen(true);
    storeToggle.classList.toggle("in", inStore);
    // The customizer belongs to Themes
    if (route === "website") document.querySelector('[data-route="themes"]').classList.add("on");
  };

  hydrateIcons();
  refreshChrome();
  const startHash = /^#\/(settings|billing|help|messages)$/.exec(location.hash);
  if (startHash) history.replaceState(null, "", "#/home");
  rerender = router(routes, "home", afterRender);
  if (startHash) { if (startHash[1] === "messages") openChat(); else openSettings(startHash[1] === "settings" ? "general" : startHash[1]); }
})();
