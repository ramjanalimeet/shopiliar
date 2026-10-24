// Shopiliar master dashboard (/master-admin): users, templates, payments and plans.
(() => {
  const { esc, taka, uid, day, daysAgo, avatar, tag, load, save, remove, toast, dialog, confirm, router, bars, siteHTML, limitText, CATEGORIES } = Dash;
  const KEY = "shopiliar.master";

  // ---------- Data ----------
  const seed = () => {
    const plans = Dash.PLANS();
    const people = [
      ["Rahim Uddin", "Rahim Fashion House", "starter", "monthly", "active", 160], ["Farzana Akter", "Farzana's Kitchen", "business", "yearly", "active", 140],
      ["Tanvir Ahmed", "TechZone BD", "pro", "yearly", "active", 130], ["Nusrat Jahan", "Nusrat Boutique", "business", "monthly", "active", 110],
      ["Kamal Hossain", "Kamal Electronics", "starter", "monthly", "suspended", 95], ["Sadia Islam", "Glow by Sadia", "business", "monthly", "active", 80],
      ["Arif Chowdhury", "Arif Travels", "starter", "yearly", "active", 64], ["Mitu Rahman", "Mitu Crafts", "starter", "monthly", "active", 41],
      ["Shakil Khan", "Dhaka Gadget Hub", "pro", "monthly", "active", 33], ["Ruma Begum", "Ruma Home Decor", "business", "yearly", "active", 21],
      ["Imran Kabir", "Kabir Consultancy", "starter", "monthly", "active", 12], ["Lamia Haque", "Lamia Studio", "business", "monthly", "active", 6],
      ["Sohel Rana", "Rana Auto Parts", "starter", "monthly", "active", 3],
    ];
    const tpl = Dash.TEMPLATES();
    const users = people.map(([name, business, plan, billing, status, ago], i) => ({
      id: uid("u"), name, business, email: name.toLowerCase().split(" ")[0] + "@" + business.toLowerCase().replace(/[^a-z]+/g, "") + ".com",
      phone: "01" + (700000000 + i * 1234567).toString().slice(0, 9), plan, billing, status, joined: daysAgo(ago),
      template: tpl[i % tpl.length].id, site: business.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".shopiliar.com",
      products: plan === "starter" ? 3 : plan === "business" ? 40 + i * 7 : 320 + i * 11, published: i % 5 !== 4,
    }));
    const methods = ["bKash", "Nagad", "Card", "bKash", "Bank transfer"];
    const payments = [];
    users.forEach((u, i) => {
      const price = plans[u.plan].price;
      const periods = u.billing === "yearly" ? 1 : Math.min(3, Math.ceil((Date.now() - new Date(u.joined)) / (30 * 864e5)));
      for (let k = 0; k < periods; k++) {
        payments.push({
          id: uid("pay"), invoice: "INV-" + (2400 + payments.length), user: u.id, plan: u.plan, billing: u.billing,
          amount: u.billing === "yearly" ? price * 12 : price, method: methods[(i + k) % methods.length],
          status: u.status === "suspended" && k === 0 ? "Failed" : k === 0 && i % 6 === 3 ? "Due" : "Paid", date: daysAgo(k * 30 + (i % 9)),
        });
      }
    });
    const activity = users.slice(0, 8).map((u, i) => ({
      id: uid("a"), date: daysAgo(i * 0.7 + 0.1),
      text: [`${u.name} signed up on the ${plans[u.plan].name} plan`, `${u.business} published their website`, `${u.name} switched to the ${tpl[i % tpl.length].name} template`, `Payment received from ${u.business}`][i % 4],
    }));
    return {
      plans, templates: tpl, users, payments, activity,
      settings: { company: "Shopiliar", supportEmail: "support@shopiliar.com", supportPhone: "", signups: true, maintenance: false },
    };
  };
  const db = load(KEY, seed);

  // A real sign-up from this browser joins the user list.
  const account = load("shopiliar.account", null);
  if (account && !account.demo && !db.users.some((u) => u.email === account.email)) {
    db.users.unshift({
      id: uid("u"), name: account.name, business: account.business || account.name, email: account.email, phone: "", plan: account.plan || "starter",
      billing: account.billing || "monthly", status: "active", joined: account.createdAt || new Date().toISOString(), template: account.template || "luxe-store",
      site: (account.business || "store").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".shopiliar.com", products: 0, published: false,
    });
    db.activity.unshift({ id: uid("a"), date: new Date().toISOString(), text: `${account.name} signed up on the ${(db.plans[account.plan] || db.plans.starter).name} plan` });
  }
  // Keep that user's plan and website status in sync with their dashboard.
  const ownStore = load("shopiliar.store", null);
  const ownUser = account && !account.demo && db.users.find((u) => u.email === account.email);
  if (ownUser) {
    Object.assign(ownUser, { plan: account.plan, billing: account.billing, business: account.business, name: account.name, template: account.template });
    if (ownStore) Object.assign(ownUser, { products: ownStore.products.length, published: !!ownStore.published });
  }
  const log = (text) => { db.activity.unshift({ id: uid("a"), date: new Date().toISOString(), text }); db.activity = db.activity.slice(0, 60); };
  const persist = () => { save(KEY, db); chrome(); };
  const chrome = () => {
    document.getElementById("count-users").textContent = db.users.length;
    document.getElementById("count-templates").textContent = db.templates.length;
    const due = db.payments.filter((p) => p.status !== "Paid").length;
    document.getElementById("count-due").textContent = due || "";
  };

  // ---------- Helpers ----------
  const PLAN_COLOR = { starter: "gray", business: "blue", pro: "purple" };
  const PAY_COLOR = { Paid: "green", Due: "yellow", Failed: "red" };
  const planName = (id) => (db.plans[id] || { name: id }).name;
  const monthly = (u) => u.status === "active" ? (db.plans[u.plan]?.price || 0) : 0;
  const mrr = () => db.users.reduce((s, u) => s + monthly(u), 0);
  const userById = (id) => db.users.find((u) => u.id === id);
  const pageHead = (icon, title, desc, cover) => `${cover ? '<div class="cover" style="background:linear-gradient(120deg,#e8deee,#d3e5ef 50%,#dbeddb)"></div>' : ""}<div class="page wide"><div class="page-icon">${icon}</div><h1 class="page-title">${esc(title)}</h1><p class="page-desc">${desc}</p>`;
  const tplCover = (t, h = 132) => `<div class="g-cover" style="height:${h}px;background:linear-gradient(135deg,${esc(t.bg)} 0%,${esc(t.bg)} 55%,${esc(t.accent)} 160%);color:${esc(t.text)}"><span class="g-name">${esc(t.name)}</span></div>`;

  let userTab = "All", userSearch = "", tplTab = "All", payTab = "All";

  // ---------- Views ----------
  const routes = {
    overview: {
      title: "Overview",
      render: () => {
        const active = db.users.filter((u) => u.status === "active");
        const newThisMonth = db.users.filter((u) => Date.now() - new Date(u.joined) < 30 * 864e5).length;
        const months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(); d.setMonth(d.getMonth() - (5 - i), 1);
          const v = db.payments.filter((p) => p.status === "Paid" && new Date(p.date).getMonth() === d.getMonth() && new Date(p.date).getFullYear() === d.getFullYear()).reduce((s, p) => s + p.amount, 0);
          return { label: d.toLocaleDateString("en-GB", { month: "short" }), v, text: taka(v) };
        });
        const byPlan = Object.keys(db.plans).map((id) => [id, db.users.filter((u) => u.plan === id).length]);
        const topTpl = [...db.templates].sort((a, b) => b.uses - a.uses).slice(0, 5);
        const due = db.payments.filter((p) => p.status !== "Paid");
        return `${pageHead("📊", "Overview", "Your whole business at a glance.", true)}
          <div class="stats">
            <div class="stat"><div class="stat-label">💰 Monthly revenue (MRR)</div><div class="stat-value">${taka(mrr())}</div><div class="stat-delta">${taka(mrr() * 12)} per year</div></div>
            <div class="stat"><div class="stat-label">👥 Users</div><div class="stat-value">${db.users.length}</div><div class="stat-delta">+${newThisMonth} this month</div></div>
            <div class="stat"><div class="stat-label">🌐 Live websites</div><div class="stat-value">${db.users.filter((u) => u.published && u.status === "active").length}</div><div class="stat-delta" style="color:var(--muted)">${active.length} active accounts</div></div>
            <div class="stat"><div class="stat-label">⏳ Unpaid invoices</div><div class="stat-value">${due.length}</div><div class="stat-delta ${due.length ? "down" : ""}">${taka(due.reduce((s, p) => s + p.amount, 0))}</div></div>
          </div>
          ${due.length ? `<div class="callout yellow"><span class="ico">⏳</span><div style="flex:1"><b>${due.length} invoice${due.length > 1 ? "s" : ""} need attention.</b> Check failed and due payments.</div><a class="btn btn-sm" href="#/payments">Open payments</a></div>` : ""}
          <div class="cols">
            ${bars("Revenue collected · last 6 months", taka(months.reduce((s, m) => s + m.v, 0)), months)}
            <div class="chart"><div class="chart-head"><b>Users by plan</b><span class="muted">${db.users.length} total</span></div>
              ${byPlan.map(([id, n]) => `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between"><span>${tag(planName(id), PLAN_COLOR[id])}</span><span class="muted">${n} · ${taka(n * (db.plans[id].price))}/mo</span></div><div class="progress"><i style="width:${(n / Math.max(1, db.users.length)) * 100}%;background:var(--accent)"></i></div></div>`).join("")}
            </div>
          </div>
          <div class="cols">
            <div><h2 class="h2">🆕 Newest users <span class="spacer"></span><a class="btn btn-sm btn-ghost" href="#/users">All users</a></h2>
              <div class="table-wrap"><table class="table" style="min-width:0"><tbody>${[...db.users].sort((a, b) => new Date(b.joined) - new Date(a.joined)).slice(0, 6).map((u) => `
                <tr><td><span class="t-title">${avatar(u.name)}${esc(u.business)}</span></td><td>${tag(planName(u.plan), PLAN_COLOR[u.plan])}</td><td class="muted t-right">${day(u.joined)}</td></tr>`).join("")}</tbody></table></div></div>
            <div><h2 class="h2">🧩 Most used templates <span class="spacer"></span><a class="btn btn-sm btn-ghost" href="#/templates">All templates</a></h2>
              <div class="table-wrap"><table class="table" style="min-width:0"><tbody>${topTpl.map((t) => `
                <tr><td><span class="t-title"><span style="width:18px;height:18px;border-radius:4px;background:linear-gradient(135deg,${esc(t.bg)} 50%,${esc(t.accent)} 50%);border:1px solid var(--border)"></span>${esc(t.name)}</span></td><td>${tag(t.category, "brown")}</td><td class="t-right">${t.uses} sites</td></tr>`).join("")}</tbody></table></div></div>
          </div>
          <h2 class="h2">🕒 Recent activity <span class="spacer"></span><a class="btn btn-sm btn-ghost" href="#/activity">See all</a></h2>
          <ul class="todo">${db.activity.slice(0, 6).map((a) => `<li><span class="muted small" style="width:96px;flex:none">${day(a.date)}</span><span>${esc(a.text)}</span></li>`).join("")}</ul>
        </div>`;
      },
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
        return `${pageHead("👥", "Users", "Everyone who uses Shopiliar. Click a business to see details, change their plan or suspend them.")}
          <div class="db-bar">
            <div class="db-tabs">${tabs.map((t) => `<button class="db-tab ${t === userTab ? "on" : ""}" data-action="user-tab" data-tab="${t}">${label(t)} <span class="muted small">${count(t)}</span></button>`).join("")}</div>
            <input class="db-search" data-action="user-search" placeholder="🔍 Search users" value="${esc(userSearch)}" aria-label="Search users">
            <button class="btn btn-sm btn-primary" data-action="add-user">New user</button>
          </div>
          <div class="table-wrap"><table class="table" style="min-width:900px">
            <thead><tr><th>Business</th><th>Owner</th><th>Plan</th><th>Website</th><th>Status</th><th>Joined</th><th class="t-right">Pays / month</th><th class="t-actions"></th></tr></thead>
            <tbody>${list.length ? list.map((u) => `
              <tr>
                <td><button class="t-title" data-action="open-user" data-id="${u.id}">${avatar(u.business)}${esc(u.business)}</button></td>
                <td><div>${esc(u.name)}</div><div class="muted small">${esc(u.email)}</div></td>
                <td>${tag(planName(u.plan), PLAN_COLOR[u.plan])} <span class="muted small">${u.billing === "yearly" ? "Yearly" : "Monthly"}</span></td>
                <td><div class="small">${esc(u.site)}</div>${u.published ? tag("Live", "green") : tag("Draft", "gray")}</td>
                <td>${u.status === "active" ? tag("Active", "green") : tag("Suspended", "red")}</td>
                <td class="muted">${day(u.joined)}</td>
                <td class="t-right">${taka(monthly(u))}</td>
                <td class="t-actions"><button class="btn btn-sm" data-action="toggle-user" data-id="${u.id}">${u.status === "active" ? "Suspend" : "Activate"}</button> <button class="icon-btn" data-action="delete-user" data-id="${u.id}" aria-label="Delete ${esc(u.business)}">🗑</button></td>
              </tr>`).join("") : `<tr><td colspan="8" class="table-empty">No users match.</td></tr>`}</tbody>
          </table></div>
          <button class="add-row" data-action="add-user">＋ New user</button>
        </div>`;
      },
    },

    templates: {
      title: "Templates",
      render: () => {
        const tabs = ["All", "published", "draft"];
        const label = { All: "All", published: "Published", draft: "Drafts" };
        const list = db.templates.filter((t) => tplTab === "All" || t.status === tplTab);
        return `${pageHead("🧩", "Templates", "Add, customize, publish and delete templates. Only <b>published</b> templates can be chosen by users.")}
          <div class="db-bar">
            <div class="db-tabs">${tabs.map((t) => `<button class="db-tab ${t === tplTab ? "on" : ""}" data-action="tpl-tab" data-tab="${t}">${label[t]} <span class="muted small">${t === "All" ? db.templates.length : db.templates.filter((x) => x.status === t).length}</span></button>`).join("")}</div>
            <button class="btn btn-sm btn-primary" data-action="new-template">New template</button>
          </div>
          <div class="gallery">${list.map((t) => `
            <div class="g-card">
              ${tplCover(t)}
              <div class="g-body">
                <div class="g-title">${esc(t.name)}</div>
                <div class="g-meta">${tag(t.category, "brown")}${t.status === "published" ? tag("Published", "green") : tag("Draft", "gray")}<span class="muted small">${t.uses} sites</span></div>
                <div class="muted small">${esc(t.desc)}</div>
                <div class="g-actions">
                  <button class="btn btn-sm" data-action="edit-template" data-id="${t.id}">Customize</button>
                  <button class="btn btn-sm" data-action="toggle-template" data-id="${t.id}">${t.status === "published" ? "Unpublish" : "Publish"}</button>
                  <button class="icon-btn" data-action="duplicate-template" data-id="${t.id}" aria-label="Duplicate ${esc(t.name)}" title="Duplicate">⧉</button>
                  <button class="icon-btn" data-action="delete-template" data-id="${t.id}" aria-label="Delete ${esc(t.name)}" title="Delete">🗑</button>
                </div>
              </div>
            </div>`).join("")}
            <button class="g-card" data-action="new-template" style="display:grid;place-items:center;min-height:260px;color:var(--faint);border-style:dashed">＋ New template</button>
          </div>
        </div>`;
      },
    },

    payments: {
      title: "Payments",
      render: () => {
        const tabs = ["All", "Paid", "Due", "Failed"];
        const list = db.payments.filter((p) => payTab === "All" || p.status === payTab).sort((a, b) => new Date(b.date) - new Date(a.date));
        const collected = db.payments.filter((p) => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
        return `${pageHead("💰", "Payments", "Subscription invoices from your users.")}
          <div class="stats" style="grid-template-columns:repeat(3,1fr)">
            <div class="stat"><div class="stat-label">✅ Collected</div><div class="stat-value">${taka(collected)}</div></div>
            <div class="stat"><div class="stat-label">⏳ Due</div><div class="stat-value">${taka(db.payments.filter((p) => p.status === "Due").reduce((s, p) => s + p.amount, 0))}</div></div>
            <div class="stat"><div class="stat-label">⚠️ Failed</div><div class="stat-value">${taka(db.payments.filter((p) => p.status === "Failed").reduce((s, p) => s + p.amount, 0))}</div></div>
          </div>
          <div class="db-bar" style="margin-top:18px"><div class="db-tabs">${tabs.map((t) => `<button class="db-tab ${t === payTab ? "on" : ""}" data-action="pay-tab" data-tab="${t}">${t} <span class="muted small">${t === "All" ? db.payments.length : db.payments.filter((p) => p.status === t).length}</span></button>`).join("")}</div></div>
          <div class="table-wrap"><table class="table">
            <thead><tr><th>Invoice</th><th>Business</th><th>Plan</th><th>Method</th><th>Date</th><th class="t-right">Amount</th><th>Status</th><th class="t-actions"></th></tr></thead>
            <tbody>${list.map((p) => { const u = userById(p.user); return `
              <tr><td class="t-title">🧾 ${esc(p.invoice)}</td><td>${esc(u ? u.business : "Deleted user")}</td><td>${tag(planName(p.plan), PLAN_COLOR[p.plan])} <span class="muted small">${p.billing === "yearly" ? "Yearly" : "Monthly"}</span></td>
              <td>${esc(p.method)}</td><td class="muted">${day(p.date)}</td><td class="t-right">${taka(p.amount)}</td><td>${tag(p.status, PAY_COLOR[p.status])}</td>
              <td class="t-actions">${p.status === "Paid" ? "" : `<button class="btn btn-sm" data-action="mark-paid" data-id="${p.id}">Mark paid</button>`}</td></tr>`; }).join("") || `<tr><td colspan="8" class="table-empty">No invoices.</td></tr>`}</tbody>
          </table></div>
          <p class="muted small" style="margin-top:12px">Invoices are sample data until bKash, Nagad or card payments are connected.</p>
        </div>`;
      },
    },

    plans: {
      title: "Plans & pricing",
      render: () => `${pageHead("🏷️", "Plans & pricing", "Change plan prices and limits. Leave a limit empty for <b>Unlimited</b>. User dashboards on this browser pick up changes straight away.")}
        <form id="plans-form">
          <div class="table-wrap"><table class="table">
            <thead><tr><th>Plan</th><th>Price per month (৳)</th><th>Pages</th><th>Products</th><th class="t-right">Users</th></tr></thead>
            <tbody>${Object.entries(db.plans).map(([id, p]) => `
              <tr><td class="t-title">${tag(p.name, PLAN_COLOR[id])}</td>
              <td><input class="input" name="${id}_price" type="number" min="0" value="${p.price}" style="width:130px" aria-label="${esc(p.name)} price"></td>
              <td><input class="input" name="${id}_pages" type="number" min="1" value="${p.pages ?? ""}" placeholder="Unlimited" style="width:120px" aria-label="${esc(p.name)} pages"></td>
              <td><input class="input" name="${id}_products" type="number" min="1" value="${p.products ?? ""}" placeholder="Unlimited" style="width:120px" aria-label="${esc(p.name)} products"></td>
              <td class="t-right">${db.users.filter((u) => u.plan === id).length}</td></tr>`).join("")}</tbody>
          </table></div>
          <div class="callout"><span class="ico">🎁</span><div>Every plan includes a free website, free CMS access and free support. Yearly Business and Pro plans include a free custom domain.</div></div>
          <button class="btn btn-primary" type="submit">Save prices &amp; limits</button>
        </form>
        <p class="muted small" style="margin-top:12px">The public Pricing page is part of the website code, so update it too when you change prices.</p>
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
      render: () => `${pageHead("🕒", "Activity", "Everything that happened across Shopiliar, newest first.")}
        <ul class="todo">${db.activity.map((a) => `<li><span class="muted small" style="width:110px;flex:none">${day(a.date)}</span><span>${esc(a.text)}</span></li>`).join("") || '<li class="muted">Nothing yet.</li>'}</ul>
      </div>`,
    },

    settings: {
      title: "Settings",
      render: () => {
        const s = db.settings;
        return `${pageHead("⚙️", "Settings", "Company details and platform switches.")}
          <div class="callout red"><span class="ico">🔒</span><div><b>Protect this page before real data goes in.</b> Anyone who knows the address can open /master-admin. In Cloudflare, open your <b>shopiliar</b> Worker → <b>Access</b> (Cloudflare Zero Trust) and add an application for <b>/master-admin*</b> that only allows your email. It's free.</div></div>
          <form id="settings-form">
            <h2 class="h2">🏢 Company</h2>
            <div class="row">
              <div class="field"><label for="c-name">Company name</label><input class="input" id="c-name" name="company" value="${esc(s.company)}"></div>
              <div class="field"><label for="c-email">Support email</label><input class="input" id="c-email" name="supportEmail" type="email" value="${esc(s.supportEmail)}"></div>
              <div class="field"><label for="c-phone">Support phone</label><input class="input" id="c-phone" name="supportPhone" value="${esc(s.supportPhone)}" placeholder="01XXX-XXXXXX"></div>
            </div>
            <h2 class="h2">🎛 Platform</h2>
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><div><div>Allow new sign-ups</div><div class="muted small">Turn off to pause new accounts.</div></div><label class="switch"><input type="checkbox" name="signups" ${s.signups ? "checked" : ""} aria-label="Allow new sign-ups"><i></i></label></div>
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><div><div>Maintenance mode</div><div class="muted small">Show a “back soon” message to users.</div></div><label class="switch"><input type="checkbox" name="maintenance" ${s.maintenance ? "checked" : ""} aria-label="Maintenance mode"><i></i></label></div>
            <div style="margin-top:20px"><button class="btn btn-primary" type="submit">Save settings</button></div>
          </form>
          <h2 class="h2" style="color:var(--danger)">Danger zone</h2>
          <div class="callout red"><span class="ico">🧹</span><div style="flex:1">Reset all master data in this browser (users, templates, payments, plans) back to the sample data.</div><button class="btn btn-sm btn-danger" data-action="reset-all">Reset data</button></div>
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
    body: `${u ? `<p class="muted small" style="margin-bottom:12px">Joined ${day(u.joined)} · ${esc(u.site)} · ${u.products} products · ${u.published ? "website live" : "website not published"}</p>` : ""}
      <div class="row"><div class="field"><label>Owner name</label><input class="input" name="name" required value="${esc(u?.name)}"></div>
      <div class="field"><label>Business name</label><input class="input" name="business" required value="${esc(u?.business)}"></div></div>
      <div class="row"><div class="field"><label>Email</label><input class="input" type="email" name="email" required value="${esc(u?.email)}"></div>
      <div class="field"><label>Phone</label><input class="input" name="phone" value="${esc(u?.phone)}"></div></div>
      <div class="row"><div class="field"><label>Plan</label><select class="select" name="plan">${Object.entries(db.plans).map(([id, p]) => `<option value="${id}"${u?.plan === id ? " selected" : ""}>${esc(p.name)} — ${taka(p.price)}/mo</option>`).join("")}</select></div>
      <div class="field"><label>Billing</label><select class="select" name="billing"><option value="monthly">Monthly</option><option value="yearly"${u?.billing === "yearly" ? " selected" : ""}>Yearly</option></select></div></div>
      <div class="row"><div class="field"><label>Template</label><select class="select" name="template">${db.templates.map((t) => `<option value="${t.id}"${u?.template === t.id ? " selected" : ""}>${esc(t.name)}</option>`).join("")}</select></div>
      <div class="field"><label>Status</label><select class="select" name="status"><option value="active">Active</option><option value="suspended"${u?.status === "suspended" ? " selected" : ""}>Suspended</option></select></div></div>`,
    submit: u ? "Save changes" : "Add user",
    onSubmit: (v) => {
      if (u) {
        if (u.plan !== v.plan) log(`${u.business} moved from ${planName(u.plan)} to ${planName(v.plan)}`);
        Object.assign(u, v);
      } else {
        const site = v.business.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".shopiliar.com";
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
          <div class="field"><label>Layout</label><select class="select" name="layout"><option value="split">Text + picture side by side</option><option value="center"${draft.layout === "center" ? " selected" : ""}>Centered</option><option value="bleed"${draft.layout === "bleed" ? " selected" : ""}>Full-width picture</option></select></div>
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
  const actions = {
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
      if (!(await confirm("Reset all data?", "Users, templates, payments, plans and settings in this browser go back to the sample data.", "Reset data"))) return;
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
  view.addEventListener("input", (e) => {
    if (e.target.dataset.action !== "user-search") return;
    userSearch = e.target.value;
    const pos = e.target.selectionStart;
    go();
    const again = view.querySelector('[data-action="user-search"]');
    again.focus(); again.setSelectionRange(pos, pos);
  });

  save(KEY, db);
  chrome();
  rerender = router(routes, "overview");
})();
