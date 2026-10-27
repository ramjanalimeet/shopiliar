// Shopilier website editor (/admin#/website): a visual editor beside the dashboard sidebar.
// The website renders in an iframe at desktop, tablet or phone width. Click a
// section to edit its content in the right-hand panel.
window.SiteEditor = (() => {
  const K = SiteKit;
  const { esc } = K;

  const DEVICES = { desktop: { label: "Desktop", icon: "monitor", width: "100%" }, tablet: { label: "Tablet", icon: "tablet", width: "820px" }, mobile: { label: "Mobile", icon: "phone", width: "390px" } };
  // What each section type can edit. [type, path, label, options]
  const L = (path, label, item, opts = {}) => ["list", path, label, { item, ...opts }];
  const CONTENT = {
    hero: [["text", "eyebrow", "Small heading"], ["text", "title", "Title"], ["textarea", "subtitle", "Subtitle"], ["link", "btn1", "Button 1"], ["link", "btn2", "Button 2"], ["image", "image", "Image"],
      ["toggle", "badge.show", "Show offer badge"], ["text", "badge.top", "Badge: top line", { when: "badge.show" }], ["text", "badge.big", "Badge: big text", { when: "badge.show" }], ["text", "badge.bottom", "Badge: bottom line", { when: "badge.show" }],
      L("features", "Features", [["icon", "icon", "Icon"], ["text", "title", "Title"], ["text", "text", "Text"]], { max: 4, add: { icon: "star", title: "New feature", text: "" }, name: "title" })],
    products: [["text", "eyebrow", "Small heading"], ["text", "title", "Title"], ["textarea", "subtitle", "Subtitle"], ["number", "count", "Number of products", { min: 1, max: 24 }], ["link", "viewAll", "“View all” link"],
      ["note", "", "Products come from your Products page."]],
    featured: [["text", "eyebrow", "Small heading"], ["text", "title", "Title"], ["textarea", "text", "Text"], ["link", "button", "Button"], ["image", "image", "Image"]],
    categories: [["text", "eyebrow", "Small heading"], ["text", "title", "Title"],
      L("items", "Categories", [["text", "name", "Name"], ["image", "image", "Image"], ["url", "link", "Link"]], { max: 8, add: { name: "New category", image: "", link: "/shop" }, name: "name" })],
    about: [["text", "eyebrow", "Small heading"], ["text", "title", "Title"], ["textarea", "text", "Text", { rows: 6 }], ["image", "image", "Image"], ["link", "button", "Button"]],
    testimonials: [["text", "eyebrow", "Small heading"], ["text", "title", "Title"],
      L("items", "Reviews", [["textarea", "quote", "Review"], ["text", "name", "Name"], ["text", "role", "City or detail"], ["number", "rating", "Stars (1–5)", { min: 1, max: 5 }]], { max: 6, add: { quote: "Write the review here.", name: "Customer name", role: "", rating: 5 }, name: "name" })],
    blog: [["text", "eyebrow", "Small heading"], ["text", "title", "Title"],
      L("items", "Posts", [["text", "title", "Title"], ["textarea", "excerpt", "Short text"], ["image", "image", "Image"], ["text", "date", "Date"], ["url", "link", "Link"]], { max: 6, add: { title: "New post", excerpt: "", image: "", date: "", link: "#" }, name: "title" })],
    newsletter: [["text", "title", "Title"], ["textarea", "text", "Text"], ["text", "placeholder", "Email box text"], ["text", "button", "Button text"]],
    contact: [["text", "title", "Title"], ["textarea", "text", "Text"], ["text", "phone", "Phone", { placeholder: "Your store phone (from Preferences)" }], ["text", "email", "Email", { placeholder: "Your store email (from Preferences)" }], ["text", "address", "Address", { placeholder: "Your store address (from Preferences)" }],
      ["note", "", 'Leave these empty to use the details in <a href="#/preferences">Preferences</a>, so they stay the same everywhere.'], ["toggle", "showForm", "Show contact form"]],
    faq: [["text", "title", "Title"], L("items", "Questions", [["text", "q", "Question"], ["textarea", "a", "Answer"]], { max: 12, add: { q: "New question?", a: "The answer." }, name: "q" })],
    banner: [["image", "image", "Background image"], ["text", "title", "Title"], ["textarea", "text", "Text"], ["link", "button", "Button"]],
    custom: [],
    // Every part of the Checkout page; payment switches change Settings → Payments
    checkout: [["text", "title", "Title"], ["textarea", "subtitle", "Text"], ["toggle", "showSteps", "Step numbers (1, 2, 3)"],
      ["heading", "", "Customer details"], ["text", "detailsTitle", "Heading"],
      ["text", "nameLabel", "Name label"], ["text", "namePh", "Name hint"], ["text", "phoneLabel", "Phone label"], ["text", "phonePh", "Phone hint"],
      ["toggle", "showEmail", "Ask for email"], ["text", "emailLabel", "Email label", { when: "showEmail" }], ["text", "emailPh", "Email hint", { when: "showEmail" }],
      ["heading", "", "Delivery"], ["text", "deliveryTitle", "Heading"], ["text", "addressLabel", "Address label"], ["text", "addressPh", "Address hint"],
      L("delivery", "Delivery options", [["text", "label", "Name"], ["number", "fee", "Charge (৳)", { max: 99999 }]], { max: 5, add: { label: "Express delivery", fee: 150 }, name: "label" }),
      ["heading", "", "Payment"], ["text", "paymentTitle", "Heading"],
      ...Object.entries(K.PAYMENTS).map(([k, l]) => ["toggle", "payments." + k, l, { scope: "settings" }]),
      ["note", "", "Turn on the ways customers can pay. This is the same as Settings → Payments."],
      ["heading", "", "Order note"], ["toggle", "showNote", "Order note box"], ["text", "noteLabel", "Label", { when: "showNote" }], ["text", "notePh", "Hint", { when: "showNote" }],
      ["heading", "", "Order summary"], ["text", "summaryTitle", "Heading"], ["toggle", "showCoupon", "Discount code box"], ["text", "couponPh", "Discount box hint", { when: "showCoupon" }], ["text", "couponButton", "Discount button", { when: "showCoupon" }],
      ["toggle", "showSecure", "Safety message"], ["text", "secureText", "Safety message text", { when: "showSecure" }],
      ["heading", "", "Order button"], ["text", "button", "Button text"], ["toggle", "buttonTotal", "Show total on the button"], ["textarea", "note", "Small text under the button", { rows: 2 }],
      ["note", "", "The order summary shows what's in the customer's cart."]],
    header: [["image", "logo", "Logo image (optional)"], ["toggle", "announcement.show", "Show announcement bar"], ["text", "announcement.text", "Announcement", { when: "announcement.show" }],
      ["toggle", "search", "Search icon"], ["toggle", "account", "Account icon"], ["toggle", "cart", "Cart icon"], ["note", "", 'Menu items come from <a href="#/navigation">Navigation</a>. The website name, logo and announcement can also be changed in <a href="#/preferences">Preferences</a>.']],
    footer: [["textarea", "text", "About text"], ["toggle", "showMenu", "Show pages"], ["toggle", "showContact", "Show contact details"], ["toggle", "showSocial", "Show social links"], ["text", "copyright", "Copyright line", { placeholder: "© 2026 Your store. All rights reserved." }],
      ["note", "", 'Social links come from <a href="#/preferences">Preferences</a>.']],
  };
  const get = (o, path) => path.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
  const set = (o, path, v) => { const ks = path.split("."); const last = ks.pop(); const t = ks.reduce((a, k) => (a[k] ??= {}), o); t[last] = v; };

  // Shrink a photo before upload: at most 1600px, WebP (or JPEG where WebP isn't supported)
  const compress = (file) => new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(im.src);
      c.toBlob((b) => (b && b.type === "image/webp" ? resolve(b) : c.toBlob((j) => (j ? resolve(j) : reject(new Error("Couldn't read that image."))), "image/jpeg", 0.85)), "image/webp", 0.82);
    };
    im.onerror = () => reject(new Error("That file isn't an image we can use. Try a JPG, PNG or WebP."));
    im.src = URL.createObjectURL(file);
  });
  const upload = async (file) => {
    const blob = await compress(file);
    const res = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": blob.type }, body: blob });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Couldn't upload the image. Check your connection.");
    return data.url;
  };

  const mount = (root, d) => {
    const { store, icon, toast, confirm, dialog } = d;
    const ctx = () => ({ site: store.site, products: store.products });
    K.ensure(store.site, store.pages, ctx());

    // #/website?page=<id> opens that page (from the Pages list)
    const askedPage = new URLSearchParams(location.hash.split("?")[1] || "").get("page");
    const state = { mode: "sections", selected: null, pageId: store.pages.some((p) => p.id === askedPage) ? askedPage : store.pages[0].id, device: innerWidth < 900 ? "mobile" : "desktop", panelOpen: innerWidth >= 900 };
    const page = () => store.pages.find((p) => p.id === state.pageId) || store.pages[0];
    const sectionById = (id) => page().sections.find((s) => s.id === id);
    const target = () => {
      if (state.selected === "header") return { content: store.site.header, style: (store.site.header.style ||= {}), type: "header", label: "Header" };
      if (state.selected === "footer") return { content: store.site.footer, style: (store.site.footer.style ||= {}), type: "footer", label: "Footer" };
      const s = state.selected && sectionById(state.selected);
      return s ? { content: s.content, style: s.style, type: s.type, label: (K.TYPES[s.type] || {}).label + " section", section: s } : null;
    };

    // ---------- History (undo / redo) ----------
    const snap = () => JSON.stringify({ site: store.site, pages: store.pages });
    let current = snap(), undoStack = [], redoStack = [], recordTimer = 0;
    const record = () => {
      clearTimeout(recordTimer); recordTimer = 0;
      const now = snap();
      if (now === current) return;
      undoStack.push(current); if (undoStack.length > 60) undoStack.shift();
      current = now; redoStack = [];
      paintTop();
    };
    // Every edit: refresh the canvas, save, and remember for undo once typing pauses
    const changed = (opts = {}) => {
      store.customized = true;
      d.touchSite(); d.persist();
      paintCanvas();
      if (opts.panel) paintPanel();
      clearTimeout(recordTimer); recordTimer = setTimeout(record, 500);
    };
    const restore = (json) => {
      const data = JSON.parse(json);
      store.site = data.site; store.pages = data.pages;
      if (!store.pages.some((p) => p.id === state.pageId)) state.pageId = store.pages[0].id;
      if (state.selected && !["header", "footer"].includes(state.selected) && !sectionById(state.selected)) state.selected = null;
      d.touchSite(); d.persist(); paintAll();
    };
    const undo = () => { if (recordTimer) record(); if (!undoStack.length) return; redoStack.push(current); current = undoStack.pop(); restore(current); };
    const redo = () => { if (!redoStack.length) return; undoStack.push(current); current = redoStack.pop(); restore(current); };

    // ---------- Layout ----------
    document.body.classList.add("editor-open");
    // The dashboard sidebar stays beside the editor; the first top-bar button hides or shows it (remembered)
    const narrow = () => matchMedia("(max-width: 900px)").matches;
    let sideHidden = false;
    try { sideHidden = localStorage.getItem("shopilier.editorSidebar") === "hidden"; } catch (e) { /* storage blocked */ }
    const paintSide = () => {
      const app = document.querySelector(".app");
      const shown = narrow() ? app.classList.contains("nav-open") : !sideHidden;
      document.body.classList.toggle("ed-side-hidden", !narrow() && sideHidden);
      const b = root.querySelector("#ed-side");
      b.setAttribute("aria-expanded", String(shown));
      b.setAttribute("aria-label", shown ? "Hide sidebar" : "Show sidebar");
      b.title = shown ? "Hide sidebar" : "Show sidebar";
    };
    const toggleSide = () => {
      if (narrow()) document.querySelector(".app").classList.toggle("nav-open");
      else {
        sideHidden = !sideHidden;
        try { localStorage.setItem("shopilier.editorSidebar", sideHidden ? "hidden" : "shown"); } catch (e) { /* storage blocked */ }
      }
      paintSide();
    };
    root.innerHTML = `<div class="ed">
      <header class="ed-top">
        <div class="ed-group">
          <button class="ed-btn ed-icon" type="button" id="ed-side" aria-controls="dashboard-nav">${icon("sidebar")}</button>
        </div>
        <div class="ed-devices" role="group" aria-label="Preview size">${Object.entries(DEVICES).map(([k, v]) => `<button type="button" data-device="${k}">${icon(v.icon)}<span class="ed-label">${v.label}</span></button>`).join("")}</div>
        <div class="ed-group">
          <button class="ed-btn" type="button" data-mode="pages">${icon("pages")}<span class="ed-label" id="ed-page-name"></span></button>
          <button class="ed-btn ed-icon" type="button" id="ed-undo" title="Undo (Ctrl+Z)" aria-label="Undo">${icon("undo")}</button>
          <button class="ed-btn ed-icon" type="button" id="ed-redo" title="Redo (Ctrl+Shift+Z)" aria-label="Redo">${icon("redo")}</button>
          <button class="ed-btn ed-hide-sm" type="button" id="ed-reset">Reset</button>
          <button class="ed-btn ed-publish" type="button" id="ed-publish">${icon("rocket")}<span class="ed-label" id="ed-publish-label"></span></button>
        </div>
      </header>
      <div class="ed-body">
        <div class="ed-canvas"><div class="ed-frame-wrap"><iframe class="ed-frame" title="Website preview"></iframe></div></div>
        <aside class="ed-panel" id="ed-panel" aria-label="Editor panel"></aside>
      </div>
    </div>`;
    const $ = (sel) => root.querySelector(sel);
    const frame = $(".ed-frame"), panel = $("#ed-panel");

    const paintTop = () => {
      root.querySelectorAll("[data-device]").forEach((b) => b.classList.toggle("on", b.dataset.device === state.device));
      root.querySelectorAll(".ed-top [data-mode]").forEach((b) => b.classList.toggle("on", state.mode === b.dataset.mode && state.panelOpen));
      $(".ed-frame-wrap").style.width = DEVICES[state.device].width;
      $(".ed-frame-wrap").dataset.device = state.device;
      $("#ed-page-name").textContent = "Pages · " + page().title;
      $("#ed-undo").disabled = !undoStack.length && !recordTimer;
      $("#ed-redo").disabled = !redoStack.length;
      $("#ed-publish-label").textContent = store.published ? "Publish changes" : "Publish website";
      $(".ed").classList.toggle("panel-open", state.panelOpen);
    };

    // ---------- Canvas ----------
    let frameReady = false;
    const body = () => K.renderBody(store.site, store.pages, { page: page(), products: store.products, ed: true, selected: state.selected });
    frame.srcdoc = K.documentHTML(store.site, store.pages, { page: page(), products: store.products, ed: true, selected: state.selected });
    frame.addEventListener("load", () => {
      frameReady = true;
      const doc = frame.contentDocument;
      doc.addEventListener("click", (e) => {
        e.preventDefault();
        const plus = e.target.closest("[data-ed-add]");
        if (plus) { openLibrary(Number(plus.dataset.edAdd)); return; }
        const chip = e.target.closest("[data-ed]");
        if (chip) { sectionAction(chip.dataset.ed, state.selected); return; }
        const el = e.target.closest("[data-sid]");
        if (el) select(el.dataset.sid, false);
      });
      doc.addEventListener("submit", (e) => e.preventDefault());
      doc.addEventListener("keydown", onKey);
      paintCanvas();
    });
    const paintCanvas = () => { if (frameReady) frame.contentDocument.body.innerHTML = body(); };
    const scrollToSelected = () => {
      if (!frameReady || !state.selected) return;
      const el = frame.contentDocument.querySelector(`[data-sid="${CSS.escape(state.selected)}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // ---------- Panel ----------
    const field = (f, obj, scope) => {
      const [type, path, label, o = {}] = f;
      if (o.when && !get(obj, o.when)) return "";
      if (o.scope) { scope = o.scope; obj = scopeObj(scope); }
      const val = get(obj, path);
      const id = "f" + Math.random().toString(36).slice(2, 8);
      const bind = `data-scope="${scope}" data-path="${path}"`;
      if (type === "note") return `<p class="ed-note">${label}</p>`;
      if (type === "heading") return `<h4 class="ed-subhead">${esc(label)}</h4>`;
      if (type === "text" || type === "url") return `<div class="ed-field"><label for="${id}">${esc(label)}</label><input class="input" id="${id}" ${bind} value="${esc(val)}" placeholder="${esc(o.placeholder || (type === "url" ? "/shop or https://…" : ""))}"></div>`;
      if (type === "textarea") return `<div class="ed-field"><label for="${id}">${esc(label)}</label><textarea class="textarea" id="${id}" rows="${o.rows || 3}" ${bind}>${esc(val)}</textarea></div>`;
      if (type === "number") return `<div class="ed-field"><label for="${id}">${esc(label)}</label><input class="input" type="number" id="${id}" min="${o.min ?? 0}" max="${o.max ?? 99}" ${bind} data-num value="${esc(val)}"></div>`;
      if (type === "toggle") return `<div class="ed-toggle"><span>${esc(label)}</span><label class="switch"><input type="checkbox" ${bind} data-rerender ${val ? "checked" : ""} aria-label="${esc(label)}"><i></i></label></div>`;
      if (type === "icon") return `<div class="ed-field"><label for="${id}">${esc(label)}</label><select class="select" id="${id}" ${bind}>${K.FEATURE_ICONS.map((n) => `<option ${n === val ? "selected" : ""}>${n}</option>`).join("")}</select></div>`;
      if (type === "link") return `<div class="ed-field"><label>${esc(label)}</label><div class="ed-link"><input class="input" ${bind.replace(path, path + ".text")} value="${esc(val?.text)}" placeholder="Button text" aria-label="${esc(label)} text"><input class="input" ${bind.replace(path, path + ".link")} value="${esc(val?.link)}" placeholder="Link, e.g. /shop" aria-label="${esc(label)} link"></div></div>`;
      if (type === "image") {
        const src = K.safeImg(val);
        return `<div class="ed-field"><label>${esc(label)}</label><div class="ed-image">
          <span class="ed-thumb">${src ? `<img src="${esc(src)}" alt="">` : icon("image")}</span>
          <label class="btn btn-sm ed-upload">${icon("plus")}${src ? "Replace" : "Upload"}<input type="file" accept="image/*" hidden ${bind}></label>
          ${src ? `<button type="button" class="btn btn-sm btn-danger-soft" data-clear ${bind}>Remove</button>` : ""}
        </div></div>`;
      }
      if (type === "list") {
        const items = Array.isArray(val) ? val : [];
        return `<div class="ed-list"><div class="ed-list-head"><b>${esc(label)}</b><span class="muted small">${items.length}${o.max ? " of " + o.max : ""}</span></div>
          ${items.map((it, i) => `<details class="ed-item" ${openItems.has(scope + path + i) ? "open" : ""} data-key="${esc(scope + path + i)}">
            <summary><span>${esc(it[o.name] || "Item " + (i + 1))}</span>
              <span class="ed-item-tools"><button type="button" data-list="up" data-scope="${scope}" data-path="${path}" data-i="${i}" aria-label="Move up" ${i ? "" : "disabled"}>${icon("up")}</button><button type="button" data-list="down" data-scope="${scope}" data-path="${path}" data-i="${i}" aria-label="Move down" ${i < items.length - 1 ? "" : "disabled"}>${icon("down")}</button><button type="button" data-list="remove" data-scope="${scope}" data-path="${path}" data-i="${i}" aria-label="Remove">${icon("trash")}</button></span></summary>
            <div class="ed-item-body">${o.item.map((sub) => field([sub[0], sub[1], sub[2], sub[3]], it, `${scope}|${path}|${i}`)).join("")}</div>
          </details>`).join("")}
          ${!o.max || items.length < o.max ? `<button type="button" class="btn btn-sm ed-add" data-list="add" data-scope="${scope}" data-path="${path}">${icon("plus")}Add ${esc(label.toLowerCase().replace(/s$/, ""))}</button>` : ""}
        </div>`;
      }
      return "";
    };
    const openItems = new Set();

    // Resolve a scope string to the object an input edits
    const scopeObj = (scope) => {
      const [base, listPath, idx] = scope.split("|");
      let obj;
      const t = target();
      if (base === "content") obj = t && t.content;
      else if (base === "style") obj = t && t.style;
      else if (base === "site") obj = store.site;
      else if (base === "page") obj = page();
      else if (base === "settings") obj = store.settings;
      else if (base.startsWith("block:")) obj = t && t.section && t.section.blocks.find((b) => b.id === base.slice(6));
      if (listPath != null) obj = get(obj, listPath)[Number(idx)];
      return obj;
    };

    const seg = (scope, path, label, options, val) => `<div class="ed-field"><label>${esc(label)}</label><div class="ed-seg">${options.map(([v, l]) => `<button type="button" class="${String(val) === v ? "on" : ""}" data-set="${v}" data-scope="${scope}" data-path="${path}">${esc(l)}</button>`).join("")}</div></div>`;

    const outline = () => {
      const p = page();
      const row = (id, label, ico, s) => `<div class="ed-row ${state.selected === id ? "on" : ""}" data-select="${id}">
        <span class="ed-row-ico">${icon(ico)}</span><span class="ed-row-label">${esc(label)}</span>
        ${s && s.type !== "checkout" ? `<span class="ed-row-tools"><button type="button" data-row="hide" data-id="${s.id}" aria-label="${s.hidden ? "Show" : "Hide"} section" title="${s.hidden ? "Show" : "Hide"}">${icon(s.hidden ? "eyeOff" : "eye")}</button></span>` : ""}
      </div>`;
      return `<div class="ed-sub">Sections on ${esc(p.title)}</div>
        <div class="ed-outline">${row("header", "Header", "layout")}${p.sections.map((s) => row(s.id, (K.TYPES[s.type] || {}).label || s.type, (K.TYPES[s.type] || {}).icon || "layout", s)).join("")}${row("footer", "Footer", "layout")}</div>
        <p class="ed-note">To add a section, point at the line between two sections on your website and click the green <b>+</b>.</p>`;
    };

    const elements = (t) => {
      const s = t.section;
      if (!s) return "";
      return `<div class="ed-sub">Elements</div>
        ${s.blocks.map((b, i) => `<details class="ed-item" ${openItems.has(b.id) ? "open" : ""} data-key="${b.id}"><summary><span>${esc(K.BLOCKS[b.type])}${b.text ? ": " + esc(b.text.slice(0, 24)) : ""}</span>
          <span class="ed-item-tools"><button type="button" data-block="up" data-id="${b.id}" aria-label="Move up" ${i ? "" : "disabled"}>${icon("up")}</button><button type="button" data-block="down" data-id="${b.id}" aria-label="Move down" ${i < s.blocks.length - 1 ? "" : "disabled"}>${icon("down")}</button><button type="button" data-block="remove" data-id="${b.id}" aria-label="Remove">${icon("trash")}</button></span></summary>
          <div class="ed-item-body">
            ${["heading", "text", "button"].includes(b.type) ? field([b.type === "text" ? "textarea" : "text", "text", b.type === "button" ? "Button text" : "Text"], b, "block:" + b.id) : ""}
            ${b.type === "button" ? field(["url", "link", "Link"], b, "block:" + b.id) : ""}
            ${b.type === "image" ? field(["image", "image", "Image"], b, "block:" + b.id) : ""}
            ${b.type !== "divider" && b.type !== "button" ? seg("block:" + b.id, "size", "Size", [["s", "Small"], ["m", "Medium"], ["l", "Large"]], b.size) : ""}
          </div></details>`).join("") || '<p class="ed-note">Add headings, text, buttons or images to this section.</p>'}
        <div class="ed-chips">${Object.entries(K.BLOCKS).map(([k, v]) => `<button type="button" class="btn btn-sm" data-add-block="${k}">${icon("plus")}${v}</button>`).join("")}</div>`;
    };

    const contentTab = (t) => {
      if (!t) return outline();
      return `${(CONTENT[t.type] || []).map((f) => field(f, t.content, "content")).join("")}${elements(t)}`;
    };
    const pagesPanel = () => `<div class="ed-panel-head"><b>Pages</b><button class="ed-icon-btn" data-close aria-label="Close">${icon("x")}</button></div>
      <div class="ed-panel-body"><div class="ed-outline">${store.pages.map((p) => `<div class="ed-row ${p.id === state.pageId ? "on" : ""}" data-page="${p.id}"><span class="ed-row-ico">${icon("pages")}</span><span class="ed-row-label">${esc(p.title)}<small>/${esc(p.slug)}</small></span>${p.inNav ? "" : '<span class="tag">Not in menu</span>'}</div>`).join("")}</div>
      <button type="button" class="btn btn-sm ed-add" data-add-page>${icon("plus")}Add page</button>
      <p class="ed-note">Rename, delete and reorder pages from <a href="#/pages">Pages</a> and <a href="#/navigation">Navigation</a>.</p></div>`;

    const paintPanel = () => {
      // Keep open list items open across repaints
      panel.querySelectorAll("details[data-key]").forEach((el) => (el.open ? openItems.add(el.dataset.key) : openItems.delete(el.dataset.key)));
      const scrollTop = panel.querySelector(".ed-panel-body")?.scrollTop || 0;
      if (state.mode === "pages") panel.innerHTML = pagesPanel();
      else {
        const t = target();
        panel.innerHTML = `<div class="ed-tabs"><span class="on">${icon("edit")}Content</span></div>
          <div class="ed-panel-head">${t ? `<button class="ed-icon-btn" data-deselect aria-label="Back to all sections" title="All sections">${icon("arrowLeft")}</button>` : ""}<b>${esc(t ? t.label : page().title + " page")}</b><button class="ed-icon-btn ed-only-sm" data-close aria-label="Close panel">${icon("x")}</button></div>
          <div class="ed-panel-body">${contentTab(t)}</div>`;
      }
      const b = panel.querySelector(".ed-panel-body");
      if (b) b.scrollTop = scrollTop;
      paintTop();
    };
    const paintAll = () => { paintTop(); paintCanvas(); paintPanel(); };

    const select = (id, scroll = true) => {
      state.selected = id; state.mode = "sections"; state.panelOpen = true;
      paintCanvas(); paintPanel();
      if (scroll) scrollToSelected();
    };

    // ---------- Section operations ----------
    const sectionAction = async (act, id) => {
      const list = page().sections, s = list.find((x) => x.id === id);
      if (!s) return;
      const i = list.indexOf(s);
      if (act === "up" && i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
      else if (act === "down" && i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]];
      else if (act === "duplicate") { const c = JSON.parse(JSON.stringify(s)); c.id = K.uid("s"); c.blocks.forEach((b) => { b.id = K.uid("b"); }); list.splice(i + 1, 0, c); state.selected = c.id; }
      else if (act === "delete") {
        if (s.type === "checkout") { toast("The checkout form can't be removed — it's how customers order"); return; }
        if (!(await confirm("Delete section?", `The ${(K.TYPES[s.type] || {}).label || ""} section will be removed from this page. You can undo this.`, "Delete"))) return;
        list.splice(i, 1); state.selected = null;
      } else return;
      changed({ panel: true });
      scrollToSelected();
    };
    // at: position in the page (the gap whose + was clicked)
    const addSection = (type, at, made) => {
      const s = made || K.make(type, ctx());
      const list = page().sections;
      list.splice(Math.max(0, Math.min(at, list.length)), 0, s);
      state.selected = s.id; state.mode = "sections"; state.panelOpen = true;
      changed({ panel: true });
      setTimeout(scrollToSelected, 50);
      toast((K.TYPES[type] || {}).label + " section added");
    };

    // ---------- Section library (opened from the "+" between sections) ----------
    // Every ready-made section, previewed live with this store's colors, fonts and products
    const openLibrary = (at) => {
      const items = K.LIBRARY.map((it) => ({ ...it, preview: K.fromLibrary(it, ctx()) }));
      const types = [...new Set(items.map((it) => it.type))];
      const wrap = document.createElement("div");
      wrap.className = "overlay lib-overlay";
      wrap.innerHTML = `<div class="lib" role="dialog" aria-modal="true" aria-label="Add a section">
        <header class="lib-head"><div><b>Add a section</b><span>Pick a ready-made section. You can change all its text and images after adding it.</span></div>
          <button type="button" class="ed-icon-btn" data-lib-close aria-label="Close">${icon("x")}</button></header>
        <div class="lib-body">
          <nav class="lib-cats" aria-label="Section types"><button type="button" class="on" data-cat="">All sections</button>${types.map((t) => `<button type="button" data-cat="${t}">${icon(K.TYPES[t].icon)}${esc(K.TYPES[t].label)}</button>`).join("")}</nav>
          <div class="lib-grid">${items.map((it, i) => `
            <button type="button" class="lib-card" data-pick="${i}" data-type="${it.type}">
              <span class="lib-prev"><iframe tabindex="-1" aria-hidden="true" loading="lazy" srcdoc="${esc(K.documentHTML(store.site, store.pages, { page: { sections: [it.preview] }, products: store.products, bare: true }))}"></iframe><span class="lib-add">${icon("plus")}Add section</span></span>
              <span class="lib-name"><b>${esc(K.TYPES[it.type].label)}</b><span>${esc(it.name)}</span></span>
            </button>`).join("")}</div>
        </div>
      </div>`;
      const prevFocus = document.activeElement;
      const close = () => { wrap.remove(); ro.disconnect(); document.removeEventListener("keydown", onKey, true); if (prevFocus && prevFocus.isConnected) prevFocus.focus(); };
      const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
      // Each preview is a 1280px-wide page scaled down to its card
      const fit = () => wrap.querySelectorAll(".lib-prev").forEach((box) => {
        const f = box.querySelector("iframe"), k = box.clientWidth / 1280;
        if (!k) return;
        f.style.transform = `scale(${k})`; f.style.height = box.clientHeight / k + "px";
      });
      const ro = new ResizeObserver(fit);
      wrap.addEventListener("click", (e) => {
        if (e.target === wrap || e.target.closest("[data-lib-close]")) return close();
        const cat = e.target.closest("[data-cat]");
        if (cat) {
          wrap.querySelectorAll("[data-cat]").forEach((b) => b.classList.toggle("on", b === cat));
          wrap.querySelectorAll(".lib-card").forEach((c) => { c.hidden = !!cat.dataset.cat && c.dataset.type !== cat.dataset.cat; });
          wrap.querySelector(".lib-grid").scrollTop = 0;
          fit(); return;
        }
        const card = e.target.closest("[data-pick]");
        if (card) { const it = items[Number(card.dataset.pick)]; close(); addSection(it.type, at, K.fromLibrary(it, ctx())); }
      });
      document.addEventListener("keydown", onKey, true);
      document.body.appendChild(wrap);
      ro.observe(wrap.querySelector(".lib-grid"));
      fit();
      wrap.querySelector("[data-lib-close]").focus();
    };

    // ---------- Events ----------
    const write = (el) => {
      const obj = scopeObj(el.dataset.scope);
      if (!obj) return;
      let v = el.type === "checkbox" ? el.checked : el.value;
      if (el.dataset.num !== undefined) { const n = Number(v); v = Number.isFinite(n) ? Math.min(Number(el.max) || n, Math.max(Number(el.min) || 0, n)) : 0; }
      set(obj, el.dataset.path, v);
      // Payment switches on the Checkout page are the store's payment settings
      if (el.dataset.scope === "settings") store.site.payments = Object.keys(K.PAYMENTS).filter((k) => store.settings.payments[k]).map((k) => K.PAYMENTS[k]);
      if (el.dataset.scope === "page" && el.dataset.path === "title") $("#ed-page-name").textContent = "Pages · " + page().title;
      changed({ panel: el.dataset.rerender !== undefined });
    };
    panel.addEventListener("input", (e) => { const el = e.target; if (el.dataset.scope && el.type !== "file" && el.type !== "checkbox") write(el); });
    panel.addEventListener("change", async (e) => {
      const el = e.target;
      if (el.type === "checkbox" && el.dataset.scope) { write(el); return; }
      if (el.type === "file" && el.files[0]) {
        const lab = el.closest(".ed-upload");
        lab.classList.add("busy");
        try { const url = await upload(el.files[0]); set(scopeObj(el.dataset.scope), el.dataset.path, url); changed({ panel: true }); toast("Image uploaded"); }
        catch (err) { toast(err.message); lab.classList.remove("busy"); }
      }
    });
    panel.addEventListener("click", async (e) => {
      const b = e.target.closest("button, [data-select], [data-page]");
      if (!b) return;
      if (b.hasAttribute("data-close")) { if (state.mode !== "sections" && innerWidth >= 900) state.mode = "sections"; else state.panelOpen = false; paintPanel(); return; }
      if (b.hasAttribute("data-deselect")) { select(null, false); return; }
      if (b.dataset.row === "hide") { e.stopPropagation(); const s = sectionById(b.dataset.id); if (s.type === "checkout") { toast("The checkout form can't be hidden — it's how customers order"); return; } s.hidden = !s.hidden; changed({ panel: true }); return; }
      if (b.dataset.select) { select(b.dataset.select); return; }
      if (b.dataset.page) { state.pageId = b.dataset.page; state.selected = null; state.mode = "sections"; frame.contentWindow && frame.contentWindow.scrollTo(0, 0); paintAll(); return; }
      if (b.dataset.set !== undefined) { set(scopeObj(b.dataset.scope), b.dataset.path, b.dataset.set); changed({ panel: true }); return; }
      if (b.hasAttribute("data-clear")) { set(scopeObj(b.dataset.scope), b.dataset.path, ""); changed({ panel: true }); return; }
      if (b.dataset.list) {
        e.preventDefault();
        const owner = scopeObj(b.dataset.scope), arr = get(owner, b.dataset.path), i = Number(b.dataset.i);
        const f = (CONTENT[target().type] || []).find((x) => x[0] === "list" && x[1] === b.dataset.path);
        if (b.dataset.list === "add") { arr.push(JSON.parse(JSON.stringify(f[3].add))); openItems.add(b.dataset.scope + b.dataset.path + (arr.length - 1)); }
        else if (b.dataset.list === "remove") arr.splice(i, 1);
        else if (b.dataset.list === "up" && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
        else if (b.dataset.list === "down" && i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
        changed({ panel: true }); return;
      }
      if (b.dataset.addBlock) { const blk = K.makeBlock(b.dataset.addBlock); target().section.blocks.push(blk); openItems.add(blk.id); changed({ panel: true }); return; }
      if (b.dataset.block) {
        e.preventDefault();
        const arr = target().section.blocks, i = arr.findIndex((x) => x.id === b.dataset.id);
        if (b.dataset.block === "remove") arr.splice(i, 1);
        else if (b.dataset.block === "up" && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
        else if (b.dataset.block === "down" && i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
        changed({ panel: true }); return;
      }
      if (b.hasAttribute("data-add-page")) {
        if (!d.canAddPage()) { toast("Your plan's page limit is reached — upgrade to add more"); return; }
        dialog({
          title: "New page",
          body: `<div class="field"><label>Page title</label><input class="input" name="title" required maxlength="40" placeholder="e.g. FAQ"></div>`,
          submit: "Add page",
          onSubmit: (v) => {
            let slug = v.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "page";
            while (store.pages.some((p) => p.slug === slug)) slug += "-2";
            const p = { id: K.uid("pg"), title: v.title, slug, inNav: true };
            p.sections = K.pageSections(p, ctx());
            store.pages.push(p); state.pageId = p.id; state.selected = null; state.mode = "sections";
            changed({ panel: true }); toast("Page added");
          },
        });
      }
    });

    root.querySelector(".ed-top").addEventListener("click", async (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      // Stop here: a click reaching the page area would close the phone menu again
      if (b.id === "ed-side") { e.stopPropagation(); toggleSide(); return; }
      if (b.dataset.device) { state.device = b.dataset.device; paintTop(); return; }
      if (b.dataset.mode) {
        const same = state.mode === b.dataset.mode && state.panelOpen;
        state.mode = same ? "sections" : b.dataset.mode; state.panelOpen = innerWidth >= 900 || !same;
        paintPanel(); return;
      }
      if (b.id === "ed-undo") undo();
      if (b.id === "ed-redo") redo();
      if (b.id === "ed-reset") {
        if (!(await confirm(`Reset the ${page().title} page?`, "Its sections go back to the starting layout. Header, footer and other pages stay. You can undo this.", "Reset page"))) return;
        page().sections = K.pageSections(page(), ctx()); state.selected = null;
        changed({ panel: true }); toast(page().title + " page reset");
      }
      if (b.id === "ed-publish") { if (recordTimer) record(); d.publish(); paintTop(); }
    });

    const onKey = (e) => {
      if (!root.isConnected) return;
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || "");
      if (!(e.ctrlKey || e.metaKey) || typing) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((k === "z" && e.shiftKey) || k === "y") { e.preventDefault(); redo(); }
    };
    addEventListener("keydown", onKey);
    const cleanup = () => {
      if (root.isConnected && root.querySelector(".ed")) return;
      removeEventListener("keydown", onKey); removeEventListener("hashchange", cleanup);
      document.body.classList.remove("editor-open", "ed-side-hidden");
      if (recordTimer) record();
    };
    addEventListener("hashchange", cleanup);

    paintAll();
    paintSide();
  };

  return { mount, upload };
})();
