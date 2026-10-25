// Local Business dashboard: appointments, services, clients and opening hours.
// Loaded before app.js, which calls seed() for a new store and build(ctx) once its helpers exist.
window.ShopilierDash = window.ShopilierDash || {};
window.ShopilierDash.local = (() => {
  const STATUS = ["Booked", "Confirmed", "Completed", "Cancelled", "No-show"];
  const OPEN = (s) => s !== "Cancelled" && s !== "No-show";
  const DAYS = [["sat", "Saturday"], ["sun", "Sunday"], ["mon", "Monday"], ["tue", "Tuesday"], ["wed", "Wednesday"], ["thu", "Thursday"], ["fri", "Friday"]];
  const DAY_KEY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]; // Date.getDay() order
  const COLORS = ["#c8e6c9", "#bbdefb", "#ffe0b2", "#e1bee7", "#ffccbc", "#b2dfdb", "#f8bbd0", "#d7ccc8"];

  const seed = () => ({
    services: [], appointments: [], clients: [],
    // Bangladesh week: open Saturday to Thursday, closed Friday
    hours: Object.fromEntries(DAYS.map(([k]) => [k, { closed: k === "fri", open: "10:00", close: "20:00" }])),
    booking: { slot: 30 },
  });

  const build = (ctx) => {
    const { store, account, esc, taka, uid, day, avatar, icon, toast, dialog, confirm, bars, head, delta, inPeriod, lineChart, searchBox, persist, go } = ctx;
    store.services ||= []; store.appointments ||= []; store.clients ||= [];
    store.hours ||= seed().hours; store.booking ||= { slot: 30 };

    let apptTab = "Upcoming", apptSearch = "", clientSearch = "";
    const now = () => Date.now();
    const dayStart = (t = now()) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
    const when = (a) => new Date(a.date);
    const timeText = (a) => when(a).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const dateText = (a) => when(a).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    const isToday = (a) => when(a).getTime() >= dayStart() && when(a).getTime() < dayStart() + 864e5;
    const value = (list) => list.filter((a) => OPEN(a.status)).reduce((s, a) => s + (Number(a.price) || 0), 0);
    const pill = (s) => `<span class="pill ${esc(s)}">${esc(s)}</span>`;
    const statusSelect = (a) => `<select class="select" style="height:32px;width:auto;font-size:13px" data-action="appt-status" data-id="${a.id}" aria-label="Appointment status">${STATUS.map((s) => `<option${s === a.status ? " selected" : ""}>${s}</option>`).join("")}</select>`;
    const sorted = (list, dir = 1) => [...list].sort((a, b) => dir * (when(a) - when(b)));
    const upcoming = () => sorted(store.appointments.filter((a) => when(a).getTime() >= now() && OPEN(a.status)));
    const visits = (c) => store.appointments.filter((a) => a.client.toLowerCase() === c.name.toLowerCase() && OPEN(a.status));
    const hoursFor = (date) => store.hours[DAY_KEY[date.getDay()]];
    const outsideHours = (date) => {
      const h = hoursFor(date);
      const hm = date.toTimeString().slice(0, 5);
      return h.closed || hm < h.open || hm >= h.close;
    };

    const apptRows = (list, compact = false) => list.length ? list.map((a) => `
      <tr>
        <td><b style="color:var(--ink)">${esc(timeText(a))}</b><span class="sub">${esc(dateText(a))}</span></td>
        <td><span class="t-title" style="font-weight:500">${avatar(a.client, "sm")}${esc(a.client)}</span>${a.phone && !compact ? `<span class="sub">${esc(a.phone)}</span>` : ""}</td>
        <td>${esc(a.service)}<span class="sub">${a.duration} min</span></td>
        <td class="t-right" style="font-weight:600;color:var(--ink)">${taka(a.price)}</td>
        <td>${compact ? pill(a.status) : statusSelect(a)}</td>
        ${compact ? "" : `<td class="t-actions"><button class="icon-btn danger" data-action="delete-appt" data-id="${a.id}" aria-label="Delete appointment">${icon("trash")}</button></td>`}
      </tr>`).join("") : `<tr><td colspan="6" class="table-empty">No appointments here yet.</td></tr>`;
    const apptTable = (list, compact) => `<div class="table-wrap"><table class="table">
      <thead><tr><th>When</th><th>Client</th><th>Service</th><th class="t-right">Price</th><th>Status</th>${compact ? "" : '<th class="t-actions"></th>'}</tr></thead>
      <tbody>${apptRows(list, compact)}</tbody></table></div>`;

    const routes = {
      home: {
        title: "Home",
        render: () => {
          const r = ctx.range(), span = r * 864e5, t = now();
          const cur = inPeriod(store.appointments, t - span, t), prev = inPeriod(store.appointments, t - 2 * span, t - span);
          const joined = (from, to) => store.clients.filter((c) => { const j = new Date(c.joined).getTime(); return j >= from && j < to; }).length;
          const vs = `<span class="muted">vs. previous ${r} days</span>`;
          const stat = (label, val, ico, color, d) => `<div class="stat"><div class="stat-top"><span class="stat-label">${label}</span><span class="stat-ico ${color}">${icon(ico)}</span></div><div class="stat-value">${val}</div><div class="stat-delta">${d}</div></div>`;
          const today = sorted(store.appointments.filter(isToday));
          const week = upcoming().filter((a) => when(a).getTime() < t + 7 * 864e5);
          const top = {};
          store.appointments.filter((a) => OPEN(a.status)).forEach((a) => { const s = top[a.service] || (top[a.service] = { n: 0, v: 0 }); s.n++; s.v += Number(a.price) || 0; });
          const topList = Object.entries(top).sort((a, b) => b[1].n - a[1].n).slice(0, 4);
          return `${head(`Welcome back, ${esc(account.name.split(" ")[0])}`, "Here's what's happening at your business today.",
            `<label class="range">${icon("calendar")}<select data-action="range" aria-label="Date range">${[7, 30, 90].map((d) => `<option value="${d}"${d === r ? " selected" : ""}>Last ${d} days</option>`).join("")}</select>${icon("chevronDown")}</label>
             <button class="btn btn-primary" data-action="add-appt">${icon("plus")}New appointment</button>`)}
            ${store.services.length ? "" : `<div class="callout blue"><span class="ico">${icon("info")}</span><div><b>Add your services first.</b> Customers pick a service when they book, like “Haircut · 30 min · ৳300”.</div><a class="btn btn-sm btn-dark" href="#/services">Add services</a></div>`}
            ${store.published ? "" : `<div class="callout yellow"><span class="ico">${icon("rocket")}</span><div><b>Your website isn't live yet.</b> Publish it so customers can find you and book.</div><a class="btn btn-sm btn-dark" href="#/website">Customize &amp; publish</a></div>`}
            <div class="stats">
              ${stat("Bookings", cur.filter((a) => OPEN(a.status)).length, "calendar", "c2", delta(cur.filter((a) => OPEN(a.status)).length, prev.filter((a) => OPEN(a.status)).length) + vs)}
              ${stat("Booking value", taka(value(cur)), "money", "c1", delta(value(cur), value(prev)) + vs)}
              ${stat("New clients", joined(t - span, t), "customers", "c4", delta(joined(t - span, t), joined(t - 2 * span, t - span)) + vs)}
              ${stat("Next 7 days", week.length, "clock", "c3", `<span class="muted">${week.length === 1 ? "appointment" : "appointments"} coming up</span>`)}
            </div>
            <div class="home-grid">
              <div class="home-main">
                <div class="card"><div class="card-head"><span class="card-title">Booking value</span><a class="btn" href="#/analytics">View report</a></div>
                  <div class="card-body">
                    <div class="sales-top"><span class="sales-total">${taka(value(cur))}</span><span class="stat-delta" style="margin:0">${delta(value(cur), value(prev))}${vs}</span>
                      <span class="legend"><span><i></i>This period</span><span><i class="prev"></i>Previous period</span></span></div>
                    ${lineChart(t, span, (from, to) => value(inPeriod(store.appointments, from, to)))}
                  </div></div>
                <div class="card"><div class="card-head"><span class="card-title">Upcoming appointments</span><a class="link" href="#/appointments">View all</a></div>
                  ${apptTable(upcoming().slice(0, 5), true)}</div>
              </div>
              <div class="home-side">
                <div class="card"><div class="card-head"><span class="card-title">Today's schedule</span><span class="muted small">${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}</span></div>
                  <div class="card-body">${today.length ? `<ul class="top-list">${today.map((a) => `<li><span class="top-img" style="background:var(--active);color:var(--accent);font-weight:700;font-size:12px;width:62px">${esc(timeText(a))}</span><span class="t"><b>${esc(a.client)}</b><span>${esc(a.service)}</span></span>${pill(a.status)}</li>`).join("")}</ul>`
                    : `<p class="empty-note">No appointments today. ${hoursFor(new Date()).closed ? "You're closed today." : ""}</p>`}</div></div>
                <div class="card"><div class="card-head"><span class="card-title">Top services</span><a class="link" href="#/services">View all</a></div>
                  <div class="card-body">${topList.length ? `<ul class="top-list">${topList.map(([n, s], i) => `<li><span class="top-img" style="background:${COLORS[i % COLORS.length]}">${icon("tag")}</span><span class="t"><b>${esc(n)}</b><span>${s.n} ${s.n === 1 ? "booking" : "bookings"}</span></span><span class="v">${taka(s.v)}</span></li>`).join("")}</ul>`
                    : `<p class="empty-note">Your most booked services will show here.</p>`}</div></div>
                <div class="card"><div class="card-head"><a class="card-title card-title-link" href="#/marketing">Marketing${icon("chevronRight")}</a></div>
                  <div class="card-body"><div class="mk-list">
                    <button class="mk-item" data-action="add-discount"><span class="mk-ico">${icon("tag")}</span><span class="t"><b>Create discount</b><span>Fill quiet days with an offer</span></span>${icon("chevronRight")}</button>
                    <a class="mk-item" href="#/marketing"><span class="mk-ico">${icon("megaphone")}</span><span class="t"><b>Create ad campaign</b><span>Reach people near you</span></span>${icon("chevronRight")}</a>
                  </div></div></div>
              </div>
            </div>
          </div>`;
        },
      },

      appointments: {
        title: "Appointments",
        render: () => {
          const t = now(), q = apptSearch.toLowerCase();
          const groups = {
            Upcoming: upcoming(),
            Today: sorted(store.appointments.filter(isToday)),
            Past: sorted(store.appointments.filter((a) => when(a).getTime() < t && OPEN(a.status)), -1),
            Cancelled: sorted(store.appointments.filter((a) => !OPEN(a.status)), -1),
          };
          const list = groups[apptTab].filter((a) => !q || (a.client + " " + a.service + " " + (a.phone || "")).toLowerCase().includes(q));
          return `${head("Appointments", "Every booking, from today's schedule to past visits. Change a status right in the table.", `<button class="btn btn-primary" data-action="add-appt">${icon("plus")}New appointment</button>`)}
            <div class="card">
              <div class="card-head"><div class="seg" style="margin-right:auto">${Object.keys(groups).map((g) => `<button class="${g === apptTab ? "on" : ""}" data-action="appt-tab" data-tab="${g}">${g} <span>${groups[g].length}</span></button>`).join("")}</div>
                ${searchBox("appt-search", apptSearch, "Search client or service")}</div>
              ${apptTable(list, false)}
            </div></div>`;
        },
      },

      services: {
        title: "Services",
        render: () => `${head("Services", "What customers can book, with how long it takes and the price.", `<button class="btn btn-primary" data-action="add-service">${icon("plus")}Add service</button>`)}
          <div class="card"><div class="table-wrap"><table class="table">
            <thead><tr><th>Service</th><th>Duration</th><th class="t-right">Price</th><th>Bookable</th><th class="t-actions"></th></tr></thead>
            <tbody>${store.services.length ? store.services.map((s, i) => `<tr>
              <td><span class="t-title"><span class="thumb" style="background:${COLORS[i % COLORS.length]};width:30px;height:30px"></span>${esc(s.name)}</span>${s.desc ? `<span class="sub">${esc(s.desc)}</span>` : ""}</td>
              <td>${s.duration} min</td>
              <td class="t-right" style="font-weight:600;color:var(--ink)">${taka(s.price)}</td>
              <td><label class="switch" title="${s.active ? "Customers can book this" : "Hidden from booking"}"><input type="checkbox" data-action="service-active" data-id="${s.id}" ${s.active ? "checked" : ""} aria-label="Bookable"><i></i></label></td>
              <td class="t-actions"><button class="icon-btn" data-action="edit-service" data-id="${s.id}" aria-label="Edit service">${icon("edit")}</button><button class="icon-btn danger" data-action="delete-service" data-id="${s.id}" aria-label="Delete service">${icon("trash")}</button></td>
            </tr>`).join("") : `<tr><td colspan="5" class="table-empty">No services yet. Add what you offer, like “Haircut”, “AC repair” or “Doctor consultation”.</td></tr>`}</tbody>
          </table></div></div>
          <form class="card" id="hours-form" style="margin-top:18px">
            <div class="card-head"><span class="card-title">Opening hours</span><span class="muted small">Bookings outside these hours are flagged</span></div>
            <div class="card-body" style="padding-top:4px">
              ${DAYS.map(([k, label]) => { const h = store.hours[k]; return `<div class="set-row">
                <span style="min-width:110px;font-weight:500;color:var(--ink)">${label}</span>
                <span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end">
                  <input class="input" type="time" name="${k}_open" value="${esc(h.open)}" style="width:140px" aria-label="${label} opens" ${h.closed ? "disabled" : ""}>
                  <span class="muted">to</span>
                  <input class="input" type="time" name="${k}_close" value="${esc(h.close)}" style="width:140px" aria-label="${label} closes" ${h.closed ? "disabled" : ""}>
                  <label class="check" style="margin-left:6px"><input type="checkbox" name="${k}_closed" data-action="day-closed" ${h.closed ? "checked" : ""}> Closed</label>
                </span></div>`; }).join("")}
              <div class="set-row"><span>Time between booking slots</span>
                <select class="select" name="slot" style="width:auto">${[15, 30, 45, 60].map((m) => `<option value="${m}"${m === store.booking.slot ? " selected" : ""}>${m} minutes</option>`).join("")}</select></div>
              <div style="display:flex;justify-content:flex-end;margin-top:12px"><button class="btn btn-primary" type="submit">Save hours</button></div>
            </div>
          </form></div>`,
        mount: (view) => {
          view.querySelector("#hours-form").addEventListener("submit", (e) => {
            e.preventDefault();
            const f = e.target.elements;
            DAYS.forEach(([k]) => { store.hours[k] = { closed: f[k + "_closed"].checked, open: f[k + "_open"].value || "10:00", close: f[k + "_close"].value || "20:00" }; });
            store.booking.slot = Number(f.slot.value) || 30;
            persist(); toast("Opening hours saved");
          });
        },
      },

      clients: {
        title: "Clients",
        render: () => {
          const q = clientSearch.toLowerCase();
          const list = store.clients.filter((c) => !q || (c.name + " " + (c.phone || "") + " " + (c.email || "")).toLowerCase().includes(q));
          return `${head("Clients", "Everyone who has booked with you.", `<button class="btn btn-primary" data-action="add-client">${icon("plus")}Add client</button>`)}
            <div class="card"><div class="card-head"><span class="card-title">All clients<small>${store.clients.length}</small></span>${searchBox("client-search", clientSearch, "Search clients")}</div>
              <div class="table-wrap"><table class="table">
                <thead><tr><th>Client</th><th>Phone</th><th>Visits</th><th>Last visit</th><th class="t-right">Spent</th><th class="t-actions"></th></tr></thead>
                <tbody>${list.length ? list.map((c) => { const v = visits(c); const past = v.filter((a) => when(a).getTime() < now()); const last = sorted(past, -1)[0]; return `<tr>
                  <td><span class="t-title">${avatar(c.name, "sm")}${esc(c.name)}</span>${c.email ? `<span class="sub">${esc(c.email)}</span>` : ""}</td>
                  <td class="muted">${esc(c.phone || "—")}</td><td>${v.length}</td><td class="muted">${last ? day(last.date) : "—"}</td>
                  <td class="t-right" style="font-weight:600;color:var(--ink)">${taka(value(past))}</td>
                  <td class="t-actions"><button class="icon-btn" data-action="book-client" data-id="${c.id}" aria-label="Book ${esc(c.name)}" title="New appointment">${icon("calendar")}</button><button class="icon-btn danger" data-action="delete-client" data-id="${c.id}" aria-label="Delete client">${icon("trash")}</button></td>
                </tr>`; }).join("") : `<tr><td colspan="6" class="table-empty">${store.clients.length ? "No clients match." : "Clients are added automatically when you book them."}</td></tr>`}</tbody>
              </table></div></div></div>`;
        },
      },

      analytics: {
        title: "Analytics",
        render: () => {
          const all = store.appointments, done = all.filter((a) => a.status === "Completed"), noShow = all.filter((a) => a.status === "No-show");
          const month = inPeriod(all, now() - 30 * 864e5, now() + 30 * 864e5).filter((a) => OPEN(a.status));
          const weekdays = DAY_KEY.map((k, i) => ({ label: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i], v: month.filter((a) => when(a).getDay() === i).length }));
          const hours = Array.from({ length: 13 }, (_, i) => i + 8).map((h) => ({ label: (h > 12 ? h - 12 : h) + (h >= 12 ? "p" : "a"), v: month.filter((a) => when(a).getHours() === h).length }));
          const top = {};
          all.filter((a) => OPEN(a.status)).forEach((a) => { top[a.service] = (top[a.service] || 0) + (Number(a.price) || 0); });
          const topList = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 6);
          const stat = (label, v, ico, c, d) => `<div class="stat"><div class="stat-top"><span class="stat-label">${label}</span><span class="stat-ico ${c}">${icon(ico)}</span></div><div class="stat-value">${v}</div><div class="stat-delta">${d}</div></div>`;
          return `${head("Analytics", "When people book and what they book.")}
            <div class="stats">
              ${stat("Booking value", taka(value(all)), "money", "c1", "All time")}
              ${stat("Bookings", all.filter((a) => OPEN(a.status)).length, "calendar", "c2", `${done.length} completed`)}
              ${stat("Clients", store.clients.length, "customers", "c4", "All time")}
              ${stat("No-show rate", (all.length ? Math.round((noShow.length / all.length) * 100) : 0) + "%", "alert", "c3", `${noShow.length} no-shows`)}
            </div>
            <div class="grid-2" style="margin-top:18px">
              <div class="card"><div class="card-head"><span class="card-title">Busiest days<small>last 30 &amp; next 30 days</small></span></div><div class="card-body">${bars(weekdays)}</div></div>
              <div class="card"><div class="card-head"><span class="card-title">Busiest hours</span></div><div class="card-body">${bars(hours)}</div></div>
            </div>
            <div class="card" style="margin-top:18px"><div class="card-head"><span class="card-title">Top services</span></div><div class="table-wrap"><table class="table" style="min-width:0"><thead><tr><th>Service</th><th class="t-right">Booking value</th></tr></thead>
              <tbody>${topList.map(([n, v]) => `<tr><td class="t-title">${esc(n)}</td><td class="t-right">${taka(v)}</td></tr>`).join("") || '<tr><td colspan="2" class="table-empty">No bookings yet</td></tr>'}</tbody></table></div></div>
          </div>`;
        },
      },
    };

    const serviceDialog = (s) => dialog({
      title: s ? "Edit service" : "Add service",
      body: `<div class="field"><label>Service name</label><input class="input" name="name" required maxlength="60" placeholder="e.g. Haircut, AC servicing, Consultation" value="${esc(s?.name)}"></div>
        <div class="row"><div class="field"><label>Duration</label><select class="select" name="duration">${[15, 30, 45, 60, 90, 120, 180].map((m) => `<option value="${m}"${m === (s?.duration ?? 30) ? " selected" : ""}>${m < 60 ? m + " min" : m / 60 + (m === 60 ? " hour" : " hours")}</option>`).join("")}</select></div>
        <div class="field"><label>Price (৳)</label><input class="input" name="price" type="number" min="0" step="1" required value="${esc(s?.price ?? "")}"></div></div>
        <div class="field"><label>Short description (optional)</label><input class="input" name="desc" maxlength="120" value="${esc(s?.desc)}"></div>`,
      submit: s ? "Save" : "Add service",
      onSubmit: (v) => {
        const data = { name: v.name, duration: Number(v.duration) || 30, price: Math.max(0, Number(v.price) || 0), desc: v.desc };
        if (s) Object.assign(s, data); else store.services.push({ id: uid("s"), active: true, created: new Date().toISOString(), ...data });
        persist(); go(); toast(s ? "Service saved" : "Service added");
      },
    });

    const apptDialog = (client) => {
      const services = store.services.filter((s) => s.active);
      if (!services.length) { toast("Add a service first"); location.hash = "#/services"; return; }
      const d = new Date(Date.now() + 60 * 6e4); d.setMinutes(Math.ceil(d.getMinutes() / store.booking.slot) * store.booking.slot, 0, 0);
      const pad = (n) => String(n).padStart(2, "0");
      const dateVal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, timeVal = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      dialog({
        title: "New appointment",
        body: `<div class="row"><div class="field"><label>Client name</label><input class="input" name="client" required maxlength="60" list="client-list" value="${esc(client?.name)}"><datalist id="client-list">${store.clients.map((c) => `<option value="${esc(c.name)}">`).join("")}</datalist></div>
          <div class="field"><label>Phone</label><input class="input" name="phone" placeholder="01XXX-XXXXXX" value="${esc(client?.phone)}"></div></div>
          <div class="field"><label>Service</label><select class="select" name="service">${services.map((s) => `<option value="${s.id}">${esc(s.name)} — ${s.duration} min · ${taka(s.price)}</option>`).join("")}</select></div>
          <div class="row"><div class="field"><label>Date</label><input class="input" type="date" name="date" required value="${dateVal}"></div>
          <div class="field"><label>Time</label><input class="input" type="time" name="time" required value="${timeVal}" step="${store.booking.slot * 60}"></div></div>
          <div class="row"><div class="field"><label>Status</label><select class="select" name="status">${STATUS.slice(0, 2).map((s) => `<option>${s}</option>`).join("")}</select></div>
          <div class="field"><label>Notes (optional)</label><input class="input" name="notes" maxlength="200"></div></div>`,
        submit: "Book appointment",
        onSubmit: (v) => {
          const s = store.services.find((x) => x.id === v.service);
          const at = new Date(`${v.date}T${v.time}`);
          if (isNaN(at)) { toast("Pick a date and time"); return false; }
          const number = Math.max(100, ...store.appointments.map((a) => a.number || 0)) + 1;
          store.appointments.push({ id: uid("a"), number, client: v.client, phone: v.phone, service: s.name, duration: s.duration, price: s.price, date: at.toISOString(), status: v.status, notes: v.notes, created: new Date().toISOString() });
          const known = store.clients.find((c) => c.name.toLowerCase() === v.client.toLowerCase());
          if (!known) store.clients.unshift({ id: uid("c"), name: v.client, phone: v.phone, email: "", joined: new Date().toISOString() });
          else if (v.phone && !known.phone) known.phone = v.phone;
          persist(); go();
          toast(outsideHours(at) ? `Booked — note: that's outside your opening hours` : `Booked ${s.name} for ${v.client}`);
        },
      });
    };

    const actions = {
      "add-appt": () => apptDialog(),
      "book-client": (el) => apptDialog(store.clients.find((c) => c.id === el.dataset.id)),
      "appt-tab": (el) => { apptTab = el.dataset.tab; go(); },
      "delete-appt": async (el) => {
        const a = store.appointments.find((x) => x.id === el.dataset.id);
        if (await confirm("Delete appointment?", `${a.client}'s ${a.service} on ${dateText(a)} will be deleted.`)) { store.appointments = store.appointments.filter((x) => x !== a); persist(); go(); }
      },
      "add-service": () => serviceDialog(),
      "edit-service": (el) => serviceDialog(store.services.find((s) => s.id === el.dataset.id)),
      "delete-service": async (el) => {
        const s = store.services.find((x) => x.id === el.dataset.id);
        if (await confirm("Delete service?", `“${s.name}” will no longer be bookable. Past appointments stay.`)) { store.services = store.services.filter((x) => x !== s); persist(); go(); }
      },
      "add-client": () => dialog({
        title: "Add client",
        body: `<div class="field"><label>Name</label><input class="input" name="name" required maxlength="60"></div>
          <div class="row"><div class="field"><label>Phone</label><input class="input" name="phone" placeholder="01XXX-XXXXXX"></div><div class="field"><label>Email</label><input class="input" name="email" type="email"></div></div>`,
        submit: "Add client",
        onSubmit: (v) => { store.clients.unshift({ id: uid("c"), ...v, joined: new Date().toISOString() }); persist(); go(); toast("Client added"); },
      }),
      "delete-client": async (el) => {
        const c = store.clients.find((x) => x.id === el.dataset.id);
        if (await confirm("Delete client?", `${c.name} will be removed from your client list. Their past appointments stay.`)) { store.clients = store.clients.filter((x) => x !== c); persist(); go(); }
      },
    };

    return {
      routes, actions,
      // Sidebar badge: appointments still to come today
      badge: () => store.appointments.filter((a) => isToday(a) && when(a).getTime() >= now() && OPEN(a.status)).length,
      siteItems: () => [store.services.filter((s) => s.active).map((s, i) => ({ name: s.name, price: s.price, color: COLORS[i % COLORS.length] })), "Services"],
      usage: () => [["Services", store.services.length, null]],
      search: (q) => { apptSearch = q; apptTab = "Upcoming"; if (location.hash === "#/appointments") go(); else location.hash = "#/appointments"; },
      onChange: (el) => {
        if (el.dataset.action === "appt-status") {
          const a = store.appointments.find((x) => x.id === el.dataset.id);
          a.status = el.value; persist(); toast(`${a.client}'s appointment marked ${a.status}`);
        }
        if (el.dataset.action === "service-active") {
          const s = store.services.find((x) => x.id === el.dataset.id);
          s.active = el.checked; persist(); toast(`${s.name} ${s.active ? "can be booked" : "is hidden from booking"}`);
        }
        if (el.dataset.action === "day-closed") {
          const row = el.closest(".set-row");
          row.querySelectorAll("input[type=time]").forEach((i) => { i.disabled = el.checked; });
        }
      },
      onInput: (el) => {
        if (el.dataset.action === "appt-search") { apptSearch = el.value; return true; }
        if (el.dataset.action === "client-search") { clientSearch = el.value; return true; }
        return false;
      },
    };
  };

  return { seed, build };
})();
