// Shopiliar store owner dashboard (/admin)
(async () => {
  const { esc, taka, uid, day, daysAgo, avatar, tag, load, toast, dialog, confirm, router, bars, icon, hydrateIcons, siteHTML, limitText, withinLimit } = Dash;
  // Plan prices and limits are managed from /master-admin when available
  const PLANS = (load("shopiliar.master", null) || {}).plans || Dash.PLANS();
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
  const store = me.store || seedStore();
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
    }).catch((err) => toast(err.message));
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
    document.getElementById("me-avatar").innerHTML = avatar(account.name);
    document.getElementById("me-name").textContent = account.name;
    document.getElementById("me-email").textContent = account.email;
    const bell = document.getElementById("bell");
    bell.querySelector(".dot")?.remove();
    if (store.orders.some((o) => o.status === "Pending")) bell.insertAdjacentHTML("beforeend", '<span class="dot"></span>');
  };
  document.getElementById("logout").addEventListener("click", async () => {
    const ok = await confirm("Log out?", "You'll go back to the sign-in page. Your store stays saved in your account.", "Log out");
    if (!ok) return;
    if (saveTimer) await saveNow();
    await fetch("/api/signout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {});
    location.href = "/signin.html";
  });

  // ---------- Helpers ----------
  const ORDER_STATUS = { Pending: "yellow", Paid: "blue", Shipped: "purple", Delivered: "green", Cancelled: "red" };
  const PAYMENT_LABEL = { cod: "Cash on delivery", bkash: "bKash", nagad: "Nagad", card: "Card" };
  const PAY_COLOR = { "Cash on delivery": "gray", bKash: "pink", Nagad: "orange", Card: "blue" };
  const sales = (orders) => orders.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);
  const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };
  const siteUrl = () => store.settings.domain && store.settings.domainStatus === "connected" ? store.settings.domain : store.settings.subdomain + ".shopiliar.com";
  const orderNo = (o) => "#" + o.number;
  const head = (title, desc, actions = "") => `<div class="page"><div class="page-head"><div><h1>${title}</h1><p>${desc}</p></div><div class="page-actions">${actions}</div></div>`;
  const statusTag = (s) => `<span class="tag dot ${ORDER_STATUS[s]}">${esc(s)}</span>`;
  const searchBox = (action, value, label) => `<label class="box-search">${icon("search")}<input data-action="${action}" value="${esc(value)}" placeholder="${label}" aria-label="${label}"></label>`;
  const limitCallout = (kind, used, limit) => limit == null ? "" : used >= limit
    ? `<div class="callout yellow"><span class="ico">${icon("alert")}</span><div><b>You've used all ${limit} ${kind} on the ${plan().name} plan.</b> <a class="u" href="#/billing">Upgrade your plan</a> to add more.</div></div>`
    : "";
  const usage = (kind, used, limit) => limit == null ? `<span class="muted small">Unlimited ${kind}</span>` : `<span class="muted small">${used} / ${limit} ${kind}</span>`;

  const checklist = () => [
    { done: store.products.length > 0, text: "Add your first product", href: "#/products" },
    { done: !!store.customized, text: "Customize your website", href: "#/website" },
    { done: Object.values(store.settings.payments).some(Boolean), text: "Choose how customers pay", href: "#/settings" },
    { done: !!store.settings.domain, text: "Connect your domain", href: "#/settings" },
    { done: store.published, text: "Publish your website", href: "#/website" },
  ];

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
      title: "Dashboard",
      render: () => {
        const list = checklist();
        const done = list.filter((c) => c.done).length;
        const month = store.orders.filter((o) => Date.now() - new Date(o.date) < 30 * 864e5);
        const visitors = store.visitors.reduce((a, b) => a + b, 0);
        const days = Array.from({ length: 14 }, (_, i) => {
          const d = new Date(Date.now() - (13 - i) * 864e5);
          const v = sales(store.orders.filter((o) => new Date(o.date).toDateString() === d.toDateString()));
          return { label: String(d.getDate()), v, text: taka(v) };
        });
        return `${head(`${greeting()}, ${esc(account.name.split(" ")[0])} 👋`, `Here's what's happening with <b>${esc(store.site.name)}</b> today.`,
          `<button class="btn" data-action="add-order">${icon("plus")}New order</button><button class="btn btn-primary" data-action="add-product">${icon("plus")}Add product</button>`)}
          ${account.demo ? `<div class="callout blue"><span class="ico">${icon("info")}</span><div>You're viewing a <b>demo store</b>. <a class="u" href="../signup.html">Sign up</a> to start your own — your details and chosen plan will appear here.</div></div>` : ""}
          ${store.published
            ? `<div class="callout green"><span class="ico">${icon("globe")}</span><div><b>Your website is live</b> at ${esc(siteUrl())}</div></div>`
            : `<div class="callout yellow"><span class="ico">${icon("rocket")}</span><div><b>Your website isn't live yet.</b> Customize it, then publish when you're ready.</div><a class="btn btn-sm btn-dark" href="#/website">Customize &amp; publish</a></div>`}
          <div class="stats">
            <div class="stat"><div class="stat-top"><span class="stat-label">Total sales · 30 days</span><span class="stat-ico c1">${icon("money")}</span></div><div class="stat-value">${taka(sales(month))}</div><div class="stat-delta">${month.filter((o) => o.status !== "Cancelled").length} paid or open orders</div></div>
            <div class="stat"><div class="stat-top"><span class="stat-label">Orders · 30 days</span><span class="stat-ico c2">${icon("orders")}</span></div><div class="stat-value">${month.length}</div><div class="stat-delta ${store.orders.some((o) => o.status === "Pending") ? "down" : ""}">${store.orders.filter((o) => o.status === "Pending").length} waiting for you</div></div>
            <div class="stat"><div class="stat-top"><span class="stat-label">Visitors · 14 days</span><span class="stat-ico c3">${icon("eye")}</span></div><div class="stat-value">${visitors.toLocaleString("en-IN")}</div><div class="stat-delta">${account.demo ? "Sample data" : "Counting starts when you publish"}</div></div>
            <div class="stat"><div class="stat-top"><span class="stat-label">Products</span><span class="stat-ico c4">${icon("products")}</span></div><div class="stat-value">${store.products.length}</div><div class="stat-delta">of ${limitText(plan().products)} on ${plan().name}</div></div>
          </div>
          <div class="grid-3-1" style="margin-top:18px">
            <div class="card"><div class="card-head"><span class="card-title">Sales overview<small>last 14 days</small></span><span class="muted">${taka(days.reduce((a, b) => a + b.v, 0))}</span></div><div class="card-body">${bars(days)}</div></div>
            <div class="card"><div class="card-head"><span class="card-title">Store setup</span><span class="muted small">${done}/${list.length}</span></div>
              <div class="card-body"><div class="progress" style="margin-bottom:6px"><i style="width:${(done / list.length) * 100}%"></i></div>
              <ul class="todo">${list.map((c) => `<li class="${c.done ? "done" : ""}"><span class="tick">${c.done ? icon("check") : ""}</span><span class="t">${esc(c.text)}</span>${c.done ? "" : `<a href="${c.href}">Start</a>`}</li>`).join("")}</ul></div></div>
          </div>
          <div class="grid-3-1" style="margin-top:18px">
            <div class="card"><div class="card-head"><span class="card-title">Recent orders</span><a class="btn btn-sm" href="#/orders">View all</a></div>${orderTable(store.orders.slice(0, 5), true)}</div>
            <div class="card"><div class="card-head"><span class="card-title">Quick actions</span></div><div class="card-body"><div class="quick" style="grid-template-columns:1fr">
              <button data-action="add-product"><span class="qi">${icon("products")}</span>Add a product</button>
              <button data-action="add-order"><span class="qi">${icon("orders")}</span>Record an order</button>
              <a href="#/website"><span class="qi">${icon("brush")}</span>Change colors &amp; text</a>
              <a href="#/pages"><span class="qi">${icon("pages")}</span>Add a page</a>
            </div></div></div>
          </div>
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
              <div class="card-body" style="background:var(--bg);border-radius:0 0 12px 12px"><div class="sp-frame ${previewMode === "mobile" ? "mobile" : ""}" id="site-preview">${siteHTML(s, store.products, store.pages)}</div></div>
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
          view.querySelector("#site-preview").innerHTML = siteHTML(store.site, store.products, store.pages);
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

    settings: {
      title: "Settings",
      render: () => {
        const st = store.settings;
        const freeDomain = account.billing === "yearly" && account.plan !== "starter";
        return `${head("Settings", "Your store details, domain and payment options.")}
          <form id="settings-form">
            <div class="grid-2">
              <div class="card"><div class="card-head"><span class="card-title">Store details</span></div><div class="card-body">
                <div class="row">
                  <div class="field"><label for="s-business">Business name</label><input class="input" id="s-business" name="business" value="${esc(account.business)}"></div>
                  <div class="field"><label for="s-owner">Your name</label><input class="input" id="s-owner" name="owner" value="${esc(account.name)}"></div>
                  <div class="field"><label for="s-email">Email</label><input class="input" id="s-email" name="email" type="email" value="${esc(account.email)}"></div>
                  <div class="field"><label for="s-phone">Phone</label><input class="input" id="s-phone" name="phone" value="${esc(st.phone)}"></div>
                </div>
                <div class="field" style="margin:0"><label for="s-address">Address</label><input class="input" id="s-address" name="address" value="${esc(st.address)}"></div>
              </div></div>
              <div class="card"><div class="card-head"><span class="card-title">Domain</span></div><div class="card-body">
                <p class="muted" style="margin-bottom:12px">Free address: <b style="color:var(--ink)">${esc(st.subdomain)}.shopiliar.com</b></p>
                ${freeDomain ? `<div class="callout green" style="margin-bottom:12px"><span class="ico">${icon("gift")}</span><div><b>Your yearly ${plan().name} plan includes a free custom domain.</b></div></div>` : ""}
                <div style="display:flex;gap:8px;align-items:flex-end">
                  <div class="field" style="flex:1;margin:0"><label for="s-domain">Custom domain</label><input class="input" id="s-domain" name="domain" placeholder="www.yourbusiness.com" value="${esc(st.domain)}"></div>
                  <button type="button" class="btn" data-action="connect-domain">${st.domain ? "Update" : "Connect"}</button>
                </div>
                ${st.domain ? `<p style="margin-top:10px">${st.domainStatus === "connected" ? '<span class="tag dot green">Connected</span>' : '<span class="tag dot yellow">Waiting for DNS</span>'} <span class="muted small">${esc(st.domain)}</span></p>` : ""}
              </div></div>
            </div>
            <div class="grid-2" style="margin-top:18px">
              <div class="card"><div class="card-head"><span class="card-title">How customers pay</span></div><div class="card-body" style="padding-top:6px;padding-bottom:6px">
                ${Object.entries(PAYMENT_LABEL).map(([k, l]) => `<div class="set-row"><span>${l}</span><label class="switch"><input type="checkbox" name="pay_${k}" ${st.payments[k] ? "checked" : ""} aria-label="${l}"><i></i></label></div>`).join("")}
              </div></div>
              <div class="card"><div class="card-head"><span class="card-title">Notifications</span></div><div class="card-body" style="padding-top:6px;padding-bottom:6px">
                <div class="set-row"><span>Email me when a new order arrives<small>Sent to ${esc(account.email)}</small></span><label class="switch"><input type="checkbox" name="orderEmails" ${st.orderEmails ? "checked" : ""} aria-label="Order emails"><i></i></label></div>
              </div></div>
            </div>
            <div style="margin-top:18px;display:flex;justify-content:flex-end"><button class="btn btn-primary" type="submit">Save settings</button></div>
          </form>
          <div class="card" style="margin-top:18px;border-color:#fecaca"><div class="card-head"><span class="card-title" style="color:var(--danger)">Danger zone</span></div>
            <div class="card-body" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><span style="flex:1">Reset this store: deletes its products, orders and website changes.</span><button class="btn btn-danger" data-action="reset-all">Reset store</button></div></div>
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
        return `${head("Plan & billing", "Your plan, what it includes and how much of it you're using.", `<button class="btn btn-primary" data-action="change-plan">Change plan</button>`)}
          <div class="grid-2">
            <div class="card"><div class="card-head"><span class="card-title">Current plan</span><span class="tag purple">${esc(p.name)}</span></div><div class="card-body">
              <div class="stat-value" style="margin:0">${yearly ? `${taka(p.price * 12)}<span class="muted" style="font-size:14px;font-weight:500"> /year</span>` : `${taka(p.price)}<span class="muted" style="font-size:14px;font-weight:500"> /month</span>`}</div>
              <p class="muted" style="margin-top:4px">${yearly ? "Billed yearly" : "Billed monthly"}${yearly && account.plan !== "starter" ? " · includes a free custom domain" : ""}</p>
              <div class="divider"></div>
              <ul class="todo">${["Free website", "Free CMS access", "Free support"].map((t) => `<li class="done"><span class="tick">${icon("check")}</span><span>${t}</span></li>`).join("")}</ul>
            </div></div>
            <div class="card"><div class="card-head"><span class="card-title">Usage</span></div><div class="card-body">
              ${[["Pages", store.pages.length, p.pages], ["Products", store.products.length, p.products]].map(([n, used, lim]) => `
                <div class="meter"><div class="meter-top"><span>${n}</span><span class="muted">${used} of ${limitText(lim)}</span></div>
                <div class="progress"><i style="width:${lim == null ? 4 : Math.min(100, (used / lim) * 100)}%;${lim != null && used >= lim ? "background:var(--danger)" : ""}"></i></div></div>`).join("")}
            </div></div>
          </div>
          <div class="card" style="margin-top:18px"><div class="card-head"><span class="card-title">Compare plans</span></div>
            <div class="table-wrap"><table class="table"><thead><tr><th>Plan</th><th class="t-right">Monthly</th><th>Pages</th><th>Products</th><th>Free domain (yearly)</th><th class="t-actions"></th></tr></thead>
            <tbody>${Object.entries(PLANS).map(([id, pl]) => `<tr><td class="t-title">${esc(pl.name)} ${id === account.plan ? '<span class="tag blue">Current</span>' : ""}</td><td class="t-right">${taka(pl.price)}</td><td>${limitText(pl.pages)}</td><td>${pl.products == null ? "Unlimited" : id === "business" ? "150+" : pl.products}</td><td>${id === "starter" ? '<span class="muted">—</span>' : '<span class="tag green">Included</span>'}</td>
              <td class="t-actions">${id === account.plan ? "" : `<button class="btn btn-sm" data-action="set-plan" data-plan="${id}">Switch</button>`}</td></tr>`).join("")}</tbody></table></div>
            <div class="card-foot muted small">Online payment for plans isn't connected yet — switching plans here updates your limits in this demo.</div>
          </div>
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
      if (!(await confirm("Reset store?", "All products, orders, customers, pages and website changes will be deleted.", "Reset store"))) return;
      const fresh = seedStore();
      Object.keys(store).forEach((k) => delete store[k]);
      Object.assign(store, fresh);
      await saveNow(); location.reload();
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
  rerender = router(routes, "home");
})();
