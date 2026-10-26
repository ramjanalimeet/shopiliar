// Shopilier store owner dashboard (/admin)
(async () => {
  const { esc, taka, uid, day, daysAgo, avatar, tag, load, toast, PIXELS, normalizePixelId, trackingCode, dialog, confirm, router, bars, icon, hydrateIcons, siteHTML, limitText, withinLimit } = Dash;
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
    Object.assign(store.site, { template: t.id, layout: t.layout, bg: t.bg, text: t.text, accent: t.accent, headline: t.headline, sub: t.sub, cta: t.cta });
    account.template = t.id;
    if (me.store) setTimeout(() => toast("Template changed to " + t.name));
  }
  if (picked) history.replaceState(null, "", location.pathname + location.hash);
  if (!me.store || picked) saveNow();
  const plan = () => PLANS[account.plan] || PLANS.starter;
  // Business and Pro get a free domain with yearly billing
  const hasFreeDomain = () => account.billing === "yearly" && account.plan !== "starter";

  // ---------- Chrome ----------
  const refreshChrome = () => {
    const pending = store.orders.filter((o) => o.status === "Pending").length;
    document.querySelectorAll("[data-badge]").forEach((el) => { el.textContent = pending || ""; });
    document.getElementById("count-pages").textContent = store.pages.length;
    document.getElementById("bell-count").textContent = pending ? (pending > 9 ? "9+" : pending) : "";
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
  profileBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(profileMenu.hidden); });
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
  const PAYMENT_LABEL = { cod: "Cash on delivery", bkash: "bKash", nagad: "Nagad", card: "Card" };
  const PAY_COLOR = { "Cash on delivery": "gray", bKash: "pink", Nagad: "orange", Card: "blue" };
  const sales = (orders) => orders.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);
  const siteUrl = () => store.settings.domain && store.settings.domainStatus === "connected" ? store.settings.domain : store.settings.subdomain + ".shopilier.com";
  const orderNo = (o) => "#" + o.number;
  const head = (title, desc, actions = "") => `<div class="page"><div class="page-head">${title ? `<div><h1>${title}</h1><p>${desc}</p></div>` : ""}<div class="page-actions">${actions}</div></div>`;
  const statusTag = (s) => `<span class="tag dot ${ORDER_STATUS[s]}">${esc(s)}</span>`;
  const searchBox = (action, value, label) => `<label class="box-search">${icon("search")}<input data-action="${action}" value="${esc(value)}" placeholder="${label}" aria-label="${label}"></label>`;
  const limitCallout = (kind, used, limit) => limit == null ? "" : used >= limit
    ? `<div class="callout yellow"><span class="ico">${icon("alert")}</span><div><b>You've used all ${limit} ${kind} on the ${plan().name} plan.</b> <a class="u" href="#" data-settings="billing">Upgrade your plan</a> to add more.</div></div>`
    : "";
  const usage = (kind, used, limit) => limit == null ? `<span class="muted small">Unlimited ${kind}</span>` : `<span class="muted small">${used} / ${limit} ${kind}</span>`;

  // ---------- Home helpers ----------
  let range = 30; // days shown on Home
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
  const lineChart = (now, span, valueFor, money = true) => Dash.lineChart(range, now, span, valueFor, money);
  // Website preview with the store's products
  const previewHTML = (site) => siteHTML(site, store.products, store.pages);
  const salesChart = (now, span) => lineChart(now, span, (from, to) => sales(inPeriod(store.orders, from, to)));
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
  let orderFilter = "All", orderSearch = "", productView = "table", productSearch = "", previewMode = "desktop";

  const routes = {
    home: {
      title: "Home",
      render: () => {
        const now = Date.now(), span = range * 864e5;
        const cur = inPeriod(store.orders, now - span, now), prev = inPeriod(store.orders, now - 2 * span, now - span);
        const live = (list) => list.filter((o) => o.status !== "Cancelled");
        const visits = store.visitors.slice(-Math.min(range, store.visitors.length)).reduce((a, b) => a + b, 0);
        const visitsPrev = range === 7 ? store.visitors.slice(0, 7).reduce((a, b) => a + b, 0) : 0;
        const vsText = `<span class="muted">vs. previous ${range} days</span>`;
        const stat = (label, value, ico, color, d) => `<div class="stat"><div class="stat-top"><span class="stat-label">${label}</span><span class="stat-ico ${color}">${icon(ico)}</span></div><div class="stat-value">${value}</div><div class="stat-delta">${d}</div></div>`;
        const curSales = sales(cur), prevSales = sales(prev);
        const ret = returning(cur, now - span), retPrev = returning(prev, now - 2 * span);
        return `${head("", "",
          `<label class="range">${icon("calendar")}<select data-action="range" aria-label="Date range">${[7, 30, 90].map((d) => `<option value="${d}"${d === range ? " selected" : ""}>Last ${d} days</option>`).join("")}</select>${icon("chevronDown")}</label>`)}
          ${store.published ? "" : `<div class="callout yellow"><span class="ico">${icon("rocket")}</span><div><b>Your website isn't live yet.</b> Customize it, then publish when you're ready.</div><a class="btn btn-sm btn-dark" href="#/website">Customize &amp; publish</a></div>`}
          <div class="stats">
            ${stat("Total sales", taka(curSales), "bag", "c1", delta(curSales, prevSales) + vsText)}
            ${stat("Total orders", cur.length.toLocaleString("en-IN"), "cart", "c2", delta(cur.length, prev.length) + vsText)}
            ${stat("Online store sessions", visits.toLocaleString("en-IN"), "barchart", "c3", store.published || visits ? (visitsPrev ? delta(visits, visitsPrev) + vsText : `<span class="muted">Last ${Math.min(range, 14)} days</span>`) : '<span class="muted">Counting starts when you publish</span>')}
            ${stat("Returning customers", ret.toFixed(1).replace(/\.0$/, "") + "%", "customers", "c4", delta(ret, retPrev, true) + vsText)}
          </div>
          <div class="home-grid">
            <div class="home-main">
              <div class="card"><div class="card-head"><span class="card-title">Sales overview</span><a class="btn" href="#/analytics">View report</a></div>
                <div class="card-body">
                  <div class="sales-top"><span class="sales-total">${taka(curSales)}</span><span class="stat-delta" style="margin:0">${delta(curSales, prevSales)}${vsText}</span>
                    <span class="legend"><span><i></i>This period</span><span><i class="prev"></i>Previous period</span></span></div>
                  ${salesChart(now, span)}
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

    messages: {
      title: "Messages",
      render: () => `${head("Messages", "Questions, complaints or help with your website — talk to the Shopilier team here.", `<button class="btn btn-primary" data-action="new-message">${icon("plus")}New message</button>`)}
        <div id="inbox-root"></div></div>`,
      mount: (view) => { inbox = ShopilierInbox(view.querySelector("#inbox-root"), { mode: "user", onUnread: setMsgBadge }); },
    },

    help: {
      title: "Help Center",
      render: () => `${head("Help Center", "Answers to common questions.")}
        <div class="card"><div class="card-body help-list">
          ${[
            ["How do I add a product?", "Go to Products and click Add product. Give it a name, price and stock, then save."],
            ["How do I change how my website looks?", "Open Online Store. Pick a template, change colors and text, and watch the live preview."],
            ["How do I publish my website?", "In Online Store, click Publish. Your site goes live at your free shopilier.com address."],
            ["Can I use my own domain?", "Yes. Go to Settings and add your domain. Yearly Business and Pro plans include a free domain."],
            ["How do I record an order from Facebook or phone?", "Go to Orders and click New order. Stock goes down automatically."],
            ["How do I change my plan?", "Open Billing and choose Switch next to the plan you want."],
            ["How do I contact the Shopilier team?", "Open Messages in the sidebar and click New message. Pick what it's about (a question, a complaint, billing or a website problem) and we'll reply right there."],
          ].map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}
        </div></div></div>`,
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

    website: {
      title: "Customize website",
      render: () => {
        const s = store.site;
        const palettes = [
          ["Classic", "#ffffff", "#111111", "#111111"], ["Sand", "#f7f4f0", "#2b211a", "#8a5a3b"], ["Ocean", "#eef6fb", "#0b2a3f", "#0b6e99"],
          ["Forest", "#f3f7f1", "#1c3326", "#2f6b2a"], ["Berry", "#fdf3f6", "#3d1527", "#ad1a72"], ["Night", "#14141c", "#ffffff", "#ff7a59"],
        ];
        const published = catalog.filter((t) => t.status === "published");
        return `${head("Customize website", "Pick a template, choose colors and edit your text. The preview updates as you type.",
          `${store.published ? '<span class="tag dot green">Live</span>' : '<span class="tag dot yellow">Draft</span>'}<button class="btn" data-action="reset-site">Reset</button><button class="btn btn-primary" data-action="publish">${icon("rocket")}${store.published ? "Publish changes" : "Publish website"}</button>`)}
          <div style="display:grid;grid-template-columns:380px 1fr;gap:18px;align-items:start" class="customizer">
            <form id="site-form" autocomplete="off">
              <div class="card"><div class="card-head"><span class="card-title">Template</span></div><div class="card-body">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${published.map((t) => `
                  <button type="button" data-action="pick-template" data-id="${t.id}" style="text-align:left;border:1px solid ${t.id === s.template ? "var(--accent)" : "var(--border)"};box-shadow:${t.id === s.template ? "0 0 0 3px var(--accent-soft)" : "none"};border-radius:9px;overflow:hidden">
                    <span style="display:block;height:48px;background:linear-gradient(135deg,${esc(t.bg)} 55%,${esc(t.accent)})"></span>
                    <span style="display:block;padding:7px 9px;font-size:12px;font-weight:600;color:var(--ink)">${esc(t.name)}</span></button>`).join("")}</div>
              </div></div>
              <div class="card"><div class="card-head"><span class="card-title">Brand</span></div><div class="card-body">
                <div class="field"><label for="f-name">Website name</label><input class="input" id="f-name" name="name" value="${esc(s.name)}" maxlength="40"></div>
                <div class="field"><label>Color theme</label><div style="display:flex;flex-wrap:wrap;gap:6px">${palettes.map(([n, bg, tx, ac]) => `
                  <button type="button" class="btn btn-sm" data-action="palette" data-bg="${bg}" data-text="${tx}" data-accent="${ac}"><span style="width:14px;height:14px;border-radius:50%;background:linear-gradient(135deg,${bg} 50%,${ac} 50%);border:1px solid var(--border-strong)"></span>${n}</button>`).join("")}</div></div>
                <div class="row">
                  <div class="field"><label for="f-accent">Button color</label><input class="input" type="color" id="f-accent" name="accent" value="${esc(s.accent)}"></div>
                  <div class="field"><label for="f-bg">Background</label><input class="input" type="color" id="f-bg" name="bg" value="${esc(s.bg)}"></div>
                </div>
                <div class="field" style="margin:0"><label>Font style</label><div class="seg" id="font-seg">${[["modern", "Modern"], ["classic", "Classic"], ["friendly", "Friendly"]].map(([v, l]) => `
                  <label style="cursor:pointer"><input type="radio" name="font" value="${v}" ${s.font === v ? "checked" : ""} hidden><button type="button" tabindex="-1" class="${s.font === v ? "on" : ""}" style="pointer-events:none">${l}</button></label>`).join("")}</div></div>
              </div></div>
              <div class="card"><div class="card-head"><span class="card-title">Homepage text</span></div><div class="card-body">
                <div class="field"><label for="f-headline">Headline</label><input class="input" id="f-headline" name="headline" value="${esc(s.headline)}" maxlength="80"></div>
                <div class="field"><label for="f-sub">Short description</label><textarea class="textarea" id="f-sub" name="sub" maxlength="200">${esc(s.sub)}</textarea></div>
                <div class="field" style="margin:0"><label for="f-cta">Button text</label><input class="input" id="f-cta" name="cta" value="${esc(s.cta)}" maxlength="30"></div>
              </div></div>
              <div class="card"><div class="card-head"><span class="card-title">Sections &amp; contact</span></div><div class="card-body">
                ${[["showProducts", "Products"], ["showAbout", "About us"], ["showContact", "Contact details"]].map(([k, l]) => `
                  <div class="set-row"><span>Show ${l}</span><label class="switch"><input type="checkbox" name="${k}" ${s[k] ? "checked" : ""} aria-label="Show ${l}"><i></i></label></div>`).join("")}
                <div class="field" style="margin-top:12px"><label for="f-about">About us text</label><textarea class="textarea" id="f-about" name="about" maxlength="400">${esc(s.about)}</textarea></div>
                <div class="row"><div class="field"><label for="f-phone">Phone</label><input class="input" id="f-phone" name="phone" value="${esc(s.phone)}"></div><div class="field"><label for="f-email">Email</label><input class="input" id="f-email" name="email" value="${esc(s.email)}"></div></div>
                <div class="field" style="margin:0"><label for="f-address">Address</label><input class="input" id="f-address" name="address" value="${esc(s.address)}"></div>
              </div></div>
            </form>
            <div class="card" style="position:sticky;top:0">
              <div class="card-head"><span class="card-title">Live preview<small>${esc(siteUrl())}</small></span>
                <div class="seg"><button class="${previewMode === "desktop" ? "on" : ""}" data-action="preview-mode" data-mode="desktop">${icon("monitor")}Desktop</button><button class="${previewMode === "mobile" ? "on" : ""}" data-action="preview-mode" data-mode="mobile">${icon("phone")}Mobile</button></div></div>
              <div class="card-body" style="background:var(--bg);border-radius:0 0 12px 12px"><div class="sp-frame ${previewMode === "mobile" ? "mobile" : ""}" id="site-preview">${previewHTML(s)}</div></div>
            </div>
          </div>
        </div>`;
      },
      mount: (view) => {
        const form = view.querySelector("#site-form");
        const update = () => {
          const d = new FormData(form);
          ["name", "accent", "bg", "font", "headline", "sub", "cta", "about", "phone", "email", "address"].forEach((k) => { if (d.has(k)) store.site[k] = d.get(k); });
          ["showProducts", "showAbout", "showContact"].forEach((k) => { store.site[k] = form.elements[k].checked; });
          store.site.text = Dash.isDark(store.site.bg) ? "#ffffff" : (Dash.isDark(store.site.text) ? store.site.text : "#111111");
          form.querySelectorAll("input[name=font]").forEach((r) => r.nextElementSibling.classList.toggle("on", r.checked));
          view.querySelector("#site-preview").innerHTML = previewHTML(store.site);
          store.customized = true;
          persist();
        };
        form.addEventListener("input", update);
        form.addEventListener("change", update);
        form.querySelectorAll(".card + .card").forEach((c) => { c.style.marginTop = "18px"; });
        if (window.innerWidth < 1000) view.querySelector(".customizer").style.gridTemplateColumns = "1fr";
      },
    },

    pages: {
      title: "Pages",
      render: () => {
        const canAdd = withinLimit(plan().pages, store.pages.length);
        return `${head("Pages", "The pages of your website. Turn on “In menu” to show a page in your top menu.", `${usage("pages", store.pages.length, plan().pages)}<button class="btn btn-primary" data-action="add-page" ${canAdd ? "" : "disabled"}>${icon("plus")}Add page</button>`)}
          ${limitCallout("pages", store.pages.length, plan().pages)}
          <div class="card"><div class="table-wrap"><table class="table">
            <thead><tr><th>Page</th><th>Address</th><th>In menu</th><th class="t-actions"></th></tr></thead>
            <tbody>${store.pages.map((p) => `
              <tr><td><button class="t-title" data-action="edit-page" data-id="${p.id}"><span class="stat-ico c1" style="width:32px;height:32px">${icon("pages")}</span>${esc(p.title)}</button></td>
              <td class="muted">${esc(siteUrl())}/${esc(p.slug)}</td>
              <td><label class="switch"><input type="checkbox" data-action="page-nav" data-id="${p.id}" ${p.inNav ? "checked" : ""} aria-label="Show ${esc(p.title)} in menu"><i></i></label></td>
              <td class="t-actions"><button class="icon-btn" data-action="edit-page" data-id="${p.id}" aria-label="Rename ${esc(p.title)}">${icon("edit")}</button>${p.locked ? '<span class="icon-btn" title="The home page can\'t be deleted"></span>' : `<button class="icon-btn danger" data-action="delete-page" data-id="${p.id}" aria-label="Delete ${esc(p.title)}">${icon("trash")}</button>`}</td></tr>`).join("")}</tbody>
          </table></div></div>
        </div>`;
      },
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
      else store.pages.push({ id: uid("pg"), title: v.title, slug, inNav: true });
      persist(); go(); toast(pg ? "Page renamed" : "Page added");
    },
  });

  const pixelById = (id) => PIXELS.find((p) => p.id === id);
  // Support messages: unread replies show as a badge on Messages in the sidebar
  let inbox = null;
  const setMsgBadge = (n) => { document.getElementById("msg-count").textContent = n || ""; };
  const checkMessages = () => ShopilierInbox.unread("user").then(setMsgBadge);
  checkMessages();
  setInterval(() => { if (location.hash !== "#/messages") checkMessages(); }, 60000);

  const actions = {
    "new-message": () => inbox && inbox.newMessage(),
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
    "pick-template": async (el) => {
      const t = findTemplate(el.dataset.id);
      if (t.id === store.site.template) return;
      if (!(await confirm(`Switch to ${t.name}?`, "Colors and layout will change. Your text, products and pages stay the same.", "Switch template"))) return;
      Object.assign(store.site, { template: t.id, layout: t.layout, bg: t.bg, text: t.text, accent: t.accent });
      account.template = t.id; store.customized = true; persist(); go(); toast("Template changed to " + t.name);
    },
    "palette": (el) => { Object.assign(store.site, { bg: el.dataset.bg, text: el.dataset.text, accent: el.dataset.accent }); store.customized = true; persist(); go(); },
    "preview-mode": (el) => { previewMode = el.dataset.mode; go(); },
    "reset-site": async () => {
      const t = findTemplate(store.site.template);
      if (!(await confirm("Reset to template?", `Colors and homepage text go back to the ${t.name} defaults.`, "Reset"))) return;
      Object.assign(store.site, { layout: t.layout, bg: t.bg, text: t.text, accent: t.accent, headline: t.headline, sub: t.sub, cta: t.cta, font: "modern" });
      persist(); go();
    },
    "publish": () => { store.published = true; store.publishedAt = new Date().toISOString(); persist(); go(); toast("🚀 Website published"); },
    "add-page": () => {
      if (!withinLimit(plan().pages, store.pages.length)) { toast(`Your ${plan().name} plan allows ${plan().pages} pages — upgrade to add more`); return; }
      pageDialog(null);
    },
    "edit-page": (el) => pageDialog(store.pages.find((p) => p.id === el.dataset.id)),
    "delete-page": async (el) => {
      const pg = store.pages.find((x) => x.id === el.dataset.id);
      if (await confirm("Delete page?", `The “${pg.title}” page will be removed from your website.`)) { store.pages = store.pages.filter((x) => x !== pg); persist(); go(); }
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
          ${[["Pages", store.pages.length, p.pages], ["Products", store.products.length, p.products]].map(([n, used, lim]) => `
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
        account.business = d.get("business").trim() || account.business;
        account.name = d.get("owner").trim() || account.name;
        account.email = d.get("email").trim() || account.email;
        store.settings.phone = d.get("phone").trim();
        store.settings.address = d.get("address").trim();
      } else if (f.dataset.form === "payments") {
        Object.keys(PAYMENT_LABEL).forEach((k) => { store.settings.payments[k] = f.elements["pay_" + k].checked; });
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
  const settingsFromHash = () => {
    const m = /^#\/(settings|billing)$/.exec(location.hash);
    if (!m) return false;
    history.replaceState(null, "", "#/home");
    openSettings(m[1] === "billing" ? "billing" : "general");
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
    if (el.dataset.action === "range") { range = Number(el.value); go(); }
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
      pg.inNav = el.checked; persist();
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

  hydrateIcons();
  refreshChrome();
  if (/^#\/(settings|billing)$/.test(location.hash)) { const tab = location.hash.endsWith("billing") ? "billing" : "general"; history.replaceState(null, "", "#/home"); rerender = router(routes, "home"); openSettings(tab); }
  else rerender = router(routes, "home");
})();
