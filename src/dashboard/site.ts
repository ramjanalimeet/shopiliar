// @ts-nocheck — ported as-is from the original dashboard script; types can be tightened over time.
// Shopilier storefront: the section model, defaults and renderer shared by the
// website editor, the Themes previews and "View your store".
export const SiteKit = (() => {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = (p) => p + Math.random().toString(36).slice(2, 9);
  const taka = (n) => "৳" + Number(n || 0).toLocaleString("en-IN");
  // Bangla digits (০–৯) for websites in Bangla
  const bnNum = (s) => String(s).replace(/[0-9]/g, (d) => String.fromCharCode(0x09e6 + Number(d)));
  const money = (site, n) => (site && site.lang === "bn" ? bnNum(taka(n)) : taka(n));
  // Only web, mail, phone and on-site links; anything else becomes "#"
  const safeLink = (u) => {
    u = String(u || "").trim();
    return /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(u) ? u : "#";
  };
  // Image addresses a store can show: uploads (/media/…), a template's own photos (/assets/templates/…),
  // https links, and inline images (the demo keeps uploads inline)
  const safeImg = (u) => /^(\/media\/[\w-]+|\/assets\/templates\/[\w-]+\/[\w-]+\.(?:webp|jpe?g|png)|https:\/\/[^\s"'<>]+|data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+)$/.test(String(u || "")) ? u : "";

  const FONTS = {
    // Single quotes: these go inside a style="" attribute
    modern: { label: "Modern", css: "'Inter', ui-sans-serif, system-ui, sans-serif" },
    elegant: { label: "Elegant", css: "'DM Serif Display', Georgia, serif" },
    classic: { label: "Classic", css: "'Lora', Georgia, serif" },
    friendly: { label: "Friendly", css: "'Poppins', ui-sans-serif, sans-serif" },
    // Made for Bangla text, with clean Latin letters too
    bangla: { label: "Bangla", css: "'Hind Siliguri', 'Noto Sans Bengali', ui-sans-serif, sans-serif" },
  };
  const FONT_LINK = "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Lora:wght@400;600;700&family=Poppins:wght@400;500;600;700&display=swap";
  const TEMPLATE_FONTS = { "luxe-store": "bangla", "bistro-restaurant": "elegant", "writely-blog": "classic", "mia-personal": "friendly" };
  const TEMPLATE_BODY_FONTS = { "luxe-store": "bangla" };
  // Templates with a look of their own: a class on the website (styled in site.css) and,
  // with sizes, placeholders that show the photo size to upload (e.g. 1920 × 800)
  const THEMES = { "luxe-store": { cls: "theme-fashion", sizes: true } };
  const themeOf = (site) => THEMES[(site && site.template) || ""] || {};

  const ICONS = {
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
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
    chevron: '<path d="m6 9 6 6 6-6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    pin: '<path d="M12 21s-7-6-7-12a7 7 0 0 1 14 0c0 6-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    quote: '<path d="M7 7h4v6H5V9a2 2 0 0 1 2-2zm10 0h4v6h-6V9a2 2 0 0 1 2-2zM5 13c0 3 2 4 4 4m6-4c0 3 2 4 4 4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    return: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5"/><path d="M20 4v4.5h-4.5"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5"/><path d="M4 20v-4.5h4.5"/>',
    diamond: '<path d="M6.5 4h11L21 9l-9 11L3 9z"/><path d="M3 9h18M12 20 8.5 9l2-5M12 20l3.5-11-2-5"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    image: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m4 18 5.5-5.5 3.5 3.5 2.5-2.5L20 18"/>',
  };
  const svg = (name, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  const FEATURE_ICONS = ["truck", "shield", "headset", "return", "diamond", "heart", "gift", "star", "leaf", "clock", "tag"];
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

  // ---------- Website language ----------
  // The words the website itself shows (buttons, cart, checkout). English is the key; site.lang picks the language.
  const STRINGS = {
    bn: {
      "Add to cart": "কার্টে যোগ করুন", "Choose options": "সাইজ বাছাই করুন", "Sold out": "স্টক শেষ", "All": "সবগুলো",
      "New": "নতুন", "Best seller": "বেস্ট সেলার", "Sale": "অফার", "Save to wishlist": "পছন্দের তালিকায় রাখুন",
      "Your products will appear here once you add them.": "প্রোডাক্ট যোগ করলে এখানে দেখা যাবে।",
      "Pages": "পেজসমূহ", "Contact": "যোগাযোগ", "Follow us": "আমাদের সাথে থাকুন", "All rights reserved.": "সর্বস্বত্ব সংরক্ষিত।",
      "Your name": "আপনার নাম", "Email": "ইমেইল", "Message": "মেসেজ", "Send message": "মেসেজ পাঠান", "Email address": "ইমেইল ঠিকানা",
      "Subtotal": "সাবটোটাল", "Discount": "ডিসকাউন্ট", "Delivery": "ডেলিভারি চার্জ", "Total": "মোট", "Free delivery": "ফ্রি ডেলিভারি",
      "Items in the cart show here.": "কার্টের প্রোডাক্ট এখানে দেখা যাবে।", "Search": "খুঁজুন", "Search products…": "প্রোডাক্ট খুঁজুন…",
      "Account": "অ্যাকাউন্ট", "Cart": "কার্ট", "Wishlist": "পছন্দের তালিকা", "Track order": "অর্ডার ট্র্যাক করুন", "Call us": "কল করুন", "Menu": "মেনু",
      "Previous": "আগেরটি", "Next": "পরেরটি", "Add an image": "ছবি যোগ করুন", "Featured": "বাছাই করা", "Categories": "ক্যাটাগরি",
      "{name} added to your cart": "{name} কার্টে যোগ হয়েছে", "Only {n} more left in stock": "স্টকে আর মাত্র {n}টি আছে", "No more left in stock": "স্টকে আর নেই",
      "Your cart is empty.": "আপনার কার্ট খালি।", "Your cart is empty": "আপনার কার্ট খালি", "Continue shopping": "কেনাকাটা চালিয়ে যান", "Remove": "বাদ দিন",
      "One less": "একটি কম", "One more": "একটি বেশি", "Close": "বন্ধ করুন", "Please choose a {opt}": "{opt} বাছাই করুন",
      "Code {code} applied": "কোড {code} যোগ হয়েছে", " (one use per customer)": " (প্রতি কাস্টমার একবার)",
      "Thank you!": "ধন্যবাদ!", "Your order is placed. We'll call you soon to confirm it.": "আপনার অর্ডারটি হয়েছে। নিশ্চিত করতে আমরা শিগগিরই ফোন করব।", "Back to the shop": "শপে ফিরে যান",
      "No products match “{q}”": "“{q}” নামে কোনো প্রোডাক্ট পাওয়া যায়নি", "Saved to your wishlist": "পছন্দের তালিকায় রাখা হয়েছে", "Removed from your wishlist": "পছন্দের তালিকা থেকে সরানো হয়েছে",
      "That code doesn't work": "এই কোডটি কাজ করছে না", "This code isn't active yet": "কোডটি এখনো চালু হয়নি", "This code has expired": "কোডটির মেয়াদ শেষ",
      "This code has been used up": "কোডটির ব্যবহার শেষ", "This code needs an order of {n} or more": "এই কোডের জন্য কমপক্ষে {n} টাকার অর্ডার লাগবে",
      "This code isn't for the items in your cart": "কোডটি আপনার কার্টের প্রোডাক্টের জন্য নয়",
    },
  };
  const tr = (site, s, vars) => {
    let out = (STRINGS[site && site.lang] || {})[s] || s;
    if (vars) Object.keys(vars).forEach((k) => { out = out.split("{" + k + "}").join(vars[k]); });
    return out;
  };
  const LANGS = [["en", "English"], ["bn", "বাংলা"]];
  // Product labels: picked on each product, shown on its photo and used by the label buttons on the website
  const LABELS = { new: "New", best: "Best seller", sale: "Sale" };
  const labelOf = (p) => (LABELS[p.badge] ? p.badge : Number(p.compare) > Number(p.price) ? "sale" : "");

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
    perks: { label: "Why us", icon: "shield" },
    custom: { label: "Custom", icon: "plus" },
    // Only on the Checkout page (not in the section library)
    checkout: { label: "Checkout", icon: "cart" },
  };
  const blankStyle = () => ({ bg: "", text: "", padding: "m", align: "left" });
  const section = (type, content, style = {}) => ({ id: uid("s"), type, hidden: false, content, style: { ...blankStyle(), ...style }, blocks: [] });

  const make = (type, ctx = {}) => {
    const site = ctx.site || {};
    // New sections start in the website's language
    const bn = site.lang === "bn";
    const L = (en, b) => (bn ? b : en);
    const cats = [...new Set((ctx.products || []).map((p) => p.category).filter(Boolean))].slice(0, 4);
    switch (type) {
      case "hero": return section("hero", {
        eyebrow: L("New collection", "নতুন কালেকশন"), title: site.headline || L("Your headline goes here", "আপনার শিরোনাম এখানে লিখুন"), accent: "",
        subtitle: site.sub || L("Tell visitors what you sell and why they'll love it.", "আপনি কী বিক্রি করেন আর কেন কাস্টমাররা পছন্দ করবেন, তা এখানে লিখুন।"),
        btn1: { text: site.cta || L("Shop Now", "এখনই কিনুন"), link: "/shop" }, btn2: { text: L("Explore Collection", "কালেকশন দেখুন"), link: "/shop" }, image: "", slides: [],
        badge: { show: false, top: L("Up to", "সর্বোচ্চ"), big: "50%", bottom: L("OFF", "ছাড়") },
        features: [
          { icon: "truck", title: L("Fast delivery", "দ্রুত ডেলিভারি"), text: L("All over Bangladesh", "সারা বাংলাদেশে") },
          { icon: "shield", title: L("Secure payment", "নিরাপদ পেমেন্ট"), text: L("bKash, Nagad & cash on delivery", "বিকাশ, নগদ ও ক্যাশ অন ডেলিভারি") },
          { icon: "headset", title: L("Friendly support", "আন্তরিক সাপোর্ট"), text: L("We're here to help", "যেকোনো প্রয়োজনে আমরা আছি") },
        ],
      }, { layout: site.layout || "split" });
      case "products": return section("products", {
        eyebrow: L("Featured products", "বাছাই করা প্রোডাক্ট"), title: L("Our Best Sellers", "আমাদের বেস্ট সেলার"),
        subtitle: L("Discover our most loved products, carefully selected for you.", "কাস্টমারদের সবচেয়ে পছন্দের প্রোডাক্টগুলো দেখুন।"), count: 4,
        viewAll: { text: L("View All", "সব দেখুন"), link: "/shop" }, showFilters: false, filterBy: "category", only: "", button: "", wishlist: false,
      }, { columns: 4 });
      case "featured": return section("featured", { eyebrow: L("Featured", "বিশেষ"), title: L("Made to last", "টেকসই আর সুন্দর"), text: L("Show off a collection, a new arrival or a special offer here.", "নতুন কালেকশন, নতুন প্রোডাক্ট বা বিশেষ অফার এখানে দেখান।"), button: { text: L("Shop the collection", "কালেকশন দেখুন"), link: "/shop" }, image: "" }, { imageSide: "right" });
      case "categories": return section("categories", {
        eyebrow: L("Shop by category", "ক্যাটাগরি অনুযায়ী দেখুন"), title: L("Find what you love", "আপনার পছন্দেরটি খুঁজে নিন"), subtitle: "", viewAll: { text: "", link: "/shop" },
        items: (cats.length ? cats : L(["New arrivals", "Best sellers", "Accessories"], ["নতুন এসেছে", "বেস্ট সেলার", "এক্সেসরিজ"])).map((name) => ({ name, image: "", link: "/shop" })),
      });
      case "about": return section("about", { eyebrow: L("Our story", "আমাদের গল্প"), title: L("About us", "আমাদের সম্পর্কে"), text: site.about || L("Tell customers who you are, what you make and why you started.", "আপনি কে, কী বানান আর কেন শুরু করলেন, কাস্টমারদের তা জানান।"), image: "", button: { text: "", link: "" } }, { imageSide: "left" });
      case "testimonials": return section("testimonials", { eyebrow: L("Reviews", "রিভিউ"), title: L("What our customers say", "কাস্টমাররা যা বলছেন"), items: [
        { quote: L("Beautiful quality and super fast delivery. Will order again!", "কাপড়ের মান দারুণ, ডেলিভারিও খুব দ্রুত। আবার অর্ডার করব!"), name: L("Customer name", "কাস্টমারের নাম"), role: L("Dhaka", "ঢাকা"), rating: 5 },
        { quote: L("Exactly as shown in the pictures. Great service.", "ছবিতে যেমন দেখেছি, ঠিক তেমনই পেয়েছি। চমৎকার সার্ভিস।"), name: L("Customer name", "কাস্টমারের নাম"), role: L("Chattogram", "চট্টগ্রাম"), rating: 5 },
        { quote: L("Lovely packaging and friendly support team.", "সুন্দর প্যাকেজিং আর আন্তরিক সাপোর্ট টিম।"), name: L("Customer name", "কাস্টমারের নাম"), role: L("Sylhet", "সিলেট"), rating: 5 },
      ] }, { align: "center" });
      case "blog": return section("blog", { eyebrow: L("From the blog", "ব্লগ থেকে"), title: L("Latest stories", "নতুন লেখা"), items: [
        { title: L("Your first blog post", "আপনার প্রথম ব্লগ পোস্ট"), excerpt: L("Share tips, news and stories with your customers.", "কাস্টমারদের সাথে টিপস, খবর আর গল্প শেয়ার করুন।"), image: "", date: "", link: "#" },
        { title: L("A second post", "দ্বিতীয় পোস্ট"), excerpt: L("Write about new products, behind the scenes or styling ideas.", "নতুন প্রোডাক্ট, কাজের পেছনের গল্প বা স্টাইলিং আইডিয়া লিখুন।"), image: "", date: "", link: "#" },
        { title: L("A third post", "তৃতীয় পোস্ট"), excerpt: L("Regular posts help customers find you on Google.", "নিয়মিত লিখলে কাস্টমাররা Google-এ আপনাকে সহজে খুঁজে পায়।"), image: "", date: "", link: "#" },
      ] });
      case "newsletter": return section("newsletter", { title: L("Join our newsletter", "আমাদের নিউজলেটারে যোগ দিন"), text: L("Get new arrivals and special offers in your inbox.", "নতুন প্রোডাক্ট আর বিশেষ অফারের খবর ইমেইলে পান।"), placeholder: L("Your email address", "আপনার ইমেইল লিখুন"), button: L("Subscribe", "সাবস্ক্রাইব করুন"), showSocial: false }, { align: "center" });
      // Phone, email and address left empty use the store details from Preferences
      case "contact": return section("contact", { title: L("Get in touch", "যোগাযোগ করুন"), text: L("Questions about an order or a product? We're happy to help.", "অর্ডার বা প্রোডাক্ট নিয়ে কোনো প্রশ্ন? আমরা সাহায্য করতে প্রস্তুত।"), phone: "", email: "", address: "", showForm: true });
      case "faq": return section("faq", { title: L("Frequently asked questions", "সাধারণ প্রশ্ন ও উত্তর"), items: L([
        { q: "How long does delivery take?", a: "Inside Dhaka 1–2 days, outside Dhaka 2–4 days." },
        { q: "How can I pay?", a: "bKash, Nagad, card or cash on delivery." },
        { q: "Can I return a product?", a: "Yes, within 7 days if it's unused and in its original packaging." },
      ], [
        { q: "ডেলিভারি পেতে কতদিন লাগে?", a: "ঢাকার ভেতরে ১–২ দিন, ঢাকার বাইরে ২–৪ দিন।" },
        { q: "কীভাবে পেমেন্ট করব?", a: "বিকাশ, নগদ, কার্ড অথবা ক্যাশ অন ডেলিভারিতে।" },
        { q: "প্রোডাক্ট কি ফেরত দেওয়া যায়?", a: "হ্যাঁ, অব্যবহৃত ও আসল প্যাকেটে থাকলে ৭ দিনের মধ্যে।" },
      ]) });
      case "banner": return section("banner", { image: "", title: L("A big statement", "বড় করে বলুন"), text: L("Use an image banner to set the mood.", "একটি বড় ছবি দিয়ে ওয়েবসাইটের মেজাজ তৈরি করুন।"), button: { text: L("Shop Now", "এখনই কিনুন"), link: "/shop" } }, { height: "m", align: "center" });
      case "perks": return section("perks", { eyebrow: "", title: L("Why shop with us?", "কেন আমাদের থেকে কিনবেন?"), subtitle: L("A few reasons customers keep coming back.", "যে কারণে কাস্টমাররা বারবার ফিরে আসেন।"), items: [
        { icon: "diamond", title: L("Premium quality", "প্রিমিয়াম কোয়ালিটি"), text: L("Carefully made and checked", "যত্ন করে বানানো ও যাচাই করা") },
        { icon: "truck", title: L("Fast delivery", "দ্রুত ডেলিভারি"), text: L("All over Bangladesh", "সারা বাংলাদেশে") },
        { icon: "return", title: L("Easy returns", "সহজ রিটার্ন"), text: L("Hassle-free exchange", "ঝামেলামুক্ত এক্সচেঞ্জ") },
        { icon: "heart", title: L("Loved by customers", "কাস্টমারদের পছন্দের"), text: L("Thousands of happy orders", "হাজারো সন্তুষ্ট কাস্টমার") },
      ] });
      case "checkout": return section("checkout", JSON.parse(JSON.stringify(bn ? CHECKOUT_BN : CHECKOUT)));
      case "custom": {
        const s = section("custom", {});
        s.blocks = [makeBlock("heading", L("A new section", "নতুন সেকশন")), makeBlock("text", L("Add headings, text, buttons and images to build anything you like.", "শিরোনাম, লেখা, বাটন আর ছবি যোগ করে যা খুশি বানান।"))];
        return s;
      }
    }
    return null;
  };

  // ---------- Section library: ready-made sections shown with live previews ----------
  const LIBRARY = [
    ["hero", "Image on the right", { layout: "split" }], ["hero", "Centered", { layout: "center" }], ["hero", "Full-width image", { layout: "bleed" }], ["hero", "Big headline with slides", { layout: "story" }],
    ["products", "4 per row", { columns: 4 }], ["products", "3 per row", { columns: 3 }], ["products", "5 per row", { columns: 5 }],
    ["featured", "Image on the right", { imageSide: "right" }], ["featured", "Image on the left", { imageSide: "left" }],
    ["categories", "Category tiles", {}],
    ["about", "Image on the left", { imageSide: "left" }], ["about", "Image on the right", { imageSide: "right" }],
    ["testimonials", "Review cards", {}], ["blog", "Latest posts", {}], ["newsletter", "Email sign-up", {}],
    ["perks", "Why choose us", {}], ["contact", "Details and form", {}], ["faq", "Questions and answers", {}],
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
    detailsTitle: "Your details",
    details: [{ label: "Full name", hint: "Your name", type: "text" }, { label: "Phone", hint: "01XXX-XXXXXX", type: "tel" }, { label: "Email (optional)", hint: "you@email.com", type: "email" }],
    deliveryTitle: "Delivery",
    deliveryFields: [{ label: "Full address", hint: "House, road, area, city", type: "textarea" }],
    delivery: [{ label: "Inside Dhaka", fee: 60 }, { label: "Outside Dhaka", fee: 120 }],
    paymentTitle: "Payment",
    payMethods: [{ label: "Cash on delivery", info: "Pay when you get your order" }, { label: "bKash", info: "" }],
    showNote: true, noteLabel: "Order note (optional)", notePh: "Anything we should know?",
    summaryTitle: "Order summary", showCoupon: true, couponPh: "Discount code", couponButton: "Apply",
    button: "Place order", buttonTotal: true, note: "You can return unused items within 7 days.",
    showSecure: true, secureText: "Your details are safe with us",
  };
  const PAYMENTS = { cod: "Cash on delivery", bkash: "bKash", nagad: "Nagad", card: "Card" };
  // The same Checkout page for a website in Bangla
  const CHECKOUT_BN = {
    title: "চেকআউট", subtitle: "প্রায় শেষ! আপনার তথ্য দিন, আমরা অর্ডারটি আপনার ঠিকানায় পৌঁছে দেব।", showSteps: true,
    detailsTitle: "আপনার তথ্য",
    details: [{ label: "পুরো নাম", hint: "আপনার নাম", type: "text" }, { label: "মোবাইল নম্বর", hint: "01XXX-XXXXXX", type: "tel" }, { label: "ইমেইল (ঐচ্ছিক)", hint: "you@email.com", type: "email" }],
    deliveryTitle: "ডেলিভারি",
    deliveryFields: [{ label: "পুরো ঠিকানা", hint: "বাসা, রোড, এলাকা, শহর", type: "textarea" }],
    delivery: [{ label: "ঢাকার ভেতরে", fee: 60 }, { label: "ঢাকার বাইরে", fee: 120 }],
    paymentTitle: "পেমেন্ট",
    payMethods: [{ label: "ক্যাশ অন ডেলিভারি", info: "প্রোডাক্ট হাতে পেয়ে টাকা দিন" }, { label: "বিকাশ", info: "" }],
    showNote: true, noteLabel: "অর্ডার নোট (ঐচ্ছিক)", notePh: "আমাদের কিছু জানাতে চান?",
    summaryTitle: "অর্ডার সামারি", showCoupon: true, couponPh: "ডিসকাউন্ট কোড", couponButton: "প্রয়োগ করুন",
    button: "অর্ডার কনফার্ম করুন", buttonTotal: true, note: "অব্যবহৃত প্রোডাক্ট ৭ দিনের মধ্যে ফেরত দিতে পারবেন।",
    showSecure: true, secureText: "আপনার তথ্য আমাদের কাছে নিরাপদ",
  };
  // Payment method names in Bangla, so Settings → Payments recognises them on a Bangla Checkout page
  const PAYMENTS_BN = { cod: "ক্যাশ অন ডেলিভারি", bkash: "বিকাশ", nagad: "নগদ", card: "কার্ড" };

  // Starting sections for a page, based on its address
  const pageSections = (page, ctx) => {
    const slug = page.slug || "";
    const site = ctx.site || {};
    // A template's own starter website, while the website is still in that starter's language
    const starter = STARTERS[site.template];
    if (starter && !page.system && starter.sections[slug] && site.lang === starter.lang) return starter.sections[slug](ctx);
    const bn = site.lang === "bn";
    if (slug === "") {
      const list = [make("hero", ctx), make("products", ctx), make("categories", ctx), make("about", ctx), make("testimonials", ctx), make("newsletter", ctx)];
      if (site.showProducts === false) list[1].hidden = true;
      if (site.showAbout === false) list[3].hidden = true;
      return list;
    }
    if (slug === "shop") { const p = make("products", ctx); Object.assign(p.content, { eyebrow: bn ? "শপ" : "Shop", title: bn ? "সব প্রোডাক্ট" : "All products", subtitle: "", count: 12, viewAll: { text: "", link: "" }, showFilters: true }); return [p]; }
    if (slug === "about") return [make("about", ctx), make("testimonials", ctx)];
    if (slug === "contact") return [make("contact", ctx), make("faq", ctx)];
    if (page.system === "checkout") return [make("checkout", ctx)];
    const c = make("custom", ctx);
    c.blocks[0].text = page.title;
    return [c];
  };

  // ---------- Starter websites ----------
  // A template can come with a whole website in its language: the pages (in menu order), the sections
  // on each, and the header and footer. New stores on that template start from it, and "Reset page" goes back to it.
  // Free stock photos (Unsplash and Pexels licences: free to use, no credit needed) that ship with the Fashion starter
  const FASHION_IMG = (n) => "/assets/templates/fashion/" + n + ".webp";
  const withContent = (sec, content, style) => { Object.assign(sec.content, content); if (style) Object.assign(sec.style, style); return sec; };
  const FASHION_TITLE = "আপনার স্টাইলের সাথে আপনার গল্প", FASHION_SUB = "প্রিমিয়াম কোয়ালিটির টি-শার্ট, যা আপনার ব্যক্তিত্বকে তুলে ধরে আরও এক ধাপ এগিয়ে। আরাম, স্টাইল আর মানের পারফেক্ট কম্বিনেশন।";
  const fashionShop = (ctx, content) => withContent(make("products", ctx), {
    eyebrow: "", subtitle: "", count: 24, viewAll: { text: "", link: "" }, showFilters: true, filterBy: "category", tabs: { all: "সবগুলো" }, button: "কার্টে যোগ করুন", wishlist: true, ...content,
  }, { columns: 4 });
  const fashionPerks = (ctx) => withContent(make("perks", ctx), {
    title: `কেন ${(ctx.site && ctx.site.name) || "আমরা"}?`, subtitle: "আমরা শুধু টি-শার্ট বিক্রি করি না, আমরা আপনার স্টাইলের অংশ হতে চাই",
    items: [
      { icon: "diamond", title: "প্রিমিয়াম কোয়ালিটি", text: "সেরা ফেব্রিক ও ফিনিশিং" },
      { icon: "truck", title: "ফ্রি ডেলিভারি", text: "সারা বাংলাদেশে" },
      { icon: "return", title: "সহজ রিটার্ন", text: "ঝামেলামুক্ত এক্সচেঞ্জ" },
      { icon: "heart", title: "বিশ্বাসযোগ্য ব্র্যান্ড", text: "হাজারো সন্তুষ্ট কাস্টমার" },
    ],
  });
  const STARTERS = {
    "luxe-store": {
      lang: "bn",
      // The sample brand's logo in the Templates page preview (new stores start without one, so their own name shows)
      previewLogo: FASHION_IMG("logo"),
      site: () => ({
        lang: "bn", headingFont: "bangla", bodyFont: "bangla", radius: "soft",
        about: "আমরা আরামদায়ক, টেকসই আর স্টাইলিশ টি-শার্ট বানাই। প্রতিটি ডিজাইন যত্ন করে বাছাই করা, আর সারা বাংলাদেশে পৌঁছে দিই দ্রুত।",
        header: { logo: "", announcement: { show: false, text: "৳২,০০০ টাকার বেশি অর্ডারে ফ্রি ডেলিভারি" }, search: true, searchBar: true, searchText: "আপনার পছন্দের টি-শার্ট খুঁজুন...", account: true, cart: true, style: blankStyle() },
        footer: { text: "প্রিমিয়াম কোয়ালিটির টি-শার্ট আর পোশাক, সারা বাংলাদেশে দ্রুত ডেলিভারি।", showMenu: true, showContact: true, showSocial: true, copyright: "", style: blankStyle() },
      }),
      pages: [["হোম", ""], ["আমাদের কালেকশন", "shop"], ["নতুন এসেছে", "new"], ["অফার", "offers"], ["আমাদের সম্পর্কে", "about"]],
      sections: {
        "": (ctx) => {
          const site = ctx.site || {};
          // Text written with AI in the sign-up keeps its place in the hero
          const own = site.headline && site.headline !== FASHION_TITLE;
          return [
            withContent(make("hero", ctx), {
              eyebrow: "", title: own ? site.headline : "আপনার\nস্টাইলের সাথে", accent: own ? "" : "আপনার গল্প",
              subtitle: site.sub && site.sub !== FASHION_SUB && own ? site.sub : FASHION_SUB,
              btn1: { text: "এখনই কেনাকাটা করুন", link: "/shop" }, btn2: { text: "সব কালেকশন দেখুন", link: "/shop" }, image: FASHION_IMG("hero-1"), slides: [{ image: FASHION_IMG("hero-2") }, { image: FASHION_IMG("hero-3") }],
              features: [
                { icon: "truck", title: "সারা বাংলাদেশে", text: "দ্রুত ডেলিভারি" },
                { icon: "shield", title: "১০০% অরিজিনাল", text: "প্রিমিয়াম কোয়ালিটি" },
                { icon: "return", title: "সহজ", text: "রিটার্ন ও এক্সচেঞ্জ" },
                { icon: "headset", title: "২৪/৭", text: "কাস্টমার সাপোর্ট" },
              ],
            }, { layout: "story" }),
            withContent(make("categories", ctx), {
              eyebrow: "", title: "আমাদের কালেকশন", subtitle: "আপনার স্টাইলের জন্য পারফেক্ট টি-শার্ট খুঁজে নিন", viewAll: { text: "সব কালেকশন দেখুন", link: "/shop" },
              items: [["প্রিন্টেড টি-শার্ট", "printed"], ["সোলিড টি-শার্ট", "solid"], ["পোলো টি-শার্ট", "polo"], ["ওভারসাইজ টি-শার্ট", "oversized"], ["হুডি ও সোয়েটশার্ট", "hoodie"]].map(([name, img]) => ({ name, image: FASHION_IMG("cat-" + img), link: "/shop" })),
            }),
            fashionShop(ctx, { title: "জনপ্রিয় কালেকশন", subtitle: "আমাদের বেস্ট সেলিং টি-শার্টগুলো দেখুন", count: 8, filterBy: "label", tabs: { all: "সবগুলো", new: "নতুন এসেছে", best: "বেস্ট সেলার", sale: "অফার" } }),
            withContent(make("featured", ctx), { eyebrow: "", title: "নতুন কালেকশন", text: "নতুন ডিজাইন, নতুন রঙ, আপনার জন্য", button: { text: "এখনই দেখুন", link: "/new" }, image: FASHION_IMG("promo") }, { imageSide: "right", padding: "s" }),
            fashionPerks(ctx),
            withContent(make("newsletter", ctx), { title: "নতুন কালেকশন ও এক্সক্লুসিভ অফারের আপডেট পেতে আমাদের সাথে থাকুন", text: "", placeholder: "আপনার ইমেইল লিখুন...", button: "সাবস্ক্রাইব করুন", showSocial: true }, { align: "left", padding: "s" }),
          ];
        },
        shop: (ctx) => [fashionShop(ctx, { title: "আমাদের কালেকশন", subtitle: "আপনার স্টাইলের জন্য পারফেক্ট টি-শার্ট খুঁজে নিন" })],
        new: (ctx) => [fashionShop(ctx, { title: "নতুন এসেছে", subtitle: "একদম নতুন ডিজাইনগুলো সবার আগে দেখুন", only: "new", showFilters: false })],
        offers: (ctx) => [fashionShop(ctx, { title: "অফার", subtitle: "সীমিত সময়ের জন্য বিশেষ দামে আপনার পছন্দের টি-শার্ট", only: "sale", showFilters: false })],
        about: (ctx) => [withContent(make("about", ctx), { image: FASHION_IMG("hero-3") }), fashionPerks(ctx), make("testimonials", ctx), make("contact", ctx), make("faq", ctx)],
      },
    },
  };
  // The pages a new store on this template starts with, or null to use the usual Home, Shop, About and Contact
  const starterPages = (templateId) => {
    const st = STARTERS[templateId];
    return st ? st.pages.map(([title, slug]) => ({ id: uid("pg"), title, slug, inNav: true, ...(slug === "" ? { locked: true } : {}) })) : null;
  };
  // The language, fonts, header and footer of a template's starter website
  const applyStarter = (site, templateId) => { const st = STARTERS[templateId]; if (st) Object.assign(site, st.site()); return site; };

  // Sample products for previews and the demo store, in the template's language
  const SAMPLE_PRODUCTS = {
    "luxe-store": [
      ["প্রিমিয়াম কটন টি-শার্ট", 440, 1200, "best", "সোলিড টি-শার্ট", "premium-cotton"], ["আরবান গ্রাফিক টি-শার্ট", 440, 1200, "new", "প্রিন্টেড টি-শার্ট", "urban-graphic"],
      ["বাংলাদেশ টি-শার্ট", 440, 1200, "sale", "সোলিড টি-শার্ট", "bangladesh"], ["মিনিমাল প্রিন্ট টি-শার্ট", 440, 1200, "new", "প্রিন্টেড টি-শার্ট", "minimal-print"],
      ["ক্লাসিক পোলো টি-শার্ট", 690, 0, "best", "পোলো টি-শার্ট", "classic-polo"], ["ওভারসাইজ ড্রপ শোল্ডার", 590, 850, "sale", "ওভারসাইজ টি-শার্ট", "oversized"],
      ["সোলিড কটন টি-শার্ট", 390, 0, "", "সোলিড টি-শার্ট", "solid-cotton"], ["উইন্টার হুডি", 1290, 1690, "new", "হুডি ও সোয়েটশার্ট", "winter-hoodie"],
    ].map(([name, price, compare, badge, category, img], i) => ({
      name, price, compare, badge, category, stock: [24, 18, 30, 12, 15, 9, 40, 6][i], color: "#e9ebee", image: FASHION_IMG("p-" + img), images: [FASHION_IMG("p-" + img)],
      description: "১০০% কটন, আরামদায়ক ফিট। মেশিনে ধোয়া যায়, রং ওঠে না।", options: [{ name: "সাইজ", values: ["S", "M", "L", "XL", "XXL"] }],
    })),
  };
  const sampleProducts = (templateId) => (SAMPLE_PRODUCTS[templateId] || []).map((p, i) => ({ id: "sample" + (i + 1), status: "active", images: [], image: "", ...JSON.parse(JSON.stringify(p)) }));

  // A whole sample store for a template (the Templates page preview)
  const previewStore = (t, brand) => {
    const site = applyStarter({ name: brand || "My Store", template: t.id, layout: t.layout, bg: t.bg, text: t.text, accent: t.accent, phone: "01700-000000", email: "hello@example.com", address: "ঢাকা, বাংলাদেশ", social: { facebook: "#", instagram: "#", youtube: "#", tiktok: "#" } }, t.id);
    const pages = starterPages(t.id) || [{ id: uid("pg"), title: "Home", slug: "", inNav: true }];
    const products = sampleProducts(t.id);
    if (STARTERS[t.id] && STARTERS[t.id].previewLogo && site.header) site.header.logo = STARTERS[t.id].previewLogo;
    ensure(site, pages, { products });
    return { site, pages, products };
  };

  // Bring an older store (one hero + a few switches) onto the section model. Safe to call every load.
  const ensure = (site, pages, ctx = {}) => {
    ctx = { ...ctx, site };
    site.headingFont ||= TEMPLATE_FONTS[site.template] || "modern";
    site.bodyFont ||= TEMPLATE_BODY_FONTS[site.template] || (site.font === "classic" ? "classic" : site.font === "friendly" ? "friendly" : "modern");
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
      if (site.lang === "bn" && co.title === "Checkout") co.title = "চেকআউট";
    }
    // Checkout sections from before every part was editable get the new options (and keep their changes)
    pages.forEach((p) => p.sections.forEach((sec) => {
      if (sec.type !== "checkout") return;
      const c = sec.content;
      if (!Array.isArray(c.details)) {
        c.details = [{ label: c.nameLabel ?? "Full name", hint: c.namePh ?? "Your name", type: "text" }, { label: c.phoneLabel ?? "Phone", hint: c.phonePh ?? "01XXX-XXXXXX", type: "tel" }];
        if (c.showEmail !== false) c.details.push({ label: c.emailLabel ?? "Email (optional)", hint: c.emailPh ?? "you@email.com", type: "email" });
      }
      if (!Array.isArray(c.deliveryFields)) c.deliveryFields = [{ label: c.addressLabel ?? "Full address", hint: c.addressPh ?? "House, road, area, city", type: "textarea" }];
      if (!Array.isArray(c.payMethods)) c.payMethods = (site.payments && site.payments.length ? site.payments : ["Cash on delivery", "bKash"]).map((label) => ({ label, info: "" }));
      ["nameLabel", "namePh", "phoneLabel", "phonePh", "showEmail", "emailLabel", "emailPh", "addressLabel", "addressPh"].forEach((k) => delete c[k]);
      delete site.payments;
      if (!Array.isArray(c.delivery)) {
        c.delivery = [{ label: c.insideLabel || "Inside Dhaka", fee: Number(c.insideFee ?? 60) }, { label: c.outsideLabel || "Outside Dhaka", fee: Number(c.outsideFee ?? 120) }];
        ["insideLabel", "insideFee", "outsideLabel", "outsideFee"].forEach((k) => delete c[k]);
      }
      Object.keys(CHECKOUT).forEach((k) => { if (c[k] === undefined) c[k] = JSON.parse(JSON.stringify(CHECKOUT[k])); });
    }));
    // The Shop page's products get category buttons (older stores didn't have them)
    pages.forEach((p) => { if (p.slug === "shop") (p.sections || []).forEach((sec) => { if (sec.type === "products" && sec.content.showFilters === undefined) sec.content.showFilters = true; }); });
    // Contact sections that only copied the store details now follow them
    pages.forEach((p) => p.sections.forEach((sec) => {
      if (sec.type === "contact") ["phone", "email", "address"].forEach((k) => { if (sec.content[k] && sec.content[k] === site[k]) sec.content[k] = ""; });
    }));
    return site;
  };

  // Switching template changes the look; text, images and sections stay
  const applyTemplate = (site, pages, t) => {
    Object.assign(site, { template: t.id, layout: t.layout, bg: t.bg, text: t.text, accent: t.accent, headingFont: TEMPLATE_FONTS[t.id] || "modern" });
    if (TEMPLATE_BODY_FONTS[t.id]) site.bodyFont = TEMPLATE_BODY_FONTS[t.id];
    pages.forEach((p) => (p.sections || []).forEach((s) => { if (s.type === "hero") s.style.layout = t.layout; }));
  };

  // ---------- Rendering ----------
  const isDark = (hex) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ""));
    if (!m) return false;
    const n = parseInt(m[1], 16);
    return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 128;
  };
  const onSale = (p) => Number(p.compare) > Number(p.price);
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
  // A photo in a section. Without one, themes with sizes show the size to upload (in the editor and previews)
  const pic = (ctx, src, cls, alt, size) => {
    const s = safeImg(src);
    if (s) return `<img class="${cls}" src="${esc(s)}" alt="${esc(alt)}" loading="lazy">`;
    if (size && ctx.theme && ctx.theme.sizes) return `<div class="${cls} ph ph-size">${svg("image", "ph-ic")}${ctx.ed || ctx.hints ? `<small>${esc(size)}</small>` : ""}</div>`;
    return `<div class="${cls} ph">${ctx.ed ? `<span>${esc(ctx.T("Add an image"))}</span>` : ""}</div>`;
  };
  // Line breaks typed in a title
  const lines = (t) => esc(t).replace(/\r?\n/g, "<br>");
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
      const featureList = (cls) => `<div class="${cls}">${features.map((f) => `<div class="feature">${svg(FEATURE_ICONS.includes(f.icon) ? f.icon : "star")}<div><b>${esc(f.title)}</b>${f.text ? `<span>${esc(f.text)}</span>` : ""}</div></div>`).join("")}</div>`;
      // Story: a big headline with a highlighted line, photos that slide, and the features in a strip below
      if (layout === "story") {
        const slides = [c.image, ...(Array.isArray(c.slides) ? c.slides : []).map((x) => x && x.image)];
        const n = slides.length, two = (i) => String(i).padStart(2, "0");
        return `<div class="hero hero-story"${n > 1 ? " data-slider" : ""}>
          <div class="wrap hero-grid">
            <div class="hero-copy">
              ${c.eyebrow ? `<p class="eyebrow">${esc(c.eyebrow)}</p>` : ""}
              <h1>${lines(c.title)}${c.accent ? `<span class="hl">${lines(c.accent)}</span>` : ""}</h1>
              ${c.subtitle ? `<p class="lead">${esc(c.subtitle)}</p>` : ""}
              ${c.btn1?.text || c.btn2?.text ? `<div class="btns">${btn(c.btn1, "btn")}${btn(c.btn2, "btn btn-outline")}</div>` : ""}
              ${ctx.blocks}
            </div>
            <div class="hero-media">
              ${slides.map((src, i) => `<div class="hero-slide${i ? "" : " on"}">${pic(ctx, src, "hero-img", c.title, "1920 × 800")}</div>`).join("")}
              ${c.badge?.show ? `<div class="badge"><span>${esc(c.badge.top)}</span><b>${esc(c.badge.big)}</b><span>${esc(c.badge.bottom)}</span></div>` : ""}
              ${n > 1 ? `<div class="hero-nav"><span class="hero-count"><b>${two(1)}</b> / ${two(n)}</span><button type="button" data-slide="-1" aria-label="${esc(ctx.T("Previous"))}">${svg("back")}</button><button type="button" data-slide="1" aria-label="${esc(ctx.T("Next"))}">${svg("arrow")}</button></div>` : ""}
            </div>
          </div>
          ${features.length ? `<div class="hero-strip"><div class="wrap">${featureList("strip")}</div></div>` : ""}
        </div>`;
      }
      return `<div class="hero hero-${esc(layout)}">
        ${layout === "bleed" ? `<div class="hero-bg">${pic(ctx, c.image, "hero-img", c.title)}</div>` : ""}
        <div class="wrap hero-grid">
          <div class="hero-copy">
            ${c.eyebrow ? `<p class="eyebrow">${esc(c.eyebrow)}</p>` : ""}
            <h1>${lines(c.title)}${c.accent ? ` <span class="hl">${lines(c.accent)}</span>` : ""}</h1>
            ${c.subtitle ? `<p class="lead">${esc(c.subtitle)}</p>` : ""}
            ${c.btn1?.text || c.btn2?.text ? `<div class="btns">${btn(c.btn1, "btn")}${btn(c.btn2, "btn btn-outline")}</div>` : ""}
            ${features.length ? featureList("features") : ""}
            ${ctx.blocks}
          </div>
          ${layout === "bleed" ? "" : `<div class="hero-media">${pic(ctx, c.image, "hero-img", c.title)}${c.badge?.show ? `<div class="badge"><span>${esc(c.badge.top)}</span><b>${esc(c.badge.big)}</b><span>${esc(c.badge.bottom)}</span></div>` : ""}</div>`}
        </div>
      </div>`;
    },
    products: (c, st, ctx) => {
      const T = ctx.T, m = ctx.money;
      // "only": just the products with that label (a "New arrivals" or "Offers" page)
      const only = LABELS[c.only] ? c.only : "";
      const list = (ctx.products || []).filter((p) => p.status !== "draft" && (!only || labelOf(p) === only)).slice(0, Math.max(1, Math.min(24, Number(c.count) || 4)));
      // Buttons above the products: by category, or by label (New, Best seller, Sale)
      const byLabel = c.filterBy === "label", tabs = c.tabs || {};
      const groups = byLabel
        ? Object.keys(LABELS).filter((k) => list.some((p) => labelOf(p) === k)).map((k) => [k, tabs[k] || T(LABELS[k])])
        : [...new Set(list.map((p) => p.category).filter(Boolean))].map((x) => [x, x]);
      const filters = c.showFilters && groups.length >= (byLabel ? 1 : 2)
        ? `<div class="p-filters${byLabel ? " p-tabs" : ""}" role="group" aria-label="${esc(T("Categories"))}"><button type="button" class="on" data-cat="">${esc(tabs.all || T("All"))}</button>${groups.map(([k, l]) => `<button type="button" data-cat="${esc(k)}">${esc(l)}</button>`).join("")}</div>` : "";
      const more = c.viewAll?.text ? `<a class="more" href="${esc(safeLink(c.viewAll.link))}">${esc(c.viewAll.text)}${svg("arrow")}</a>` : "";
      const badge = (p) => LABELS[p.badge] ? `<em class="p-badge b-${p.badge}">${esc(T(LABELS[p.badge]))}</em>` : onSale(p) ? `<em class="p-sale">−${Math.round((1 - p.price / p.compare) * 100)}%</em>` : "";
      const addText = (p) => c.button || T((p.options || []).length ? "Choose options" : "Add to cart");
      const sized = ctx.theme && ctx.theme.sizes;
      return `<div class="wrap">
        <div class="sec-head"><div>${head(c)}${c.subtitle ? `<p class="sub">${esc(c.subtitle)}</p>` : ""}</div>${byLabel ? filters : ""}${more}</div>
        ${byLabel ? "" : filters}
        ${list.length ? `<div class="grid cols-${Number(st.columns) || 4}">${list.map((p) => `
          <div class="card product" data-pid="${esc(p.id)}" data-cat="${esc(byLabel ? labelOf(p) : p.category || "")}">
            <button type="button" class="p-img${safeImg(p.image) ? "" : sized ? " ph ph-size" : ""}" data-view="${esc(p.id)}" aria-label="${esc(p.name)}"${sized && !safeImg(p.image) ? "" : ` style="background:${esc(color(p.color) || "#e9e6e1")}"`}>${safeImg(p.image) ? `<img src="${esc(p.image)}" alt="" loading="lazy">` : sized ? `${svg("image", "ph-ic")}${ctx.ed || ctx.hints ? "<small>600 × 600</small>" : ""}` : `<span>${esc((p.name || "?").slice(0, 1))}</span>`}${badge(p)}</button>
            ${c.wishlist ? `<button type="button" class="p-wish" data-wish="${esc(p.id)}" aria-label="${esc(T("Save to wishlist"))}" title="${esc(T("Save to wishlist"))}">${svg("heart")}</button>` : ""}
            <div class="p-body"><button type="button" class="p-name" data-view="${esc(p.id)}">${esc(p.name)}</button><span class="price">${m(p.price)}${onSale(p) ? ` <s>${m(p.compare)}</s>` : ""}</span>
              ${p.stock === 0 ? `<button type="button" class="btn btn-outline p-add" disabled>${esc(T("Sold out"))}</button>` : `<button type="button" class="btn btn-outline p-add" data-add="${esc(p.id)}">${svg("cart")}${esc(addText(p))}</button>`}</div>
          </div>`).join("")}</div>` : `<p class="empty">${esc(T("Your products will appear here once you add them."))}</p>`}
        ${ctx.blocks}
      </div>`;
    },
    featured: (c, st, ctx) => `<div class="wrap split ${st.imageSide === "left" ? "img-left" : ""}">
        <div class="split-copy">${head(c)}${c.text ? `<p class="lead">${esc(c.text)}</p>` : ""}${c.button?.text ? `<div class="btns">${btn(c.button)}</div>` : ""}${ctx.blocks}</div>
        <div class="split-media">${pic(ctx, c.image, "split-img", c.title, "1920 × 600")}</div>
      </div>`,
    categories: (c, st, ctx) => `<div class="wrap">
        <div class="sec-head"><div>${head(c)}${c.subtitle ? `<p class="sub">${esc(c.subtitle)}</p>` : ""}</div>${c.viewAll?.text ? `<a class="more" href="${esc(safeLink(c.viewAll.link))}">${esc(c.viewAll.text)}${svg("arrow")}</a>` : ""}</div>
        <div class="grid cols-${Math.min(5, Math.max(2, (c.items || []).length))}">${(c.items || []).map((it) => `
          <a class="cat" href="${esc(safeLink(it.link))}">${pic(ctx, it.image, "cat-img", it.name, "400 × 400")}<b>${esc(it.name)}</b></a>`).join("")}</div>
        ${ctx.blocks}
      </div>`,
    about: (c, st, ctx) => `<div class="wrap split ${st.imageSide === "right" ? "" : "img-left"}">
        <div class="split-copy">${head(c)}${c.text ? `<p class="lead">${esc(c.text)}</p>` : ""}${c.button?.text ? `<div class="btns">${btn(c.button, "btn btn-outline")}</div>` : ""}${ctx.blocks}</div>
        <div class="split-media">${pic(ctx, c.image, "split-img", c.title, "1200 × 900")}</div>
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
          <a class="card post" href="${esc(safeLink(p.link))}">${pic(ctx, p.image, "post-img", p.title, "1200 × 750")}<div class="p-body">${p.date ? `<span class="date">${esc(p.date)}</span>` : ""}<b>${esc(p.title)}</b><span>${esc(p.excerpt)}</span></div></a>`).join("")}</div>
        ${ctx.blocks}
      </div>`,
    newsletter: (c, st, ctx) => {
      const socials = c.showSocial ? Object.entries((ctx.site || {}).social || {}).filter(([k, v]) => v && SOCIAL_NAMES[k]) : [];
      return `<div class="wrap narrow news${socials.length ? " has-social" : ""}">
        <div class="news-copy">${c.title ? `<h2>${esc(c.title)}</h2>` : ""}${c.text ? `<p class="lead">${esc(c.text)}</p>` : ""}</div>
        <form class="news-form" onsubmit="return false"><input type="email" placeholder="${esc(c.placeholder || "Your email")}" aria-label="${esc(ctx.T("Email address"))}"><button class="btn" type="submit">${esc(c.button || "Subscribe")}</button></form>
        ${socials.length ? `<span class="socials news-social">${socials.map(([k, v]) => `<a href="${esc(safeLink(v))}" target="_blank" rel="noopener" aria-label="${SOCIAL_NAMES[k]}" title="${SOCIAL_NAMES[k]}">${socialIcon(k)}</a>`).join("")}</span>` : ""}
        ${ctx.blocks}
      </div>`;
    },
    perks: (c, st, ctx) => {
      const items = (c.items || []).filter((x) => x && x.title);
      return `<div class="wrap">
        <div class="sec-head"><div>${head(c)}${c.subtitle ? `<p class="sub">${esc(c.subtitle)}</p>` : ""}</div></div>
        <div class="grid cols-${Math.min(4, Math.max(1, items.length))}">${items.map((x) => `<div class="card perk">${svg(FEATURE_ICONS.includes(x.icon) ? x.icon : "star")}<div><b>${esc(x.title)}</b>${x.text ? `<span>${esc(x.text)}</span>` : ""}</div></div>`).join("")}</div>
        ${ctx.blocks}
      </div>`;
    },
    contact: (c, st, ctx) => `<div class="wrap split contact">
        <div class="split-copy">${c.title ? `<h2>${esc(c.title)}</h2>` : ""}${c.text ? `<p class="lead">${esc(c.text)}</p>` : ""}
          <ul class="contact-list">${[["phone", "phone"], ["email", "mail"], ["address", "pin"]].map(([k, ic]) => { const val = c[k] || (ctx.site || {})[k]; return val ? `<li>${svg(ic)}${esc(val)}</li>` : ""; }).join("")}</ul>${ctx.blocks}</div>
        ${c.showForm ? `<form class="card contact-form" onsubmit="return false"><input placeholder="${esc(ctx.T("Your name"))}"><input type="email" placeholder="${esc(ctx.T("Email"))}"><textarea rows="4" placeholder="${esc(ctx.T("Message"))}"></textarea><button class="btn" type="submit">${esc(ctx.T("Send message"))}</button></form>` : ""}
      </div>`,
    faq: (c, st, ctx) => `<div class="wrap narrow">
        ${c.title ? `<h2>${esc(c.title)}</h2>` : ""}
        <div class="faq">${(c.items || []).map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}</div>
        ${ctx.blocks}
      </div>`,
    banner: (c, st, ctx) => `<div class="banner h-${esc(st.height || "m")}">${pic(ctx, c.image, "banner-img", c.title, "1920 × 800")}<div class="wrap banner-copy">${c.title ? `<h2>${esc(c.title)}</h2>` : ""}${c.text ? `<p class="lead">${esc(c.text)}</p>` : ""}${c.button?.text ? `<div class="btns">${btn(c.button)}</div>` : ""}${ctx.blocks}</div></div>`,
    // Checkout: details, delivery, payment and an order summary, in the website's own colors and fonts
    checkout: (c, st, ctx) => {
      const items = (ctx.products || []).filter((p) => p.status !== "draft").slice(0, 2);
      const T = ctx.T, taka = ctx.money;
      const opts = (Array.isArray(c.delivery) ? c.delivery : []).map((d) => ({ label: d.label || "Delivery", fee: Math.max(0, Number(d.fee) || 0) }));
      const fee = opts.length ? opts[0].fee : 0;
      const sub = items.reduce((a, p) => a + (Number(p.price) || 0), 0), total = sub + fee;
      const pays = (Array.isArray(c.payMethods) ? c.payMethods : []).filter((m) => m && m.label);
      // A question is required unless its label says it's optional
      const field = (label, type, ph, wide, optional) => {
        const req = !optional && !/optional|ঐচ্ছিক/i.test(label || "") ? " required" : "";
        const attrs = `data-q="${esc(label || ph || "")}" data-type="${esc(type || "text")}" placeholder="${esc(ph || "")}"${req}`;
        return `<label class="co-field${wide ? " wide" : ""}">${label ? `<span>${esc(label)}</span>` : ""}${type === "textarea" ? `<textarea rows="2" ${attrs}></textarea>` : `<input type="${["tel", "email", "number"].includes(type) ? type : "text"}" ${attrs}>`}</label>`;
      };
      // The store's own form fields: long answers and a last odd field take the full width
      const fields = (list) => {
        const l = (Array.isArray(list) ? list : []).filter((f) => f && (f.label || f.hint));
        return l.length ? `<div class="co-row">${l.map((f, i) => {
          const long = f.type === "textarea";
          // A short field with nothing beside it takes the full width
          let run = 0;
          for (let j = i - 1; j >= 0 && l[j].type !== "textarea"; j--) run++;
          const alone = !long && run % 2 === 0 && (!l[i + 1] || l[i + 1].type === "textarea");
          return field(f.label, f.type, f.hint, long || alone);
        }).join("")}</div>` : "";
      };
      let n = 0;
      const step = (title) => (title || c.showSteps ? `<h3>${c.showSteps ? `<i>${++n}</i>` : ""}${esc(title)}</h3>` : "");
      return `<div class="wrap checkout">
        <div class="co-head">${c.title ? `<h1>${esc(c.title)}</h1>` : ""}${c.subtitle ? `<p class="lead">${esc(c.subtitle)}</p>` : ""}</div>
        <div class="co-grid">
          <form class="co-form" onsubmit="return false" data-sub="${sub}">
            <div class="co-step">${step(c.detailsTitle)}${fields(c.details)}</div>
            <div class="co-step">${step(c.deliveryTitle)}${fields(c.deliveryFields)}
              ${opts.length ? `<div class="co-options">${opts.map((d, i) => `<label class="co-option"><input type="radio" name="delivery" value="${esc(d.label)}" data-fee="${d.fee}"${i ? "" : " checked"}><span>${esc(d.label)}</span><b>${taka(d.fee)}</b></label>`).join("")}</div>` : ""}</div>
            ${pays.length ? `<div class="co-step">${step(c.paymentTitle)}<div class="co-options">${pays.map((p, i) => `<label class="co-option"><input type="radio" name="pay" value="${esc(p.label)}"${i ? "" : " checked"}><span>${esc(p.label)}${p.info ? `<small>${esc(p.info)}</small>` : ""}</span></label>`).join("")}</div></div>` : ""}
            ${c.showNote ? `<div class="co-step co-note">${field(c.noteLabel, "textarea", c.notePh, false, true)}</div>` : ""}
            <button class="btn co-place" type="submit">${esc(c.button || "Place order")}${c.buttonTotal ? ` · <span class="co-tot">${taka(total)}</span>` : ""}</button>
            ${c.note ? `<p class="co-small">${esc(c.note)}</p>` : ""}
            ${ctx.blocks}
          </form>
          <aside class="co-summary">
            ${c.summaryTitle ? `<h3>${esc(c.summaryTitle)}</h3>` : ""}
            <div class="co-items" data-items>${items.length ? items.map((p) => `<div class="co-item"><span class="co-img" style="background:${esc(color(p.color) || "#e9e6e1")}">${safeImg(p.image) ? `<img src="${esc(p.image)}" alt="">` : ""}<em>${ctx.site && ctx.site.lang === "bn" ? "১" : "1"}</em></span><span class="co-name">${esc(p.name)}</span><b>${taka(p.price)}</b></div>`).join("") : `<p class="empty">${esc(T("Items in the cart show here."))}</p>`}</div>
            ${c.showCoupon ? `<div class="co-coupon"><input class="co-code" placeholder="${esc(c.couponPh || "Discount code")}" aria-label="${esc(c.couponPh || "Discount code")}"><button class="btn btn-outline co-apply" type="button">${esc(c.couponButton || "Apply")}</button></div><p class="co-msg" hidden></p>` : ""}
            <div class="co-line"><span>${esc(T("Subtotal"))}</span><span class="co-sub">${taka(sub)}</span></div>
            <div class="co-line co-disc" hidden><span>${esc(T("Discount"))}</span><span class="co-disc-v"></span></div>
            ${opts.length ? `<div class="co-line"><span>${esc(T("Delivery"))}</span><span class="co-fee">${taka(fee)}</span></div>` : ""}
            <div class="co-line co-total"><span>${esc(T("Total"))}</span><span class="co-tot">${taka(total)}</span></div>
            ${c.showSecure && c.secureText ? `<p class="co-secure">${svg("shield")}${esc(c.secureText)}</p>` : ""}
          </aside>
        </div>
      </div>`;
    },
    custom: (c, st, ctx) => `<div class="wrap narrow">${ctx.blocks || (ctx.ed ? '<p class="empty">Add elements to this section from the panel.</p>' : "")}</div>`,
  };

  // Menu items with no dropdown parent (a parent that's not in the menu doesn't count)
  const isTop = (p, pages) => !p.parent || !pages.some((x) => x.id === p.parent && x.inNav && !x.parent);
  const navPages = (pages) => pages.filter((p) => p.inNav && isTop(p, pages)).slice(0, 5);
  const navChildren = (pages, parent) => pages.filter((p) => p.inNav && p.parent === parent.id);
  const pageHref = (p) => "/" + (p.slug || "");

  // Dropdown menu styles, picked in Navigation
  const DROPDOWNS = [
    { id: "simple", name: "Simple list", text: "A clean list of links. Works for any store." },
    { id: "icons", name: "Boxes with icons", text: "Two columns of tidy boxes, each with an icon." },
    { id: "cards", name: "Image cards", text: "A picture for each page — great for collections." },
    { id: "mega", name: "Mega menu", text: "Full width, with links and a featured product." },
  ];
  // Promotional banner colors (empty = the website's accent color)
  const ANNOUNCE_COLORS = [
    ["", "Brand", "", ""], ["black", "Black", "#111111", "#ffffff"], ["sale", "Sale red", "#dc2626", "#ffffff"], ["green", "Green", "#15803d", "#ffffff"],
    ["gold", "Gold", "#f5c542", "#1a1a1a"], ["blush", "Blush", "#fde2e4", "#7a1f2b"], ["sky", "Sky", "#e0f2fe", "#0c4a6e"], ["cream", "Cream", "#f6efe3", "#3d2f1f"],
  ];
  const announceStyle = (a) => (color(a.bg) ? `background:${a.bg};color:${color(a.color) || (isDark(a.bg) ? "#ffffff" : "#111111")}` : "");
  // Extra buttons on the right of the header
  const HEADER_BUTTONS = [
    { id: "wishlist", name: "Wishlist", text: "A heart for saved products" },
    { id: "track", name: "Track order", text: "Customers check where their order is" },
    { id: "whatsapp", name: "WhatsApp", text: "Chat with you on WhatsApp" },
    { id: "phone", name: "Call us", text: "Calls your store phone" },
  ];
  const digits = (x) => String(x || "").replace(/\D/g, "");
  const waLink = (site) => (site.social && safeLink(site.social.whatsapp)) || (digits(site.phone) ? "https://wa.me/" + (digits(site.phone).startsWith("0") ? "88" : "") + digits(site.phone) : "");
  // A picture for a page: the first image in its sections
  const pageImage = (p) => {
    for (const sec of p.sections || []) {
      const c = sec.content || {};
      if (safeImg(c.image)) return c.image;
      const it = (c.items || []).find((x) => safeImg(x && x.image));
      if (it) return it.image;
    }
    return "";
  };
  const renderDropdown = (site, parent, kids, opts) => {
    const style = opts.ddStyle || (site.header && site.header.dropdown) || "simple";
    const link = (p, inner) => `<a href="${esc(pageHref(p))}"${opts.page && p.id === opts.page.id ? ' class="on"' : ""}>${inner}</a>`;
    let body;
    if (style === "icons") body = kids.map((p) => link(p, `<i class="dd-ico">${svg("arrow")}</i><span><b>${esc(p.title)}</b><small>/${esc(p.slug)}</small></span>`)).join("");
    else if (style === "cards") body = kids.map((p) => { const img = pageImage(p); return link(p, `<span class="dd-img">${img ? `<img src="${esc(img)}" alt="">` : `<em>${esc((p.title || "?").slice(0, 1))}</em>`}</span><b>${esc(p.title)}</b>`); }).join("");
    else if (style === "mega") {
      const prods = (opts.products || []).filter((x) => x.status !== "draft").slice(0, 3);
      body = `<div class="dd-cols"><b class="dd-head">${esc(parent.title)}</b>${kids.map((p) => link(p, `${esc(p.title)}${svg("arrow")}`)).join("")}</div>
        ${prods.length ? `<div class="dd-feature"><small>Featured</small><div>${prods.map((x) => `<a href="/shop"><span class="dd-img" style="background:${esc(color(x.color) || "#e9e6e1")}">${safeImg(x.image) ? `<img src="${esc(x.image)}" alt="">` : ""}</span><b>${esc(x.name)}</b><span>${taka(x.price)}</span></a>`).join("")}</div></div>` : ""}`;
    } else body = kids.map((p) => link(p, esc(p.title))).join("");
    return `<div class="dd-panel dd-${style}"><div class="dd-in">${body}</div></div>`;
  };

  // The store's logo as a square with rounded corners, with the website name beside it
  // (header.hideName shows the logo alone)
  const brand = (site, tag, cls) => {
    const h = site.header || {}, name = site.name || "My Store", logo = safeImg(h.logo);
    const showName = !logo || !h.hideName;
    return `<${tag} class="${cls}${logo ? " has-mark" : ""}"${tag === "a" ? ' href="/"' : ""}>${logo ? `<img class="logo-mark" src="${esc(logo)}" alt="${showName ? "" : esc(name)}">` : ""}${showName ? `<span class="logo-name">${esc(name)}</span>` : ""}</${tag}>`;
  };
  const renderHeader = (site, pages, opts) => {
    const h = site.header;
    const T = (s) => tr(site, s);
    const x = h.buttons || {};
    const firstDd = opts.ddOpenFirst ? navPages(pages).find((p) => navChildren(pages, p).length) : null;
    const hs = h.style || {};
    return `<header class="s-header${hs.hideDesktop ? " hide-d" : ""}${hs.hideTablet ? " hide-t" : ""}${hs.hidePhone ? " hide-m" : ""}" data-sid="header" style="${sectionStyle(h.style)}">
      ${h.announcement?.show && h.announcement.text ? `<div class="announce" style="${esc(announceStyle(h.announcement))}">${h.announcement.link ? `<a href="${esc(safeLink(h.announcement.link))}">${esc(h.announcement.text)}${svg("arrow")}</a>` : esc(h.announcement.text)}</div>` : ""}
      <div class="wrap nav">
        ${brand(site, "a", "logo")}
        <nav class="menu">${navPages(pages).map((p, i) => {
          const a = `<a href="${esc(pageHref(p))}"${opts.page && p.id === opts.page.id ? ' class="on"' : ""}>${esc(p.title)}</a>`;
          const kids = navChildren(pages, p);
          if (!kids.length) return a;
          return `<div class="dd${p === firstDd ? " open" : ""}">${a.replace("</a>", `${svg("chevron", "dd-arrow")}</a>`)}${renderDropdown(site, p, kids, opts)}</div>`;
        }).join("")}</nav>
        ${h.search && h.searchBar ? `<form class="h-search" role="search" onsubmit="return false"><input type="search" placeholder="${esc(h.searchText || T("Search products…"))}" aria-label="${esc(T("Search"))}"><button type="submit" aria-label="${esc(T("Search"))}">${svg("search")}</button></form>` : ""}
        <div class="tools">${h.search && !h.searchBar ? `<span title="${esc(T("Search"))}">${svg("search")}</span>` : ""}${x.wishlist ? `<span title="${esc(T("Wishlist"))}">${svg("heart")}</span>` : ""}${x.track ? `<a href="/contact" title="${esc(T("Track order"))}">${svg("truck")}</a>` : ""}${h.account ? `<span title="${esc(T("Account"))}">${svg("user")}</span>` : ""}${x.whatsapp && waLink(site) ? `<a href="${esc(waLink(site))}" target="_blank" rel="noopener" title="WhatsApp" class="t-wa">${socialIcon("whatsapp")}</a>` : ""}${x.phone && digits(site.phone) ? `<a href="tel:${esc(digits(site.phone))}" title="${esc(T("Call us"))}">${svg("phone")}</a>` : ""}${h.cart ? `<a href="/checkout" aria-label="${esc(T("Cart"))}" title="${esc(T("Cart"))}"${themeOf(site).cls ? ` data-count="${site.lang === "bn" ? "০" : "0"}"` : ""}>${svg("cart")}</a>` : ""}${h.cta && h.cta.show && h.cta.text ? `<a class="btn t-cta" href="${esc(safeLink(h.cta.link) || "/shop")}">${esc(h.cta.text)}</a>` : ""}<button type="button" class="burger" aria-label="${esc(T("Menu"))}">${svg("menu")}</button></div>
      </div>
    </header>`;
  };
  const renderFooter = (site, pages) => {
    const f = site.footer, socials = Object.entries(site.social || {}).filter(([k, v]) => v && SOCIAL_NAMES[k]);
    const T = (s) => tr(site, s);
    const fs = f.style || {};
    return `<footer class="s-footer${fs.hideDesktop ? " hide-d" : ""}${fs.hideTablet ? " hide-t" : ""}${fs.hidePhone ? " hide-m" : ""}" data-sid="footer" style="${sectionStyle(f.style)}">
      <div class="wrap foot-grid">
        <div>${brand(site, "b", "logo")}${f.text ? `<p>${esc(f.text)}</p>` : ""}</div>
        ${f.showMenu ? `<div><b>${esc(T("Pages"))}</b>${navPages(pages).map((p) => `<a href="${esc(pageHref(p))}">${esc(p.title)}</a>`).join("")}</div>` : ""}
        ${f.showContact ? `<div><b>${esc(T("Contact"))}</b>${[site.phone, site.email, site.address].filter(Boolean).map((v) => `<span>${esc(v)}</span>`).join("")}</div>` : ""}
        ${f.showSocial && socials.length ? `<div><b>${esc(T("Follow us"))}</b><span class="socials">${socials.map(([k, v]) => `<a href="${esc(safeLink(v))}" target="_blank" rel="noopener" aria-label="${SOCIAL_NAMES[k]}" title="${SOCIAL_NAMES[k]}">${socialIcon(k)}</a>`).join("")}</span></div>` : ""}
      </div>
      <div class="wrap copy">${esc(f.copyright || `© ${site.lang === "bn" ? bnNum(new Date().getFullYear()) : new Date().getFullYear()} ${site.name || "My Store"}. ${T("All rights reserved.")}`)}</div>
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
    // ddOpenFirst shows the first dropdown open (with room for it); ddStyle previews a dropdown style
    if (opts.headerOnly) return `<div class="site${themeOf(site).cls ? " " + themeOf(site).cls : ""}${opts.ddOpenFirst ? " dd-preview" : ""}" style="${esc(rootStyle(site))};min-height:0">${renderHeader(site, pages, { page, products: opts.products, ddOpenFirst: opts.ddOpenFirst, ddStyle: opts.ddStyle })}</div>`;
    // Editor: a "+" on each gap between sections opens the section library (index = where it goes)
    const insert = (i) => ed && !opts.bare ? `<div class="ed-insert" data-insert="${i}"><button type="button" data-ed-add="${i}" title="Add a section here" aria-label="Add a section here">+</button></div>` : "";
    const fixedLabel = (id, name) => ed && opts.selected === id ? `<div class="ed-chip"><div class="ed-chip-in"><b>${name}</b></div></div>` : "";
    const theme = themeOf(site);
    const T = (s, v) => tr(site, s, v), m = (n) => money(site, n);
    return `<div class="site${theme.cls ? " " + theme.cls : ""}" style="${esc(rootStyle(site))}">
      ${opts.bare ? "" : renderHeader(site, pages, { page, products: opts.products }).replace('class="s-header', `class="s-header${sel("header")}`).replace(/(<header[^>]*>)/, `$1${fixedLabel("header", "Header")}`)}
      <main>${insert(0)}${sections.map((s, i) => {
        const R = RENDER[s.type];
        if (!R) return "";
        const st = s.style || {};
        const hide = `${st.hideDesktop ? " hide-d" : ""}${st.hideTablet ? " hide-t" : ""}${st.hidePhone ? " hide-m" : ""}`;
        return `<section class="s s-${esc(s.type)} pad-${esc(st.padding || "m")} align-${esc(st.align || "left")}${hide}${s.hidden ? " is-hidden" : ""}${sel(s.id)}" data-sid="${esc(s.id)}" style="${sectionStyle(st)}">${label(s)}${R(s.content || {}, st, { products: opts.products, ed, blocks: renderBlocks(s.blocks, ed), site, theme, hints: !!opts.hints, T, money: m })}</section>${insert(i + 1)}`;
      }).join("") || (ed ? '<section class="s pad-l align-center"><div class="wrap"><p class="empty">This page has no sections yet. Click + to add one.</p></div></section>' : "")}</main>
      ${opts.bare ? "" : renderFooter(site, pages).replace('class="s-footer', `class="s-footer${sel("footer")}`).replace(/(<footer[^>]*>)/, `$1${fixedLabel("footer", "Footer")}`)}
    </div>`;
  };

  // A full HTML document for an iframe or a new tab
  const documentHTML = (site, pages, opts = {}) => {
    const origin = opts.origin != null ? opts.origin : location.origin;
    // <base> so uploaded photos (/media/…) load in previews too (srcdoc and blob pages have no address of their own)
    return `<!doctype html><html lang="${site.lang === "bn" ? "bn" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base href="${esc(origin)}/">
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
  // How much a discount code takes off. items: [{ id, price, qty }], fee: the delivery charge.
  // Plain functions (no outside variables) so the website's script and the dashboard share them.
  const discountFor = function (d, items, fee) {
    var sum = function (l) { return l.reduce(function (a, it) { return a + it.price * it.qty; }, 0); };
    var sub = sum(items);
    if (!d || sub < (d.min || 0)) return 0;
    if (d.type === "shipping") return Math.max(0, fee || 0);
    var base = d.products && d.products.length ? sum(items.filter(function (it) { return d.products.indexOf(it.id) >= 0; })) : sub;
    var off = d.type === "percent" ? Math.round(base * d.value / 100) : d.value;
    if (d.type === "percent" && d.max) off = Math.min(off, d.max);
    return Math.max(0, Math.min(off, base));
  };
  // Why a code can't be used right now, or "" when it can. now: a time in ms.
  const discountProblem = function (d, items, now) {
    var sub = items.reduce(function (a, it) { return a + it.price * it.qty; }, 0);
    if (!d || d.active === false) return "That code doesn't work";
    if (d.starts && now < new Date(d.starts + "T00:00:00").getTime()) return "This code isn't active yet";
    if (d.ends && now > new Date(d.ends + "T23:59:59").getTime()) return "This code has expired";
    if (d.limit && (d.used || 0) >= d.limit) return "This code has been used up";
    if (sub < (d.min || 0)) return "This code needs an order of \u09f3" + Number(d.min).toLocaleString("en-IN") + " or more";
    if (d.products && d.products.length && !items.some(function (it) { return d.products.indexOf(it.id) >= 0; })) return "This code isn't for the items in your cart";
    return "";
  };

  // The website's shopping: add to cart, the cart on the checkout page, discount codes and placing an order.
  // Runs on the website only (not in the editor). Orders go to the dashboard that opened the preview.
  const storefront = function () {
    var D = window.SHOP || { products: [], discounts: [] }, cart = [], code = null;
    try { cart = JSON.parse(sessionStorage.getItem("shop-cart") || "[]"); } catch (e) {}
    var byId = function (id) { return D.products.filter(function (p) { return p.id === id; })[0]; };
    cart = cart.filter(function (it) { return byId(it.id); });
    // Words and numbers in the website's language (D.t holds the translations, D.bn: Bangla digits)
    var num = function (x) { return D.bn ? String(x).replace(/[0-9]/g, function (d) { return String.fromCharCode(0x09e6 + Number(d)); }) : String(x); };
    var tr = function (s, v) { var o = (D.t && D.t[s]) || s; if (v) Object.keys(v).forEach(function (k) { o = o.split("{" + k + "}").join(v[k]); }); return o; };
    var trWhy = function (m) { var x = /^This code needs an order of (.+) or more$/.exec(m || ""); return x ? tr("This code needs an order of {n} or more", { n: num(x[1]) }) : tr(m); };
    var taka = function (n) { return num("\u09f3" + Number(n || 0).toLocaleString("en-IN")); };
    var esc = function (x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); };
    var note = function (text) {
      var t = document.createElement("div"); t.className = "shop-toast"; t.textContent = text; document.body.appendChild(t);
      setTimeout(function () { t.remove(); }, 2200);
    };
    var subtotal = function () { return cart.reduce(function (a, it) { return a + byId(it.id).price * it.qty; }, 0); };
    var feeNow = function () { var d = document.querySelector('.checkout input[name="delivery"]:checked'); return d ? Number(d.getAttribute("data-fee")) || 0 : 0; };
    var save = function () { try { sessionStorage.setItem("shop-cart", JSON.stringify(cart)); } catch (e) {} draw(); };
    // Shop events for the ad and analytics pixels connected in Marketing (each only if it's on the page)
    var track = function (ev, value, items) {
      var w = window, cur = "BDT", ids = items.map(function (it) { return it.id; });
      var names = { add: ["AddToCart", "add_to_cart", "AddToCart", "ADD_CART", "addtocart", "AddToCart"], checkout: ["InitiateCheckout", "begin_checkout", "InitiateCheckout", "START_CHECKOUT", "", ""], buy: ["Purchase", "purchase", "CompletePayment", "PURCHASE", "checkout", "Purchase"] }[ev];
      try {
        if (w.fbq) w.fbq("track", names[0], { value: value, currency: cur, content_ids: ids, content_type: "product" });
        if (w.gtag) w.gtag("event", names[1], { value: value, currency: cur, items: items.map(function (it) { return { item_id: it.id, item_name: it.name, price: it.price, quantity: it.qty }; }) });
        if (w.dataLayer && !w.gtag) w.dataLayer.push({ event: names[1], ecommerce: { value: value, currency: cur } });
        if (w.ttq) w.ttq.track(names[2], { value: value, currency: cur, contents: items.map(function (it) { return { content_id: it.id, quantity: it.qty, price: it.price }; }) });
        if (w.snaptr) w.snaptr("track", names[3], { price: value, currency: cur, item_ids: ids });
        if (w.pintrk && names[4]) w.pintrk("track", names[4], { value: value, currency: cur, order_quantity: items.reduce(function (a, it) { return a + it.qty; }, 0) });
        if (w.rdt && names[5]) w.rdt("track", names[5], { value: value, currency: cur, itemCount: items.length });
        if (w.uetq && ev === "buy") w.uetq.push("event", "purchase", { revenue_value: value, currency: cur });
      } catch (e) {}
    };
    var lines = function () { return cart.map(function (it) { var p = byId(it.id); return { id: p.id, name: p.name + (it.v ? " (" + it.v + ")" : ""), price: p.price, qty: it.qty }; }); };
    // How many of a product are in the cart, in all its sizes/colors
    var inCart = function (id) { return cart.reduce(function (a, it) { return a + (it.id === id ? it.qty : 0); }, 0); };
    var addToCart = function (p, v, qty) {
      if (p.stock != null && inCart(p.id) + qty > p.stock) { note(p.stock > inCart(p.id) ? tr("Only {n} more left in stock", { n: num(p.stock - inCart(p.id)) }) : tr("No more left in stock")); return false; }
      var it = cart.filter(function (x) { return x.id === p.id && (x.v || "") === (v || ""); })[0];
      if (it) it.qty += qty; else cart.push({ id: p.id, v: v || "", qty: qty });
      save(); note(tr("{name} added to your cart", { name: p.name + (v ? " (" + v + ")" : "") }));
      track("add", p.price * qty, [{ id: p.id, name: p.name, price: p.price, qty: qty }]);
      return true;
    };
    // Product details: photos, description, sizes/colors and quantity
    var view = function (p) {
      var imgs = p.images.length ? p.images : p.image ? [p.image] : [], pick = {}, qty = 1;
      var box = document.createElement("div");
      box.className = "qv"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", p.name);
      box.innerHTML = '<div class="qv-in"><button type="button" class="qv-x" aria-label="' + esc(tr("Close")) + '">\u00d7</button>' +
        '<div class="qv-media"><div class="qv-main" style="background:' + esc(p.color || "#e9e6e1") + '">' + (imgs[0] ? '<img src="' + esc(imgs[0]) + '" alt="">' : "<span>" + esc(p.name.slice(0, 1)) + "</span>") + "</div>" +
        (imgs.length > 1 ? '<div class="qv-thumbs">' + imgs.map(function (u, i) { return '<button type="button" data-img="' + i + '"' + (i ? "" : ' class="on"') + '><img src="' + esc(u) + '" alt=""></button>'; }).join("") + "</div>" : "") + "</div>" +
        '<div class="qv-info"><h2>' + esc(p.name) + '</h2><p class="qv-price">' + taka(p.price) + (p.compare ? " <s>" + taka(p.compare) + "</s>" : "") + "</p>" +
        p.options.map(function (o, i) { return '<div class="qv-opt"><b>' + esc(o.name) + '</b><div>' + o.values.map(function (val) { return '<button type="button" data-opt="' + i + '" data-val="' + esc(val) + '">' + esc(val) + "</button>"; }).join("") + "</div></div>"; }).join("") +
        '<div class="qv-buy"><span class="qv-qty"><button type="button" data-q="-1" aria-label="' + esc(tr("One less")) + '">\u2212</button><b>' + num(1) + '</b><button type="button" data-q="1" aria-label="' + esc(tr("One more")) + '">+</button></span>' +
        '<button type="button" class="btn qv-add"' + (p.stock === 0 ? " disabled" : "") + ">" + esc(p.stock === 0 ? tr("Sold out") : tr("Add to cart")) + "</button></div>" +
        '<p class="qv-msg" hidden></p>' + (p.description ? '<div class="qv-desc">' + esc(p.description).replace(/\n/g, "<br>") + "</div>" : "") + "</div></div>";
      var site = document.querySelector(".site");
      (site ? site.parentNode : document.body).appendChild(box);
      box.setAttribute("style", site ? site.getAttribute("style") || "" : "");
      var close = function () { box.remove(); document.removeEventListener("keydown", key); };
      var key = function (e) { if (e.key === "Escape") close(); };
      document.addEventListener("keydown", key);
      box.addEventListener("click", function (e) {
        if (e.target === box || e.target.closest(".qv-x")) { close(); return; }
        var th = e.target.closest("[data-img]");
        if (th) { box.querySelector(".qv-main").innerHTML = '<img src="' + esc(imgs[+th.getAttribute("data-img")]) + '" alt="">'; box.querySelectorAll("[data-img]").forEach(function (b) { b.classList.toggle("on", b === th); }); return; }
        var op = e.target.closest("[data-opt]");
        if (op) { pick[op.getAttribute("data-opt")] = op.getAttribute("data-val"); box.querySelectorAll('[data-opt="' + op.getAttribute("data-opt") + '"]').forEach(function (b) { b.classList.toggle("on", b === op); }); box.querySelector(".qv-msg").hidden = true; return; }
        var dq = e.target.closest("[data-q]");
        if (dq) { qty = Math.max(1, Math.min(99, qty + Number(dq.getAttribute("data-q")))); box.querySelector(".qv-qty b").textContent = num(qty); return; }
        if (e.target.closest(".qv-add")) {
          var missing = p.options.filter(function (o, i) { return !pick[i]; })[0];
          if (missing) { var m = box.querySelector(".qv-msg"); m.hidden = false; m.textContent = tr("Please choose a {opt}", { opt: missing.name.toLowerCase() }); return; }
          var v = p.options.map(function (o, i) { return o.name + ": " + pick[i]; }).join(" / ");
          if (addToCart(p, v, qty)) close();
        }
      });
      var first = box.querySelector(".qv-add"); if (first) first.focus();
    };
    var draw = function () {
      var count = cart.reduce(function (a, it) { return a + it.qty; }, 0);
      // Themes that always show the count keep a "0" badge; the others show it once something is in the cart
      document.querySelectorAll('.tools a[href="/checkout"]').forEach(function (a) { if (count || a.closest(".theme-fashion")) a.setAttribute("data-count", num(count)); else a.removeAttribute("data-count"); });
      document.querySelectorAll(".checkout").forEach(function (root) {
        var box = root.querySelector("[data-items]"), sub = subtotal(), d = root.querySelector('input[name="delivery"]:checked');
        var fee = cart.length && d ? Number(d.getAttribute("data-fee")) || 0 : 0;
        // A code stops working when the cart changes so it no longer fits
        if (code) { var why = discountProblem(code, lines(), Date.now()); if (why) { code = null; msg(root, trWhy(why), false); } }
        var off = code ? discountFor(code, lines(), fee) : 0, total = Math.max(0, sub + fee - off);
        box.innerHTML = cart.length ? cart.map(function (it, i) {
          var p = byId(it.id);
          return '<div class="co-item"><span class="co-img" style="background:' + esc(p.color || "#e9e6e1") + '">' + (p.image ? '<img src="' + esc(p.image) + '" alt="">' : "") + "<em>" + num(it.qty) + '</em></span><span class="co-name">' + esc(p.name) + (it.v ? '<small class="co-v">' + esc(it.v) + "</small>" : "") +
            '<span class="co-qty"><button type="button" data-qty="-1" data-i="' + i + '" aria-label="' + esc(tr("One less")) + '">\u2212</button><b>' + num(it.qty) + '</b><button type="button" data-qty="1" data-i="' + i + '" aria-label="' + esc(tr("One more")) + '">+</button><button type="button" class="co-rm" data-rm="' + i + '">' + esc(tr("Remove")) + '</button></span></span><b>' + taka(p.price * it.qty) + "</b></div>";
        }).join("") : '<p class="empty">' + esc(tr("Your cart is empty.")) + ' <a href="/shop">' + esc(tr("Continue shopping")) + '</a></p>';
        root.querySelectorAll(".co-sub").forEach(function (e) { e.textContent = taka(sub); });
        root.querySelectorAll(".co-fee").forEach(function (e) { e.textContent = taka(cart.length ? fee : 0); });
        root.querySelectorAll(".co-tot").forEach(function (e) { e.textContent = taka(total); });
        var dl = root.querySelector(".co-disc");
        if (dl) { dl.hidden = !off; dl.querySelector("span").textContent = tr(code && code.type === "shipping" ? "Free delivery" : "Discount"); dl.querySelector(".co-disc-v").textContent = "\u2212" + taka(off) + (code ? " (" + code.code + ")" : ""); }
        var btn = root.querySelector(".co-place"); if (btn) btn.disabled = !cart.length;
      });
    };
    var msg = function (root, text, ok) { var m = root.querySelector(".co-msg"); if (m) { m.hidden = !text; m.textContent = text; m.className = "co-msg" + (ok ? " ok" : ""); } };
    // Hero slides: the arrows move between photos, and they move on by themselves every few seconds
    var slide = function (box, step) {
      var all = box.querySelectorAll(".hero-slide"), i = 0;
      all.forEach(function (s, k) { if (s.classList.contains("on")) i = k; });
      var n = (i + step + all.length) % all.length;
      all.forEach(function (s, k) { s.classList.toggle("on", k === n); });
      var c = box.querySelector(".hero-count b"); if (c) c.textContent = String(n + 1).padStart(2, "0");
    };
    setInterval(function () { document.querySelectorAll("[data-slider]").forEach(function (b) { if (b.offsetParent && !b.matches(":hover")) slide(b, 1); }); }, 6000);
    // Wishlist hearts, kept for this visit
    var wish = [];
    try { wish = JSON.parse(sessionStorage.getItem("shop-wish") || "[]"); } catch (e) {}
    var paintWish = function () { document.querySelectorAll("[data-wish]").forEach(function (b) { var on = wish.indexOf(b.getAttribute("data-wish")) >= 0; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); }); };
    paintWish();
    document.addEventListener("click", function (e) {
      if (e.target.closest(".qv")) return;
      var sl = e.target.closest("[data-slide]");
      if (sl) { slide(sl.closest("[data-slider]"), Number(sl.getAttribute("data-slide"))); return; }
      var wh = e.target.closest("[data-wish]");
      if (wh) {
        var wid = wh.getAttribute("data-wish"), at = wish.indexOf(wid);
        if (at >= 0) wish.splice(at, 1); else wish.push(wid);
        try { sessionStorage.setItem("shop-wish", JSON.stringify(wish)); } catch (err) {}
        paintWish(); note(tr(at >= 0 ? "Removed from your wishlist" : "Saved to your wishlist"));
        return;
      }
      var fc = e.target.closest("[data-cat]");
      if (fc && fc.tagName === "BUTTON") {
        var sec = fc.closest(".s-products") || document, cat = fc.getAttribute("data-cat");
        sec.querySelectorAll(".p-filters button").forEach(function (b) { b.classList.toggle("on", b === fc); });
        sec.querySelectorAll(".product[data-cat]").forEach(function (card) { card.hidden = !!cat && card.getAttribute("data-cat") !== cat; });
        return;
      }
      var vw = e.target.closest("[data-view]");
      if (vw) { var vp = byId(vw.getAttribute("data-view")); if (vp) view(vp); return; }
      var add = e.target.closest("[data-add]");
      if (add) {
        var p = byId(add.getAttribute("data-add"));
        // Products with sizes/colors open their details so the customer can choose
        if (p.options.length) view(p); else addToCart(p, "", 1);
        return;
      }
      var q = e.target.closest("[data-qty]");
      if (q) {
        var x = cart[+q.getAttribute("data-i")], pr = byId(x.id), step = Number(q.getAttribute("data-qty"));
        if (step > 0 && pr.stock != null && inCart(pr.id) >= pr.stock) { note("No more left in stock"); return; }
        x.qty += step;
        if (x.qty < 1) cart = cart.filter(function (c) { return c !== x; });
        save(); return;
      }
      var rm = e.target.closest("[data-rm]");
      if (rm) { cart.splice(+rm.getAttribute("data-rm"), 1); save(); return; }
      var ap = e.target.closest(".co-apply");
      if (ap) {
        var root = ap.closest(".checkout"), val = (root.querySelector(".co-code").value || "").trim().toUpperCase();
        var found = D.discounts.filter(function (d) { return d.code === val; })[0];
        if (!val) { code = null; msg(root, "", false); }
        else if (!found || discountProblem(found, lines(), Date.now())) { code = null; msg(root, trWhy(discountProblem(found, lines(), Date.now())), false); }
        else { code = found; msg(root, tr("Code {code} applied", { code: found.code }) + (found.once ? tr(" (one use per customer)") : ""), true); }
        draw();
      }
    });
    document.addEventListener("change", function (e) { if (e.target.name === "delivery") draw(); });
    // Opening the checkout with something in the cart counts as starting checkout (once per visit)
    var started = false;
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href="/checkout"]');
      if (a && cart.length && !started) { started = true; track("checkout", subtotal(), lines()); }
    });
    // The header's search box: opens the shop page with only the products whose name matches
    document.addEventListener("submit", function (e) {
      var f = e.target.closest(".h-search");
      if (!f) return;
      e.preventDefault();
      var q = (f.querySelector("input").value || "").trim().toLowerCase();
      var pg = document.querySelector('[data-slug="shop"]');
      if (pg) document.querySelectorAll("[data-slug]").forEach(function (d) { d.hidden = d !== pg; });
      var root = pg || document, shown = 0;
      root.querySelectorAll(".p-filters button").forEach(function (b, i) { b.classList.toggle("on", i === 0); });
      root.querySelectorAll(".product").forEach(function (card) {
        var name = ((card.querySelector(".p-name") || {}).textContent || "").toLowerCase(), ok = !q || name.indexOf(q) >= 0;
        card.hidden = !ok; if (ok) shown++;
      });
      if (q && !shown) note(tr("No products match “{q}”", { q: q }));
      scrollTo(0, 0);
    });
    document.addEventListener("submit", function (e) {
      var form = e.target.closest(".co-form");
      if (!form) return;
      e.preventDefault();
      if (!cart.length) { note(tr("Your cart is empty")); return; }
      var root = form.closest(".checkout"), answers = [];
      form.querySelectorAll("[data-q]").forEach(function (f) { if (f.value.trim()) answers.push({ label: f.getAttribute("data-q"), type: f.getAttribute("data-type"), value: f.value.trim() }); });
      var pick = function (n) { var r = form.querySelector('input[name="' + n + '"]:checked'); return r ? r.value : ""; };
      var fee = feeNow(), paid = Math.max(0, subtotal() + fee - (code ? discountFor(code, lines(), fee) : 0));
      track("buy", paid, lines());
      var order = { items: cart.map(function (it) { return { id: it.id, qty: it.qty, v: it.v || "" }; }), answers: answers, delivery: pick("delivery"), payment: pick("pay"), code: code ? code.code : "" };
      if (window.opener) { try { window.opener.postMessage({ type: "shopilier-order", order: order }, location.origin === "null" ? "*" : location.origin); } catch (err) {} }
      cart = []; code = null; save();
      root.innerHTML = '<div class="co-done"><span>\u2713</span><h1>' + esc(tr("Thank you!")) + '</h1><p class="lead">' + esc(tr("Your order is placed. We'll call you soon to confirm it.")) + '</p><a class="btn" href="/">' + esc(tr("Back to the shop")) + "</a></div>";
      scrollTo(0, 0);
    });
    draw();
  };

  const storeHTML = (site, pages, opts = {}) => {
    const doc = documentHTML(site, pages, { ...opts, page: pages[0] });
    // opts.start: the page to open first (default: the home page)
    const first = Math.max(0, pages.findIndex((p) => p.id === opts.start));
    const all = pages.map((p, i) => `<div data-slug="${esc(p.slug || "")}"${i === first ? "" : " hidden"}>${renderBody(site, pages, { ...opts, page: p })}</div>`).join("");
    const nav = `<script>document.addEventListener("click",function(e){var m=e.target.closest(".burger");if(m){m.closest(".s-header").classList.toggle("m-open");return}document.querySelectorAll(".m-open").forEach(function(h){h.classList.remove("m-open")});var a=e.target.closest("a[href^='/']");if(!a)return;var slug=a.getAttribute("href").slice(1),pg=document.querySelector('[data-slug="'+slug+'"]');e.preventDefault();if(!pg)return;document.querySelectorAll("[data-slug]").forEach(function(d){d.hidden=d!==pg});scrollTo(0,0)});<\/script>`;
    // What the shop script needs: products that are for sale and the discount codes that work
    const shop = {
      t: STRINGS[site.lang] || null, bn: site.lang === "bn",
      products: (opts.products || []).filter((p) => p.status !== "draft").map((p) => ({
        id: p.id, name: p.name, price: Number(p.price) || 0, compare: onSale(p) ? Number(p.compare) : 0, stock: p.stock == null ? null : Number(p.stock), color: color(p.color),
        image: safeImg(p.image) ? p.image : "", images: (p.images || []).filter((u) => safeImg(u)).slice(0, 8), description: String(p.description || "").slice(0, 2000),
        options: (p.options || []).filter((o) => o && o.name && (o.values || []).length).slice(0, 2).map((o) => ({ name: o.name, values: o.values.slice(0, 20) })),
      })),
      discounts: (opts.discounts || []).filter((d) => d.active !== false).map((d) => ({
        code: d.code, type: d.type, value: Number(d.value) || 0, min: Number(d.min) || 0, max: Number(d.max) || 0, products: d.products || [],
        starts: d.starts || "", ends: d.ends || "", limit: Number(d.limit) || 0, used: Number(d.used) || 0, once: !!d.once,
      })),
    };
    const shopJs = `<script>window.SHOP=${JSON.stringify(shop).replace(/</g, "\\u003c")};var discountFor=(${discountFor}),discountProblem=(${discountProblem});(${storefront})();<\/script>`;
    // Pixels and custom code from Marketing: in the <head>, and at the end of the <body>
    const t = opts.tracking || {};
    // The website keeps room for its scrollbar, so moving between a short and a long page doesn't shift it sideways
    return doc.replace("</head>", () => "<style>html{scrollbar-gutter:stable}</style>" + (t.head ? t.head + "\n" : "") + "</head>")
      .replace(/<body([^>]*)>[\s\S]*<\/body>/, (m, attrs) => `<body${attrs}>${all}${nav}${shopJs}${t.body || ""}</body>`);
  };

  return { tr, LANGS, LABELS, labelOf, money, STARTERS, starterPages, applyStarter, sampleProducts, previewStore, PAYMENTS_BN, CHECKOUT_BN, THEMES, discountFor, discountProblem, ANNOUNCE_COLORS, announceStyle, HEADER_BUTTONS, DROPDOWNS, CHECKOUT, PAYMENTS, SOCIALS, socialIcon, LIBRARY, fromLibrary, storeHTML, TEMPLATE_FONTS, esc, uid, FONTS, TYPES, BLOCKS, FEATURE_ICONS, make, makeBlock, pageSections, ensure, applyTemplate, renderBody, documentHTML, safeImg, isDark };
})();
