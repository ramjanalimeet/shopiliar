// Demo dashboard (/demo): the real store dashboard (admin/app.js, editor.js, inbox.js) running on a
// sample store. This file stands in for the account API: it answers every /api/* call those scripts
// make and keeps the sample store in this browser (localStorage), so a visitor can try everything
// (products, orders, the website editor, publishing, messages) without an account.
// It must load before the dashboard scripts.
(() => {
  const KEY = "shopilier.demo";
  const PLANS = ["free", "starter", "business", "pro"];
  const realFetch = window.fetch.bind(window);
  const now = () => new Date().toISOString();
  const ago = (minutes) => new Date(Date.now() - minutes * 6e4).toISOString();
  const clean = (v, max) => String(v ?? "").trim().slice(0, max);
  const uid = () => "demo_" + Math.random().toString(36).slice(2, 10);
  // Dash (dash.js) is a top-level const, so it isn't on window; it exists once the dashboard scripts have loaded
  const dash = () => (typeof Dash === "object" ? Dash : null);

  // The sample store owner. account.demo makes the dashboard seed sample products, customers and orders.
  const ACCOUNT = () => ({
    name: "Sabbir Ahmed", business: "Dhaka Threads", email: "sabbir@dhakathreads.com", category: "ecommerce",
    plan: "business", billing: "monthly", template: "luxe-store", createdAt: ago(45 * 1440), hasPassword: true, demo: true,
  });
  // A first conversation from the Shopilier team, so the chat and the bell have something to show
  const WELCOME = {
    id: "welcome", subject: "Welcome to your demo store 🎉", kind: "question", status: "open", unread: true,
    messages: [{ from: "admin", at: ago(95), body:
      "Hi Sabbir! 👋 This is the Shopilier dashboard, running on a sample store so you can try everything.\n\n" +
      "• Add a product or record an order\n• Open Online Store → Themes → Customize to edit the website, then publish it\n• Change the plan in Settings → Plan & billing\n\n" +
      "Nothing you do here affects anyone else. Reply to this message and you'll get a demo answer." }],
  };
  const REPLIES = [
    "Thanks for trying the demo! In your real store a person from the Shopilier team answers here, usually within a few hours. Anything else you'd like to try?",
    "Got it 👍 This is a demo reply. On Starter, Business and Pro, real support replies land right here in your dashboard.",
    "Thanks! When you open your own store (it's free to start at shopilier.com), this chat connects you straight to our team.",
  ];

  // ---------- Storage ----------
  const fresh = () => {
    const w = { ...WELCOME, createdAt: WELCOME.messages[0].at, updatedAt: WELCOME.messages[0].at };
    return { v: 1, account: ACCOUNT(), store: null, conversations: [w], replies: 0 };
  };
  const load = () => {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || "null");
      if (d && d.v === 1 && d.account && Array.isArray(d.conversations)) return d;
    } catch (e) { /* blocked or corrupt */ }
    return null;
  };
  let db = load() || fresh();
  let memoryOnly = false;
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
      memoryOnly = false;
    } catch (e) {
      // Usually the 5 MB limit after several photo uploads: keep going in memory
      if (!memoryOnly && dash()) dash().toast("This browser's demo storage is full — changes stay until you reload");
      memoryOnly = true;
    }
  };
  if (!load()) save();

  // ---------- Responses ----------
  const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
  const fail = (error, status = 400) => json({ error }, status);
  const pub = (c) => ({
    id: c.id, subject: c.subject, kind: c.kind, status: c.status, last: c.messages[c.messages.length - 1]?.body,
    unread: !!c.unread, adminUnread: false, createdAt: c.createdAt, updatedAt: c.updatedAt,
  });
  const thread = (c) => ({ conversation: pub(c), messages: c.messages.map((m) => ({ from: m.from, body: m.body, at: m.at })) });
  const conversation = (id) => db.conversations.find((c) => c.id === id);
  // A demo reply from "the team" a few seconds after a message; the inbox picks it up on its next check
  const replyLater = (c) => setTimeout(() => {
    const live = conversation(c.id);
    if (!live) return;
    live.messages.push({ from: "admin", at: now(), body: REPLIES[db.replies++ % REPLIES.length] });
    live.unread = true; live.updatedAt = now(); live.status = "open";
    save();
  }, 6000 + Math.random() * 4000);

  // Photos stay inline (data URLs) in the demo, so they're shrunk a bit more than real uploads
  const toDataUrl = (blob) => new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, 1000 / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k));
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(im.src);
      let url = c.toDataURL("image/webp", 0.78);
      if (!url.startsWith("data:image/webp")) url = c.toDataURL("image/jpeg", 0.8);
      resolve(url);
    };
    im.onerror = () => { URL.revokeObjectURL(im.src); reject(new Error("That file isn't an image we can use. Try a JPG, PNG or WebP.")); };
    im.src = URL.createObjectURL(blob);
  });

  // ---------- The pretend API ----------
  // Handlers get the parsed JSON body up front when the caller sent a string (so a save on tab close completes in time).
  const routes = [
    ["GET", /^\/api\/me$/, () => json({ account: db.account, store: db.store })],
    ["PUT", /^\/api\/store$/, (req, m, body) => {
      if (!body || typeof body.store !== "object" || Array.isArray(body.store)) return fail("Missing store.");
      const a = body.account || {}, cur = db.account;
      db.store = body.store;
      db.account = {
        ...cur,
        name: clean(a.name, 80) || cur.name, business: clean(a.business, 80) || cur.business,
        email: clean(a.email, 254).toLowerCase() || cur.email,
        plan: PLANS.includes(a.plan) ? a.plan : cur.plan,
        billing: a.billing === "yearly" || a.billing === "monthly" ? a.billing : cur.billing,
        template: /^[a-z0-9-]{1,60}$/.test(a.template || "") ? a.template : cur.template,
        demo: true,
      };
      save();
      return json({ account: db.account, savedAt: now() });
    }],
    ["POST", /^\/api\/signout$/, () => json({ ok: true })],
    ["POST", /^\/api\/password$/, (req, m, body) => {
      const pw = String((body || {}).password || "");
      if (pw.length < 8) return fail("Password must be at least 8 characters.");
      db.account.hasPassword = true; save();
      return json({ ok: true });
    }],
    ["POST", /^\/api\/upload$/, async (req) => {
      const type = (req.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
      if (!/^image\/(webp|jpeg|png|gif)$/.test(type)) return fail("Please upload a JPG, PNG, WebP or GIF image.", 415);
      const blob = await req.blob();
      if (!blob.size) return fail("The image is empty.");
      try { return json({ url: await toDataUrl(blob) }); } catch (err) { return fail(err.message); }
    }],
    ["GET", /^\/api\/messages$/, () => json({ conversations: [...db.conversations].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).map(pub) })],
    ["POST", /^\/api\/messages$/, (req, m, body) => {
      const subject = clean(body?.subject, 120), text = clean(body?.body, 2000);
      if (!subject || !text) return fail("Please add a subject and a message.");
      const c = { id: uid(), subject, kind: ["question", "complaint", "billing", "website"].includes(body.kind) ? body.kind : "question", status: "open", unread: false, createdAt: now(), updatedAt: now(), messages: [{ from: "user", body: text, at: now() }] };
      db.conversations.push(c); save(); replyLater(c);
      return json({ id: c.id }, 201);
    }],
    ["GET", /^\/api\/messages\/([\w-]+)$/, (req, m) => {
      const c = conversation(m[1]);
      if (!c) return fail("Conversation not found.", 404);
      c.unread = false; save();
      return json(thread(c));
    }],
    ["POST", /^\/api\/messages\/([\w-]+)$/, (req, m, body) => {
      const c = conversation(m[1]);
      if (!c) return fail("Conversation not found.", 404);
      const text = clean(body?.body, 2000);
      if (!text) return fail("Write a message first.");
      c.messages.push({ from: "user", body: text, at: now() });
      c.status = "open"; c.updatedAt = now(); save(); replyLater(c);
      return json(thread(c));
    }],
  ];

  window.fetch = (input, init = {}) => {
    const url = new URL(typeof input === "string" ? input : input.url, location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith("/api/")) return realFetch(input, init);
    const req = new Request(input, init);
    let body;
    try { body = typeof init.body === "string" ? JSON.parse(init.body) : undefined; } catch (e) { return Promise.resolve(fail("Expected JSON.")); }
    const route = routes.find(([method, re]) => method === req.method && re.test(url.pathname));
    if (!route) return Promise.resolve(fail("Not found.", 404));
    try {
      return Promise.resolve(route[2](req, route[1].exec(url.pathname), body)).catch((err) => { console.error(err); return fail("Something went wrong in the demo.", 500); });
    } catch (err) {
      console.error(err);
      return Promise.resolve(fail("Something went wrong in the demo.", 500));
    }
  };

  // Inside the home page's demo frame: links leave the frame, and the bar is slimmer
  if (window.self !== window.top) document.body.classList.add("embedded");

  // ---------- Demo bar ----------
  // "Reset demo" puts the sample store back the way it started (delegated, so it works whenever the bar is rendered)
  document.addEventListener("click", async (e) => {
    if (!e.target.closest("#demo-reset")) return;
    const ok = dash() ? await dash().confirm("Reset the demo?", "The sample store goes back to how it started. Your products, orders and website changes in this demo are removed.", "Reset demo") : confirm("Reset the demo?");
    if (!ok) return;
    try { localStorage.removeItem(KEY); } catch (err) { /* ignore */ }
    db = fresh();
    location.href = location.pathname;
  });
})();
