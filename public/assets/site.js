// Shopilier storefront: the section model, defaults and renderer shared by the
// website editor, the Themes previews and "View your store".
window.SiteKit = (() => {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = (p) => p + Math.random().toString(36).slice(2, 9);
  const taka = (n) => "৳" + Number(n || 0).toLocaleString("en-IN");
  // Only web, mail, phone and on-site links; anything else becomes "#"
  const safeLink = (u) => {
    u = String(u || "").trim();
    return /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(u) ? u : "#";
  };
  const safeImg = (u) => /^(\/media\/[\w-]+|https:\/\/[^\s"'<>]+)$/.test(String(u || "")) ? u : "";

  const FONTS = {
    // Single quotes: these go inside a style="" attribute
    modern: { label: "Modern", css: "'Inter', ui-sans-serif, system-ui, sans-serif" },
    elegant: { label: "Elegant", css: "'DM Serif Display', Georgia, serif" },
    classic: { label: "Classic", css: "'Lora', Georgia, serif" },
    friendly: { label: "Friendly", css: "'Poppins', ui-sans-serif, sans-serif" },
  };
  const FONT_LINK = "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700&family=Lora:wght@400;600;700&family=Poppins:wght@400;500;600;700&display=swap";
  const TEMPLATE_FONTS = { "luxe-store": "elegant", "bistro-restaurant": "elegant", "writely-blog": "classic", "mia-personal": "friendly" };

  const ICONS = {
    truck: '<path d="M3 6h11v9H3zM14 9h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8S10.5 4 8 4.5 7 8 12 8zm0 0s1.5-4 4-3.5S17 8 12 8z"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    leaf: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19 14 10"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    tag: '<path d="M3 12V3h9l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h12L22 7H6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    pin: '<path d="M12 21s-7-6-7-12a7 7 0 0 1 14 0c0 6-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    quote: '<path d="M7 7h4v6H5V9a2 2 0 0 1 2-2zm10 0h4v6h-6V9a2 2 0 0 1 2-2zM5 13c0 3 2 4 4 4m6-4c0 3 2 4 4 4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
  };
  const svg = (name, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  const FEATURE_ICONS = ["truck", "shield", "headset", "gift", "star", "leaf", "clock", "tag"];
  // Social media platforms: name, an example link, and a one-color logo (24px grid, filled with currentColor).
  // The first four always show in Preferences; the rest can be added there.
  const SOCIALS = {
    facebook: { name: "Facebook", ph: "https://facebook.com/yourpage", d: "M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" },
    instagram: { name: "Instagram", ph: "https://instagram.com/yourname", d: "M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3c1.2-.1 1.6-.1 4.8-.1zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.2 4.4 2.6 6.8 7 7 1.2.1 1.6.1 4.9.1s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.2-4.4-2.6-6.8-7-7C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.9 1.4 1.4 0 0 0 0-2.9z" },
    youtube: { name: "YouTube", ph: "https://youtube.com/@yourchannel", d: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" },
    tiktok: { name: "TikTok", ph: "https://tiktok.com/@yourname", d: "M19.6 6.7a4.8 4.8 0 0 1-3.8-4.2V2h-3.4v13.7a2.9 2.9 0 1 1-2-2.8V9.4a6.3 6.3 0 1 0 5.4 6.3V8.7a8.2 8.2 0 0 0 4.8 1.5V6.8a4.9 4.9 0 0 1-1-.1z" },
    x: { name: "X (Twitter)", ph: "https://x.com/yourname", d: "M18.2 2.2h3.4l-7.4 8.5L23 21.8h-6.8l-5.3-7-6.1 7H1.4l7.9-9.1L.9 2.2h7l4.8 6.4 5.5-6.4zm-1.2 17.6h1.9L7.1 4.1H5.1l11.9 15.7z" },
    linkedin: { name: "LinkedIn", ph: "https://linkedin.com/company/yourname", d: "M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.4V9h3.4v1.6c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4a2.1 2.1 0 1 1 0-4.1 2.1 2.1 0 0 1 0 4.1zm1.8 13.1H3.6V9h3.5v11.5zM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0z" },
    whatsapp: { name: "WhatsApp", ph: "https://wa.me/8801XXXXXXXXX", d: "M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-.9 1.2-.3.2-.6.1a8.2 8.2 0 0 1-4.1-3.6c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.5 13.5 0 0 0 5.2 4.6c1.9.8 2.7.9 3.6.7a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.2-.3-.3-.6-.4zM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8zM12 0a12 12 0 0 0-10.3 18.1L0 24l6.1-1.6A12 12 0 1 0 12 0z" },
    pinterest: { name: "Pinterest", ph: "https://pinterest.com/yourname", d: "M12 0a12 12 0 0 0-4.4 23.2c-.1-.9-.2-2.4 0-3.4l1.4-6s-.4-.7-.4-1.8c0-1.7 1-2.9 2.2-2.9 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1 4-.3 1.2.6 2.2 1.8 2.2 2.1 0 3.8-2.3 3.8-5.5 0-2.9-2.1-4.9-5.1-4.9a5.3 5.3 0 0 0-5.5 5.3c0 1 .4 2.2.9 2.8.1.1.1.2.1.4l-.3 1.4c-.1.2-.2.3-.4.2-1.5-.7-2.4-2.9-2.4-4.6 0-3.8 2.7-7.2 7.9-7.2 4.1 0 7.3 2.9 7.3 6.9 0 4.1-2.6 7.4-6.2 7.4-1.2 0-2.4-.6-2.7-1.4l-.8 2.8c-.3 1.1-1 2.4-1.5 3.2A12 12 0 1 0 12 0z" },
    threads: { name: "Threads", ph: "https://threads.net/@yourname", d: "M17.3 11.1l-.4-.2c-.2-3.4-2.1-5.4-5.2-5.4-1.9 0-3.4.8-4.4 2.3l1.7 1.2c.7-1.1 1.8-1.3 2.7-1.3 1 0 1.8.3 2.3.9.4.4.6 1 .7 1.8a12 12 0 0 0-2.8-.1c-2.8.2-4.6 1.8-4.5 4.1 0 1.2.6 2.2 1.6 2.8.8.6 1.9.8 3 .8 1.5-.1 2.6-.7 3.4-1.7.6-.8 1-1.8 1.1-3 .7.4 1.3 1 1.6 1.7.5 1.2.6 3.3-1.1 5-1.5 1.5-3.3 2.1-6 2.1-3 0-5.2-1-6.7-2.9C3.8 17.4 3.1 15 3.1 12s.7-5.4 2.1-7.2C6.6 2.9 8.9 1.9 11.9 1.9c3 0 5.3 1 6.8 2.9.8.9 1.3 2.1 1.7 3.4l2-.5c-.4-1.7-1.1-3.1-2.1-4.3C18.3 1.1 15.5-.1 11.9 0 8.3 0 5.6 1.2 3.7 3.5 2 5.6 1.2 8.5 1.2 12s.8 6.4 2.5 8.5C5.6 22.8 8.3 24 11.9 24c3.2 0 5.5-.9 7.4-2.7 2.5-2.5 2.4-5.6 1.6-7.5-.6-1.4-1.8-2.5-3.5-3.2zm-5.6 5.3c-1.3.1-2.6-.5-2.7-1.6 0-.8.6-1.8 2.6-1.9h.7c.7 0 1.4.1 2 .2-.2 2.8-1.6 3.2-2.6 3.3z" },
    telegram: { name: "Telegram", ph: "https://t.me/yourname", d: "M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.6 8.2-2 9.3c-.1.7-.5.8-1.1.5l-3-2.2-1.4 1.4c-.2.2-.3.3-.6.3l.2-3.1 5.6-5c.2-.2 0-.3-.4-.1l-6.9 4.3-3-.9c-.6-.2-.7-.6.1-1l11.6-4.5c.6-.2 1 .1.9 1z" },
  };
  const SOCIAL_NAMES = Object.fromEntries(Object.entries(SOCIALS).map(([k, v]) => [k, v.name]));
  const socialIcon = (k, cls = "") => SOCIALS[k] ? `<svg class="soc ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${SOCIALS[k].d}"/></svg>` : "";

  // ---------- Section types ----------
  // label + icon for the "Add section" grid; make() returns a new section's content
  const TYPES = {
    hero: { label: "Hero", icon: "image" },
    products: { label: "Products", icon: "grid" },
    featured: { label: "Featured", icon: "star" },
    categories: { label: "Categories", icon: "tag" },
    about: { label: "About", icon: "user" },
    testimonials: { label: "Testimonials", icon: "chat" },
    blog: { label: "Blog", icon: "pages" },
    newsletter: { label: "Newsletter", icon: "mail" },
    contact: { label: "Contact", icon: "phone" },
    faq: { label: "FAQ", icon: "help" },
    banner: { label: "Image banner", icon: "layout" },
    custom: { label: "Custom", icon: "plus" },
    // Only on the Checkout page (not in the section library)
    checkout: { label: "Checkout", icon: "cart" },
  };
  const blankStyle = () => ({ bg: "", text: "", padding: "m", align: "left" });
  const section = (type, content, style = {}) => ({ id: uid("s"), type, hidden: false, content, style: { ...blankStyle(), ...style }, blocks: [] });

  const make = (type, ctx = {}) => {
    const site = ctx.site || {};
    const cats = [...new Set((ctx.products || []).map((p) => p.category).filter(Boolean))].slice(0, 4);
    switch (type) {
      case "hero": return section("hero", {
        eyebrow: "New collection", title: site.headline || "Your headline goes here", subtitle: site.sub || "Tell visitors what you sell and why they'll love it.",
        btn1: { text: site.cta || "Shop Now", link: "/shop" }, btn2: { text: "Explore Collection", link: "/shop" }, image: "",
        badge: { show: false, top: "Up to", big: "50%", bottom: "OFF" },
        features: [
          { icon: "truck", title: "Fast delivery", text: "All over Bangladesh" },
          { icon: "shield", title: "Secure payment", text: "bKash, Nagad & cash on delivery" },
          { icon: "headset", title: "Friendly support", text: "We're here to help" },
        ],
      }, { layout: site.layout || "split" });
      case "products": return section("products", { eyebrow: "Featured products", title: "Our Best Sellers", subtitle: "Discover our most loved products, carefully selected for you.", count: 4, viewAll: { text: "View All", link: "/shop" } }, { columns: 4 });
      case "featured": return section("featured", { eyebrow: "Featured", title: "Made to last", text: "Show off a collection, a new arrival or a special offer here.", button: { text: "Shop the collection", link: "/shop" }, image: "" }, { imageSide: "right" });
      case "categories": return section("categories", { eyebrow: "Shop by category", title: "Find what you love", items: (cats.length ? cats : ["New arrivals", "Best sellers", "Accessories"]).map((name) => ({ name, image: "", link: "/shop" })) });
      case "about": return section("about", { eyebrow: "Our story", title: "About us", text: site.about || "Tell customers who you are, what you make and why you started.", image: "", button: { text: "", link: "" } }, { imageSide: "left" });
      case "testimonials": return section("testimonials", { eyebrow: "Reviews", title: "What our customers say", items: [
        { quote: "Beautiful quality and super fast delivery. Will order again!", name: "Customer name", role: "Dhaka", rating: 5 },
        { quote: "Exactly as shown in the pictures. Great service.", name: "Customer name", role: "Chattogram", rating: 5 },
        { quote: "Lovely packaging and friendly support team.", name: "Customer name", role: "Sylhet", rating: 5 },
      ] }, { align: "center" });
      case "blog": return section("blog", { eyebrow: "From the blog", title: "Latest stories", items: [
        { title: "Your first blog post", excerpt: "Share tips, news and stories with your customers.", image: "", date: "", link: "#" },
        { title: "A second post", excerpt: "Write about new products, behind the scenes or styling ideas.", image: "", date: "", link: "#" },
        { title: "A third post", excerpt: "Regular posts help customers find you on Google.", image: "", date: "", link: "#" },
      ] });
      case "newsletter": return section("newsletter", { title: "Join our newsletter", text: "Get new arrivals and special offers in your inbox.", placeholder: "Your email address", button: "Subscribe" }, { align: "center" });
      // Phone, email and address left empty use the store details from Preferences
      case "contact": return section("contact", { title: "Get in touch", text: "Questions about an order or a product? We're happy to help.", phone: "", email: "", address: "", showForm: true });
      case "faq": return section("faq", { title: "Frequently asked questions", items: [
        { q: "How long does delivery take?", a: "Inside Dhaka 1–2 days, outside Dhaka 2–4 days." },
        { q: "How can I pay?", a: "bKash, Nagad, card or cash on delivery." },
        { q: "Can I return a product?", a: "Yes, within 7 days if it's unused and in its original packaging." },
      ] });
      case "banner": return section("banner", { image: "", title: "A big statement", text: "Use an image banner to set the mood.", button: { text: "Shop Now", link: "/shop" } }, { height: "m", align: "center" });
      case "checkout": return section("checkout", { ...CHECKOUT, delivery: CHECKOUT.delivery.map((d) => ({ ...d })) });
      case "custom": {
        const s = section("custom", {});
        s.blocks = [makeBlock("heading", "A new section"), makeBlock("text", "Add headings, text, buttons and images to build anything you like.")];
        return s;
      }
    }
    return null;
  };

  // ---------- Section library: ready-made sections shown with live previews ----------
  const LIBRARY = [
    ["hero", "Image on the right", { layout: "split" }], ["hero", "Centered", { layout: "center" }], ["hero", "Full-width image", { layout: "bleed" }],
    ["products", "4 per row", { columns: 4 }], ["products", "3 per row", { columns: 3 }],
    ["featured", "Image on the right", { imageSide: "right" }], ["featured", "Image on the left", { imageSide: "left" }],
    ["categories", "Category tiles", {}],
    ["about", "Image on the left", { imageSide: "left" }], ["about", "Image on the right", { imageSide: "right" }],
    ["testimonials", "Review cards", {}], ["blog", "Latest posts", {}], ["newsletter", "Email sign-up", {}],
    ["contact", "Details and form", {}], ["faq", "Questions and answers", {}],
    ["banner", "Medium height", { height: "m" }], ["banner", "Tall", { height: "l" }],
    ["custom", "Blank, add your own elements", {}],
  ].map(([type, name, style]) => ({ type, name, style }));
  const fromLibrary = (item, ctx) => { const sec = make(item.type, ctx); Object.assign(sec.style, item.style); return sec; };

  // ---------- Elements (blocks) that can be added to any section ----------
  const BLOCKS = { heading: "Heading", text: "Text", button: "Button", image: "Image", spacer: "Spacer", divider: "Divider" };
  const makeBlock = (type, text) => ({
    id: uid("b"), type,
    text: text ?? (type === "heading" ? "New heading" : type === "text" ? "Write something here." : type === "button" ? "Click here" : ""),
    link: type === "button" ? "/shop" : "", image: "", size: "m",
  });

  // Everything on the Checkout page the store owner can change
  const CHECKOUT = {
    title: "Checkout", subtitle: "Almost done! Fill in your details and we'll deliver your order.", showSteps: true,
    detailsTitle: "Your details", nameLabel: "Full name", namePh: "Your name", phoneLabel: "Phone", phonePh: "01XXX-XXXXXX",
    showEmail: true, emailLabel: "Email (optional)", emailPh: "you@email.com",
    deliveryTitle: "Delivery", addressLabel: "Full address", addressPh: "House, road, area, city",
    delivery: [{ label: "Inside Dhaka", fee: 60 }, { label: "Outside Dhaka", fee: 120 }],
    paymentTitle: "Payment",
    showNote: true, noteLabel: "Order note (optional)", notePh: "Anything we should know?",
    summaryTitle: "Order summary", showCoupon: true, couponPh: "Discount code", couponButton: "Apply",
    button: "Place order", buttonTotal: true, note: "You can return unused items within 7 days.",
    showSecure: true, secureText: "Your details are safe with us",
  };
  const PAYMENTS = { cod: "Cash on delivery", bkash: "bKash", nagad: "Nagad", card: "Card" };

  // Starting sections for a page, based on its address
  const pageSections = (page, ctx) => {
    const slug = page.slug || "";
    const site = ctx.site || {};
    if (slug === "") {
      const list = [make("hero", ctx), make("products", ctx), make("categories", ctx), make("about", ctx), make("testimonials", ctx), make("newsletter", ctx)];
      if (site.showProducts === false) list[1].hidden = true;
      if (site.showAbout === false) list[3].hidden = true;
      return list;
    }
    if (slug === "shop") { const p = make("products", ctx); Object.assign(p.content, { eyebrow: "Shop", title: "All products", subtitle: "", count: 12, viewAll: { text: "", link: "" } }); return [p]; }
    if (slug === "about") return [make("about", ctx), make("testimonials", ctx)];
    if (slug === "contact") return [make("contact", ctx), make("faq", ctx)];
    if (page.system === "checkout") return [make("checkout", ctx)];
    const c = make("custom", ctx);
    c.blocks[0].text = page.title;
    return [c];
  };

  // Bring an older store (one hero + a few switches) onto the section model. Safe to call every load.
  const ensure = (site, pages, ctx = {}) => {
    ctx = { ...ctx, site };
    site.headingFont ||= TEMPLATE_FONTS[site.template] || "modern";
    site.bodyFont ||= site.font === "classic" ? "classic" : site.font === "friendly" ? "friendly" : "modern";
    site.radius ||= "soft";
    site.header ||= { logo: "", announcement: { show: false, text: "Free delivery on orders over ৳2,000" }, search: true, account: true, cart: true, style: blankStyle() };
    site.footer ||= { text: site.about || "", showMenu: true, showContact: true, showSocial: true, copyright: "", style: blankStyle() };
    pages.forEach((p) => { if (!Array.isArray(p.sections)) p.sections = pageSections(p, ctx); });
    // Every store has a Checkout page: it can be edited or reset, but not deleted, and its link stays /checkout
    if (!pages.some((p) => p.system === "checkout")) {
      let co = pages.find((p) => p.slug === "checkout");
      if (!co) { co = { id: uid("pg"), title: "Checkout", slug: "checkout", inNav: false }; pages.push(co); }
      Object.assign(co, { system: "checkout", locked: true, inNav: false });
      if (!Array.isArray(co.sections)) co.sections = [];
      if (!co.sections.some((x) => x.type === "checkout")) co.sections.unshift(make("checkout", ctx));
    }
    // Checkout sections from before every part was editable get the new options (and keep their changes)
    pages.forEach((p) => p.sections.forEach((sec) => {
      if (sec.type !== "checkout") return;
      const c = sec.content;
      if (!Array.isArray(c.delivery)) {
        c.delivery = [{ label: c.insideLabel || "Inside Dhaka", fee: Number(c.insideFee ?? 60) }, { label: c.outsideLabel || "Outside Dhaka", fee: Number(c.outsideFee ?? 120) }];
        ["insideLabel", "insideFee", "outsideLabel", "outsideFee"].forEach((k) => delete c[k]);
      }
      Object.keys(CHECKOUT).forEach((k) => { if (c[k] === undefined) c[k] = CHECKOUT[k]; });
    }));
    // Contact sections that only copied the store details now follow them
    pages.forEach((p) => p.sections.forEach((sec) => {
      if (sec.type === "contact") ["phone", "email", "address"].forEach((k) => { if (sec.content[k] && sec.content[k] === site[k]) sec.content[k] = ""; });
    }));
    return site;
  };

  // Switching template changes the look; text, images and sections stay
  const applyTemplate = (site, pages, t) => {
    Object.assign(site, { template: t.id, layout: t.layout, bg: t.bg, text: t.text, accent: t.accent, headingFont: TEMPLATE_FONTS[t.id] || "modern" });
    pages.forEach((p) => (p.sections || []).forEach((s) => { if (s.type === "hero") s.style.layout = t.layout; }));
  };

  // ---------- Rendering ----------
  const isDark = (hex) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ""));
    if (!m) return false;
    const n = parseInt(m[1], 16);
    return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 128;
  };
  const color = (c) => (/^#[0-9a-f]{3,8}$/i.test(String(c || "")) ? c : "");
  const RADIUS = { sharp: "0px", soft: "8px", round: "999px" };
  const rootStyle = (site) => {
    const bg = color(site.bg) || "#ffffff", text = color(site.text) || "#111111", accent = color(site.accent) || "#111111";
    return `--bg:${bg};--text:${text};--accent:${accent};--on-accent:${isDark(accent) ? "#ffffff" : "#111111"};--soft:${isDark(bg) ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.035)"};--line:${isDark(bg) ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.09)"};--hfont:${(FONTS[site.headingFont] || FONTS.modern).css};--bfont:${(FONTS[site.bodyFont] || FONTS.modern).css};--btn-radius:${RADIUS[site.radius] || RADIUS.soft}`;
  };
  const sectionStyle = (st = {}) => {
    const bg = color(st.bg), tx = color(st.text);
    return [bg && `--bg:${bg};background:${bg}`, tx && `--text:${tx};color:${tx}`, bg && `--soft:${isDark(bg) ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.035)"}`, bg && `--line:${isDark(bg) ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.09)"}`].filter(Boolean).join(";");
  };
  const img = (src, cls, alt = "", ed) => {
    const s = safeImg(src);
    return s ? `<img class="${cls}" src="${esc(s)}" alt="${esc(alt)}" loading="lazy">` : `<div class="${cls} ph">${ed ? "<span>Add an image</span>" : ""}</div>`;
  };
  const btn = (b, cls = "btn") => (b && b.text ? `<a class="${cls}" href="${esc(safeLink(b.link))}">${esc(b.text)}</a>` : "");
  const head = (c) => `${c.eyebrow ? `<p class="eyebrow">${esc(c.eyebrow)}</p>` : ""}${c.title ? `<h2>${esc(c.title)}</h2>` : ""}`;
  const stars = (n) => `<span class="stars" aria-label="${n} out of 5">${"★".repeat(Math.max(0, Math.min(5, n | 0)))}<i>${"★".repeat(5 - Math.max(0, Math.min(5, n | 0)))}</i></span>`;

  const renderBlocks = (blocks, ed) => !blocks || !blocks.length ? "" : `<div class="blocks">${blocks.map((b) => {
    const cls = `blk blk-${b.type} size-${b.size || "m"}`;
    if (b.type === "heading") return `<h3 class="${cls}">${esc(b.text)}</h3>`;
    if (b.type === "text") return `<p class="${cls}">${esc(b.text)}</p>`;
    if (b.type === "button") return b.text ? `<a class="${cls} btn" href="${esc(safeLink(b.link))}">${esc(b.text)}</a>` : "";
    if (b.type === "image") return `<div class="${cls}">${img(b.image, "blk-img", b.text, ed)}</div>`;
    if (b.type === "spacer") return `<div class="${cls}"></div>`;
    if (b.type === "divider") return `<hr class="${cls}">`;
    return "";
  }).join("")}</div>`;

  const RENDER = {
    hero: (c, st, ctx) => {
      const layout = st.layout || "split";
      const features = (c.features || []).filter((f) => f.title);
      return `<div class="hero hero-${esc(layout)}">
        ${layout === "bleed" ? `<div class="hero-bg">${img(c.image, "hero-img", c.title, ctx.ed)}</div>` : ""}
        <div class="wrap hero-grid">
          <div class="hero-copy">
            ${c.eyebrow ? `<p class="eyebrow">${esc(c.eyebrow)}</p>` : ""}
            <h1>${esc(c.title)}</h1>
            ${c.subtitle ? `<p class="lead">${esc(c.subtitle)}</p>` : ""}
            ${c.btn1?.text || c.btn2?.text ? `<div class="btns">${btn(c.btn1, "btn")}${btn(c.btn2, "btn btn-outline")}</div>` : ""}
            ${features.length ? `<div class="features">${features.map((f) => `<div class="feature">${svg(FEATURE_ICONS.includes(f.icon) ? f.icon : "star")}<div><b>${esc(f.title)}</b>${f.text ? `<span>${esc(f.text)}</span>` : ""}</div></div>`).join("")}</div>` : ""}
            ${ctx.blocks}
          </div>
          ${layout === "bleed" ? "" : `<div class="hero-media">${img(c.image, "hero-img", c.title, ctx.ed)}${c.badge?.show ? `<div class="badge"><span>${esc(c.badge.top)}</span><b>${esc(c.badge.big)}</b><span>${esc(c.badge.bottom)}</span></div>` : ""}</div>`}
        </div>
      </div>`;
    },
    products: (c, st, ctx) => {
      const list = (ctx.products || []).filter((p) => p.status !== "draft").slice(0, Math.max(1, Math.min(24, Number(c.count) || 4)));
      return `<div class="wrap">
        <div class="sec-head"><div>${head(c)}${c.subtitle ? `<p class="sub">${esc(c.subtitle)}</p>` : ""}</div>${c.viewAll?.text ? `<a class="more" href="${esc(safeLink(c.viewAll.link))}">${esc(c.viewAll.text)}${svg("arrow")}</a>` : ""}</div>
        ${list.length ? `<div class="grid cols-${Number(st.columns) || 4}">${list.map((p) => `
          <a class="card product" href="#">
            <div class="p-img" style="background:${esc(color(p.color) || "#e9e6e1")}">${safeImg(p.image) ? `<img src="${esc(p.image)}" alt="" loading="lazy">` : `<span>${esc((p.name || "?").slice(0, 1))}</span>`}</div>
            <div class="p-body"><b>${esc(p.name)}</b><span class="price">${taka(p.price)}</span>${p.stock === 0 ? '<span class="sold">Sold out</span>' : ""}</div>
          </a>`).join("")}</div>` : `<p class="empty">Your products will appear here once you add them.</p>`}
        ${ctx.blocks}
      </div>`;
    },
    featured: (c, st, ctx) => `<div class="wrap split ${st.imageSide === "left" ? "img-left" : ""}">
        <div class="split-copy">${head(c)}${c.text ? `<p class="lead">${esc(c.text)}</p>` : ""}${c.button?.text ? `<div class="btns">${btn(c.button)}</div>` : ""}${ctx.blocks}</div>
        <div class="split-media">${img(c.image, "split-img", c.title, ctx.ed)}</div>
      </div>`,
    categories: (c, st, ctx) => `<div class="wrap">
        <div class="sec-head"><div>${head(c)}</div></div>
        <div class="grid cols-${Math.min(4, Math.max(2, (c.items || []).length))}">${(c.items || []).map((it) => `
          <a class="cat" href="${esc(safeLink(it.link))}">${img(it.image, "cat-img", it.name, ctx.ed)}<b>${esc(it.name)}</b></a>`).join("")}</div>
        ${ctx.blocks}
      </div>`,
    about: (c, st, ctx) => `<div class="wrap split ${st.imageSide === "right" ? "" : "img-left"}">
        <div class="split-copy">${head(c)}${c.text ? `<p class="lead">${esc(c.text)}</p>` : ""}${c.button?.text ? `<div class="btns">${btn(c.button, "btn btn-outline")}</div>` : ""}${ctx.blocks}</div>
        <div class="split-media">${img(c.image, "split-img", c.title, ctx.ed)}</div>
      </div>`,
    testimonials: (c, st, ctx) => `<div class="wrap">
        <div class="sec-head"><div>${head(c)}</div></div>
        <div class="grid cols-${Math.min(3, Math.max(1, (c.items || []).length))}">${(c.items || []).map((t) => `
          <figure class="card quote">${stars(t.rating ?? 5)}<blockquote>“${esc(t.quote)}”</blockquote><figcaption><b>${esc(t.name)}</b>${t.role ? `<span>${esc(t.role)}</span>` : ""}</figcaption></figure>`).join("")}</div>
        ${ctx.blocks}
      </div>`,
    blog: (c, st, ctx) => `<div class="wrap">
        <div class="sec-head"><div>${head(c)}</div></div>
        <div class="grid cols-3">${(c.items || []).map((p) => `
          <a class="card post" href="${esc(safeLink(p.link))}">${img(p.image, "post-img", p.title, ctx.ed)}<div class="p-body">${p.date ? `<span class="date">${esc(p.date)}</span>` : ""}<b>${esc(p.title)}</b><span>${esc(p.excerpt)}</span></div></a>`).join("")}</div>
        ${ctx.blocks}
      </div>`,
    newsletter: (c, st, ctx) => `<div class="wrap narrow news">
        ${c.title ? `<h2>${esc(c.title)}</h2>` : ""}${c.text ? `<p class="lead">${esc(c.text)}</p>` : ""}
        <form class="news-form" onsubmit="return false"><input type="email" placeholder="${esc(c.placeholder || "Your email")}" aria-label="Email address"><button class="btn" type="submit">${esc(c.button || "Subscribe")}</button></form>
        ${ctx.blocks}
      </div>`,
    contact: (c, st, ctx) => `<div class="wrap split contact">
        <div class="split-copy">${c.title ? `<h2>${esc(c.title)}</h2>` : ""}${c.text ? `<p class="lead">${esc(c.text)}</p>` : ""}
          <ul class="contact-list">${[["phone", "phone"], ["email", "mail"], ["address", "pin"]].map(([k, ic]) => { const val = c[k] || (ctx.site || {})[k]; return val ? `<li>${svg(ic)}${esc(val)}</li>` : ""; }).join("")}</ul>${ctx.blocks}</div>
        ${c.showForm ? `<form class="card contact-form" onsubmit="return false"><input placeholder="Your name"><input type="email" placeholder="Email"><textarea rows="4" placeholder="Message"></textarea><button class="btn" type="submit">Send message</button></form>` : ""}
      </div>`,
    faq: (c, st, ctx) => `<div class="wrap narrow">
        ${c.title ? `<h2>${esc(c.title)}</h2>` : ""}
        <div class="faq">${(c.items || []).map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}</div>
        ${ctx.blocks}
      </div>`,
    banner: (c, st, ctx) => `<div class="banner h-${esc(st.height || "m")}">${img(c.image, "banner-img", c.title, ctx.ed)}<div class="wrap banner-copy">${c.title ? `<h2>${esc(c.title)}</h2>` : ""}${c.text ? `<p class="lead">${esc(c.text)}</p>` : ""}${c.button?.text ? `<div class="btns">${btn(c.button)}</div>` : ""}${ctx.blocks}</div></div>`,
    // Checkout: details, delivery, payment and an order summary, in the website's own colors and fonts
    checkout: (c, st, ctx) => {
      const items = (ctx.products || []).filter((p) => p.status !== "draft").slice(0, 2);
      const opts = (Array.isArray(c.delivery) ? c.delivery : []).map((d) => ({ label: d.label || "Delivery", fee: Math.max(0, Number(d.fee) || 0) }));
      const fee = opts.length ? opts[0].fee : 0;
      const sub = items.reduce((a, p) => a + (Number(p.price) || 0), 0), total = sub + fee;
      const pays = (ctx.site && ctx.site.payments && ctx.site.payments.length ? ctx.site.payments : ["Cash on delivery"]);
      const field = (label, type, ph) => `<label class="co-field">${label ? `<span>${esc(label)}</span>` : ""}${type === "area" ? `<textarea rows="2" placeholder="${esc(ph)}"></textarea>` : `<input type="${type}" placeholder="${esc(ph)}">`}</label>`;
      let n = 0;
      const step = (title) => (title || c.showSteps ? `<h3>${c.showSteps ? `<i>${++n}</i>` : ""}${esc(title)}</h3>` : "");
      // Picking a delivery option updates the delivery charge and total
      const pick = `var f=+this.dataset.fee,s=+this.form.dataset.sub,q=this.closest('.checkout');q.querySelector('.co-fee').textContent=this.dataset.label;q.querySelectorAll('.co-tot').forEach(function(e){e.textContent='৳'+(s+f).toLocaleString('en-IN')})`;
      return `<div class="wrap checkout">
        <div class="co-head">${c.title ? `<h1>${esc(c.title)}</h1>` : ""}${c.subtitle ? `<p class="lead">${esc(c.subtitle)}</p>` : ""}</div>
        <div class="co-grid">
          <form class="co-form" onsubmit="return false" data-sub="${sub}">
            <div class="co-step">${step(c.detailsTitle)}<div class="co-row">${field(c.nameLabel, "text", c.namePh)}${field(c.phoneLabel, "tel", c.phonePh)}</div>${c.showEmail ? field(c.emailLabel, "email", c.emailPh) : ""}</div>
            <div class="co-step">${step(c.deliveryTitle)}${field(c.addressLabel, "area", c.addressPh)}
              ${opts.length ? `<div class="co-options">${opts.map((d, i) => `<label class="co-option"><input type="radio" name="delivery" data-fee="${d.fee}" data-label="${esc(taka(d.fee))}" onchange="${esc(pick)}"${i ? "" : " checked"}><span>${esc(d.label)}</span><b>${taka(d.fee)}</b></label>`).join("")}</div>` : ""}</div>
            <div class="co-step">${step(c.paymentTitle)}<div class="co-options">${pays.map((p, i) => `<label class="co-option"><input type="radio" name="pay"${i ? "" : " checked"}><span>${esc(p)}</span></label>`).join("")}</div></div>
            ${c.showNote ? `<div class="co-step">${field(c.noteLabel, "area", c.notePh)}</div>` : ""}
            <button class="btn co-place" type="submit">${esc(c.button || "Place order")}${c.buttonTotal ? ` · <span class="co-tot">${taka(total)}</span>` : ""}</button>
            ${c.note ? `<p class="co-small">${esc(c.note)}</p>` : ""}
            ${ctx.blocks}
          </form>
          <aside class="co-summary">
            ${c.summaryTitle ? `<h3>${esc(c.summaryTitle)}</h3>` : ""}
            ${items.length ? items.map((p) => `<div class="co-item"><span class="co-img" style="background:${esc(color(p.color) || "#e9e6e1")}">${safeImg(p.image) ? `<img src="${esc(p.image)}" alt="">` : ""}<em>1</em></span><span class="co-name">${esc(p.name)}</span><b>${taka(p.price)}</b></div>`).join("") : `<p class="empty">Items in the cart show here.</p>`}
            ${c.showCoupon ? `<div class="co-coupon"><input placeholder="${esc(c.couponPh || "Discount code")}" aria-label="${esc(c.couponPh || "Discount code")}"><button class="btn btn-outline" type="button">${esc(c.couponButton || "Apply")}</button></div>` : ""}
            <div class="co-line"><span>Subtotal</span><span>${taka(sub)}</span></div>
            ${opts.length ? `<div class="co-line"><span>Delivery</span><span class="co-fee">${taka(fee)}</span></div>` : ""}
            <div class="co-line co-total"><span>Total</span><span class="co-tot">${taka(total)}</span></div>
            ${c.showSecure && c.secureText ? `<p class="co-secure">${svg("shield")}${esc(c.secureText)}</p>` : ""}
          </aside>
        </div>
      </div>`;
    },
    custom: (c, st, ctx) => `<div class="wrap narrow">${ctx.blocks || (ctx.ed ? '<p class="empty">Add elements to this section from the panel.</p>' : "")}</div>`,
  };

  const navPages = (pages) => pages.filter((p) => p.inNav).slice(0, 5);
  const pageHref = (p) => "/" + (p.slug || "");

  const renderHeader = (site, pages, opts) => {
    const h = site.header;
    return `<header class="s-header" data-sid="header" style="${sectionStyle(h.style)}">
      ${h.announcement?.show && h.announcement.text ? `<div class="announce">${esc(h.announcement.text)}</div>` : ""}
      <div class="wrap nav">
        <a class="logo" href="/">${safeImg(h.logo) ? `<img src="${esc(h.logo)}" alt="${esc(site.name)}">` : esc(site.name || "My Store")}</a>
        <nav class="menu">${navPages(pages).map((p) => `<a href="${esc(pageHref(p))}"${opts.page && p.id === opts.page.id ? ' class="on"' : ""}>${esc(p.title)}</a>`).join("")}</nav>
        <div class="tools">${h.search ? `<span>${svg("search")}</span>` : ""}${h.account ? `<span>${svg("user")}</span>` : ""}${h.cart ? `<a href="/checkout" aria-label="Cart and checkout">${svg("cart")}</a>` : ""}<span class="burger">${svg("menu")}</span></div>
      </div>
    </header>`;
  };
  const renderFooter = (site, pages) => {
    const f = site.footer, socials = Object.entries(site.social || {}).filter(([k, v]) => v && SOCIAL_NAMES[k]);
    return `<footer class="s-footer" data-sid="footer" style="${sectionStyle(f.style)}">
      <div class="wrap foot-grid">
        <div><b class="logo">${esc(site.name || "My Store")}</b>${f.text ? `<p>${esc(f.text)}</p>` : ""}</div>
        ${f.showMenu ? `<div><b>Pages</b>${navPages(pages).map((p) => `<a href="${esc(pageHref(p))}">${esc(p.title)}</a>`).join("")}</div>` : ""}
        ${f.showContact ? `<div><b>Contact</b>${[site.phone, site.email, site.address].filter(Boolean).map((v) => `<span>${esc(v)}</span>`).join("")}</div>` : ""}
        ${f.showSocial && socials.length ? `<div><b>Follow us</b><span class="socials">${socials.map(([k, v]) => `<a href="${esc(safeLink(v))}" target="_blank" rel="noopener" aria-label="${SOCIAL_NAMES[k]}" title="${SOCIAL_NAMES[k]}">${socialIcon(k)}</a>`).join("")}</span></div>` : ""}
      </div>
      <div class="wrap copy">${esc(f.copyright || `© ${new Date().getFullYear()} ${site.name || "My Store"}. All rights reserved.`)}</div>
    </footer>`;
  };

  // The page body. opts: { page, products, ed (editor mode), selected }
  const renderBody = (site, pages, opts = {}) => {
    const page = opts.page || pages[0];
    const ed = !!opts.ed;
    const sections = (page.sections || []).filter((s) => ed || !s.hidden);
    const label = (s) => ed && opts.selected === s.id ? `<div class="ed-chip"><div class="ed-chip-in"><b>${esc((TYPES[s.type] || {}).label || s.type)}</b><button data-ed="up" title="Move up">↑</button><button data-ed="down" title="Move down">↓</button>${s.type === "checkout" ? "" : '<button data-ed="duplicate" title="Duplicate">⧉</button><button data-ed="delete" title="Delete">✕</button>'}</div></div>` : "";
    const sel = (id) => (ed && opts.selected === id ? " is-selected" : "");
    // Just the header (live menu bar preview on the Navigation page)
    if (opts.headerOnly) return `<div class="site" style="${esc(rootStyle(site))};min-height:0">${renderHeader(site, pages, { page })}</div>`;
    // Editor: a "+" on each gap between sections opens the section library (index = where it goes)
    const insert = (i) => ed && !opts.bare ? `<div class="ed-insert" data-insert="${i}"><button type="button" data-ed-add="${i}" title="Add a section here" aria-label="Add a section here">+</button></div>` : "";
    const fixedLabel = (id, name) => ed && opts.selected === id ? `<div class="ed-chip"><div class="ed-chip-in"><b>${name}</b></div></div>` : "";
    return `<div class="site" style="${esc(rootStyle(site))}">
      ${opts.bare ? "" : renderHeader(site, pages, { page }).replace('class="s-header"', `class="s-header${sel("header")}"`).replace(/(<header[^>]*>)/, `$1${fixedLabel("header", "Header")}`)}
      <main>${insert(0)}${sections.map((s, i) => {
        const R = RENDER[s.type];
        if (!R) return "";
        const st = s.style || {};
        return `<section class="s s-${esc(s.type)} pad-${esc(st.padding || "m")} align-${esc(st.align || "left")}${s.hidden ? " is-hidden" : ""}${sel(s.id)}" data-sid="${esc(s.id)}" style="${sectionStyle(st)}">${label(s)}${R(s.content || {}, st, { products: opts.products, ed, blocks: renderBlocks(s.blocks, ed), site })}</section>${insert(i + 1)}`;
      }).join("") || (ed ? '<section class="s pad-l align-center"><div class="wrap"><p class="empty">This page has no sections yet. Click + to add one.</p></div></section>' : "")}</main>
      ${opts.bare ? "" : renderFooter(site, pages).replace('class="s-footer"', `class="s-footer${sel("footer")}"`).replace(/(<footer[^>]*>)/, `$1${fixedLabel("footer", "Footer")}`)}
    </div>`;
  };

  // A full HTML document for an iframe or a new tab
  const documentHTML = (site, pages, opts = {}) => {
    const origin = opts.origin || location.origin;
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${esc((site.seo && site.seo.title) || site.name || "My Store")}</title>
      ${site.seo && site.seo.description ? `<meta name="description" content="${esc(site.seo.description)}">` : ""}
      <meta property="og:title" content="${esc((site.seo && site.seo.title) || site.name || "My Store")}">
      ${site.seo && site.seo.description ? `<meta property="og:description" content="${esc(site.seo.description)}">` : ""}
      ${site.seo && safeImg(site.seo.image) ? `<meta property="og:image" content="${esc((site.seo.image.startsWith("/") ? origin : "") + site.seo.image)}">` : ""}
      <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link rel="stylesheet" href="${FONT_LINK}"><link rel="stylesheet" href="${origin}/assets/site.css">
      </head><body${opts.ed ? ' class="editing"' : ""}>${renderBody(site, pages, opts)}</body></html>`;
  };

  // Every page in one document; menu links switch pages without leaving it (used by "View your store")
  const storeHTML = (site, pages, opts = {}) => {
    const doc = documentHTML(site, pages, { ...opts, page: pages[0] });
    // opts.start: the page to open first (default: the home page)
    const first = Math.max(0, pages.findIndex((p) => p.id === opts.start));
    const all = pages.map((p, i) => `<div data-slug="${esc(p.slug || "")}"${i === first ? "" : " hidden"}>${renderBody(site, pages, { ...opts, page: p })}</div>`).join("");
    const nav = `<script>document.addEventListener("click",function(e){var a=e.target.closest("a[href^='/']");if(!a)return;var slug=a.getAttribute("href").slice(1),pg=document.querySelector('[data-slug="'+slug+'"]');e.preventDefault();if(!pg)return;document.querySelectorAll("[data-slug]").forEach(function(d){d.hidden=d!==pg});scrollTo(0,0)});<\/script>`;
    return doc.replace(/<body([^>]*)>[\s\S]*<\/body>/, `<body$1>${all.replace(/\$/g, "$$$$")}${nav}</body>`);
  };

  return { CHECKOUT, PAYMENTS, SOCIALS, socialIcon, LIBRARY, fromLibrary, storeHTML, TEMPLATE_FONTS, esc, uid, FONTS, TYPES, BLOCKS, FEATURE_ICONS, make, makeBlock, pageSections, ensure, applyTemplate, renderBody, documentHTML, safeImg, isDark };
})();
