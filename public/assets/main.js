// Mobile menu
document.querySelectorAll(".site-header").forEach((header) => {
  const btn = header.querySelector(".menu-toggle");
  if (!btn) return;
  const setOpen = (open) => {
    header.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  btn.addEventListener("click", () => setOpen(!header.classList.contains("open")));
  header.addEventListener("click", (e) => { if (e.target.closest(".main-nav a, .auth a")) setOpen(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && header.classList.contains("open")) { setOpen(false); btn.focus(); }
  });
  matchMedia("(min-width: 761px)").addEventListener("change", (e) => { if (e.matches) setOpen(false); });
});

// Templates: search, category, sort and preview
const tplList = document.getElementById("tpl-list");
if (tplList) {
  const cards = [...tplList.querySelectorAll(".tcard")];
  const search = document.getElementById("tpl-search");
  const sort = document.getElementById("tpl-sort");
  const chips = document.getElementById("tpl-chips");
  const empty = document.getElementById("tpl-empty");
  const best = document.getElementById("tpl-best");
  const BEST = {
    local: "Best for cafés, restaurants, plumbers, electricians and clinics that take appointment bookings.",
    ecommerce: "Best for every kind of business that sells products online.",
    course: "Best for content creators, influencers and YouTubers selling online courses.",
  };
  let cat = "all";

  const render = () => {
    const q = search.value.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    let shown = 0;
    cards.forEach((card) => {
      const match = (cat === "all" || card.dataset.cat === cat) &&
        terms.every((t) => card.dataset.search.includes(t));
      card.hidden = !match;
      if (match) shown++;
    });
    empty.hidden = shown > 0;
  };

  const sortCards = () => {
    const key = sort.value;
    const sorted = [...cards].sort((a, b) =>
      key === "az" ? a.dataset.name.localeCompare(b.dataset.name)
        : Number(a.dataset[key]) - Number(b.dataset[key]));
    sorted.forEach((card) => tplList.appendChild(card));
  };

  search.addEventListener("input", render);
  sort.addEventListener("change", sortCards);
  // Business type tabs (All / Local Business / E-commerce / Course Selling); #local etc. opens one
  const setCat = (name) => {
    cat = name;
    chips.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("on", b.dataset.cat === name);
      b.setAttribute("aria-pressed", String(b.dataset.cat === name));
    });
    best.textContent = BEST[name] || "";
    best.hidden = !BEST[name];
    render();
  };
  chips.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    history.replaceState(null, "", btn.dataset.cat === "all" ? location.pathname : "#" + btn.dataset.cat);
    setCat(btn.dataset.cat);
  });
  if (BEST[location.hash.slice(1)]) setCat(location.hash.slice(1));

  const modal = document.getElementById("tpl-modal");
  const modalShot = document.getElementById("tpl-modal-shot");
  const device = document.getElementById("tpl-device");
  const deviceSwitch = document.getElementById("tpl-devices");
  const deviceSize = document.getElementById("tpl-device-size");
  const deviceFit = document.getElementById("tpl-device-fit");
  const stage = deviceFit.parentElement;
  // Real screen sizes (CSS pixels) for each preview mode
  const devices = { desktop: [1440, 900], tablet: [768, 1024], mobile: [390, 844] };
  let current = "desktop";
  let lastFocus = null;

  const fitDevice = () => {
    const [w, h] = devices[current];
    const pad = parseFloat(getComputedStyle(stage).paddingLeft) * 2;
    const scale = Math.min(1, (stage.clientWidth - pad) / w, (stage.clientHeight - pad) / h);
    device.style.width = w + "px";
    device.style.height = h + "px";
    device.style.transform = "scale(" + scale + ")";
    deviceFit.style.width = w * scale + "px";
    deviceFit.style.height = h * scale + "px";
    const label = current[0].toUpperCase() + current.slice(1);
    deviceSize.textContent = label + " · " + w + " × " + h + (scale < 1 ? " · " + Math.round(scale * 100) + "%" : "");
  };
  new ResizeObserver(() => { if (!modal.hidden) fitDevice(); }).observe(stage);

  const setDevice = (name) => {
    current = name;
    device.dataset.device = name;
    fitDevice();
    deviceSwitch.querySelectorAll("button").forEach((b) => {
      const on = b.dataset.device === name;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    modalShot.scrollTop = 0;
  };
  deviceSwitch.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (btn) setDevice(btn.dataset.device);
  });
  const closeModal = () => {
    modal.hidden = true;
    modalShot.innerHTML = "";
    document.body.classList.remove("no-scroll");
    if (lastFocus) lastFocus.focus();
  };
  tplList.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-preview]");
    if (!btn) return;
    const card = btn.closest(".tcard");
    lastFocus = btn;
    document.getElementById("tpl-modal-title").textContent = card.dataset.name;
    document.getElementById("tpl-modal-use").href = card.querySelector(".btn-dark").getAttribute("href");
    const live = card.querySelector(".shot").cloneNode(true);
    live.classList.add("live");
    const burger = document.createElement("span");
    burger.className = "s-burger";
    burger.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    live.querySelector(".s-nav").appendChild(burger);
    modalShot.appendChild(live);
    modal.hidden = false;
    setDevice("desktop");
    document.body.classList.add("no-scroll");
    modal.querySelector(".modal-close").focus();
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest(".modal-close")) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });
}


