// Mobile menu
document.querySelectorAll(".menu-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const header = btn.closest(".site-header");
    const open = header.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
});

// Template category filters
const filterBar = document.querySelector("[data-filters]");
if (filterBar) {
  filterBar.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    filterBar.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === btn));
    const cat = btn.dataset.cat;
    document.querySelectorAll(".tpl-card").forEach((card) => {
      card.hidden = cat !== "all" && card.dataset.cat !== cat;
    });
  });
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
