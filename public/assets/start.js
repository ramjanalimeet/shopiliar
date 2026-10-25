// Get started: template or Create with AI → plan → account, then the store dashboard.
// Links from Pricing (?plan=&billing=) and Templates (?template=) skip the steps already answered.
(() => {
  const root = document.getElementById("start-step");
  const stepsEl = document.getElementById("start-steps");
  if (!root) return;
  const { esc, icon, TEMPLATES } = Dash;
  const templates = TEMPLATES();
  const PLANS = Dash.PLANS();
  const taka = (n) => "৳" + Number(n).toLocaleString("en-US");

  const PLAN_NAMES = { starter: "Starter", business: "Business", pro: "Pro" };
  const FEATURES = { starter: ["5 page website", "3 products", "Unlimited sales"], business: ["100 page website", "150+ products", "Unlimited sales"], pro: ["Unlimited pages", "Unlimited products", "Unlimited sales"] };
  const STEPS = [["site", "Your website"], ["plan", "Plan"], ["account", "Account"]];

  // ---------- State (seeded from the link that brought the visitor here) ----------
  const params = new URLSearchParams(location.search);
  const state = { start: null, template: null, ai: null, plan: null, billing: params.get("billing") === "yearly" ? "yearly" : "monthly", step: "site", planPreset: false };
  const presetTpl = templates.find((t) => t.id === params.get("template"));
  if (presetTpl) { state.start = "template"; state.template = presetTpl.id; }
  if (PLAN_NAMES[params.get("plan")]) { state.plan = params.get("plan"); state.planPreset = true; }
  state.step = !state.template ? "site" : !state.plan ? "plan" : "account";

  const go = (step) => { state.step = step; render(); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const nextAfterSite = () => go(state.plan ? "account" : "plan");
  const tplById = (id) => templates.find((t) => t.id === id);

  // ---------- Pieces ----------
  const mini = (t, copy = {}) => `<div class="mini" style="--bg:${esc(t.bg)};--fg:${esc(t.text)};--ac:${esc(t.accent)}">
      <div class="mini-nav"><b>${esc(copy.name || t.name.split(" ")[0])}</b><span></span><span></span><span></span></div>
      <div class="mini-hero"><strong>${esc(copy.headline || t.headline)}</strong><p>${esc(copy.sub || t.sub)}</p><i>${esc(copy.cta || t.cta)}</i></div>
    </div>`;
  const back = (step, label = "Back") => `<button type="button" class="start-back" data-go="${step}">${icon("chevronDown", "i back-ico")}${label}</button>`;
  const head = (title, sub) => `<div class="start-head"><h1 tabindex="-1">${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div>`;

  const views = {
    site: () => `${head("How do you want to start?", "Your online store — you can change everything later.")}
      <div class="choice-grid two">
        <button type="button" class="choice big" data-start="template"><span class="choice-ico">${icon("grid")}</span><b>Pick a template</b><span>Choose from ready-made designs for your online store.</span></button>
        <button type="button" class="choice big ai" data-start="ai"><span class="choice-ico">${icon("sparkle")}</span><b>Create with AI</b><span>Describe your business and we'll write your website's first draft.</span></button>
      </div>`,

    template: () => `${back("site")}${head("Pick a template", `Designs for your online store. <a class="link" href="templates.html" target="_blank" rel="noopener">See full previews</a>`)}
      <div class="tpl-pick">${templates.filter((t) => t.status === "published").map((t) => `
        <button type="button" class="tpl-option${state.template === t.id ? " on" : ""}" data-template="${t.id}">${mini(t)}<b>${esc(t.name)}</b><span>${esc(t.desc)}</span></button>`).join("")}</div>`,

    ai: () => {
      const a = state.ai;
      if (a && a.headline) {
        const t = tplById(a.template);
        return `${back("ai-form", "Change the description")}${head(a.source === "ai" ? "Here's your website, written by AI" : "Here's a first draft of your website", "Edit anything you like — you can change it all later in your dashboard.")}
          <div class="ai-result">
            <div class="ai-preview">${mini(t, { name: a.name, headline: a.headline, sub: a.sub, cta: a.cta })}<p class="muted small">Style: ${esc(t.name)}</p></div>
            <form class="ai-edit" id="ai-edit">
              <div class="field"><label for="ai-headline">Headline</label><input id="ai-headline" name="headline" maxlength="60" value="${esc(a.headline)}"></div>
              <div class="field"><label for="ai-sub">Short description</label><input id="ai-sub" name="sub" maxlength="120" value="${esc(a.sub)}"></div>
              <div class="field"><label for="ai-cta">Button text</label><input id="ai-cta" name="cta" maxlength="20" value="${esc(a.cta)}"></div>
              <div class="field"><label for="ai-about">About your business</label><textarea id="ai-about" name="about" rows="3" maxlength="300">${esc(a.about)}</textarea></div>
              <div class="start-actions"><button type="button" class="btn btn-outline" data-ai-again>${icon("sparkle")}Write it again</button><button class="btn btn-dark" type="submit">Use this website</button></div>
            </form>
          </div>`;
      }
      return views["ai-form"]();
    },

    "ai-form": () => `${back("site")}${head("Tell us about your business", "A couple of sentences is enough. We'll write your headline, description and About section.")}
      <form class="start-form" id="ai-form">
        <div class="row2"><div class="field"><label for="ai-name">Business name</label><input id="ai-name" name="name" required maxlength="60" value="${esc(state.ai?.name || "")}" placeholder="Lume Furniture"></div>
        <div class="field"><label for="ai-city">City</label><input id="ai-city" name="city" maxlength="40" value="${esc(state.ai?.city || "")}" placeholder="Dhaka"></div></div>
        <div class="field"><label for="ai-about-in">What do you do?</label><textarea id="ai-about-in" name="about" required minlength="10" maxlength="500" rows="4" placeholder="We sell handmade wooden furniture and home decor, delivered across Bangladesh.">${esc(state.ai?.input || "")}</textarea></div>
        <p class="form-msg" role="status"></p>
        <div class="start-actions"><button class="btn btn-dark btn-lg" type="submit">${icon("sparkle")}Create my website</button></div>
      </form>`,

    plan: () => {
      return `${back(state.start === "ai" ? "ai" : "template")}${head("Choose your plan", "Every plan includes a free website, CMS access and support.")}
        <div class="start-toggle" role="group" aria-label="Billing period">
          <button type="button" data-billing="monthly" class="${state.billing === "monthly" ? "on" : ""}" aria-pressed="${state.billing === "monthly"}">Monthly</button>
          <button type="button" data-billing="yearly" class="${state.billing === "yearly" ? "on" : ""}" aria-pressed="${state.billing === "yearly"}">Yearly <small>Free domain</small></button>
        </div>
        <div class="plan-pick">${Object.keys(PLAN_NAMES).map((id) => `
          <button type="button" class="plan-option${state.plan === id ? " on" : ""}${id === "business" ? " pop" : ""}" data-plan="${id}">
            ${id === "business" ? '<span class="pop-tag">Most popular</span>' : ""}
            <b>${PLAN_NAMES[id]}</b>
            <span class="plan-price">${taka(state.billing === "yearly" ? PLANS[id].price * 12 : PLANS[id].price)}<small>/${state.billing === "yearly" ? "year" : "month"}</small></span>
            <ul>${FEATURES[id].map((f) => `<li>${icon("check")}${f}</li>`).join("")}</ul>
            <span class="plan-cta">Choose ${PLAN_NAMES[id]}</span>
          </button>`).join("")}</div>`;
    },

    account: () => {
      const price = PLANS[state.plan].price;
      const t = tplById(state.template);
      const google = new URLSearchParams({ next: "/admin/", plan: state.plan, billing: state.billing, template: state.template });
      return `${back(state.planPreset ? (state.start === "ai" ? "ai" : "template") : "plan")}${head("Create your account", "Last step — then you're in your dashboard.")}
        <div class="account-grid">
          <form class="start-form" id="account-form">
            <div class="field"><label for="name">Your name</label><input id="name" name="name" required maxlength="80" autocomplete="name" placeholder="Akash Rahman"></div>
            <div class="field"><label for="business">Business name</label><input id="business" name="business" maxlength="80" autocomplete="organization" value="${esc(state.ai?.name || "")}" placeholder="Your business"></div>
            <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" required autocomplete="email" placeholder="you@business.com"></div>
            <div class="field"><label for="password">Password</label><input id="password" name="password" type="password" minlength="8" required autocomplete="new-password" placeholder="At least 8 characters"></div>
            <button class="btn btn-dark btn-block btn-lg" type="submit">Create account &amp; start</button>
            <div class="divider">or</div>
            <a class="btn btn-outline btn-block" id="google-start" href="/api/auth/google?${google}"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg> Continue with Google</a>
            <p class="form-msg" role="status"></p>
            <p class="auth-foot">Already have an account? <a class="link" href="signin.html">Sign in</a></p>
          </form>
          <aside class="summary">
            <h2>Your order</h2>
            <dl>
              <div><dt>Website</dt><dd>${state.start === "ai" ? "Created with AI · " : ""}${esc(t.name)} <button type="button" class="link-btn" data-go="${state.start === "ai" ? "ai" : "template"}">Change</button></dd></div>
              <div><dt>Plan</dt><dd>${PLAN_NAMES[state.plan]} · ${state.billing === "yearly" ? "Yearly" : "Monthly"} <button type="button" class="link-btn" data-go="plan">Change</button></dd></div>
            </dl>
            <div class="summary-total"><span>Total</span><b>${taka(state.billing === "yearly" ? price * 12 : price)}<small>/${state.billing === "yearly" ? "year" : "month"}</small></b></div>
            <div class="pay-note">${icon("info")}<span><b>Payment:</b> online payment with bKash, Nagad and card is coming soon. Your plan starts today and you won't be charged until payments are switched on.</span></div>
          </aside>
        </div>`;
    },
  };

  const stepOf = { site: "site", template: "site", ai: "site", "ai-form": "site", plan: "plan", account: "account" };
  const render = () => {
    const current = STEPS.findIndex(([id]) => id === stepOf[state.step]);
    stepsEl.innerHTML = STEPS.map(([, label], i) => `<li class="${i < current ? "done" : i === current ? "on" : ""}"${i === current ? ' aria-current="step"' : ""}><span>${i < current ? icon("check") : i + 1}</span>${label}</li>`).join("");
    root.innerHTML = views[state.step]();
    document.title = (state.step === "account" ? "Create your account" : "Get started") + " — Shopilier";
    root.querySelector("h1")?.focus({ preventScroll: true });
    if (state.step === "ai-form") root.querySelector("#ai-name").focus();
  };

  // Text written in Create with AI goes to the new dashboard (app.js reads it once)
  const handOver = () => {
    try {
      if (state.start === "ai" && state.ai) sessionStorage.setItem("shopilier.start", JSON.stringify({ headline: state.ai.headline, sub: state.ai.sub, cta: state.ai.cta, about: state.ai.about, at: Date.now() }));
      else sessionStorage.removeItem("shopilier.start");
    } catch (e) { /* storage blocked: the dashboard uses the template's text */ }
  };

  const createSite = async (form, values) => {
    const msg = form.querySelector(".form-msg");
    const btn = form.querySelector("[type=submit]");
    btn.disabled = true;
    btn.innerHTML = `${icon("sparkle")}Writing your website…`;
    msg.textContent = "";
    try {
      const res = await fetch("/api/ai/site", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      state.ai = { ...data, name: values.name, city: values.city, input: values.about };
      state.template = data.template;
      go("ai");
    } catch (err) {
      msg.style.color = "#e03e3e";
      msg.textContent = err.message;
      btn.disabled = false;
      btn.innerHTML = `${icon("sparkle")}Create my website`;
    }
  };

  // ---------- Events ----------
  root.addEventListener("click", (e) => {
    const el = e.target.closest("[data-go], [data-start], [data-template], [data-plan], [data-billing], [data-ai-again]");
    if (!el) return;
    if (el.dataset.go) go(el.dataset.go);
    else if (el.dataset.start) { state.start = el.dataset.start; go(el.dataset.start === "ai" ? (state.ai?.headline ? "ai" : "ai-form") : "template"); }
    else if (el.dataset.template) { state.template = el.dataset.template; state.ai = null; nextAfterSite(); }
    else if (el.dataset.plan) { state.plan = el.dataset.plan; go("account"); }
    else if (el.dataset.billing) { state.billing = el.dataset.billing; render(); }
    else if ("aiAgain" in el.dataset) { const a = state.ai; createSite(root.querySelector("#ai-edit"), { name: a.name, city: a.city, about: a.input }); }
  });
  root.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target, f = new FormData(form);
    const val = (k) => String(f.get(k) || "").trim();
    if (form.id === "ai-form") return createSite(form, { name: val("name"), city: val("city"), about: val("about") });
    if (form.id === "ai-edit") {
      Object.assign(state.ai, { headline: val("headline") || state.ai.headline, sub: val("sub"), cta: val("cta") || state.ai.cta, about: val("about") });
      return nextAfterSite();
    }
    if (form.id === "account-form") {
      const msg = form.querySelector(".form-msg"), btn = form.querySelector("[type=submit]");
      btn.disabled = true; msg.textContent = "";
      try {
        const res = await fetch("/api/signup", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: val("name"), business: val("business"), email: val("email"), password: f.get("password"), plan: state.plan, billing: state.billing, template: state.template }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
        handOver();
        location.href = "/admin/";
      } catch (err) {
        msg.style.color = "#e03e3e"; msg.textContent = err.message; btn.disabled = false;
      }
    }
  });
  // Google sign-up keeps the same choices; hand the AI text over before leaving
  root.addEventListener("click", (e) => { if (e.target.closest("#google-start")) handOver(); });

  // Already signed in: straight to the dashboard (applying a template picked on the Templates page)
  fetch("/api/me").then((r) => { if (r.ok) location.replace("/admin/" + (presetTpl ? "?template=" + presetTpl.id : "")); }).catch(() => {});

  // Google sign-in errors come back here as ?error=
  const GOOGLE_ERRORS = { google: "Google sign-in didn't finish. Please try again.", google_email: "Your Google email isn't verified yet.", google_off: "Google sign-in isn't set up yet. Please use your email and password." };
  render();
  if (GOOGLE_ERRORS[params.get("error")]) {
    root.insertAdjacentHTML("afterbegin", `<p class="start-alert" role="alert">${GOOGLE_ERRORS[params.get("error")]}</p>`);
  }
})();