// Pricing: business type tabs (Local Business / E-commerce / Course Selling) and monthly / yearly toggle
const billing = document.querySelector("[data-billing]");
if (billing) {
  const taka = (n) => n.toLocaleString("en-US");
  const tabs = [...document.querySelectorAll(".cat-tabs [role=tab]")];
  let yearly = false;
  let cat = tabs.some((t) => t.dataset.cat === location.hash.slice(1)) ? location.hash.slice(1) : tabs[0].dataset.cat;

  const render = () => {
    tabs.forEach((t) => {
      const on = t.dataset.cat === cat;
      t.classList.toggle("on", on);
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll(".cat-panel, .compare table[data-cat]").forEach((el) => { el.hidden = el.dataset.cat !== cat; });
    billing.querySelectorAll("button").forEach((b) => {
      const on = (b.dataset.period === "yearly") === yearly;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    document.body.classList.toggle("is-yearly", yearly);
    document.querySelectorAll(".cat-panel .pcard").forEach((card) => {
      const price = card.querySelector("[data-month]");
      const month = Number(price.dataset.month);
      price.textContent = taka(yearly ? month * 12 : month);
      card.querySelector("[data-per]").textContent = yearly ? "/year" : "/month";
      card.querySelector("[data-bill]").textContent = yearly ? "৳" + taka(month) + "/month, billed yearly" : "Billed monthly";
      card.querySelector("[data-plan-link]").href = "signup.html?category=" + card.closest(".cat-panel").dataset.cat +
        "&plan=" + card.dataset.plan + "&billing=" + (yearly ? "yearly" : "monthly");
    });
  };
  const select = (name, focus) => {
    cat = name;
    history.replaceState(null, "", "#" + name);
    render();
    if (focus) tabs.find((t) => t.dataset.cat === name).focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(t.dataset.cat));
    t.addEventListener("keydown", (e) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (step) { e.preventDefault(); select(tabs[(i + step + tabs.length) % tabs.length].dataset.cat, true); }
    });
  });
  billing.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    yearly = btn.dataset.period === "yearly";
    render();
  });
  render();
}

// Sign in (sign-up is the step-by-step flow in start.js). Accounts are kept by the Worker (src/index.js); the session is an HttpOnly cookie.
const api = async (path, body) => {
  const res = await fetch(path, body === undefined ? {} : {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
};
const signedIn = fetch("/api/me").then((r) => r.ok).catch(() => false);

// Signed-in visitors get a Dashboard button instead of Sign in / Sign up
signedIn.then((yes) => {
  if (!yes) return;
  document.querySelectorAll(".site-header .auth").forEach((el) => {
    el.innerHTML = '<a class="btn btn-dark" href="/admin/">Dashboard</a>';
  });
});

document.querySelectorAll("form[data-auth]").forEach((form) => {
  const params = new URLSearchParams(location.search);
  // Only send people back to pages inside their dashboard
  const next = /^\/admin(\/|$)/.test(params.get("next") || "") ? params.get("next") : "/admin/";
  const msg = form.querySelector(".form-msg");
  const say = (text) => { msg.style.color = "#e03e3e"; msg.textContent = text; };

  form.querySelectorAll("a[data-google]").forEach((a) => { a.href = "/api/auth/google?" + new URLSearchParams({ next }); });
  const GOOGLE_ERRORS = {
    google: "Google sign-in didn't finish. Please try again.",
    google_email: "Your Google email isn't verified yet.",
    google_off: "Google sign-in isn't set up yet. Please use your email and password.",
  };
  if (GOOGLE_ERRORS[params.get("error")]) say(GOOGLE_ERRORS[params.get("error")]);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const button = form.querySelector("[type=submit]");
    const val = (id) => (form.querySelector("#" + id)?.value || "").trim();
    msg.textContent = "";
    button.disabled = true;
    try {
      await api("/api/signin", {
        email: val("email"), password: form.querySelector("#password").value, remember: form.querySelector("#remember")?.checked,
      });
      location.href = next;
    } catch (err) {
      say(err.message);
      button.disabled = false;
    }
  });
});
