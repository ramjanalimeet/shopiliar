// Mobile menu
document.querySelectorAll(".menu-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const header = btn.closest(".site-header");
    const open = header.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
});

// Templates: search, category, sort and preview
const tplList = document.getElementById("tpl-list");
if (tplList) {
  const cards = [...tplList.querySelectorAll(".tcard")];
  const search = document.getElementById("tpl-search");
  const sort = document.getElementById("tpl-sort");
  const chips = document.getElementById("tpl-chips");
  const empty = document.getElementById("tpl-empty");
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
  chips.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    cat = btn.dataset.cat;
    chips.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("on", b === btn);
      b.setAttribute("aria-pressed", String(b === btn));
    });
    render();
  });

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

// Sign up: show the template or plan picked earlier
const pickedNote = document.querySelector("[data-picked-template]");
if (pickedNote) {
  const params = new URLSearchParams(location.search);
  const title = (s) => s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  const slug = params.get("template");
  const plan = params.get("plan");
  const period = params.get("billing") === "yearly" ? "yearly" : "monthly";
  if (slug && /^[a-z0-9-]+$/.test(slug)) {
    pickedNote.textContent = "Template selected: " + title(slug);
    pickedNote.hidden = false;
  } else if (plan && /^(starter|business|pro)$/.test(plan)) {
    pickedNote.textContent = "Plan selected: " + title(plan) + " (" + period + ")";
    pickedNote.hidden = false;
  }
}

// Pricing monthly / yearly toggle
const billing = document.querySelector("[data-billing]");
if (billing) {
  const taka = (n) => n.toLocaleString("en-US");
  billing.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const yearly = btn.dataset.period === "yearly";
    billing.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("on", b === btn);
      b.setAttribute("aria-pressed", String(b === btn));
    });
    document.body.classList.toggle("is-yearly", yearly);
    document.querySelectorAll(".pcard").forEach((card) => {
      const price = card.querySelector("[data-month]");
      const month = Number(price.dataset.month);
      price.textContent = taka(yearly ? month * 12 : month);
      card.querySelector("[data-per]").textContent = yearly ? "/year" : "/month";
      card.querySelector("[data-bill]").textContent = yearly
        ? "৳" + taka(month) + "/month, billed yearly"
        : "Billed monthly";
      card.querySelector("[data-plan-link]").href =
        "signup.html?plan=" + card.dataset.plan + "&billing=" + (yearly ? "yearly" : "monthly");
    });
  });
}

// Auth forms (front-end only until a backend is connected)
document.querySelectorAll("form[data-auth]").forEach((form) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = form.querySelector(".form-msg");
    if (msg) msg.textContent = form.dataset.auth === "signup"
      ? "Account form submitted — connect a backend to create real accounts."
      : "Sign-in form submitted — connect a backend to authenticate.";
  });
});
