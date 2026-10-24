// Shopiliar store owner dashboard (/admin)
(() => {
  const { esc, taka, uid, day, daysAgo, avatar, tag, load, save, remove, toast, dialog, confirm, router, bars, siteHTML, limitText, withinLimit } = Dash;
  // Plan prices and limits are managed from /master-admin when available
  const PLANS = (load("shopiliar.master", null) || {}).plans || Dash.PLANS();
  const ACCOUNT_KEY = "shopiliar.account";
  const STORE_KEY = "shopiliar.store";

  // ---------- Data ----------
  const account = load(ACCOUNT_KEY, () => ({
    demo: true, name: "Alex Carter", business: "Lume Furniture", email: "alex@lume.com.bd",
    plan: "business", billing: "monthly", template: "luxe-store", createdAt: new Date().toISOString(),
  }));
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
  const store = load(STORE_KEY, seedStore);
  const persist = () => { save(STORE_KEY, store); save(ACCOUNT_KEY, account); refreshChrome(); };
  const plan = () => PLANS[account.plan] || PLANS.starter;

  // ---------- Chrome ----------
  const refreshChrome = () => {
    const name = store.site.name || "My Store";
    document.getElementById("ws-name").textContent = name;
    document.getElementById("crumb-store").textContent = name;
    document.getElementById("ws-logo").textContent = name.trim()[0]?.toUpperCase() || "S";
    document.getElementById("ws-plan").textContent = plan().name + " plan · " + (account.billing === "yearly" ? "Yearly" : "Monthly");
    document.getElementById("count-orders").textContent = store.orders.filter((o) => o.status === "Pending").length || "";
    document.getElementById("count-products").textContent = store.products.length;
    document.getElementById("count-pages").textContent = store.pages.length;
  };
  document.getElementById("logout").addEventListener("click", async () => {
    const ok = await confirm("Log out?", "You'll go back to the sign-in page. Your store data stays saved in this browser.", "Log out");
    if (!ok) return;
    try { sessionStorage.removeItem("shopiliar.session"); } catch (e) { /* ignore */ }
    location.href = "../signin.html";
  });

  // ---------- Helpers ----------
  const ORDER_STATUS = { Pending: "yellow", Paid: "blue", Shipped: "purple", Delivered: "green", Cancelled: "red" };
  const PAYMENT_LABEL = { cod: "Cash on delivery", bkash: "bKash", nagad: "Nagad", card: "Card" };
  const sales = (orders) => orders.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };
  const siteUrl = () => store.settings.domain && store.settings.domainStatus === "connected" ? store.settings.domain : store.settings.subdomain + ".shopiliar.com";
  const orderNo = (o) => "#" + o.number;
  const pageHead = (icon, title, desc, cover = false) =>
    `${cover ? '<div class="cover"></div>' : ""}<div class="page${cover ? "" : ""}"><div class="page-icon">${icon}</div><h1 class="page-title">${esc(title)}</h1><p class="page-desc">${desc}</p>`;
  const limitCallout = (kind, used, limit) => limit == null ? "" : used >= limit
    ? `<div class="callout yellow"><span class="ico">⚠️</span><div><b>You've used all ${limit} ${kind} on the ${plan().name} plan.</b> <a href="#/billing" style="text-decoration:underline">Upgrade your plan</a> to add more.</div></div>`
    : `<p class="muted small" style="margin:-10px 0 14px">${used} of ${limit} ${kind} used on the ${plan().name} plan.</p>`;

  const checklist = () => [
    { done: store.products.length > 0, text: "Add your first product", href: "#/products" },
    { done: !!store.customized, text: "Customize your website", href: "#/website" },
    { done: Object.values(store.settings.payments).some(Boolean), text: "Choose how customers pay", href: "#/settings" },
    { done: !!store.settings.domain, text: "Connect your domain", href: "#/settings" },
    { done: store.published, text: "Publish your website", href: "#/website" },
  ];

  const orderTable = (orders, compact = false) => `
    <div class="table-wrap"><table class="table">
      <thead><tr><th>Order</th><th>Customer</th>${compact ? "" : "<th>Date</th><th>Payment</th>"}<th class="t-right">Total</th><th>Status</th>${compact ? "" : '<th class="t-actions"></th>'}</tr></thead>
      <tbody>${orders.length ? orders.map((o) => `
        <tr>
          <td><button class="t-title" data-action="view-order" data-id="${o.id}">🧾 ${orderNo(o)}</button></td>
          <td><span class="t-title" style="font-weight:400">${avatar(o.customer)}${esc(o.customer)}</span></td>
          ${compact ? "" : `<td class="muted">${day(o.date)}</td><td>${tag(o.payment, o.payment === "Cash on delivery" ? "gray" : o.payment === "bKash" ? "pink" : o.payment === "Nagad" ? "orange" : "blue")}</td>`}
          <td class="t-right">${taka(o.total)}</td>
          <td>${compact ? tag(o.status, ORDER_STATUS[o.status]) : `<select class="select" style="height:26px;width:auto" data-action="order-status" data-id="${o.id}" aria-label="Order status">${Object.keys(ORDER_STATUS).map((s) => `<option${s === o.status ? " selected" : ""}>${s}</option>`).join("")}</select>`}</td>
          ${compact ? "" : `<td class="t-actions"><button class="icon-btn" data-action="delete-order" data-id="${o.id}" aria-label="Delete order">🗑</button></td>`}
        </tr>`).join("") : `<tr><td colspan="7" class="table-empty">No orders here yet.</td></tr>`}</tbody>
    </table></div>`;

  // ---------- Views ----------
  let orderFilter = "All", orderSearch = "", productView = "table", productSearch = "", previewMode = "desktop";

  const routes = {
    home: {
      title: "Home",
      render: () => {
        const list = checklist();
        const done = list.filter((c) => c.done).length;
        const month = store.orders.filter((o) => Date.now() - new Date(o.date) < 30 * 864e5);
        const visitors = store.visitors.reduce((a, b) => a + b, 0);
        return `${pageHead("👋", `${greeting()}, ${account.name.split(" ")[0]}`, `Here's what's happening with <b>${esc(store.site.name)}</b> today.`, true)}
          ${account.demo ? `<div class="callout blue"><span class="ico">💡</span><div>You're looking at a <b>demo store</b>. <a href="../signup.html" style="text-decoration:underline">Sign up</a> to start your own — your details and chosen plan will appear here.</div></div>` : ""}
          ${store.published
            ? `<div class="callout green"><span class="ico">🟢</span><div><b>Your website is live</b> at <span style="text-decoration:underline">${esc(siteUrl())}</span></div></div>`
            : `<div class="callout yellow"><span class="ico">🚀</span><div style="flex:1"><b>Your website isn't live yet.</b> Customize it, then publish when you're ready.</div><a class="btn btn-sm btn-dark" href="#/website">Customize &amp; publish</a></div>`}
          <div class="stats">
            <div class="stat"><div class="stat-label">💰 Sales (30 days)</div><div class="stat-value">${taka(sales(month))}</div><div class="stat-delta" style="color:var(--muted)">${month.filter((o) => o.status !== "Cancelled").length} paid or open orders</div></div>
            <div class="stat"><div class="stat-label">🧾 Orders</div><div class="stat-value">${month.length}</div><div class="stat-delta">${store.orders.filter((o) => o.status === "Pending").length} pending</div></div>
            <div class="stat"><div class="stat-label">👀 Visitors (14 days)</div><div class="stat-value">${visitors.toLocaleString("en-IN")}</div><div class="stat-delta" style="color:var(--muted)">${account.demo ? "Sample data" : "Counting starts when you publish"}</div></div>
            <div class="stat"><div class="stat-label">📦 Products</div><div class="stat-value">${store.products.length}</div><div class="stat-delta" style="color:var(--muted)">of ${limitText(plan().products)} on ${plan().name}</div></div>
          </div>
          <div class="cols">
            <div>
              <h2 class="h2">✅ Set up your store</h2>
              <div class="muted small">${done} of ${list.length} done</div>
              <div class="progress"><i style="width:${(done / list.length) * 100}%"></i></div>
              <ul class="todo">${list.map((c) => `<li class="${c.done ? "done" : ""}"><input type="checkbox" ${c.done ? "checked" : ""} disabled aria-label="${esc(c.text)}"><span>${esc(c.text)}</span><a href="${c.href}">Open →</a></li>`).join("")}</ul>
            </div>
            <div>
              <h2 class="h2">⚡ Quick actions</h2>
              <ul class="todo">
                <li><span>📦</span><button data-action="add-product" style="text-align:left">Add a product</button></li>
                <li><span>🧾</span><button data-action="add-order" style="text-align:left">Record an order</button></li>
                <li><span>🎨</span><a href="#/website" style="margin:0;color:inherit;font-size:14px">Change website colors &amp; text</a></li>
                <li><span>📄</span><a href="#/pages" style="margin:0;color:inherit;font-size:14px">Add a page</a></li>
              </ul>
            </div>
          </div>
          <h2 class="h2">🧾 Recent orders <span class="spacer"></span><a class="btn btn-sm btn-ghost" href="#/orders">View all</a></h2>
          ${orderTable(store.orders.slice(0, 5), true)}
        </div>`;
      },
    },

    orders: {
      title: "Orders",
      render: () => {
        const tabs = ["All", ...Object.keys(ORDER_STATUS)];
        const q = orderSearch.toLowerCase();
        const list = store.orders
          .filter((o) => orderFilter === "All" || o.status === orderFilter)
          .filter((o) => !q || (o.customer + " " + o.number + " " + o.phone).toLowerCase().includes(q));
        return `${pageHead("🧾", "Orders", "Track every order from pending to delivered. Change a status right in the table.")}
          <div class="db-bar">
            <div class="db-tabs">${tabs.map((t) => `<button class="db-tab ${t === orderFilter ? "on" : ""}" data-action="order-tab" data-tab="${t}">${t}<span class="muted small">${t === "All" ? store.orders.length : store.orders.filter((o) => o.status === t).length}</span></button>`).join("")}</div>
            <input class="db-search" placeholder="🔍 Search orders" value="${esc(orderSearch)}" data-action="order-search" aria-label="Search orders">
            <button class="btn btn-sm btn-primary" data-action="add-order">New order</button>
          </div>
          ${orderTable(list)}
          <button class="add-row" data-action="add-order">＋ New order</button>
        </div>`;
      },
    },

    products: {
      title: "Products",
      render: () => {
        const q = productSearch.toLowerCase();
        const list = store.products.filter((p) => !q || (p.name + " " + p.category).toLowerCase().includes(q));
        const canAdd = withinLimit(plan().products, store.products.length);
        return `${pageHead("📦", "Products", "Everything you sell. Click a product name to edit it.")}
          ${limitCallout("products", store.products.length, plan().products)}
          <div class="db-bar">
            <div class="db-tabs">
              <button class="db-tab ${productView === "table" ? "on" : ""}" data-action="product-view" data-view="table">☰ Table</button>
              <button class="db-tab ${productView === "gallery" ? "on" : ""}" data-action="product-view" data-view="gallery">▦ Gallery</button>
            </div>
            <input class="db-search" placeholder="🔍 Search products" value="${esc(productSearch)}" data-action="product-search" aria-label="Search products">
            <button class="btn btn-sm btn-primary" data-action="add-product" ${canAdd ? "" : "disabled style=opacity:.5"}>New product</button>
          </div>
          ${productView === "table" ? `
          <div class="table-wrap"><table class="table">
            <thead><tr><th>Name</th><th>Category</th><th class="t-right">Price</th><th class="t-right">Stock</th><th>Status</th><th class="t-actions"></th></tr></thead>
            <tbody>${list.length ? list.map((p) => `
              <tr>
                <td><button class="t-title" data-action="edit-product" data-id="${p.id}"><span style="width:18px;height:18px;border-radius:4px;background:${esc(p.color)};flex:none;border:1px solid var(--border)"></span>${esc(p.name)}</button></td>
                <td>${tag(p.category || "General", "brown")}</td>
                <td class="t-right">${taka(p.price)}</td>
                <td class="t-right">${p.stock > 0 ? p.stock : '<span style="color:var(--danger)">Out of stock</span>'}</td>
                <td>${p.status === "draft" ? tag("Draft", "gray") : tag("Active", "green")}</td>
                <td class="t-actions"><button class="icon-btn" data-action="delete-product" data-id="${p.id}" aria-label="Delete ${esc(p.name)}">🗑</button></td>
              </tr>`).join("") : `<tr><td colspan="6" class="table-empty">No products yet.</td></tr>`}</tbody>
          </table></div>
          ${canAdd ? '<button class="add-row" data-action="add-product">＋ New product</button>' : ""}` : `
          <div class="gallery">${list.map((p) => `
            <div class="g-card">
              <div class="g-cover" style="background:${esc(p.color)}"></div>
              <div class="g-body"><div class="g-title">${esc(p.name)}</div><div class="g-meta">${tag(taka(p.price), "green")}${tag(p.category || "General", "brown")}${p.status === "draft" ? tag("Draft") : ""}</div>
              <div class="g-actions"><button class="btn btn-sm" data-action="edit-product" data-id="${p.id}">Edit</button><button class="btn btn-sm btn-danger" data-action="delete-product" data-id="${p.id}">Delete</button></div></div>
            </div>`).join("")}</div>`}
        </div>`;
      },
    },

    customers: {
      title: "Customers",
      render: () => {
        const stats = (c) => { const os = store.orders.filter((o) => o.customer === c.name); return { count: os.length, spent: sales(os) }; };
        return `${pageHead("👥", "Customers", "People who bought from you. Totals update automatically from your orders.")}
          <div class="db-bar"><div class="db-tabs"><span class="db-tab on">All customers <span class="muted small">${store.customers.length}</span></span></div><button class="btn btn-sm btn-primary" data-action="add-customer">New customer</button></div>
          <div class="table-wrap"><table class="table">
            <thead><tr><th>Name</th><th>Phone</th><th>City</th><th class="t-right">Orders</th><th class="t-right">Total spent</th><th>Customer since</th><th class="t-actions"></th></tr></thead>
            <tbody>${store.customers.map((c) => { const s = stats(c); return `
              <tr><td><span class="t-title">${avatar(c.name)}${esc(c.name)}</span></td><td class="muted">${esc(c.phone)}</td><td>${tag(c.city || "—", "blue")}</td>
              <td class="t-right">${s.count}</td><td class="t-right">${taka(s.spent)}</td><td class="muted">${day(c.joined)}</td>
              <td class="t-actions"><button class="icon-btn" data-action="delete-customer" data-id="${c.id}" aria-label="Delete ${esc(c.name)}">🗑</button></td></tr>`; }).join("")}</tbody>
          </table></div>
          <button class="add-row" data-action="add-customer">＋ New customer</button>
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
        return `${pageHead("📈", "Analytics", "How your website and sales are doing.")}
          <div class="cols">${bars("Sales · last 7 days", taka(days.reduce((a, b) => a + b.v, 0)), days)}${bars("Visitors · last 14 days", store.visitors.reduce((a, b) => a + b, 0).toLocaleString("en-IN"), vis)}</div>
          <div class="cols">
            <div><h2 class="h2">🏆 Top products</h2><div class="table-wrap"><table class="table" style="min-width:0"><thead><tr><th>Product</th><th class="t-right">Sales</th></tr></thead><tbody>${topList.map(([n, v]) => `<tr><td class="t-title">${esc(n)}</td><td class="t-right">${taka(v)}</td></tr>`).join("") || '<tr><td colspan="2" class="table-empty">No sales yet</td></tr>'}</tbody></table></div></div>
            <div><h2 class="h2">🌐 Where visitors come from</h2>${sources.map(([n, p]) => `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between"><span>${n}</span><span class="muted">${p}%</span></div><div class="progress"><i style="width:${p}%;background:var(--accent)"></i></div></div>`).join("")}</div>
          </div>
          <p class="muted small">Visitor numbers are sample data until your live website is connected.</p>
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
        return `<div class="page wide"><div class="page-icon">🎨</div><h1 class="page-title">Customize website</h1>
          <p class="page-desc">Pick a template, choose colors and edit your text. The preview updates as you type. Nothing goes live until you press <b>Publish</b>.</p>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:18px">
            ${store.published ? tag("● Live", "green") : tag("● Draft — not published", "yellow")}
            <span class="muted small">${esc(siteUrl())}</span><span style="flex:1"></span>
            <button class="btn" data-action="reset-site">Reset to template</button>
            <button class="btn btn-dark" data-action="publish">${store.published ? "Publish changes" : "🚀 Publish website"}</button>
          </div>
          <div style="display:grid;grid-template-columns:340px 1fr;gap:28px;align-items:start" class="customizer">
            <form id="site-form" autocomplete="off">
              <h2 class="h2" style="margin-top:0">1. Template</h2>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${published.map((t) => `
                <button type="button" data-action="pick-template" data-id="${t.id}" style="text-align:left;border:1px solid ${t.id === s.template ? "var(--accent)" : "var(--border)"};box-shadow:${t.id === s.template ? "0 0 0 2px var(--accent-soft)" : "none"};border-radius:6px;overflow:hidden">
                  <span style="display:block;height:42px;background:linear-gradient(135deg,${esc(t.bg)} 55%,${esc(t.accent)})"></span>
                  <span style="display:block;padding:5px 7px;font-size:12px;font-weight:500">${esc(t.name)}</span></button>`).join("")}</div>
              <h2 class="h2">2. Brand</h2>
              <div class="field"><label for="f-name">Website name</label><input class="input" id="f-name" name="name" value="${esc(s.name)}" maxlength="40"></div>
              <div class="field"><label>Color theme</label><div style="display:flex;flex-wrap:wrap;gap:6px">${palettes.map(([n, bg, tx, ac]) => `
                <button type="button" class="btn btn-sm" data-action="palette" data-bg="${bg}" data-text="${tx}" data-accent="${ac}" title="${n}"><span style="width:14px;height:14px;border-radius:50%;background:linear-gradient(135deg,${bg} 50%,${ac} 50%);border:1px solid var(--border-strong)"></span>${n}</button>`).join("")}</div></div>
              <div class="row">
                <div class="field"><label for="f-accent">Button color</label><input class="input" type="color" id="f-accent" name="accent" value="${esc(s.accent)}" style="padding:2px"></div>
                <div class="field"><label for="f-bg">Background</label><input class="input" type="color" id="f-bg" name="bg" value="${esc(s.bg)}" style="padding:2px"></div>
              </div>
              <div class="field"><label>Font style</label><div style="display:flex;gap:6px">${[["modern", "Modern"], ["classic", "Classic"], ["friendly", "Friendly"]].map(([v, l]) => `
                <label class="btn btn-sm" style="${s.font === v ? "border-color:var(--accent);color:var(--accent)" : ""}"><input type="radio" name="font" value="${v}" ${s.font === v ? "checked" : ""} hidden>${l}</label>`).join("")}</div></div>
              <h2 class="h2">3. Homepage text</h2>
              <div class="field"><label for="f-headline">Headline</label><input class="input" id="f-headline" name="headline" value="${esc(s.headline)}" maxlength="80"></div>
              <div class="field"><label for="f-sub">Short description</label><textarea class="textarea" id="f-sub" name="sub" maxlength="200">${esc(s.sub)}</textarea></div>
              <div class="field"><label for="f-cta">Button text</label><input class="input" id="f-cta" name="cta" value="${esc(s.cta)}" maxlength="30"></div>
              <h2 class="h2">4. Sections</h2>
              ${[["showProducts", "Products"], ["showAbout", "About us"], ["showContact", "Contact details"]].map(([k, l]) => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0"><span>${l}</span><label class="switch"><input type="checkbox" name="${k}" ${s[k] ? "checked" : ""} aria-label="Show ${l}"><i></i></label></div>`).join("")}
              <div class="field" style="margin-top:8px"><label for="f-about">About us text</label><textarea class="textarea" id="f-about" name="about" maxlength="400">${esc(s.about)}</textarea></div>
              <div class="row"><div class="field"><label for="f-phone">Phone</label><input class="input" id="f-phone" name="phone" value="${esc(s.phone)}"></div><div class="field"><label for="f-email">Email</label><input class="input" id="f-email" name="email" value="${esc(s.email)}"></div></div>
              <div class="field"><label for="f-address">Address</label><input class="input" id="f-address" name="address" value="${esc(s.address)}"></div>
            </form>
            <div style="position:sticky;top:12px">
              <div class="db-bar" style="border:0;margin-bottom:8px"><div class="db-tabs">
                <button class="db-tab ${previewMode === "desktop" ? "on" : ""}" data-action="preview-mode" data-mode="desktop">🖥 Desktop</button>
                <button class="db-tab ${previewMode === "mobile" ? "on" : ""}" data-action="preview-mode" data-mode="mobile">📱 Mobile</button></div>
                <span class="muted small">Live preview</span></div>
              <div class="sp-frame ${previewMode === "mobile" ? "mobile" : ""}" id="site-preview">${siteHTML(s, store.products, store.pages)}</div>
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
          form.querySelectorAll("input[name=font]").forEach((r) => { r.parentElement.style.cssText = r.checked ? "border-color:var(--accent);color:var(--accent)" : ""; });
          view.querySelector("#site-preview").innerHTML = siteHTML(store.site, store.products, store.pages);
          store.customized = true;
          persist();
        };
        form.addEventListener("input", update);
        form.addEventListener("change", update);
        if (window.innerWidth < 900) view.querySelector(".customizer").style.gridTemplateColumns = "1fr";
      },
    },

    pages: {
      title: "Pages",
      render: () => {
        const canAdd = withinLimit(plan().pages, store.pages.length);
        return `${pageHead("📄", "Pages", "The pages of your website. Turn on “In menu” to show a page in your website's top menu.")}
          ${limitCallout("pages", store.pages.length, plan().pages)}
          <div class="db-bar"><div class="db-tabs"><span class="db-tab on">All pages <span class="muted small">${store.pages.length}</span></span></div>
          <button class="btn btn-sm btn-primary" data-action="add-page" ${canAdd ? "" : "disabled style=opacity:.5"}>New page</button></div>
          <div class="table-wrap"><table class="table">
            <thead><tr><th>Page</th><th>Address</th><th>In menu</th><th class="t-actions"></th></tr></thead>
            <tbody>${store.pages.map((p) => `
              <tr><td><button class="t-title" data-action="edit-page" data-id="${p.id}">📄 ${esc(p.title)}</button></td>
              <td class="muted">/${esc(p.slug)}</td>
              <td><label class="switch"><input type="checkbox" data-action="page-nav" data-id="${p.id}" ${p.inNav ? "checked" : ""} aria-label="Show ${esc(p.title)} in menu"><i></i></label></td>
              <td class="t-actions">${p.locked ? '<span class="muted small">Home page</span>' : `<button class="icon-btn" data-action="delete-page" data-id="${p.id}" aria-label="Delete ${esc(p.title)}">🗑</button>`}</td></tr>`).join("")}</tbody>
          </table></div>
          ${canAdd ? '<button class="add-row" data-action="add-page">＋ New page</button>' : ""}
        </div>`;
      },
    },

    settings: {
      title: "Settings",
      render: () => {
        const st = store.settings;
        const freeDomain = account.billing === "yearly" && account.plan !== "starter";
        return `${pageHead("⚙️", "Settings", "Your store details, domain and payment options.")}
          <form id="settings-form">
            <h2 class="h2">🏪 Store details</h2>
            <div class="row">
              <div class="field"><label for="s-business">Business name</label><input class="input" id="s-business" name="business" value="${esc(account.business)}"></div>
              <div class="field"><label for="s-owner">Your name</label><input class="input" id="s-owner" name="owner" value="${esc(account.name)}"></div>
              <div class="field"><label for="s-email">Email</label><input class="input" id="s-email" name="email" type="email" value="${esc(account.email)}"></div>
              <div class="field"><label for="s-phone">Phone</label><input class="input" id="s-phone" name="phone" value="${esc(st.phone)}"></div>
            </div>
            <div class="field"><label for="s-address">Address</label><input class="input" id="s-address" name="address" value="${esc(st.address)}"></div>
            <h2 class="h2">🌐 Domain</h2>
            <p class="muted" style="margin-bottom:10px">Free address: <b style="color:var(--text)">${esc(st.subdomain)}.shopiliar.com</b></p>
            ${freeDomain ? `<div class="callout green"><span class="ico">🎁</span><div><b>Your yearly ${plan().name} plan includes a free custom domain.</b> Type the domain you want below.</div></div>` : ""}
            <div style="display:flex;gap:8px;align-items:flex-end">
              <div class="field" style="flex:1;margin:0"><label for="s-domain">Custom domain</label><input class="input" id="s-domain" name="domain" placeholder="www.yourbusiness.com" value="${esc(st.domain)}"></div>
              <button type="button" class="btn" data-action="connect-domain">${st.domain ? "Update" : "Connect"}</button>
            </div>
            ${st.domain ? `<p style="margin-top:8px">${tag(st.domainStatus === "connected" ? "Connected" : "Waiting for DNS", st.domainStatus === "connected" ? "green" : "yellow")} <span class="muted small">${esc(st.domain)}</span></p>` : ""}
            <h2 class="h2">💳 How customers pay</h2>
            ${Object.entries(PAYMENT_LABEL).map(([k, l]) => `<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border)"><span>${l}</span><label class="switch"><input type="checkbox" name="pay_${k}" ${st.payments[k] ? "checked" : ""} aria-label="${l}"><i></i></label></div>`).join("")}
            <h2 class="h2">🔔 Notifications</h2>
            <label class="check"><input type="checkbox" name="orderEmails" ${st.orderEmails ? "checked" : ""}> Email me when a new order arrives</label>
            <div style="margin-top:22px"><button class="btn btn-primary" type="submit">Save settings</button></div>
          </form>
          <h2 class="h2" style="color:var(--danger)">Danger zone</h2>
          <div class="callout red"><span class="ico">🧹</span><div style="flex:1">Reset this demo store: deletes its products, orders and website changes in this browser.</div><button class="btn btn-sm btn-danger" data-action="reset-all">Reset store</button></div>
        </div>`;
      },
      mount: (view) => {
        view.querySelector("#settings-form").addEventListener("submit", (e) => {
          e.preventDefault();
          const d = new FormData(e.target);
          account.business = d.get("business").trim() || account.business;
          account.name = d.get("owner").trim() || account.name;
          account.email = d.get("email").trim() || account.email;
          store.settings.phone = d.get("phone").trim();
          store.settings.address = d.get("address").trim();
          Object.keys(PAYMENT_LABEL).forEach((k) => { store.settings.payments[k] = e.target.elements["pay_" + k].checked; });
          store.settings.orderEmails = e.target.elements.orderEmails.checked;
          persist();
          toast("Settings saved");
        });
      },
    },

    billing: {
      title: "Plan & billing",
      render: () => {
        const p = plan();
        const yearly = account.billing === "yearly";
        return `${pageHead("💳", "Plan & billing", "Your plan, what it includes and how much of it you're using.")}
          <div class="callout"><span class="ico">⭐</span><div style="flex:1"><b>${p.name} plan</b> · ${yearly ? `${taka(p.price * 12)}/year` : `${taka(p.price)}/month`}<div class="muted small">${yearly ? "Billed yearly" : "Billed monthly"}${yearly && account.plan !== "starter" ? " · includes a free custom domain" : ""}</div></div><button class="btn btn-sm btn-dark" data-action="change-plan">Change plan</button></div>
          <h2 class="h2">Usage</h2>
          ${[["Pages", store.pages.length, p.pages], ["Products", store.products.length, p.products]].map(([n, used, lim]) => `
            <div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between"><span>${n}</span><span class="muted">${used} of ${limitText(lim)}</span></div>
            <div class="progress"><i style="width:${lim == null ? 6 : Math.min(100, (used / lim) * 100)}%;background:${lim != null && used >= lim ? "var(--danger)" : "var(--accent)"}"></i></div></div>`).join("")}
          <h2 class="h2">Included in every plan</h2>
          <ul class="todo"><li class="">✅ <span>Free website</span></li><li>✅ <span>Free CMS access</span></li><li>✅ <span>Free support</span></li></ul>
          <h2 class="h2">Compare plans</h2>
          <div class="table-wrap"><table class="table"><thead><tr><th>Plan</th><th class="t-right">Monthly</th><th>Pages</th><th>Products</th><th>Free domain (yearly)</th><th></th></tr></thead>
          <tbody>${Object.entries(PLANS).map(([id, pl]) => `<tr><td class="t-title">${pl.name} ${id === account.plan ? tag("Current", "blue") : ""}</td><td class="t-right">${taka(pl.price)}</td><td>${limitText(pl.pages)}</td><td>${pl.products == null ? "Unlimited" : id === "business" ? "150+" : pl.products}</td><td>${id === "starter" ? "—" : "✅"}</td>
            <td class="t-actions">${id === account.plan ? "" : `<button class="btn btn-sm" data-action="set-plan" data-plan="${id}">Switch</button>`}</td></tr>`).join("")}</tbody></table></div>
          <p class="muted small" style="margin-top:12px">Online payment for plans isn't connected yet — switching plans here updates your limits in this demo.</p>
        </div>`;
      },
    },
  };

  // ---------- Actions ----------
  const go = () => rerender();
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

  const actions = {
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
    "change-plan": () => dialog({
      title: "Change plan",
      body: `<div class="field"><label>Plan</label><select class="select" name="plan">${Object.entries(PLANS).map(([id, p]) => `<option value="${id}"${id === account.plan ? " selected" : ""}>${p.name} — ${taka(p.price)}/month</option>`).join("")}</select></div>
        <div class="field"><label>Billing</label><select class="select" name="billing"><option value="monthly">Monthly</option><option value="yearly"${account.billing === "yearly" ? " selected" : ""}>Yearly (free custom domain on Business &amp; Pro)</option></select></div>`,
      submit: "Update plan",
      onSubmit: (v) => { account.plan = v.plan; account.billing = v.billing; persist(); go(); toast("Plan updated to " + PLANS[v.plan].name); },
    }),
    "set-plan": (el) => { account.plan = el.dataset.plan; persist(); go(); toast("Plan updated to " + PLANS[account.plan].name); },
    "reset-all": async () => {
      if (!(await confirm("Reset store?", "All products, orders, customers, pages and website changes in this browser will be deleted.", "Reset store"))) return;
      remove(STORE_KEY); location.reload();
    },
  };

  const view = document.getElementById("view");
  view.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el || el.tagName === "SELECT" || el.tagName === "INPUT") return;
    const fn = actions[el.dataset.action];
    if (fn) { e.preventDefault(); fn(el); }
  });
  view.addEventListener("change", (e) => {
    const el = e.target;
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

  refreshChrome();
  rerender = router(routes, "home");
})();
