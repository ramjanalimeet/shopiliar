// @ts-nocheck — ported as-is from the original dashboard script; types can be tightened over time.
import { Dash } from "./dash";

// Support inbox used by both dashboards.
// mode "user": a customer talking to the Shopilier team (/api/messages).
// mode "admin": the master panel answering every customer (/master-admin/api/...).
export const ShopilierInbox = (root, { mode, onUnread }) => {
  const { esc, icon, toast, dialog } = Dash;
  const admin = mode === "admin";
  const base = admin ? "/master-admin/api/conversations" : "/api/messages";
  const KINDS = { question: ["Question", "gray"], complaint: ["Complaint", "red"], billing: ["Billing", "blue"], website: ["Website problem", "orange"] };
  let list = [], active = null, thread = null, tab = admin ? "open" : "all", search = "", timer = null;

  const call = async (url, body) => {
    const res = await fetch(url, body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
    return data;
  };
  const ago = (d) => {
    const m = Math.round((Date.now() - new Date(d)) / 6e4);
    return m < 1 ? "now" : m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };
  const stamp = (d) => new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const kindTag = (k) => { const [label, color] = KINDS[k] || KINDS.question; return `<span class="tag ${color}">${label}</span>`; };
  const statusTag = (c) => c.status === "closed" ? '<span class="tag gray">Resolved</span>' : '<span class="tag dot green">Open</span>';
  const unread = (c) => (admin ? c.adminUnread : c.unread);

  const filtered = () => list.filter((c) => {
    const q = search.toLowerCase();
    const inTab = tab === "all" || (tab === "open" && c.status === "open") || (tab === "closed" && c.status === "closed") || (tab === "complaint" && c.kind === "complaint");
    const text = [c.subject, c.last, c.user?.name, c.user?.business, c.user?.email].join(" ").toLowerCase();
    return inTab && (!q || text.includes(q));
  });

  const renderList = () => {
    const tabs = admin ? [["open", "Open"], ["complaint", "Complaints"], ["closed", "Resolved"], ["all", "All"]] : null;
    const count = (t) => list.filter((c) => t === "all" || (t === "open" && c.status === "open") || (t === "closed" && c.status === "closed") || (t === "complaint" && c.kind === "complaint")).length;
    const items = filtered();
    root.querySelector(".inbox-list").innerHTML = `
      ${admin ? `<div class="inbox-tools"><div class="seg">${tabs.map(([id, label]) => `<button type="button" class="${id === tab ? "on" : ""}" data-inbox-tab="${id}">${label} <span>${count(id)}</span></button>`).join("")}</div>
        <label class="box-search">${icon("search")}<input data-inbox-search value="${esc(search)}" placeholder="Search name, business or message" aria-label="Search messages"></label></div>` : ""}
      <div class="inbox-items">${items.length ? items.map((c) => `
        <button type="button" class="inbox-item${c.id === active ? " on" : ""}${unread(c) ? " unread" : ""}" data-open="${c.id}">
          <span class="inbox-item-top"><b>${esc(admin ? c.user?.business || c.user?.name : c.subject)}</b><time>${ago(c.updatedAt)}</time></span>
          ${admin ? `<span class="inbox-item-sub">${esc(c.subject)}</span>` : ""}
          <span class="inbox-item-last">${admin && c.lastFrom === "admin" ? "You: " : ""}${esc(c.last || "")}</span>
          <span class="inbox-item-tags">${kindTag(c.kind)}${statusTag(c)}${unread(c) ? '<span class="inbox-dot" aria-label="Unread"></span>' : ""}</span>
        </button>`).join("")
        : `<p class="inbox-empty">${list.length ? "No conversations here." : admin ? "No messages from users yet." : "No messages yet. Start one and our team will reply here."}</p>`}</div>`;
  };

  const bubbles = () => thread.messages.map((m) => {
    const mine = admin ? m.from === "admin" : m.from === "user";
    const who = m.from === "admin" ? "Shopilier team" : admin ? thread.conversation.user?.name || "Customer" : "You";
    return `<div class="bubble ${mine ? "mine" : "theirs"}"><div class="bubble-body">${esc(m.body).replace(/\n/g, "<br>")}</div><span class="bubble-meta">${esc(who)} · ${stamp(m.at)}</span></div>`;
  }).join("");

  const renderThread = () => {
    const pane = root.querySelector(".inbox-thread");
    root.querySelector(".inbox").classList.toggle("show-thread", !!active);
    if (!thread) {
      pane.innerHTML = `<div class="inbox-placeholder">${icon("mail")}<p>${admin ? "Pick a conversation to read and reply." : "Pick a conversation, or start a new one."}</p></div>`;
      return;
    }
    const c = thread.conversation, u = c.user;
    pane.innerHTML = `
      <div class="thread-head">
        <button type="button" class="icon-btn thread-back" data-back aria-label="Back to conversations">${icon("chevronDown")}</button>
        <div class="thread-title"><b>${esc(c.subject)}</b><span>${kindTag(c.kind)}${statusTag(c)}</span></div>
        ${admin ? `<button type="button" class="btn btn-sm" data-status="${c.status === "closed" ? "open" : "closed"}">${c.status === "closed" ? "Reopen" : `${icon("check")}Mark resolved`}</button>` : ""}
      </div>
      ${admin && u ? `<div class="thread-user"><span class="avatar">${esc((u.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase())}</span>
        <div><b>${esc(u.name)}</b> · ${esc(u.business)}<span>${esc(u.email)} · ${esc((u.plan || "starter")[0].toUpperCase() + (u.plan || "starter").slice(1))} plan (${esc(u.billing || "monthly")})</span></div></div>` : ""}
      <div class="thread-messages" tabindex="0" aria-label="Messages">${bubbles()}</div>
      <form class="thread-reply" data-reply>
        <textarea name="body" rows="2" maxlength="2000" required placeholder="${admin ? `Reply to ${esc(u?.name || "the customer")}…` : "Write a message…"}" aria-label="Message"></textarea>
        <button class="btn btn-primary" type="submit">${icon("mail")}Send</button>
      </form>
      ${!admin && c.status === "closed" ? '<p class="thread-note">This conversation was marked resolved. Send a message to reopen it.</p>' : ""}`;
    const box = pane.querySelector(".thread-messages");
    box.scrollTop = box.scrollHeight;
  };

  const refreshList = async () => {
    const data = await call(base);
    list = data.conversations;
    renderList();
    onUnread?.(list.filter(unread).length);
  };
  const open = async (id) => {
    active = id;
    renderList();
    try {
      thread = await call(`${base}/${id}`);
      const c = list.find((x) => x.id === id);
      if (c) { if (admin) c.adminUnread = false; else c.unread = false; }
      renderList(); renderThread();
      onUnread?.(list.filter(unread).length);
      root.querySelector(".thread-reply textarea")?.focus();
    } catch (err) { toast(err.message); }
  };

  const newMessage = async () => {
    if (admin) {
      let users = [];
      try { users = (await call("/master-admin/api/users")).users; } catch (err) { toast(err.message); return; }
      if (!users.length) { toast("No users have signed up yet"); return; }
      dialog({
        title: "New message to a user",
        body: `<div class="field"><label>User</label><select class="select" name="userId" required>${users.map((u) => `<option value="${esc(u.id)}">${esc(u.business || u.name)} — ${esc(u.name)} (${esc(u.email)})</option>`).join("")}</select></div>
          <div class="field"><label>Subject</label><input class="input" name="subject" required maxlength="120"></div>
          <div class="field"><label>Message</label><textarea class="textarea" name="body" required maxlength="2000" rows="5"></textarea></div>`,
        submit: "Send message",
        onSubmit: (v, close, form) => {
          form.querySelector("[type=submit]").disabled = true;
          call(base, v).then(async ({ id }) => { close(); toast("Message sent"); tab = "all"; await refreshList(); open(id); })
            .catch((err) => { toast(err.message); form.querySelector("[type=submit]").disabled = false; });
          return false;
        },
      });
    } else {
      dialog({
        title: "New message",
        body: `<div class="field"><label>What's it about?</label><select class="select" name="kind">${Object.entries(KINDS).map(([id, [label]]) => `<option value="${id}">${label}</option>`).join("")}</select></div>
          <div class="field"><label>Subject</label><input class="input" name="subject" required maxlength="120" placeholder="e.g. My website isn't showing my new products"></div>
          <div class="field"><label>Message</label><textarea class="textarea" name="body" required maxlength="2000" rows="5" placeholder="Tell us what happened. The more detail, the faster we can help."></textarea></div>`,
        submit: "Send",
        onSubmit: (v, close, form) => {
          form.querySelector("[type=submit]").disabled = true;
          call(base, v).then(async ({ id }) => { close(); toast("Message sent — we'll reply here"); await refreshList(); open(id); })
            .catch((err) => { toast(err.message); form.querySelector("[type=submit]").disabled = false; });
          return false;
        },
      });
    }
  };

  // ---------- Mount ----------
  root.innerHTML = `<div class="inbox"><aside class="inbox-list"><p class="inbox-empty">Loading messages…</p></aside><section class="inbox-thread"></section></div>`;
  renderThread();
  root.addEventListener("click", async (e) => {
    const el = e.target.closest("[data-open], [data-inbox-tab], [data-back], [data-status]");
    if (!el) return;
    if (el.dataset.open) open(el.dataset.open);
    else if (el.dataset.inboxTab) { tab = el.dataset.inboxTab; renderList(); }
    else if ("back" in el.dataset) { active = null; thread = null; renderList(); renderThread(); }
    else if (el.dataset.status) {
      try { thread = await call(`${base}/${active}/status`, { status: el.dataset.status }); await refreshList(); renderThread(); toast(el.dataset.status === "closed" ? "Marked resolved" : "Reopened"); }
      catch (err) { toast(err.message); }
    }
  });
  root.addEventListener("input", (e) => {
    if (!("inboxSearch" in e.target.dataset)) return;
    search = e.target.value;
    const pos = e.target.selectionStart;
    renderList();
    const again = root.querySelector("[data-inbox-search]");
    again.focus(); again.setSelectionRange(pos, pos);
  });
  root.addEventListener("submit", async (e) => {
    if (!e.target.matches("[data-reply]")) return;
    e.preventDefault();
    const form = e.target, text = form.elements.body.value.trim();
    if (!text) return;
    const btn = form.querySelector("[type=submit]");
    btn.disabled = true;
    try { thread = await call(`${base}/${active}`, { body: text }); renderThread(); refreshList(); }
    catch (err) { toast(err.message); btn.disabled = false; }
  });
  root.addEventListener("keydown", (e) => {
    // Enter sends, Shift+Enter adds a new line
    if (e.key === "Enter" && !e.shiftKey && e.target.matches(".thread-reply textarea")) { e.preventDefault(); e.target.form.requestSubmit(); }
  });

  // New replies show up without reloading: check every 15 seconds while the inbox is on screen
  const tick = async () => {
    if (!root.isConnected || !root.querySelector(".inbox")) { clearInterval(timer); return; }
    try {
      await refreshList();
      const draft = root.querySelector(".thread-reply textarea");
      if (active && !(draft && draft.value)) {
        const fresh = await call(`${base}/${active}`);
        if (fresh.messages.length !== thread?.messages.length || fresh.conversation.status !== thread?.conversation.status) { thread = fresh; renderThread(); }
      }
    } catch (e) { /* offline: try again next time */ }
  };
  timer = setInterval(tick, 15000);
  refreshList().then(() => {
    const first = admin ? null : list.find(unread);
    if (first) open(first.id);
  }).catch((err) => { root.querySelector(".inbox-list").innerHTML = `<p class="inbox-empty">${esc(err.message)}</p>`; });

  return { newMessage };
};

// Unread count for a sidebar badge, without opening the inbox
ShopilierInbox.unread = async (mode) => {
  try {
    const res = await fetch(mode === "admin" ? "/master-admin/api/conversations" : "/api/messages");
    if (!res.ok) return 0;
    const { conversations } = await res.json();
    return conversations.filter((c) => (mode === "admin" ? c.adminUnread : c.unread)).length;
  } catch (e) { return 0; }
};
