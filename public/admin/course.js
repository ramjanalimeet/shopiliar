// Course Selling dashboard: courses with lessons, students and enrollments (sales).
// Loaded before app.js, which calls seed() for a new store and build(ctx) once its helpers exist.
window.ShopilierDash = window.ShopilierDash || {};
window.ShopilierDash.course = (() => {
  const COLORS = ["#6d5dfc", "#0ea5e9", "#f97316", "#14b8a6", "#ec4899", "#84cc16", "#eab308", "#111827"];
  const PAYMENTS = ["bKash", "Nagad", "Card", "Cash"];

  const seed = () => ({ courses: [], students: [], enrollments: [] });

  const build = (ctx) => {
    const { store, account, plan, esc, taka, uid, day, avatar, icon, toast, dialog, confirm, bars, limitText, withinLimit, head, delta, inPeriod, lineChart, searchBox, usage, limitCallout, persist, go } = ctx;
    store.courses ||= []; store.students ||= []; store.enrollments ||= [];

    let studentSearch = "", saleSearch = "";
    const now = () => Date.now();
    const courseLimit = () => Dash.COURSE_LIMITS[account.plan] ?? Dash.COURSE_LIMITS.starter;
    const revenue = (list) => list.reduce((s, e) => s + (Number(e.price) || 0), 0);
    const minutes = (c) => c.lessons.reduce((s, l) => s + (Number(l.minutes) || 0), 0);
    const duration = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? (m % 60) + "m" : ""}`.trim() : `${m}m`);
    const studentsOf = (c) => store.enrollments.filter((e) => e.courseId === c.id).length;
    const progress = (p) => `<div style="display:flex;align-items:center;gap:8px;min-width:120px"><div class="progress" style="flex:1"><i style="width:${p}%"></i></div><span class="muted small">${p}%</span></div>`;
    const sortedSales = () => [...store.enrollments].sort((a, b) => new Date(b.date) - new Date(a.date));

    const saleRows = (list, compact = false) => list.length ? list.map((e) => `
      <tr>
        <td><span class="t-title" style="font-weight:500">${avatar(e.student, "sm")}${esc(e.student)}</span>${e.email && !compact ? `<span class="sub">${esc(e.email)}</span>` : ""}</td>
        <td>${esc(e.course)}</td>
        <td class="muted">${day(e.date)}</td>
        ${compact ? "" : `<td>${esc(e.payment)}</td>`}
        <td class="t-right" style="font-weight:600;color:var(--ink)">${taka(e.price)}</td>
        <td>${compact ? progress(e.progress) : `<select class="select" style="height:32px;width:auto;font-size:13px" data-action="enroll-progress" data-id="${e.id}" aria-label="Progress">${[0, 25, 50, 75, 100].map((p) => `<option value="${p}"${p === e.progress ? " selected" : ""}>${p === 100 ? "Completed" : p + "% done"}</option>`).join("")}</select>`}</td>
        ${compact ? "" : `<td class="t-actions"><button class="icon-btn danger" data-action="delete-sale" data-id="${e.id}" aria-label="Delete enrollment">${icon("trash")}</button></td>`}
      </tr>`).join("") : `<tr><td colspan="7" class="table-empty">No enrollments yet. They'll show here when students buy a course.</td></tr>`;
    const saleTable = (list, compact) => `<div class="table-wrap"><table class="table">
      <thead><tr><th>Student</th><th>Course</th><th>Date</th>${compact ? "" : "<th>Payment</th>"}<th class="t-right">Price</th><th>Progress</th>${compact ? "" : '<th class="t-actions"></th>'}</tr></thead>
      <tbody>${saleRows(list, compact)}</tbody></table></div>`;

    const routes = {
      home: {
        title: "Home",
        render: () => {
          const r = ctx.range(), span = r * 864e5, t = now();
          const cur = inPeriod(store.enrollments, t - span, t), prev = inPeriod(store.enrollments, t - 2 * span, t - span);
          const joined = (from, to) => store.students.filter((s) => { const j = new Date(s.joined).getTime(); return j >= from && j < to; }).length;
          const avg = store.enrollments.length ? Math.round(store.enrollments.reduce((s, e) => s + e.progress, 0) / store.enrollments.length) : 0;
          const vs = `<span class="muted">vs. previous ${r} days</span>`;
          const stat = (label, val, ico, color, d) => `<div class="stat"><div class="stat-top"><span class="stat-label">${label}</span><span class="stat-ico ${color}">${icon(ico)}</span></div><div class="stat-value">${val}</div><div class="stat-delta">${d}</div></div>`;
          const top = store.courses.map((c) => ({ c, n: studentsOf(c), v: revenue(store.enrollments.filter((e) => e.courseId === c.id)) })).sort((a, b) => b.v - a.v || b.n - a.n).slice(0, 4);
          return `${head(`Welcome back, ${esc(account.name.split(" ")[0])}`, "Here's how your courses are doing.",
            `<label class="range">${icon("calendar")}<select data-action="range" aria-label="Date range">${[7, 30, 90].map((d) => `<option value="${d}"${d === r ? " selected" : ""}>Last ${d} days</option>`).join("")}</select>${icon("chevronDown")}</label>
             <button class="btn btn-primary" data-action="add-sale">${icon("plus")}Record a sale</button>`)}
            ${store.courses.length ? "" : `<div class="callout blue"><span class="ico">${icon("info")}</span><div><b>Create your first course.</b> Give it a title and price, then add lessons.</div><button class="btn btn-sm btn-dark" data-action="add-course">Create course</button></div>`}
            ${store.published ? "" : `<div class="callout yellow"><span class="ico">${icon("rocket")}</span><div><b>Your website isn't live yet.</b> Publish it so students can find your courses.</div><a class="btn btn-sm btn-dark" href="#/website">Customize &amp; publish</a></div>`}
            <div class="stats">
              ${stat("Revenue", taka(revenue(cur)), "money", "c1", delta(revenue(cur), revenue(prev)) + vs)}
              ${stat("Enrollments", cur.length, "play", "c2", delta(cur.length, prev.length) + vs)}
              ${stat("New students", joined(t - span, t), "customers", "c4", delta(joined(t - span, t), joined(t - 2 * span, t - span)) + vs)}
              ${stat("Average progress", avg + "%", "check", "c3", `<span class="muted">across ${store.enrollments.length} ${store.enrollments.length === 1 ? "enrollment" : "enrollments"}</span>`)}
            </div>
            <div class="home-grid">
              <div class="home-main">
                <div class="card"><div class="card-head"><span class="card-title">Course sales</span><a class="btn" href="#/analytics">View report</a></div>
                  <div class="card-body">
                    <div class="sales-top"><span class="sales-total">${taka(revenue(cur))}</span><span class="stat-delta" style="margin:0">${delta(revenue(cur), revenue(prev))}${vs}</span>
                      <span class="legend"><span><i></i>This period</span><span><i class="prev"></i>Previous period</span></span></div>
                    ${lineChart(t, span, (from, to) => revenue(inPeriod(store.enrollments, from, to)))}
                  </div></div>
                <div class="card"><div class="card-head"><span class="card-title">Recent enrollments</span><a class="link" href="#/sales">View all</a></div>
                  ${saleTable(sortedSales().slice(0, 5), true)}</div>
              </div>
              <div class="home-side">
                <div class="card"><div class="card-head"><span class="card-title">Top courses</span><a class="link" href="#/courses">View all</a></div>
                  <div class="card-body">${top.length ? `<ul class="top-list">${top.map(({ c, n, v }) => `<li><span class="top-img" style="background:${esc(c.color)};color:#fff">${icon("play")}</span><span class="t"><b>${esc(c.title)}</b><span>${n} ${n === 1 ? "student" : "students"}</span></span><span class="v">${taka(v)}</span></li>`).join("")}</ul>`
                    : `<p class="empty-note">No courses yet. <a class="link" href="#" data-action="add-course">Create your first course</a></p>`}</div></div>
                <div class="card"><div class="card-head"><span class="card-title">Your plan</span></div>
                  <div class="card-body"><div class="meter"><div class="meter-top"><span>Courses</span><span class="muted">${store.courses.length} of ${limitText(courseLimit())}</span></div>
                    <div class="progress"><i style="width:${courseLimit() == null ? 4 : Math.min(100, (store.courses.length / courseLimit()) * 100)}%"></i></div></div>
                    <p class="muted small" style="margin-top:10px">Unlimited students on every plan.</p></div></div>
                <div class="card"><div class="card-head"><a class="card-title card-title-link" href="#/marketing">Marketing${icon("chevronRight")}</a></div>
                  <div class="card-body"><div class="mk-list">
                    <button class="mk-item" data-action="add-discount"><span class="mk-ico">${icon("tag")}</span><span class="t"><b>Create discount</b><span>Launch offer or early-bird price</span></span>${icon("chevronRight")}</button>
                    <a class="mk-item" href="#/marketing"><span class="mk-ico">${icon("megaphone")}</span><span class="t"><b>Connect your pixels</b><span>Track ads from YouTube, Facebook &amp; TikTok</span></span>${icon("chevronRight")}</a>
                  </div></div></div>
              </div>
            </div>
          </div>`;
        },
      },

      courses: {
        title: "Courses",
        render: () => {
          const lim = courseLimit(), canAdd = withinLimit(lim, store.courses.length);
          return `${head("Courses", "Your courses and their lessons.", `${usage("courses", store.courses.length, lim)}<button class="btn btn-primary" data-action="add-course" ${canAdd ? "" : "disabled"}>${icon("plus")}New course</button>`)}
            ${limitCallout("courses", store.courses.length, lim)}
            <div class="gallery">${store.courses.map((c) => `
              <div class="g-card">
                <div class="g-cover" style="background:linear-gradient(135deg, ${esc(c.color)}, ${esc(c.color)}cc);color:#fff"><span class="g-name">${esc(c.title)}</span>${c.status === "published" ? '<span class="tag green">Published</span>' : '<span class="tag gray">Draft</span>'}</div>
                <div class="g-body">
                  <div class="g-meta"><b style="color:var(--ink)">${taka(c.price)}</b><span class="muted small">${c.lessons.length} ${c.lessons.length === 1 ? "lesson" : "lessons"} · ${duration(minutes(c))}</span><span class="muted small">· ${studentsOf(c)} ${studentsOf(c) === 1 ? "student" : "students"}</span></div>
                  ${c.desc ? `<p class="muted small">${esc(c.desc)}</p>` : ""}
                  <div class="g-actions"><button class="btn btn-sm" data-action="lessons" data-id="${c.id}">${icon("list")}Lessons</button><button class="btn btn-sm" data-action="edit-course" data-id="${c.id}">${icon("edit")}Edit</button><button class="icon-btn danger" data-action="delete-course" data-id="${c.id}" aria-label="Delete course">${icon("trash")}</button></div>
                </div>
              </div>`).join("")}
              ${canAdd ? `<button class="g-new" data-action="add-course">${icon("plus")}New course</button>` : ""}
            </div></div>`;
        },
      },

      students: {
        title: "Students",
        render: () => {
          const q = studentSearch.toLowerCase();
          const list = store.students.filter((s) => !q || (s.name + " " + (s.email || "") + " " + (s.phone || "")).toLowerCase().includes(q));
          return `${head("Students", "Everyone who has bought one of your courses.", `<button class="btn btn-primary" data-action="add-student">${icon("plus")}Add student</button>`)}
            <div class="card"><div class="card-head"><span class="card-title">All students<small>${store.students.length}</small></span>${searchBox("student-search", studentSearch, "Search students")}</div>
              <div class="table-wrap"><table class="table">
                <thead><tr><th>Student</th><th>Phone</th><th>Courses</th><th>Joined</th><th class="t-right">Spent</th><th class="t-actions"></th></tr></thead>
                <tbody>${list.length ? list.map((s) => { const es = store.enrollments.filter((e) => e.student.toLowerCase() === s.name.toLowerCase()); return `<tr>
                  <td><span class="t-title">${avatar(s.name, "sm")}${esc(s.name)}</span>${s.email ? `<span class="sub">${esc(s.email)}</span>` : ""}</td>
                  <td class="muted">${esc(s.phone || "—")}</td><td>${es.length}</td><td class="muted">${day(s.joined)}</td>
                  <td class="t-right" style="font-weight:600;color:var(--ink)">${taka(revenue(es))}</td>
                  <td class="t-actions"><button class="icon-btn danger" data-action="delete-student" data-id="${s.id}" aria-label="Delete student">${icon("trash")}</button></td>
                </tr>`; }).join("") : `<tr><td colspan="6" class="table-empty">${store.students.length ? "No students match." : "Students are added automatically when you record a sale."}</td></tr>`}</tbody>
              </table></div></div></div>`;
        },
      },

      sales: {
        title: "Sales",
        render: () => {
          const q = saleSearch.toLowerCase();
          const list = sortedSales().filter((e) => !q || (e.student + " " + e.course + " " + (e.email || "")).toLowerCase().includes(q));
          return `${head("Sales", "Every course enrollment and how far each student has got.", `<button class="btn btn-primary" data-action="add-sale">${icon("plus")}Record a sale</button>`)}
            <div class="card"><div class="card-head"><span class="card-title">Enrollments<small>${store.enrollments.length} · ${taka(revenue(store.enrollments))}</small></span>${searchBox("sale-search", saleSearch, "Search student or course")}</div>
              ${saleTable(list, false)}</div></div>`;
        },
      },

      analytics: {
        title: "Analytics",
        render: () => {
          const all = store.enrollments, done = all.filter((e) => e.progress === 100);
          const week = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now() - (6 - i) * 864e5);
            const v = revenue(all.filter((e) => new Date(e.date).toDateString() === d.toDateString()));
            return { label: d.toLocaleDateString("en-GB", { weekday: "short" }), v, text: taka(v) };
          });
          const byCourse = store.courses.map((c) => ({ label: c.title.length > 10 ? c.title.slice(0, 9) + "…" : c.title, v: revenue(all.filter((e) => e.courseId === c.id)) }));
          const stat = (label, v, ico, c, d) => `<div class="stat"><div class="stat-top"><span class="stat-label">${label}</span><span class="stat-ico ${c}">${icon(ico)}</span></div><div class="stat-value">${v}</div><div class="stat-delta">${d}</div></div>`;
          return `${head("Analytics", "Which courses sell and whether students finish them.")}
            <div class="stats">
              ${stat("Revenue", taka(revenue(all)), "money", "c1", "All time")}
              ${stat("Enrollments", all.length, "play", "c2", "All time")}
              ${stat("Students", store.students.length, "customers", "c4", "All time")}
              ${stat("Completion rate", (all.length ? Math.round((done.length / all.length) * 100) : 0) + "%", "check", "c3", `${done.length} finished`)}
            </div>
            <div class="grid-2" style="margin-top:18px">
              <div class="card"><div class="card-head"><span class="card-title">Sales<small>last 7 days</small></span><span class="muted">${taka(week.reduce((a, b) => a + b.v, 0))}</span></div><div class="card-body">${bars(week)}</div></div>
              <div class="card"><div class="card-head"><span class="card-title">Revenue by course</span></div><div class="card-body">${byCourse.length ? bars(byCourse.map((b) => ({ ...b, text: taka(b.v) }))) : '<p class="empty-note">Create a course to see this.</p>'}</div></div>
            </div>
          </div>`;
        },
      },
    };

    const courseDialog = (c) => dialog({
      title: c ? "Edit course" : "New course",
      body: `<div class="field"><label>Course title</label><input class="input" name="title" required maxlength="60" placeholder="e.g. Spoken English in 30 Days" value="${esc(c?.title)}"></div>
        <div class="row"><div class="field"><label>Price (৳)</label><input class="input" name="price" type="number" min="0" step="1" required value="${esc(c?.price ?? "")}"></div>
        <div class="field"><label>Status</label><select class="select" name="status"><option value="published">Published</option><option value="draft"${c?.status === "draft" ? " selected" : ""}>Draft (hidden)</option></select></div></div>
        <div class="field"><label>Short description (optional)</label><input class="input" name="desc" maxlength="140" value="${esc(c?.desc)}"></div>
        <div class="field"><label>Cover color</label><div style="display:flex;gap:8px">${COLORS.map((col, i) => `<label style="cursor:pointer"><input type="radio" name="color" value="${col}" ${(c ? c.color === col : i === 0) ? "checked" : ""} style="accent-color:${col}"> <span style="display:inline-block;width:20px;height:20px;border-radius:5px;background:${col};vertical-align:middle"></span></label>`).join("")}</div></div>`,
      submit: c ? "Save" : "Create course",
      onSubmit: (v) => {
        const data = { title: v.title, price: Math.max(0, Number(v.price) || 0), status: v.status, desc: v.desc, color: v.color || COLORS[0] };
        if (c) {
          Object.assign(c, data);
          store.enrollments.filter((e) => e.courseId === c.id).forEach((e) => { e.course = c.title; });
        } else store.courses.push({ id: uid("cr"), lessons: [], created: new Date().toISOString(), ...data });
        persist(); go(); toast(c ? "Course saved" : "Course created — now add lessons");
      },
    });

    const lessonsDialog = (c) => {
      const d = dialog({
        title: `Lessons · ${c.title}`,
        submit: "Add lesson",
        body: `${c.lessons.length ? `<ol class="todo" style="margin-bottom:14px">${c.lessons.map((l, i) => `<li><span class="tick" style="border-color:var(--border);color:var(--muted);font-size:11px;font-weight:600">${i + 1}</span><span class="t" style="flex:1">${esc(l.title)}</span><span class="muted small">${l.minutes} min</span><button type="button" class="icon-btn danger" data-remove-lesson="${l.id}" aria-label="Remove lesson">${icon("trash")}</button></li>`).join("")}</ol>`
          : `<p class="muted" style="margin-bottom:14px">No lessons yet. Add the first one below.</p>`}
          <div class="row"><div class="field"><label>Lesson title</label><input class="input" name="title" required maxlength="80" placeholder="e.g. Introduction"></div>
          <div class="field"><label>Length (minutes)</label><input class="input" name="minutes" type="number" min="1" max="600" value="10" required></div></div>`,
        onSubmit: (v) => {
          c.lessons.push({ id: uid("l"), title: v.title, minutes: Math.max(1, parseInt(v.minutes, 10) || 10) });
          persist(); go(); setTimeout(() => lessonsDialog(c));
        },
        onOpen: (form) => form.addEventListener("click", (e) => {
          const btn = e.target.closest("[data-remove-lesson]");
          if (!btn) return;
          c.lessons = c.lessons.filter((l) => l.id !== btn.dataset.removeLesson);
          persist(); go(); d.close(); lessonsDialog(c);
        }),
      });
    };

    const saleDialog = () => {
      const courses = store.courses.filter((c) => c.status === "published");
      if (!courses.length) { toast("Publish a course first"); location.hash = "#/courses"; return; }
      dialog({
        title: "Record a sale",
        body: `<div class="row"><div class="field"><label>Student name</label><input class="input" name="student" required maxlength="60" list="student-list"><datalist id="student-list">${store.students.map((s) => `<option value="${esc(s.name)}">`).join("")}</datalist></div>
          <div class="field"><label>Email</label><input class="input" name="email" type="email"></div></div>
          <div class="field"><label>Course</label><select class="select" name="course">${courses.map((c) => `<option value="${c.id}">${esc(c.title)} — ${taka(c.price)}</option>`).join("")}</select></div>
          <div class="row"><div class="field"><label>Payment</label><select class="select" name="payment">${PAYMENTS.map((p) => `<option>${p}</option>`).join("")}</select></div>
          <div class="field"><label>Price paid (৳, optional)</label><input class="input" name="price" type="number" min="0" step="1" placeholder="Course price"></div></div>`,
        submit: "Record sale",
        onSubmit: (v) => {
          const c = store.courses.find((x) => x.id === v.course);
          const number = Math.max(1000, ...store.enrollments.map((e) => e.number || 0)) + 1;
          store.enrollments.push({ id: uid("e"), number, student: v.student, email: v.email, courseId: c.id, course: c.title, price: v.price === "" ? c.price : Math.max(0, Number(v.price) || 0), payment: v.payment, progress: 0, date: new Date().toISOString() });
          const known = store.students.find((s) => s.name.toLowerCase() === v.student.toLowerCase());
          if (!known) store.students.unshift({ id: uid("st"), name: v.student, email: v.email, phone: "", joined: new Date().toISOString() });
          else if (v.email && !known.email) known.email = v.email;
          persist(); go(); toast(`${v.student} enrolled in ${c.title}`);
        },
      });
    };

    const actions = {
      "add-course": () => {
        if (!withinLimit(courseLimit(), store.courses.length)) { toast(`Your ${plan().name} plan allows ${courseLimit()} ${courseLimit() === 1 ? "course" : "courses"} — upgrade to add more`); return; }
        courseDialog();
      },
      "edit-course": (el) => courseDialog(store.courses.find((c) => c.id === el.dataset.id)),
      "lessons": (el) => lessonsDialog(store.courses.find((c) => c.id === el.dataset.id)),
      "delete-course": async (el) => {
        const c = store.courses.find((x) => x.id === el.dataset.id);
        if (await confirm("Delete course?", `“${c.title}” and its ${c.lessons.length} lessons will be deleted. Past sales stay.`)) { store.courses = store.courses.filter((x) => x !== c); persist(); go(); }
      },
      "add-sale": saleDialog,
      "delete-sale": async (el) => {
        const e = store.enrollments.find((x) => x.id === el.dataset.id);
        if (await confirm("Delete enrollment?", `${e.student}'s enrollment in ${e.course} will be deleted.`)) { store.enrollments = store.enrollments.filter((x) => x !== e); persist(); go(); }
      },
      "add-student": () => dialog({
        title: "Add student",
        body: `<div class="field"><label>Name</label><input class="input" name="name" required maxlength="60"></div>
          <div class="row"><div class="field"><label>Email</label><input class="input" name="email" type="email"></div><div class="field"><label>Phone</label><input class="input" name="phone" placeholder="01XXX-XXXXXX"></div></div>`,
        submit: "Add student",
        onSubmit: (v) => { store.students.unshift({ id: uid("st"), ...v, joined: new Date().toISOString() }); persist(); go(); toast("Student added"); },
      }),
      "delete-student": async (el) => {
        const s = store.students.find((x) => x.id === el.dataset.id);
        if (await confirm("Delete student?", `${s.name} will be removed from your student list. Their past enrollments stay.`)) { store.students = store.students.filter((x) => x !== s); persist(); go(); }
      },
    };

    return {
      routes, actions,
      badge: () => 0,
      siteItems: () => [store.courses.filter((c) => c.status === "published").map((c) => ({ name: c.title, price: c.price, color: c.color })), "Courses"],
      usage: () => [["Courses", store.courses.length, courseLimit()]],
      search: (q) => { saleSearch = q; if (location.hash === "#/sales") go(); else location.hash = "#/sales"; },
      onChange: (el) => {
        if (el.dataset.action === "enroll-progress") {
          const e = store.enrollments.find((x) => x.id === el.dataset.id);
          e.progress = Number(el.value) || 0; persist(); toast(`${e.student}: ${e.progress === 100 ? "course completed" : e.progress + "% done"}`);
        }
      },
      onInput: (el) => {
        if (el.dataset.action === "student-search") { studentSearch = el.value; return true; }
        if (el.dataset.action === "sale-search") { saleSearch = el.value; return true; }
        return false;
      },
    };
  };

  return { seed, build };
})();
