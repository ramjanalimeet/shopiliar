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
  let lastFocus = null;
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
    modalShot.appendChild(card.querySelector(".shot").cloneNode(true));
    modal.hidden = false;
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

// Sign up: show the template picked on the Templates page
const pickedNote = document.querySelector("[data-picked-template]");
if (pickedNote) {
  const slug = new URLSearchParams(location.search).get("template");
  if (slug && /^[a-z0-9-]+$/.test(slug)) {
    const name = slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
    pickedNote.textContent = "Template selected: " + name;
    pickedNote.hidden = false;
  }
}

// Pricing monthly / yearly toggle
const billing = document.querySelector("[data-billing]");
if (billing) {
  billing.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    billing.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === btn));
    const yearly = btn.dataset.period === "yearly";
    document.querySelectorAll("[data-monthly]").forEach((el) => {
      el.textContent = "$" + (yearly ? el.dataset.yearly : el.dataset.monthly);
    });
    document.querySelectorAll("[data-period-label]").forEach((el) => {
      el.textContent = yearly ? "/mo, billed yearly" : "/month";
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
