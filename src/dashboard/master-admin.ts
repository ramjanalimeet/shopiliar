// @ts-nocheck — ported as-is from the original dashboard script; types can be tightened over time.
import { Dash } from "./dash";
import { ShopilierInbox } from "./inbox";

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
    settings: { company: "Shopilier", supportEmail: "support@shopilier.com", supportPhone: "", signups: true, maintenance: false },
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
           <button class="btn btn-primary" data-action="add-user">${icon("plus")}Add user</button>`)}
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
        return `${head("Users", "Everyone who uses Shopilier. Open a user to change their plan, template or status.", `<button class="btn btn-primary" data-action="add-user">${icon("plus")}Add user</button>`)}
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
                  <td class="t-actions"><button class="btn btn-sm" data-action="toggle-user" data-id="${u.id}">${u.status === "active" ? "Suspend" : "Activate"}</button><button class="icon-btn" data-action="open-user" data-id="${u.id}" aria-label="Edit ${esc(u.business)}">${icon("edit")}</button><button class="icon-btn danger" data-action="delete-user" data-id="${u.id}" aria-label="Delete ${esc(u.business)}">${icon("trash")}</button></td>
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
        return `${head("Templates", "Add, customize, publish and delete templates. Only published templates can be chosen by users.", `<button class="btn btn-primary" data-action="new-template">${icon("plus")}New template</button>`)}
          <div style="margin-bottom:16px"><div class="seg">${tabs.map((t) => `<button class="${t === tplTab ? "on" : ""}" data-action="tpl-tab" data-tab="${t}">${label[t]}<span>${t === "All" ? db.templates.length : db.templates.filter((x) => x.status === t).length}</span></button>`).join("")}</div></div>
          <div class="gallery">${list.map((t) => `
            <div class="g-card">
              ${tplCover(t)}
              <div class="g-body">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span class="g-title">${esc(t.name)}</span><span class="muted small">${t.uses} sites</span></div>
                <div class="g-meta">${tag(t.category, "brown")}${tag(t.layout === "center" ? "Centered" : t.layout === "bleed" ? "Full-width" : t.layout === "story" ? "Big headline with slides" : "Side by side", "gray")}</div>
                <div class="muted small">${esc(t.desc)}</div>
                <div class="g-actions">
                  <button class="btn btn-sm" data-action="edit-template" data-id="${t.id}">${icon("edit")}Customize</button>
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

    activity: {
      title: "Activity",
      render: () => `${head("Activity", "Everything that happened across Shopilier, newest first.")}
        <div class="card"><div class="card-body" style="padding-top:4px;padding-bottom:4px"><ul class="feed">${db.activity.map((a) => `<li><span class="fdot"></span><span>${esc(a.text)}</span><time>${day(a.date)}</time></li>`).join("") || '<li class="muted">Nothing yet.</li>'}</ul></div></div>
      </div>`,
    },

    settings: {
      title: "Settings",
      render: () => {
        const s = db.settings;
        return `${head("Settings", "Company details and platform switches.")}
          <div class="callout red"><span class="ico">${icon("shield")}</span><div><b>Protect this page before real data goes in.</b> Anyone who knows the address can open /master-admin. In Cloudflare, open your <b>shopiliar</b> project → <b>Access</b> and allow only your email for <b>/master-admin*</b>. It's free.</div></div>
          <form id="settings-form">
            <div class="grid-2">
              <div class="card"><div class="card-head"><span class="card-title">Company</span></div><div class="card-body">
                <div class="field"><label for="c-name">Company name</label><input class="input" id="c-name" name="company" value="${esc(s.company)}"></div>
                <div class="row">
                  <div class="field"><label for="c-email">Support email</label><input class="input" id="c-email" name="supportEmail" type="email" value="${esc(s.supportEmail)}"></div>
                  <div class="field"><label for="c-phone">Support phone</label><input class="input" id="c-phone" name="supportPhone" value="${esc(s.supportPhone)}" placeholder="01XXX-XXXXXX"></div>
                </div>
              </div></div>
              <div class="card"><div class="card-head"><span class="card-title">Platform</span></div><div class="card-body" style="padding-top:6px;padding-bottom:6px">
                <div class="set-row"><span>Allow new sign-ups<small>Turn off to pause new accounts.</small></span><label class="switch"><input type="checkbox" name="signups" ${s.signups ? "checked" : ""} aria-label="Allow new sign-ups"><i></i></label></div>
                <div class="set-row"><span>Maintenance mode<small>Show a “back soon” message to users.</small></span><label class="switch"><input type="checkbox" name="maintenance" ${s.maintenance ? "checked" : ""} aria-label="Maintenance mode"><i></i></label></div>
              </div></div>
            </div>
            <div style="margin-top:18px;display:flex;justify-content:flex-end"><button class="btn btn-primary" type="submit">Save settings</button></div>
          </form>
          <div class="card" style="margin-top:18px;border-color:#fecaca"><div class="card-head"><span class="card-title" style="color:var(--danger)">Danger zone</span></div>
            <div class="card-body" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><span style="flex:1">Reset the templates, plans, payments and settings kept in this browser. Users always come from the database.</span><button class="btn btn-danger" data-action="reset-all">Reset data</button></div></div>
        </div>`;
      },
      mount: (view) => view.querySelector("#settings-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const d = new FormData(e.target);
        Object.assign(db.settings, { company: d.get("company").trim(), supportEmail: d.get("supportEmail").trim(), supportPhone: d.get("supportPhone").trim(), signups: e.target.elements.signups.checked, maintenance: e.target.elements.maintenance.checked });
        persist(); toast("Settings saved");
      }),
    },
  };

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
      if (u) {
        if (u.plan !== v.plan) log(`${u.business} moved from ${planName(u.plan)} to ${planName(v.plan)}`);
        Object.assign(u, v);
      } else {
        const site = v.business.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".shopilier.com";
        db.users.unshift({ id: uid("u"), ...v, joined: new Date().toISOString(), site, products: 0, published: false });
        log(`${v.name} was added on the ${planName(v.plan)} plan`);
      }
      persist(); go(); toast(u ? "User updated" : "User added");
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
    "add-user": () => userDialog(null),
    "open-user": (el) => userDialog(userById(el.dataset.id)),
    "toggle-user": (el) => {
      const u = userById(el.dataset.id);
      u.status = u.status === "active" ? "suspended" : "active";
      log(`${u.business} was ${u.status === "active" ? "re-activated" : "suspended"}`);
      persist(); go(); toast(`${u.business} ${u.status === "active" ? "activated" : "suspended"}`);
    },
    "delete-user": async (el) => {
      const u = userById(el.dataset.id);
      if (!(await confirm("Delete user?", `${u.business} (${u.email}) and their website will be deleted. This can't be undone.`))) return;
      db.users = db.users.filter((x) => x !== u);
      log(`${u.business} was deleted`); persist(); go(); toast("User deleted");
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
  rerender = router(routes, "overview");
  loadUsers();
};
