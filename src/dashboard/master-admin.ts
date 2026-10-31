// @ts-nocheck — ported as-is from the original dashboard script; types can be tightened over time.
import { Dash } from "./dash";
import { ShopilierInbox } from "./inbox";
import { SiteEditor } from "./editor";
import { SiteKit } from "./site";

// Shopilier master dashboard (/master-admin): users, templates, payments and plans. start() runs once the shell is on the page.
export const start = () => {
  const { esc, taka, uid, day, daysAgo, avatar, tag, load, save, remove, toast, dialog, confirm, router, bars, icon, hydrateIcons, siteHTML, limitText, CATEGORIES } = Dash;
  const KEY = "shopiliar.master";

  // ---------- Data ----------
  // Users come from the database (/master-admin/api/users). Plans, templates, settings, payments and the
  // activity log are kept in this browser. Nothing is made up: a new browser starts with no users or payments.
  const DATA_VERSION = 2;
  const fresh = () => ({
    v: DATA_VERSION, plans: Dash.PLANS(), templates: Dash.TEMPLATES().map((t) => ({ ...t, uses: 0 })), users: [], payments: [], activity: [],
  });
  const db = load(KEY, fresh);
  // Plans were restructured (the Free plan was retired and the limits changed): data saved by an older version gets the new plans
  if (!db.plans || db.plans.free || !db.plans.starter) db.plans = Dash.PLANS();
  // Older versions filled this browser with sample users, invoices and activity: clear them once
  if (db.v !== DATA_VERSION) {
    Object.assign(db, { v: DATA_VERSION, users: [], payments: [], activity: [] });
    db.templates = (db.templates && db.templates.length ? db.templates : Dash.TEMPLATES()).map((t) => ({ ...t, uses: 0 }));
  }
  // How many users are on each template, from the real user list
  const countUses = () => db.templates.forEach((t) => { t.uses = db.users.filter((u) => u.template === t.id).length; });
  // Real users from the database. What only this dashboard knows (suspended or not) stays as it was.
  const loadUsers = async () => {
    try {
      const res = await fetch("/master-admin/api/users");
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Couldn't load users.");
      const { users } = await res.json();
      const before = new Map(db.users.map((u) => [u.id, u]));
      db.users = users.map((u) => ({
        id: u.id, name: u.name, business: u.business || u.name, email: u.email, phone: "", plan: db.plans[u.plan] ? u.plan : "starter",
        billing: u.billing === "yearly" ? "yearly" : "monthly", status: (before.get(u.id) || {}).status || "active", joined: u.joined, template: u.template || "",
        site: "", products: null, published: null,
      }));
      countUses(); persist(); if (rerender) go();
    } catch (err) { toast(err.message || "Couldn't load users."); }
  };
  const log = (text) => { db.activity.unshift({ id: uid("a"), date: new Date().toISOString(), text }); db.activity = db.activity.slice(0, 60); };
  const persist = () => { save(KEY, db); chrome(); };
  const chrome = () => {
    document.getElementById("count-users").textContent = db.users.length;
    document.getElementById("count-templates").textContent = db.templates.length;
    const due = db.payments.filter((p) => p.status !== "Paid").length;
    document.getElementById("count-due").textContent = due || "";
    document.getElementById("bell-count").textContent = due ? (due > 9 ? "9+" : due) : "";
  };
  // Profile menu in the top bar
  const profileBtn = document.getElementById("profile-btn");
  const profileMenu = document.getElementById("profile-menu");
  const toggleMenu = (open) => { profileMenu.hidden = !open; profileBtn.setAttribute("aria-expanded", String(open)); };
  profileBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(profileMenu.hidden); });
  document.addEventListener("click", (e) => { if (!profileMenu.hidden && !e.target.closest(".profile")) toggleMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !profileMenu.hidden) { toggleMenu(false); profileBtn.focus(); } });

  // ---------- Helpers ----------
  const PLAN_COLOR = { starter: "green", business: "blue", pro: "purple" };
  const PAY_COLOR = { Paid: "green", Due: "yellow", Failed: "red" };
  const planName = (id) => (db.plans[id] || { name: id }).name;
  const monthly = (u) => u.status === "active" ? (db.plans[u.plan]?.price || 0) : 0;
  const mrr = () => db.users.reduce((s, u) => s + monthly(u), 0);
  const userById = (id) => db.users.find((u) => u.id === id);
  const head = (title, desc, actions = "") => `<div class="page"><div class="page-head"><div><h1>${title}</h1><p>${desc}</p></div><div class="page-actions">${actions}</div></div>`;
  const planTag = (id) => tag(planName(id), PLAN_COLOR[id] || "gray");
  const searchBox = (action, value, label) => `<label class="box-search">${icon("search")}<input data-action="${action}" value="${esc(value)}" placeholder="${label}" aria-label="${label}"></label>`;
  const tplCover = (t) => `<div class="g-cover" style="background:linear-gradient(135deg,${esc(t.bg)} 0%,${esc(t.bg)} 55%,${esc(t.accent)} 160%);color:${esc(t.text)}"><span class="g-name">${esc(t.name)}</span>${t.status === "published" ? '<span class="tag dot green">Published</span>' : '<span class="tag dot gray">Draft</span>'}</div>`;
  const ago = (d) => {
    const m = Math.round((Date.now() - new Date(d)) / 6e4);
    return m < 60 ? `${Math.max(1, m)}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
  };

  let userTab = "All", userSearch = "", tplTab = "All", payTab = "All";
  let range = 30; // days shown on Overview
  const inPeriod = (list, key, from, to) => list.filter((x) => { const t = new Date(x[key]).getTime(); return t >= from && t < to; });
  const paid = (list) => list.filter((p) => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
  const statusPill = (u) => u.status === "active" ? '<span class="pill Paid">Active</span>' : '<span class="pill Cancelled">Suspended</span>';

  // ---------- Views ----------
  const routes = {
    overview: {
      title: "Overview",
      render: () => {
        const now = Date.now(), span = range * 864e5;
        const vs = `<span class="muted">vs. previous ${range} days</span>`;
        const stat = (label, value, ico, color, d) => `<div class="stat"><div class="stat-top"><span class="stat-label">${label}</span><span class="stat-ico ${color}">${icon(ico)}</span></div><div class="stat-value">${value}</div><div class="stat-delta">${d}</div></div>`;
        const curPay = inPeriod(db.payments, "date", now - span, now), prevPay = inPeriod(db.payments, "date", now - 2 * span, now - span);
        const curUsers = inPeriod(db.users, "joined", now - span, now).length, prevUsers = inPeriod(db.users, "joined", now - 2 * span, now - span).length;
        const active = db.users.filter((u) => u.status === "active");
        const live = active.filter((u) => u.published).length;
        const due = db.payments.filter((p) => p.status !== "Paid");
        const byPlan = Object.keys(db.plans).map((id) => [id, db.users.filter((u) => u.plan === id).length]);
        const topTpl = [...db.templates].sort((a, b) => b.uses - a.uses).slice(0, 4);
        return `${head("Welcome back, Admin", "Here's how Shopilier is doing.",
          `<label class="range">${icon("calendar")}<select data-action="range" aria-label="Date range">${[7, 30, 90].map((d) => `<option value="${d}"${d === range ? " selected" : ""}>Last ${d} days</option>`).join("")}</select>${icon("chevronDown")}</label>
           <a class="btn btn-primary" href="#/users">${icon("customers")}See users</a>`)}
          ${due.length ? `<div class="callout yellow"><span class="ico">${icon("alert")}</span><div><b>${due.length} invoice${due.length > 1 ? "s" : ""} need attention</b> · ${taka(due.reduce((s, p) => s + p.amount, 0))} unpaid</div><a class="btn btn-sm btn-dark" href="#/payments">Review</a></div>` : ""}
          <div class="stats">
            ${stat("Revenue collected", taka(paid(curPay)), "money", "c1", Dash.delta(paid(curPay), paid(prevPay)) + vs)}
            ${stat("New users", curUsers, "customers", "c2", Dash.delta(curUsers, prevUsers) + vs)}
            ${stat("Monthly recurring", taka(mrr()), "barchart", "c3", `<span class="muted">${taka(mrr() * 12)} a year</span>`)}
            ${stat("Live websites", live, "globe", "c4", `<span class="muted">${active.length} active accounts</span>`)}
          </div>
          <div class="home-grid">
            <div class="home-main">
              <div class="card"><div class="card-head"><span class="card-title">Revenue</span><a class="btn" href="#/payments">View payments</a></div>
                <div class="card-body">
                  <div class="sales-top"><span class="sales-total">${taka(paid(curPay))}</span><span class="stat-delta" style="margin:0">${Dash.delta(paid(curPay), paid(prevPay))}${vs}</span>
                    <span class="legend"><span><i></i>This period</span><span><i class="prev"></i>Previous period</span></span></div>
                  ${Dash.lineChart(range, now, span, (from, to) => paid(inPeriod(db.payments, "date", from, to)))}
                </div></div>
              <div class="card"><div class="card-head"><span class="card-title">Newest users</span><a class="link" href="#/users">View all</a></div>
                <div class="table-wrap"><table class="orders-mini">
                  <thead><tr><th>Business</th><th>Owner</th><th>Plan</th><th>Status</th><th>Joined</th></tr></thead>
                  <tbody>${[...db.users].sort((a, b) => new Date(b.joined) - new Date(a.joined)).slice(0, 6).map((u) => `<tr>
                    <td><button class="ord" data-action="open-user" data-id="${u.id}">${esc(u.business)}</button></td><td>${esc(u.name)}</td><td>${planTag(u.plan)}</td><td>${statusPill(u)}</td><td>${day(u.joined)}</td></tr>`).join("")}</tbody>
                </table></div></div>
            </div>
            <div class="home-side">
              <div class="card"><div class="card-head"><span class="card-title">Users by plan</span><a class="link" href="#/plans">Plans</a></div>
                <div class="card-body">${byPlan.map(([id, n]) => `<div class="meter"><div class="meter-top"><span>${planTag(id)}</span><span class="muted">${n} users · ${taka(n * db.plans[id].price)}/mo</span></div><div class="progress"><i style="width:${(n / Math.max(1, db.users.length)) * 100}%"></i></div></div>`).join("")}</div></div>
              <div class="card"><div class="card-head"><span class="card-title">Most used templates</span><a class="link" href="#/templates">Manage</a></div>
                <div class="card-body"><ul class="top-list">${topTpl.map((t) => `<li><span class="top-img" style="background:linear-gradient(135deg,${esc(t.bg)} 50%,${esc(t.accent)} 50%)"></span><span class="t"><b>${esc(t.name)}</b><span>${esc(t.category)}</span></span><span class="v">${t.uses} sites</span></li>`).join("")}</ul></div></div>
              <div class="card"><div class="card-head"><span class="card-title">Recent activity</span><a class="link" href="#/activity">All</a></div>
                <div class="card-body" style="padding-top:4px;padding-bottom:8px"><ul class="feed">${db.activity.slice(0, 5).map((a) => `<li><span class="fdot"></span><span>${esc(a.text)}</span><time>${ago(a.date)}</time></li>`).join("")}</ul></div></div>
            </div>
          </div>
        </div>`;
      },
    },

    messages: {
      title: "Messages",
      render: () => `${head("Messages", "Every conversation with your users — questions, complaints and billing. Replies show up in their dashboard.", `<button class="btn btn-primary" data-action="new-message">${icon("plus")}New message</button>`)}
        <div id="inbox-root"></div></div>`,
      mount: (view) => { inbox = ShopilierInbox(view.querySelector("#inbox-root"), { mode: "admin", onUnread: setMsgBadge }); },
    },

    users: {
      title: "Users",
      render: () => {
        const tabs = ["All", ...Object.keys(db.plans), "suspended"];
        const label = (t) => t === "All" ? "All" : t === "suspended" ? "Suspended" : planName(t);
        const count = (t) => t === "All" ? db.users.length : t === "suspended" ? db.users.filter((u) => u.status === "suspended").length : db.users.filter((u) => u.plan === t).length;
        const q = userSearch.toLowerCase();
        const list = db.users
          .filter((u) => userTab === "All" || (userTab === "suspended" ? u.status === "suspended" : u.plan === userTab))
          .filter((u) => !q || (u.name + u.business + u.email + u.site).toLowerCase().includes(q));
        return `${head("Users", "Everyone who signed up for Shopilier. Use the ⋯ menu to edit, suspend or delete a user.")}
          <div class="card">
            <div class="card-head"><div class="seg" style="margin-right:auto">${tabs.map((t) => `<button class="${t === userTab ? "on" : ""}" data-action="user-tab" data-tab="${t}">${label(t)}<span>${count(t)}</span></button>`).join("")}</div>
              ${searchBox("user-search", userSearch, "Search users")}</div>
            <div class="table-wrap"><table class="table" style="min-width:960px">
              <thead><tr><th>Business</th><th>Plan</th><th>Website</th><th>Status</th><th>Joined</th><th class="t-right">Pays / month</th><th class="t-actions"></th></tr></thead>
              <tbody>${list.length ? list.map((u) => `
                <tr>
                  <td><button class="t-title" data-action="open-user" data-id="${u.id}">${avatar(u.business)}<span>${esc(u.business)}<span class="sub">${esc(u.name)} · ${esc(u.email)}</span></span></button></td>
                  <td>${planTag(u.plan)} <span class="muted small">${u.billing === "yearly" ? "Yearly" : "Monthly"}</span></td>
                  <td><span class="small">${esc(u.site || "—")}</span>${u.published == null ? "" : `<span class="sub">${u.published ? "Live" : "Not published"}</span>`}</td>
                  <td>${u.status === "active" ? '<span class="tag dot green">Active</span>' : '<span class="tag dot red">Suspended</span>'}</td>
                  <td class="muted">${day(u.joined)}</td>
                  <td class="t-right" style="font-weight:600;color:var(--ink)">${taka(monthly(u))}</td>
                  <td class="t-actions"><button class="icon-btn row-more" data-action="user-menu" data-id="${u.id}" aria-haspopup="menu" aria-expanded="false" aria-label="More actions for ${esc(u.business)}" title="More actions">${icon("dots")}</button></td>
                </tr>`).join("") : `<tr><td colspan="7" class="table-empty">No users match.</td></tr>`}</tbody>
            </table></div>
          </div>
        </div>`;
      },
    },

    templates: {
      title: "Templates",
      render: () => {
        const tabs = ["All", "published", "draft"];
        const label = { All: "All", published: "Published", draft: "Drafts" };
        const list = db.templates.filter((t) => tplTab === "All" || t.status === tplTab);
        return `${head("Templates", "Design each template's website with the visual builder (Design), change its name and colors (Details), and publish it. New stores start from the saved design.", `<button class="btn btn-primary" data-action="new-template">${icon("plus")}New template</button>`)}
          <div style="margin-bottom:16px"><div class="seg">${tabs.map((t) => `<button class="${t === tplTab ? "on" : ""}" data-action="tpl-tab" data-tab="${t}">${label[t]}<span>${t === "All" ? db.templates.length : db.templates.filter((x) => x.status === t).length}</span></button>`).join("")}</div></div>
          <div class="gallery">${list.map((t) => `
            <div class="g-card">
              ${tplCover(t)}
              <div class="g-body">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="g-title">${esc(t.name)}</span><span class="muted small">${t.uses} sites</span></div>
                <div class="g-meta">${tag(t.category, "brown")}${tag(t.layout === "center" ? "Centered" : t.layout === "bleed" ? "Full-width" : t.layout === "story" ? "Big headline with slides" : "Side by side", "gray")}</div>
                <div class="muted small">${esc(t.desc)}</div>
                <div class="g-actions">
                  <a class="btn btn-sm btn-primary" href="#/design?t=${encodeURIComponent(t.id)}">${icon("brush")}Design</a>
                  <button class="btn btn-sm" data-action="edit-template" data-id="${t.id}">${icon("edit")}Details</button>
                  <button class="btn btn-sm" data-action="toggle-template" data-id="${t.id}">${t.status === "published" ? "Unpublish" : "Publish"}</button>
                  <button class="icon-btn" data-action="duplicate-template" data-id="${t.id}" aria-label="Duplicate ${esc(t.name)}" title="Duplicate">${icon("copy")}</button>
                  <button class="icon-btn danger" data-action="delete-template" data-id="${t.id}" aria-label="Delete ${esc(t.name)}" title="Delete">${icon("trash")}</button>
                </div>
              </div>
            </div>`).join("")}
            <button class="g-new" data-action="new-template"><span>${icon("plus")}</span>New template</button>
          </div>
        </div>`;
      },
    },

    payments: {
      title: "Payments",
      render: () => {
        const tabs = ["All", "Paid", "Due", "Failed"];
        const list = db.payments.filter((p) => payTab === "All" || p.status === payTab).sort((a, b) => new Date(b.date) - new Date(a.date));
        const sum = (st) => db.payments.filter((p) => p.status === st).reduce((s, p) => s + p.amount, 0);
        return `${head("Payments", "Subscription invoices from your users.")}
          <div class="stats" style="grid-template-columns:repeat(3,1fr)">
            <div class="stat"><div class="stat-top"><span class="stat-label">Collected</span><span class="stat-ico c2">${icon("check")}</span></div><div class="stat-value">${taka(sum("Paid"))}</div></div>
            <div class="stat"><div class="stat-top"><span class="stat-label">Due</span><span class="stat-ico c3">${icon("clock")}</span></div><div class="stat-value">${taka(sum("Due"))}</div></div>
            <div class="stat"><div class="stat-top"><span class="stat-label">Failed</span><span class="stat-ico c4">${icon("alert")}</span></div><div class="stat-value">${taka(sum("Failed"))}</div></div>
          </div>
          <div class="card" style="margin-top:18px">
            <div class="card-head"><div class="seg" style="margin-right:auto">${tabs.map((t) => `<button class="${t === payTab ? "on" : ""}" data-action="pay-tab" data-tab="${t}">${t}<span>${t === "All" ? db.payments.length : db.payments.filter((p) => p.status === t).length}</span></button>`).join("")}</div></div>
            <div class="table-wrap"><table class="table">
              <thead><tr><th>Invoice</th><th>Business</th><th>Plan</th><th>Method</th><th>Date</th><th class="t-right">Amount</th><th>Status</th><th class="t-actions"></th></tr></thead>
              <tbody>${list.map((p) => { const u = userById(p.user); return `
                <tr><td class="t-title">${esc(p.invoice)}</td><td>${esc(u ? u.business : "Deleted user")}</td><td>${planTag(p.plan)} <span class="muted small">${p.billing === "yearly" ? "Yearly" : "Monthly"}</span></td>
                <td>${esc(p.method)}</td><td class="muted">${day(p.date)}</td><td class="t-right" style="font-weight:600;color:var(--ink)">${taka(p.amount)}</td><td><span class="tag dot ${PAY_COLOR[p.status]}">${esc(p.status)}</span></td>
                <td class="t-actions">${p.status === "Paid" ? "" : `<button class="btn btn-sm" data-action="mark-paid" data-id="${p.id}">Mark paid</button>`}</td></tr>`; }).join("") || `<tr><td colspan="8" class="table-empty">No invoices.</td></tr>`}</tbody>
            </table></div>
            <div class="card-foot muted small">Invoices show here once bKash, Nagad or card payments are connected.</div>
          </div>
        </div>`;
      },
    },

    plans: {
      title: "Plans & pricing",
      render: () => `${head("Plans & pricing", "Change plan prices and limits. Leave a limit empty for Unlimited.")}
        <form id="plans-form">
          <div class="gallery" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">${Object.entries(db.plans).map(([id, p]) => `
            <div class="card"><div class="card-head"><span class="card-title">${esc(p.name)}</span>${planTag(id)}</div><div class="card-body">
              <div class="field"><label>Price per month (৳)</label><input class="input" name="${id}_price" type="number" min="0" value="${p.price}"></div>
              <div class="row">
                <div class="field"><label>Pages</label><input class="input" name="${id}_pages" type="number" min="1" value="${p.pages ?? ""}" placeholder="Unlimited"></div>
                <div class="field"><label>Products</label><input class="input" name="${id}_products" type="number" min="1" value="${p.products ?? ""}" placeholder="Unlimited"></div>
              </div>
              <p class="muted small">${db.users.filter((u) => u.plan === id).length} users on this plan</p>
            </div></div>`).join("")}</div>
          <div class="callout" style="margin-top:18px"><span class="ico">${icon("gift")}</span><div>Every plan includes a free website and CMS access. Free stays on its shopilier.com address with no support chat; the paid plans add a custom domain, support and staff (Starter 1, Business 5, Pro unlimited). Yearly Business and Pro plans include a free custom domain.</div></div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><span class="muted small">The public Pricing page is part of the website code, so update it too when you change prices.</span><button class="btn btn-primary" type="submit">Save prices &amp; limits</button></div>
        </form>
      </div>`,
      mount: (view) => view.querySelector("#plans-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const d = new FormData(e.target);
        Object.keys(db.plans).forEach((id) => {
          const num = (k) => { const v = String(d.get(`${id}_${k}`)).trim(); return v === "" ? null : Math.max(0, Number(v)); };
          db.plans[id].price = num("price") ?? 0;
          db.plans[id].pages = num("pages");
          db.plans[id].products = num("products");
        });
        log("Plan prices and limits were updated");
        persist(); toast("Plans saved");
      }),
    },

    // The template builder: the same visual editor store owners use, on a template's own design.
    // Designs are saved in the database; new stores on the template start from them.
    design: {
      title: "Template builder",
      render: () => '<div class="ed-root"><p class="muted" style="padding:28px">Opening the template builder…</p></div>',
      mount: async (view) => {
        const id = new URLSearchParams(location.hash.split("?")[1] || "").get("t");
        const t = db.templates.find((x) => x.id === id);
        if (!t) { location.hash = "#/templates"; return; }
        let saved = null;
        try {
          const r = await fetch(`/master-admin/api/templates/${encodeURIComponent(t.id)}/design`);
          const data = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(data.error || "Couldn't load the saved design.");
          saved = data.design;
        } catch (err) { toast(err.message); }
        const root = view.querySelector(".ed-root");
        if (!root || !root.isConnected) return;
        root.innerHTML = "";
        // Sample products to design with: the template's own, or a few placeholders
        const samples = SiteKit.sampleProducts(t.id);
        const products = samples.length ? samples : ["Sample product", "Best seller", "New arrival", "On sale"].map((name, i) => ({
          id: "sample" + (i + 1), name, price: [1200, 1800, 950, 1500][i], compare: i === 3 ? 2000 : 0, stock: 20, status: "active", category: "", color: "#e9ebee", image: "", images: [], options: [],
        }));
        const fresh = () => {
          const site = SiteKit.applyStarter({ name: t.name, template: t.id, layout: t.layout, bg: t.bg, text: t.text, accent: t.accent, headline: t.headline, sub: t.sub, cta: t.cta,
            phone: "01700-000000", email: "hello@example.com", address: "Dhaka, Bangladesh", social: {} }, t.id);
          const pages = SiteKit.starterPages(t.id) || [["Home", ""], ["Shop", "shop"], ["About", "about"], ["Contact", "contact"]].map(([title, slug]) => ({ id: uid("pg"), title, slug, inNav: true, ...(slug ? {} : { locked: true }) }));
          return { site, pages };
        };
        const start = saved || fresh();
        const store = { site: start.site, pages: start.pages, products, published: !!saved, customized: true };
        let timer = 0, saving = Promise.resolve(), lastSaved = saved ? "Saved" : "";
        const save = (announce) => {
          clearTimeout(timer); timer = 0;
          saving = saving.then(async () => {
            const res = await fetch(`/master-admin/api/templates/${encodeURIComponent(t.id)}/design`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ site: store.site, pages: store.pages }) });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Couldn't save the template.");
            store.published = true; lastSaved = "Saved";
            if (announce) { log(`The ${t.name} template design was saved`); persist(); toast(`${t.name} saved. New stores on this template start from this design.`); }
          }).catch((err) => toast(err.message));
          return saving;
        };
        // Save a moment after each change, and right away when leaving the builder
        const flush = () => { if (timer) save(false); };
        window.addEventListener("hashchange", flush, { once: true });
        window.addEventListener("pagehide", flush, { once: true });
        SiteEditor.mount(root, {
          store, account: { plan: "pro", business: t.name, email: "" }, catalog: db.templates, icon, toast, confirm, dialog,
          touchSite: () => {}, syncPayments: () => {},
          persist: () => { lastSaved = ""; clearTimeout(timer); timer = setTimeout(() => save(false), 1200); },
          publish: () => save(true), publishLabel: () => "Save template",
          canAddPage: () => true, uploadUrl: "/master-admin/api/upload",
        });
        // A bar above the editor: which template this is, and a way back to its built-in design
        const bar = document.createElement("div");
        bar.className = "tb-bar";
        bar.innerHTML = `<a class="btn btn-sm" href="#/templates">${icon("arrowLeft")}Templates</a><b>${esc(t.name)}</b><span class="muted small">${saved ? "Editing the saved design" : "Starting from the built-in design"}</span>
          <button type="button" class="btn btn-sm" data-tb-reset${saved ? "" : " hidden"}>${icon("history")}Back to built-in design</button>`;
        root.prepend(bar);
        bar.querySelector("[data-tb-reset]").addEventListener("click", async () => {
          if (!(await confirm("Go back to the built-in design?", `The saved ${t.name} design is removed. New stores will start from the template's built-in design again.`, "Remove saved design"))) return;
          clearTimeout(timer); timer = 0;
          const r = await fetch(`/master-admin/api/templates/${encodeURIComponent(t.id)}/design`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: "{}" });
          if (!r.ok) { toast("Couldn't remove the saved design."); return; }
          log(`The ${t.name} template went back to its built-in design`); persist(); toast("Back to the built-in design");
          go();
        });
      },
    },

    activity: {
      title: "Activity",
      render: () => `${head("Activity", "Everything that happened across Shopilier, newest first.")}
        <div class="card"><div class="card-body" style="padding-top:4px;padding-bottom:4px"><ul class="feed">${db.activity.map((a) => `<li><span class="fdot"></span><span>${esc(a.text)}</span><time>${day(a.date)}</time></li>`).join("") || '<li class="muted">Nothing yet.</li>'}</ul></div></div>
      </div>`,
    },

  };

  // ---------- Users: changes saved to the database ----------
  const apiUser = async (method, id, body) => {
    const res = await fetch(`/master-admin/api/users/${encodeURIComponent(id)}`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Couldn't save. Check your connection.");
    return data;
  };
  // The ⋯ menu on a user's row: a small menu by the button (kept on the page, so the table doesn't clip it)
  const closeUserMenu = () => {
    document.querySelectorAll(".row-menu").forEach((m) => m.remove());
    document.querySelectorAll('[data-action="user-menu"][aria-expanded="true"]').forEach((b) => b.setAttribute("aria-expanded", "false"));
  };
  const userMenu = (btn) => {
    const wasOpen = btn.getAttribute("aria-expanded") === "true";
    closeUserMenu();
    if (wasOpen) return;
    const u = userById(btn.dataset.id);
    if (!u) return;
    const m = document.createElement("div");
    m.className = "v-menu row-menu"; m.setAttribute("role", "menu");
    m.innerHTML = `<button type="button" role="menuitem" data-do="open-user">${icon("edit")}<span><b>Edit details</b><small>Name, email, plan and template</small></span></button>
      <button type="button" role="menuitem" data-do="toggle-user">${icon(u.status === "active" ? "lock" : "check")}<span><b>${u.status === "active" ? "Suspend" : "Activate"}</b><small>${u.status === "active" ? "Mark this account as suspended" : "Mark this account as active"}</small></span></button>
      <button type="button" role="menuitem" class="danger" data-do="delete-user">${icon("trash")}<span><b>Delete user</b><small>Removes the account and website</small></span></button>`;
    document.body.appendChild(m);
    const r = btn.getBoundingClientRect(), h = m.offsetHeight;
    const below = r.bottom + 6 + h < innerHeight - 8;
    m.style.cssText = `position:fixed;right:${Math.max(8, innerWidth - r.right)}px;top:${below ? r.bottom + 6 : Math.max(8, r.top - 6 - h)}px`;
    btn.setAttribute("aria-expanded", "true");
    m.addEventListener("click", (e) => {
      const it = e.target.closest("[data-do]");
      if (!it) return;
      closeUserMenu();
      actions[it.dataset.do]({ dataset: { id: u.id } });
    });
    m.querySelector("button").focus();
  };
  document.addEventListener("click", (e) => { if (!e.target.closest(".row-menu, [data-action=\"user-menu\"]")) closeUserMenu(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeUserMenu(); });
  window.addEventListener("hashchange", closeUserMenu);
  document.addEventListener("scroll", closeUserMenu, true);

  // ---------- Settings (a popup from the sidebar) ----------
  // Shopilier's website details, the admin team and payment details, saved in the database (/master-admin/api/settings)
  const ROLES = [["owner", "Owner"], ["admin", "Admin"], ["support", "Support"], ["finance", "Finance"]];
  const openSettings = async (tab = "website") => {
    let s;
    try {
      const res = await fetch("/master-admin/api/settings");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't load settings.");
      s = data.settings;
    } catch (err) { toast(err.message); return; }
    const staff = s.staff.map((x) => ({ ...x }));
    const v = (x) => esc(x ?? "");
    const field = (name, label, val, o = {}) => `<div class="field"><label for="st-${name}">${label}</label><input class="input" id="st-${name}" name="${name}" value="${v(val)}"${o.type ? ` type="${o.type}"` : ""} placeholder="${v(o.ph)}"${o.max ? ` maxlength="${o.max}"` : ""}></div>`;
    const sw = (name, label, hint, on) => `<div class="set-row"><span>${label}<small>${hint}</small></span><label class="switch"><input type="checkbox" name="${name}" ${on ? "checked" : ""} aria-label="${label}"><i></i></label></div>`;
    const pay = (k, label) => { const m = s.payments[k]; return `<div class="st-pay">
        <div class="set-row"><span><b>${label}</b><small>Customers can pay their plan with ${label}</small></span><label class="switch"><input type="checkbox" name="pay_${k}_on" ${m.on ? "checked" : ""} aria-label="Accept ${label}"><i></i></label></div>
        <div class="row">${field(`pay_${k}_number`, `${label} number`, m.number, { ph: "01XXX-XXXXXX", max: 30 })}
          <div class="field"><label for="st-pay_${k}_type">Account type</label><select class="select" id="st-pay_${k}_type" name="pay_${k}_type">${[["merchant", "Merchant"], ["personal", "Personal"], ["agent", "Agent"]].map(([x, l]) => `<option value="${x}"${m.type === x ? " selected" : ""}>${l}</option>`).join("")}</select></div></div></div>`; };
    const staffRows = () => staff.length ? staff.map((x, i) => `<div class="st-staff">
        <span class="st-ava">${esc((x.name || "?").slice(0, 1).toUpperCase())}</span>
        <span class="st-who"><b>${esc(x.name)}</b><small>${esc(x.email)}</small></span>
        <select class="select" data-staff-role="${i}" aria-label="Role of ${esc(x.name)}">${ROLES.map(([r, l]) => `<option value="${r}"${x.role === r ? " selected" : ""}>${l}</option>`).join("")}</select>
        <button type="button" class="icon-btn danger" data-staff-rm="${i}" aria-label="Remove ${esc(x.name)}" title="Remove">${icon("trash")}</button></div>`).join("")
      : '<p class="muted small" style="padding:6px 0">No team members yet. Add the people who help run Shopilier.</p>';
    const TABS = [["website", "Website", "globe"], ["staff", "Staff", "customers"], ["payments", "Payments", "money"], ["advanced", "Advanced", "settings"]];
    const d = dialog({
      title: "Settings", size: "lg", submit: "Save settings",
      body: `<div class="st-tabs" role="tablist">${TABS.map(([k, l, ic]) => `<button type="button" role="tab" data-st-tab="${k}" class="${k === tab ? "on" : ""}" aria-selected="${k === tab}">${icon(ic)}${l}</button>`).join("")}</div>
        <div class="st-panel" data-st-panel="website"${tab === "website" ? "" : " hidden"}>
          <p class="st-intro">Shopilier's details. The contact and social links show on the website's footer and Contact page.</p>
          <div class="row">${field("company", "Company name", s.company, { max: 80 })}${field("supportEmail", "Support email", s.supportEmail, { type: "email" })}</div>
          <div class="row">${field("supportPhone", "Support phone", s.supportPhone, { ph: "01XXX-XXXXXX" })}${field("whatsapp", "WhatsApp", s.whatsapp, { ph: "01XXX-XXXXXX" })}</div>
          ${field("address", "Address", s.address, { max: 200 })}
          <h4 class="st-sub">Social links</h4>
          <div class="row">${field("facebook", "Facebook", s.social.facebook, { type: "url", ph: "https://facebook.com/…" })}${field("youtube", "YouTube", s.social.youtube, { type: "url", ph: "https://youtube.com/@…" })}</div>
          <div class="row">${field("tiktok", "TikTok", s.social.tiktok, { type: "url", ph: "https://tiktok.com/@…" })}${field("instagram", "Instagram", s.social.instagram, { type: "url", ph: "https://instagram.com/…" })}</div>
          <h4 class="st-sub">Platform</h4>
          ${sw("signups", "Allow new sign-ups", "Turn off to pause new accounts. Existing users still sign in.", s.signups)}
          ${sw("maintenance", "Maintenance notice", "Shows a message at the top of every store dashboard.", s.maintenance)}
          ${field("maintenanceText", "Notice text", s.maintenanceText, { max: 200 })}
        </div>
        <div class="st-panel" data-st-panel="staff"${tab === "staff" ? "" : " hidden"}>
          <p class="st-intro">The people who run Shopilier with you. Also add each email to Cloudflare Access for <b>/master-admin*</b>, which is what lets them open this dashboard.</p>
          <div class="st-staff-list" data-staff-list>${staffRows()}</div>
          <div class="st-staff-add"><input class="input" data-new="name" placeholder="Name" maxlength="80" aria-label="New member's name"><input class="input" data-new="email" type="email" placeholder="email@example.com" aria-label="New member's email">
            <select class="select" data-new="role" aria-label="New member's role">${ROLES.map(([r, l]) => `<option value="${r}"${r === "support" ? " selected" : ""}>${l}</option>`).join("")}</select>
            <button type="button" class="btn" data-staff-add>${icon("plus")}Add</button></div>
        </div>
        <div class="st-panel" data-st-panel="payments"${tab === "payments" ? "" : " hidden"}>
          <p class="st-intro">Where store owners send money for their plan. Online payment isn't connected yet, so these are the details your team gives out and checks.</p>
          ${pay("bkash", "bKash")}${pay("nagad", "Nagad")}${pay("rocket", "Rocket")}
          <div class="st-pay"><div class="set-row"><span><b>Bank transfer</b><small>Account name, number, bank and branch</small></span><label class="switch"><input type="checkbox" name="bank_on" ${s.payments.bank.on ? "checked" : ""} aria-label="Accept bank transfer"><i></i></label></div>
            <div class="field"><label for="st-bank">Bank details</label><textarea class="textarea" id="st-bank" name="bank_details" rows="3" maxlength="500" placeholder="Account name, account number, bank, branch">${v(s.payments.bank.details)}</textarea></div></div>
          <div class="row">${field("invoicePrefix", "Invoice number prefix", s.payments.invoicePrefix, { ph: "INV-", max: 10 })}${field("payNote", "Payment note", s.payments.note, { ph: "e.g. Write your store name in the reference", max: 300 })}</div>
        </div>
        <div class="st-panel" data-st-panel="advanced"${tab === "advanced" ? "" : " hidden"}>
          <div class="callout red" style="margin-bottom:14px"><span class="ico">${icon("shield")}</span><div><b>Keep this dashboard private.</b> In Cloudflare, open your <b>shopiliar</b> project → <b>Access</b> and allow only your team's emails for <b>/master-admin*</b>.</div></div>
          <div class="set-row"><span>Reset this browser's data<small>Templates, plans and payments kept in this browser go back to the start. Users and settings stay in the database.</small></span><button type="button" class="btn btn-danger" data-action-reset>Reset data</button></div>
        </div>`,
      onOpen: (form) => {
        form.classList.add("st-dialog");
        form.addEventListener("click", (e) => {
          const t = e.target.closest("[data-st-tab]");
          if (t) {
            form.querySelectorAll("[data-st-tab]").forEach((b) => { b.classList.toggle("on", b === t); b.setAttribute("aria-selected", String(b === t)); });
            form.querySelectorAll("[data-st-panel]").forEach((p) => { p.hidden = p.dataset.stPanel !== t.dataset.stTab; });
            return;
          }
          const rm = e.target.closest("[data-staff-rm]");
          if (rm) { staff.splice(Number(rm.dataset.staffRm), 1); form.querySelector("[data-staff-list]").innerHTML = staffRows(); return; }
          if (e.target.closest("[data-staff-add]")) {
            const get = (k) => form.querySelector(`[data-new="${k}"]`);
            const name = get("name").value.trim(), email = get("email").value.trim().toLowerCase();
            if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast("Enter a name and a valid email"); return; }
            if (staff.some((x) => x.email === email)) { toast("That email is already on the team"); return; }
            staff.push({ id: uid("st"), name, email, role: get("role").value });
            get("name").value = ""; get("email").value = "";
            form.querySelector("[data-staff-list]").innerHTML = staffRows(); get("name").focus();
            return;
          }
          if (e.target.closest("[data-action-reset]")) { d.close(); actions["reset-all"](); }
        });
        form.addEventListener("change", (e) => { const r = e.target.closest("[data-staff-role]"); if (r) staff[Number(r.dataset.staffRole)].role = r.value; });
        // Enter in the "add member" boxes adds the member instead of saving the whole form
        form.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.closest("[data-new]")) { e.preventDefault(); form.querySelector("[data-staff-add]").click(); } });
      },
      onSubmit: (val, close, form) => {
        const el = form.elements, num = (k) => ({ on: el[`pay_${k}_on`].checked, number: val[`pay_${k}_number`], type: val[`pay_${k}_type`] });
        const body = {
          company: val.company, supportEmail: val.supportEmail, supportPhone: val.supportPhone, whatsapp: val.whatsapp, address: val.address,
          social: { facebook: val.facebook, youtube: val.youtube, tiktok: val.tiktok, instagram: val.instagram },
          signups: el.signups.checked, maintenance: el.maintenance.checked, maintenanceText: val.maintenanceText, staff,
          payments: { bkash: num("bkash"), nagad: num("nagad"), rocket: num("rocket"), bank: { on: el.bank_on.checked, details: val.bank_details }, invoicePrefix: val.invoicePrefix, note: val.payNote },
        };
        const btn = form.querySelector("[type=submit]"); btn.disabled = true;
        fetch("/master-admin/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
          .then(async (res) => { const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.error || "Couldn't save settings."); return data; })
          .then(() => { log("Settings were updated"); persist(); close(); toast("Settings saved"); })
          .catch((err) => { btn.disabled = false; toast(err.message); });
        return false;
      },
    });
  };
  // Settings opens as a popup from the sidebar and the profile menu, wherever you are
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href="#/settings"]');
    if (!a) return;
    e.preventDefault();
    profileMenu.hidden = true;
    openSettings();
  });

  // ---------- Dialogs ----------
  let rerender;
  const go = () => rerender();

  const userDialog = (u) => dialog({
    title: u ? u.business : "New user",
    body: `${u ? `<p class="muted small" style="margin-bottom:12px">Joined ${day(u.joined)}${u.site ? ` · ${esc(u.site)}` : ""}${u.products == null ? "" : ` · ${u.products} products`}${u.published == null ? "" : ` · ${u.published ? "website live" : "website not published"}`}</p>` : ""}
      <div class="row"><div class="field"><label>Owner name</label><input class="input" name="name" required value="${esc(u?.name)}"></div>
      <div class="field"><label>Business name</label><input class="input" name="business" required value="${esc(u?.business)}"></div></div>
      <div class="row"><div class="field"><label>Email</label><input class="input" type="email" name="email" required value="${esc(u?.email)}"></div>
      <div class="field"><label>Phone</label><input class="input" name="phone" value="${esc(u?.phone)}"></div></div>
      <div class="row"><div class="field"><label>Plan</label><select class="select" name="plan">${Object.entries(db.plans).map(([id, p]) => `<option value="${id}"${u?.plan === id ? " selected" : ""}>${esc(p.name)} — ${p.price ? taka(p.price) + "/mo" : "free"}</option>`).join("")}</select></div>
      <div class="field"><label>Billing</label><select class="select" name="billing"><option value="monthly">Monthly</option><option value="yearly"${u?.billing === "yearly" ? " selected" : ""}>Yearly</option></select></div></div>
      <div class="row"><div class="field"><label>Template</label><select class="select" name="template">${db.templates.map((t) => `<option value="${t.id}"${u?.template === t.id ? " selected" : ""}>${esc(t.name)}</option>`).join("")}</select></div>
      <div class="field"><label>Status</label><select class="select" name="status"><option value="active">Active</option><option value="suspended"${u?.status === "suspended" ? " selected" : ""}>Suspended</option></select></div></div>`,
    submit: u ? "Save changes" : "Add user",
    onSubmit: (v) => {
      if (!u) return;
      apiUser("PATCH", u.id, { name: v.name, business: v.business, email: v.email, plan: v.plan, billing: v.billing, template: v.template }).then((res) => {
        if (u.plan !== res.user.plan) log(`${u.business} moved from ${planName(u.plan)} to ${planName(res.user.plan)}`);
        Object.assign(u, res.user, { phone: v.phone, status: v.status });
        countUses(); persist(); go(); toast("User updated");
      }).catch((err) => toast(err.message));
    },
  });

  const templateDialog = (t) => {
    const draft = t ? { ...t } : {
      id: "", name: "", category: CATEGORIES[0], desc: "", layout: "split", bg: "#ffffff", text: "#111111", accent: "#2383e2",
      headline: "Your headline goes here", sub: "A short line that explains what this business does.", cta: "Get Started", status: "draft", uses: 0,
    };
    const preview = () => siteHTML({ ...draft, name: draft.name || "Template name", font: "modern" }, [
      { name: "Product one", price: 1200, color: draft.accent }, { name: "Product two", price: 2400, color: draft.bg === "#ffffff" ? "#e9e4da" : draft.bg }, { name: "Product three", price: 900, color: "#d9cfc4" },
    ]);
    const d = dialog({
      title: t ? `Customize ${t.name}` : "New template",
      size: "lg",
      body: `<div style="display:grid;grid-template-columns:260px 1fr;gap:18px" class="tpl-editor">
        <div>
          <div class="field"><label>Name</label><input class="input" name="name" required maxlength="40" value="${esc(draft.name)}"></div>
          <div class="field"><label>Category</label><select class="select" name="category">${CATEGORIES.map((c) => `<option${c === draft.category ? " selected" : ""}>${esc(c)}</option>`).join("")}</select></div>
          <div class="field"><label>Description</label><textarea class="textarea" name="desc" maxlength="160" style="min-height:60px">${esc(draft.desc)}</textarea></div>
          <div class="field"><label>Layout</label><select class="select" name="layout"><option value="split">Text + picture side by side</option><option value="center"${draft.layout === "center" ? " selected" : ""}>Centered</option><option value="bleed"${draft.layout === "bleed" ? " selected" : ""}>Full-width picture</option><option value="story"${draft.layout === "story" ? " selected" : ""}>Big headline with slides</option></select></div>
          <div class="row" style="grid-template-columns:1fr 1fr 1fr"><div class="field"><label>Background</label><input class="input" type="color" name="bg" value="${esc(draft.bg)}" style="padding:2px"></div>
          <div class="field"><label>Text</label><input class="input" type="color" name="text" value="${esc(draft.text)}" style="padding:2px"></div>
          <div class="field"><label>Accent</label><input class="input" type="color" name="accent" value="${esc(draft.accent)}" style="padding:2px"></div></div>
          <div class="field"><label>Default headline</label><input class="input" name="headline" maxlength="80" value="${esc(draft.headline)}"></div>
          <div class="field"><label>Default description</label><input class="input" name="sub" maxlength="160" value="${esc(draft.sub)}"></div>
          <div class="field"><label>Default button</label><input class="input" name="cta" maxlength="30" value="${esc(draft.cta)}"></div>
          <label class="check"><input type="checkbox" name="published" ${draft.status === "published" ? "checked" : ""}> Published (users can choose it)</label>
        </div>
        <div><div class="muted small" style="margin-bottom:6px">Live preview</div><div class="sp-frame" id="tpl-preview">${preview()}</div></div>
      </div>`,
      submit: t ? "Save template" : "Create template",
      onOpen: (form) => {
        if (window.innerWidth < 760) form.querySelector(".tpl-editor").style.gridTemplateColumns = "1fr";
        const sync = () => {
          ["name", "category", "desc", "layout", "bg", "text", "accent", "headline", "sub", "cta"].forEach((k) => { draft[k] = form.elements[k].value; });
          form.querySelector("#tpl-preview").innerHTML = preview();
        };
        form.addEventListener("input", sync);
        form.addEventListener("change", sync);
      },
      onSubmit: (v) => {
        const data = { name: v.name, category: v.category, desc: v.desc, layout: v.layout, bg: v.bg, text: v.text, accent: v.accent, headline: v.headline, sub: v.sub, cta: v.cta, status: v.published ? "published" : "draft" };
        if (t) { Object.assign(t, data); log(`Template “${t.name}” was updated`); }
        else {
          let id = v.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "template";
          while (db.templates.some((x) => x.id === id)) id += "-2";
          db.templates.unshift({ id, ...data, uses: 0, created: new Date().toISOString() });
          log(`New template “${v.name}” was created`);
        }
        persist(); go(); toast(t ? "Template saved" : "Template created");
      },
    });
    return d;
  };

  // ---------- Actions ----------
  // Support messages from real users (stored in D1, unlike the sample data above)
  let inbox = null;
  const setMsgBadge = (n) => { document.getElementById("msg-count").textContent = n || ""; };
  ShopilierInbox.unread("admin").then(setMsgBadge);
  setInterval(() => { if (location.hash !== "#/messages") ShopilierInbox.unread("admin").then(setMsgBadge); }, 60000);

  const actions = {
    "new-message": () => inbox && inbox.newMessage(),
    "user-tab": (el) => { userTab = el.dataset.tab; go(); },
    "open-user": (el) => userDialog(userById(el.dataset.id)),
    "user-menu": (el) => userMenu(el),
    "toggle-user": (el) => {
      const u = userById(el.dataset.id);
      u.status = u.status === "active" ? "suspended" : "active";
      log(`${u.business} was ${u.status === "active" ? "re-activated" : "suspended"}`);
      persist(); go(); toast(`${u.business} ${u.status === "active" ? "activated" : "suspended"}`);
    },
    // Deleting asks for the business name to be typed, then removes the account and everything in it
    "delete-user": (el) => {
      const u = userById(el.dataset.id);
      if (!u) return;
      dialog({
        title: "Delete user?", submit: "Delete user", danger: true,
        body: `<p class="muted">${esc(u.business)} (${esc(u.email)}) will be deleted with their website, products, orders, photos and messages. This can't be undone.</p>
          <div class="field" style="margin-top:14px"><label for="del-confirm">Type <b>${esc(u.business)}</b> to confirm</label>
          <input class="input" id="del-confirm" name="confirm" autocomplete="off" spellcheck="false" placeholder="${esc(u.business)}"></div>`,
        onOpen: (form) => {
          const input = form.elements.confirm, btn = form.querySelector("[type=submit]");
          const sync = () => { btn.disabled = input.value.trim() !== u.business.trim(); };
          input.addEventListener("input", sync); sync();
        },
        onSubmit: (v) => {
          if (v.confirm !== u.business.trim()) { toast("Type the business name exactly"); return false; }
          apiUser("DELETE", u.id, { confirm: v.confirm }).then(() => {
            db.users = db.users.filter((x) => x !== u);
            log(`${u.business} was deleted`); countUses(); persist(); go(); toast(`${u.business} was deleted`);
          }).catch((err) => toast(err.message));
        },
      });
    },
    "tpl-tab": (el) => { tplTab = el.dataset.tab; go(); },
    "new-template": () => templateDialog(null),
    "edit-template": (el) => templateDialog(db.templates.find((t) => t.id === el.dataset.id)),
    "toggle-template": (el) => {
      const t = db.templates.find((x) => x.id === el.dataset.id);
      t.status = t.status === "published" ? "draft" : "published";
      log(`Template “${t.name}” was ${t.status === "published" ? "published" : "unpublished"}`);
      persist(); go(); toast(`${t.name} ${t.status === "published" ? "is now available to users" : "is hidden from users"}`);
    },
    "duplicate-template": (el) => {
      const t = db.templates.find((x) => x.id === el.dataset.id);
      let id = t.id + "-copy";
      while (db.templates.some((x) => x.id === id)) id += "-2";
      const copy = { ...t, id, name: t.name + " (copy)", status: "draft", uses: 0, created: new Date().toISOString() };
      db.templates.splice(db.templates.indexOf(t) + 1, 0, copy);
      log(`Template “${t.name}” was duplicated`); persist(); go(); toast("Copy created as a draft");
    },
    "delete-template": async (el) => {
      const t = db.templates.find((x) => x.id === el.dataset.id);
      const using = db.users.filter((u) => u.template === t.id).length;
      if (db.templates.length === 1) { toast("Keep at least one template"); return; }
      if (!(await confirm("Delete template?", `“${t.name}” will be deleted.${using ? ` ${using} user${using > 1 ? "s" : ""} on it will keep their current design.` : ""}`))) return;
      db.templates = db.templates.filter((x) => x !== t);
      log(`Template “${t.name}” was deleted`); persist(); go(); toast("Template deleted");
    },
    "pay-tab": (el) => { payTab = el.dataset.tab; go(); },
    "mark-paid": (el) => {
      const p = db.payments.find((x) => x.id === el.dataset.id);
      p.status = "Paid"; const u = userById(p.user);
      log(`Payment ${p.invoice} from ${u ? u.business : "a user"} was marked paid`); persist(); go(); toast(p.invoice + " marked paid");
    },
    "reset-all": async () => {
      if (!(await confirm("Reset all data?", "Templates, plans, payments and settings in this browser go back to the start. Users are loaded again from the database.", "Reset data"))) return;
      remove(KEY); location.reload();
    },
  };

  const view = document.getElementById("view");
  view.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el || el.tagName === "INPUT") return;
    const fn = actions[el.dataset.action];
    if (fn) { e.preventDefault(); fn(el); }
  });
  view.addEventListener("change", (e) => {
    if (e.target.dataset.action === "range") { range = Number(e.target.value); go(); }
  });
  view.addEventListener("input", (e) => {
    if (e.target.dataset.action !== "user-search") return;
    userSearch = e.target.value;
    const pos = e.target.selectionStart;
    go();
    const again = view.querySelector('[data-action="user-search"]');
    again.focus(); again.setSelectionRange(pos, pos);
  });

  document.getElementById("top-search").addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    userSearch = e.target.value.trim(); userTab = "All";
    if (location.hash === "#/users") go(); else location.hash = "#/users";
  });

  hydrateIcons();
  countUses();
  save(KEY, db);
  chrome();
  if (location.hash === "#/settings") { history.replaceState(null, "", "#/overview"); setTimeout(() => openSettings(), 0); }
  rerender = router(routes, "overview");
  loadUsers();
};
