import type { ReactNode } from "react";

// The template previews shown on the Templates page and in the preview popup (mock storefronts drawn with CSS and SVG).
// "live" adds the phone-size menu button the popup shows.
const Burger = () => (
  <span className="s-burger"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg></span>
);

// A template's real storefront in a frame: scaled down to the card, or full size in the preview popup
const RealShot = ({ id, name, live }: { id: string; name: string; live: boolean }) => (
  live
    ? <iframe className="shot-live-frame" src={`/templates/preview/${id}`} title={`${name} preview`} />
    : <div className="shot shot-real"><iframe src={`/templates/preview/${id}`} title={`${name} preview`} loading="lazy" tabIndex={-1} aria-hidden="true" /></div>
);

// desc is shown on the card in Bangla; search covers the English keywords and the Bangla description
export type TemplateCard = { id: string; name: string; desc: string; pop: number; newest: number; search: string; shot: (live: boolean) => ReactNode };

export const TEMPLATE_CARDS: TemplateCard[] = [
  {
    id: "luxe-store",
    name: "Fashion & Clothing",
    desc: "টি-শার্ট ও পোশাকের জন্য বাংলা অনলাইন দোকান, কালেকশন, অফার আর দ্রুত চেকআউটসহ।",
    pop: 0,
    newest: 0,
    search: "fashion & clothing a bangla clothing store for t-shirts and apparel, with collections, offers and a quick checkout. fashion clothing t-shirt tshirt polo hoodie saree boutique dress apparel bangla shotiq টি-শার্ট পোশাক",
    // The real storefront (see /templates/preview/luxe-store), so the card and the popup show the website you get
    shot: (live) => <RealShot id="luxe-store" name="Fashion & Clothing" live={live} />,
  },
  {
    id: "saas-landing",
    name: "Electronics & Gadgets",
    desc: "ফোন, গ্যাজেট ও এক্সেসরিজের জন্য ঝকঝকে আধুনিক দোকান, ওয়ারেন্টির তথ্যসহ।",
    pop: 1,
    newest: 2,
    search: "electronics & gadgets a clean, modern store for phones, gadgets and accessories, with warranty details. electronics gadgets phone mobile earbuds smart watch power bank tech accessories",
    shot: (live) => (
      <div data-layout="center" className={"shot t-saas" + (live ? " live" : "")}>
        <div className="s-nav"><b>GadgetBari</b>
          <nav><span>Home</span><span>Phones</span><span>Gadgets</span><span>Deals</span></nav><span className="s-cta">Shop Now</span>{live && <Burger />}
        </div>
        <div className="s-copy">
          <h4>Gadgets For<br />Everyday Life</h4>
          <p>Phones, earbuds and smart home devices — with warranty and fast delivery.</p>
        </div>
        <div className="s-art">
          <svg viewBox="0 0 300 66" preserveAspectRatio="xMidYMax meet"><rect x="0" y="0" width="300" height="80" rx="5" fill="#fff" stroke="#e3e1f3" /><rect x="0" y="0" width="22" height="80" rx="5" fill="#1b1f3b" /><g fill="#5a6390"><circle cx="11" cy="14" r="2.3" /><circle cx="11" cy="25" r="2.3" /><circle cx="11" cy="36" r="2.3" /><circle cx="11" cy="47" r="2.3" /></g><text x="30" y="12" fontSize="6" fontWeight="700" fill="#111">Dashboard</text><text x="84" y="12" fontSize="4.5" fill="#999">Home</text><rect x="262" y="6" width="30" height="8" rx="3" fill="#4b5cf0" /><text x="267" y="11.6" fontSize="3.6" fill="#fff">Get Started</text><g fontSize="4" fill="#666"><text x="34" y="26">Products</text><text x="34" y="36">Orders</text><text x="34" y="46">Customers</text><text x="34" y="56">Analytics</text></g><rect x="30" y="20" width="44" height="9" rx="2" fill="#eef0fb" opacity=".6" /><g fontSize="3.8" fill="#999"><text x="84" y="28">Total Revenue</text><text x="150" y="28">Orders</text><text x="216" y="28">Customers</text></g><g fontSize="6.4" fontWeight="700" fill="#111"><text x="84" y="37">$12,480</text><text x="150" y="37">320</text><text x="216" y="37">1,245</text></g><path d="M84 60l14-6 10 3 14-9 12 5 16-10 12 6 16-10 14 4 18-9 14 3 18-7" stroke="#6b7cf6" strokeWidth="1.4" fill="none" /><g fontSize="3.6" fill="#999"><text x="84" y="48">Orders</text><text x="216" y="48">Orders</text></g></svg>
        </div>
        <section className="s-more">
          <h5>Best sellers</h5>
          <div className="s-grid">
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#c7cdfd,#6b7cf6)" }} /><b>Wireless Earbuds</b><em>৳2,990</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#e3defb,#8a6af0)" }} /><b>Smart Watch</b><em>৳4,500</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#d4f1ff,#4fa3e8)" }} /><b>Power Bank</b><em>৳1,800</em></div>
          </div>
        </section>
        <footer className="s-foot"><b>GadgetBari</b><span>© 2026 GadgetBari. All rights reserved.</span></footer>
      </div>
    ),
  },
  {
    id: "bistro-restaurant",
    name: "Grocery & Food",
    desc: "মুদি, তাজা খাবার আর নিত্যপ্রয়োজনীয় পণ্যের দোকান, একই দিনে ডেলিভারিসহ।",
    pop: 3,
    newest: 5,
    search: "grocery & food a bold store for groceries, fresh food and daily essentials with same-day delivery. grocery food fresh fish vegetables rice oil bakery sweets restaurant cafe bazar",
    shot: (live) => (
      <div data-layout="bleed" className={"shot t-bistro" + (live ? " live" : "")}>
        <div className="s-art">
          <svg viewBox="0 0 270 220" preserveAspectRatio="xMaxYMid slice"><defs><radialGradient id="bi-glow" cx=".62" cy=".55" r=".7"><stop offset="0" stopColor="#5a3a1c" /><stop offset=".5" stopColor="#24170d" /><stop offset="1" stopColor="#0f0c0a" /></radialGradient><linearGradient id="bi-fade" x1="0" x2="1"><stop offset="0" stopColor="#0f0c0a" /><stop offset=".35" stopColor="#0f0c0a" stopOpacity="0" /></linearGradient><linearGradient id="bi-salmon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f08a4b" /><stop offset=".6" stopColor="#d4582a" /><stop offset="1" stopColor="#8f2f14" /></linearGradient><radialGradient id="bi-plate" cx=".5" cy=".4" r=".6"><stop offset="0" stopColor="#3a3632" /><stop offset="1" stopColor="#151311" /></radialGradient></defs><rect width="270" height="220" fill="url(#bi-glow)" /><g fill="#ffb35c" opacity=".25"><circle cx="236" cy="78" r="5" /><circle cx="252" cy="96" r="3" /><circle cx="214" cy="70" r="2.5" /></g><ellipse cx="170" cy="160" rx="100" ry="48" fill="url(#bi-plate)" /><ellipse cx="170" cy="156" rx="78" ry="34" fill="#2a2622" /><g transform="rotate(-12 165 140)"><rect x="112" y="118" width="104" height="44" rx="14" fill="url(#bi-salmon)" /><g stroke="#ffd0b0" strokeWidth="2" opacity=".75"><path d="M130 120c-4 14-4 28 0 40" /><path d="M148 119c-4 14-4 28 0 42" /><path d="M166 119c-4 14-4 28 0 42" /><path d="M184 119c-4 14-4 28 0 42" /><path d="M200 120c-4 14-4 28 0 40" /></g><rect x="112" y="118" width="104" height="10" rx="6" fill="#5b2a14" opacity=".55" /></g><g fill="#4f8a2b"><circle cx="160" cy="104" r="9" /><circle cx="174" cy="96" r="10" /><circle cx="190" cy="104" r="9" /><circle cx="168" cy="110" r="8" /><circle cx="182" cy="112" r="8" /></g><g fill="#7cbf3b"><circle cx="166" cy="98" r="5" /><circle cx="184" cy="100" r="5" /><circle cx="176" cy="88" r="5" /></g><g fill="#f2e7c9"><circle cx="128" cy="168" r="2" /><circle cx="214" cy="170" r="2" /><circle cx="222" cy="150" r="1.6" /></g><rect width="270" height="220" fill="url(#bi-fade)" /></svg>
        </div>
        <div className="s-nav"><b>Fresh Bazar</b>
          <nav><span>Home</span><span>Shop</span><span>Offers</span><span>Contact</span></nav><span className="s-cta">Order Now</span>{live && <Burger />}
        </div>
        <div className="s-copy">
          <h4>Fresh Food<br />At Your<br />Door</h4>
          <p>Vegetables, fish and pantry staples,<br />delivered the same day.</p>
          <div className="s-btns"><span className="s-btn">Shop Now</span><span className="s-btn ghost">See Offers</span></div>
        </div>
        <section className="s-more">
          <h5>Today&apos;s picks</h5>
          <div className="s-grid">
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#f08a4b,#8f2f14)" }} /><b>Fresh Hilsa</b><em>৳1,200/kg</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#7cbf3b,#2f6b2a)" }} /><b>Organic Rice</b><em>৳85/kg</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#6b3f2a,#2a1810)" }} /><b>Mustard Oil</b><em>৳260</em></div>
          </div>
        </section>
        <footer className="s-foot"><b>Fresh Bazar</b><span>© 2026 Fresh Bazar. All rights reserved.</span></footer>
      </div>
    ),
  },
  {
    id: "nova-portfolio",
    name: "Jewelry & Accessories",
    desc: "গয়না, ঘড়ি ও এক্সেসরিজের জন্য মিনিমাল, প্রিমিয়াম দোকান।",
    pop: 5,
    newest: 3,
    search: "jewelry & accessories a minimal, premium store for jewelry, watches and accessories. jewelry jewellery gold silver pearl necklace earrings bracelet watch accessories minimal",
    shot: (live) => (
      <div data-layout="split" className={"shot t-nova" + (live ? " live" : "")}>
        <div className="s-nav"><b>Rupkotha</b>
          <nav><span>Home</span><span>Shop</span><span>Collections</span><span>Contact</span></nav>{live && <Burger />}
        </div>
        <div className="s-copy"><small>Handcrafted in Bangladesh</small>
          <h4>Jewelry Made<br />To Be Remembered</h4>
          <p>Gold, silver and pearl pieces<br />for every occasion.</p>
          <div className="s-btns"><span className="s-btn">Shop Jewelry</span></div>
        </div>
        <div className="s-art">
          <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="nv-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#eeeef0" /><stop offset="1" stopColor="#c9cacd" /></linearGradient><linearGradient id="nv-top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#ececee" /></linearGradient><linearGradient id="nv-left" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f7f7f8" /><stop offset="1" stopColor="#d7d8db" /></linearGradient><linearGradient id="nv-right" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#dedfe2" /><stop offset="1" stopColor="#b6b8bc" /></linearGradient><filter id="nv-blur"><feGaussianBlur stdDeviation="6" /></filter></defs><rect width="200" height="200" fill="url(#nv-bg)" /><ellipse cx="112" cy="168" rx="70" ry="14" fill="#8e9094" opacity=".45" filter="url(#nv-blur)" /><path d="M60 74l52-26 46 22-50 28z" fill="url(#nv-top)" /><path d="M60 74l48 24-2 68-46-26z" fill="url(#nv-left)" /><path d="M108 98l50-28-2 66-50 30z" fill="url(#nv-right)" /></svg>
        </div>
        <section className="s-more">
          <h5>New in</h5>
          <div className="s-grid">
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#eeeef0,#b6b8bc)" }} /><b>Pearl Earrings</b><em>৳2,200</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#f3e6d6,#c9a27e)" }} /><b>Gold Necklace</b><em>৳12,500</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#dfe7f5,#8ea4c9)" }} /><b>Silver Bracelet</b><em>৳3,800</em></div>
          </div>
        </section>
        <footer className="s-foot"><b>Rupkotha</b><span>© 2026 Rupkotha. All rights reserved.</span></footer>
      </div>
    ),
  },
  {
    id: "growify-agency",
    name: "Home & Furniture",
    desc: "ফার্নিচার, লাইটিং আর ঘর সাজানোর পণ্যের জন্য শান্ত, খোলামেলা দোকান।",
    pop: 4,
    newest: 6,
    search: "home & furniture a calm, spacious store for furniture, lighting and home decor. furniture home decor sofa chair table lamp lighting interior",
    shot: (live) => (
      <div data-layout="split" className={"shot t-growify" + (live ? " live" : "")}>
        <div className="s-nav"><b>Lume Home</b>
          <nav><span>Home</span><span>Shop</span><span>Rooms</span><span>About</span></nav><span className="s-cta">Shop Now</span>{live && <Burger />}
        </div>
        <div className="s-copy"><small>Furniture &amp; Decor</small>
          <h4>Furniture For<br />Modern Living</h4>
          <p>Sofas, tables and decor,<br />delivered across Bangladesh.</p>
          <div className="s-btns"><span className="s-btn">Shop Furniture</span></div>
        </div>
        <div className="s-art">
          <svg viewBox="0 0 200 180" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="gr-wall" x1="0" x2="1"><stop offset="0" stopColor="#fbfaf7" /><stop offset="1" stopColor="#ece8e1" /></linearGradient><linearGradient id="gr-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#cdb79a" /><stop offset="1" stopColor="#a88c6b" /></linearGradient></defs><rect width="200" height="180" fill="url(#gr-wall)" /><rect x="12" y="10" width="78" height="112" fill="#f4f8fb" stroke="#d9d6cf" strokeWidth="3" /><path d="M51 10v112M12 50h78M12 88h78" stroke="#d9d6cf" strokeWidth="2.4" /><rect x="15" y="13" width="34" height="35" fill="#e7f0f6" /><rect x="53" y="52" width="34" height="34" fill="#eaf2f7" /><rect y="132" width="200" height="48" fill="url(#gr-floor)" /><g stroke="#2f6b2a" strokeWidth="2.4" strokeLinecap="round"><path d="M178 132V70" /><path d="M178 92c-14-8-20-20-18-30M178 84c12-8 18-20 16-30M178 108c-16-4-24-14-24-24M178 104c14-4 20-14 20-24" /></g><g fill="#3f8a34"><ellipse cx="160" cy="62" rx="9" ry="5" transform="rotate(-40 160 62)" /><ellipse cx="194" cy="54" rx="9" ry="5" transform="rotate(40 194 54)" /><ellipse cx="154" cy="84" rx="9" ry="5" transform="rotate(-30 154 84)" /><ellipse cx="198" cy="80" rx="9" ry="5" transform="rotate(30 198 80)" /><ellipse cx="178" cy="66" rx="5" ry="10" /></g><path d="M168 132h20l-3 18h-14z" fill="#e8e2d8" /><g fill="#2e7d32"><ellipse cx="8" cy="100" rx="10" ry="5" transform="rotate(-30 8 100)" /><ellipse cx="18" cy="108" rx="10" ry="5" transform="rotate(30 18 108)" /><ellipse cx="10" cy="118" rx="10" ry="5" /></g><rect x="6" y="122" width="14" height="22" fill="#eae4da" /><ellipse cx="104" cy="122" rx="56" ry="9" fill="#6b4a2f" /><rect x="48" y="118" width="112" height="6" fill="#5a3d25" /><path d="M70 124l-4 34M138 124l4 34" stroke="#3b2a1c" strokeWidth="3" /><g fill="#1d1d1f"><path d="M58 112h18l-2 26H60z" /><path d="M130 112h18l-2 26h-14z" /><path d="M94 108h20l-2 22H96z" /></g><g stroke="#1d1d1f" strokeWidth="2.2"><path d="M60 138l-2 24M74 138l2 24M132 138l-2 24M146 138l2 24" /></g></svg>
        </div>
        <section className="s-more">
          <h5>Popular picks</h5>
          <div className="s-grid">
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#efe9df,#cdb79a)" }} /><b>Accent Chair</b><em>৳12,500</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#e3efe0,#5f9a55)" }} /><b>Table Lamp</b><em>৳3,200</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#e8e4f8,#8a7ad6)" }} /><b>Coffee Table</b><em>৳9,800</em></div>
          </div>
        </section>
        <footer className="s-foot"><b>Lume Home</b><span>© 2026 Lume Home. All rights reserved.</span></footer>
      </div>
    ),
  },
  {
    id: "writely-blog",
    name: "Single Product",
    desc: "একটি প্রোডাক্টের গল্প বলা এক পেজের দোকান, ফিচার আর রিভিউসহ।",
    pop: 6,
    newest: 1,
    search: "single product a story-led one-page shop for a single hero product, with features and reviews. single product one product landing page backpack travel outdoor story trailo",
    shot: (live) => (
      <div data-layout="split" className={"shot t-writely" + (live ? " live" : "")}>
        <div className="s-nav"><b>Trailo</b>
          <nav><span>Home</span><span>Features</span><span>Reviews</span></nav>
          <div className="s-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 8h14l-1 13H6z" /><path d="M9 8V6a3 3 0 016 0v2" /></svg>
          </div>{live && <Burger />}
        </div>
        <div className="s-copy">
          <h4>One Bag For<br />Every Trail</h4>
          <p>A 40-litre backpack built for<br />Bandarban to Sajek.</p>
          <div className="s-btns"><span className="s-btn">Pre-order — ৳3,490</span></div>
        </div>
        <div className="s-art">
          <svg viewBox="0 0 240 180" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="wr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8fb5dc" /><stop offset="1" stopColor="#e3edf6" /></linearGradient><linearGradient id="wr-lake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5b7ea1" /><stop offset="1" stopColor="#1f3b57" /></linearGradient><linearGradient id="wr-mtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7b8a9c" /><stop offset="1" stopColor="#3d4a5a" /></linearGradient></defs><rect width="240" height="180" fill="url(#wr-sky)" /><path d="M0 108l40-34 26 18 30-42 30 30 22-48 30 40 22-16 40 52z" fill="#9fb0c4" /><path d="M30 112l50-46 22 18 34-48 40 52 20-14 44 38z" fill="url(#wr-mtn)" /><path d="M136 36l-14 20 8-4 6 8 6-8 8 6z M80 66l-10 12 8-2 4 6 6-6z" fill="#fff" /><path d="M136 36l-12 18 6-2 6 6z" fill="#f2f6fa" /><rect y="110" width="240" height="70" fill="url(#wr-lake)" /><path d="M30 112l50 30 22-10 34 30 40-34 20 8 44-24z" fill="#4c6680" opacity=".45" /><g fill="#1a3324"><path d="M0 120l8-30 8 30zM10 124l10-40 10 40zM24 120l7-26 7 26z" /><path d="M196 120l9-34 9 34zM210 124l10-42 10 42zM226 120l7-28 7 28z" /></g><rect y="118" width="240" height="2" fill="#dfe8f0" opacity=".5" /></svg>
        </div>
        <section className="s-more">
          <h5>Why Trailo</h5>
          <div className="s-grid">
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#bcd3ea,#5b7ea1)" }} /><b>40L capacity</b><em>Fits a 3-day trip</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#f2e3cf,#c58b5a)" }} /><b>Waterproof</b><em>Rain-tested fabric</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#cfe3d6,#3d6b52)" }} /><b>2-year warranty</b><em>Repairs included</em></div>
          </div>
        </section>
        <footer className="s-foot"><b>Trailo</b><span>© 2026 Trailo. All rights reserved.</span></footer>
      </div>
    ),
  },
  {
    id: "fixly-services",
    name: "Single Product",
    desc: "একটি প্রোডাক্ট বিক্রির এক পেজের দোকান, ভেতরে কী আছে, ওয়ারেন্টি আর FAQ-সহ।",
    pop: 7,
    newest: 7,
    search: "single product a one-page shop that sells one product, with what's inside, a warranty and faq. single product one product landing page tool kit tools hardware fixkit",
    shot: (live) => (
      <div data-layout="split" className={"shot t-fixly" + (live ? " live" : "")}>
        <div className="s-nav"><b>FixKit</b>
          <nav><span>Home</span><span>Features</span><span>Reviews</span><span>FAQ</span></nav><span className="s-cta">Order Now</span>{live && <Burger />}
        </div>
        <div className="s-copy"><small>42-piece tool kit</small>
          <h4>The Only Tool Kit<br />You&apos;ll Ever Need</h4>
          <p>Everything for home repairs,<br />in one box.</p>
          <div className="s-btns"><span className="s-btn">Order Now — ৳2,250</span></div>
        </div>
        <div className="s-art">
          <svg viewBox="0 0 200 170" preserveAspectRatio="xMidYMax meet"><rect x="34" y="70" width="132" height="100" rx="4" fill="#fff" stroke="#c7d6f5" strokeWidth="2" /><path d="M20 78l80-60 80 60" fill="none" stroke="#1d4ed8" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" /><rect x="86" y="112" width="30" height="58" rx="3" fill="#1d4ed8" /><circle cx="110" cy="142" r="2.4" fill="#fff" /><rect x="48" y="92" width="26" height="24" rx="3" fill="#dbe7ff" /><rect x="128" y="92" width="26" height="24" rx="3" fill="#dbe7ff" /><circle cx="160" cy="44" r="22" fill="#ffb020" /><path d="M150 54l14-14m-4-6a7 7 0 109 9l-5-1-2-5z" stroke="#7a4b00" strokeWidth="3.2" fill="none" strokeLinecap="round" /></svg>
        </div>
        <section className="s-more">
          <h5>What&apos;s inside</h5>
          <div className="s-grid">
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#dbe7ff,#1d4ed8)" }} /><b>42 pieces</b><em>Screwdrivers, pliers, wrench</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#e0f2fe,#0ea5e9)" }} /><b>Lifetime warranty</b><em>Replaced free, forever</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#fff1d6,#ffb020)" }} /><b>Free delivery</b><em>Anywhere in Bangladesh</em></div>
          </div>
        </section>
        <footer className="s-foot"><b>FixKit</b><span>© 2026 FixKit. All rights reserved.</span></footer>
      </div>
    ),
  },
  {
    id: "launchly-landing",
    name: "Single Product",
    desc: "নতুন প্রোডাক্ট লঞ্চের জন্য সাহসী পেজ, প্রি-অর্ডার আর আর্লি-বার্ড দামসহ।",
    pop: 8,
    newest: 8,
    search: "single product a bold launch page for one product, with pre-orders and early-bird pricing. single product one product launch pre-order waitlist earbuds gadget nova buds",
    shot: (live) => (
      <div data-layout="bleed" className={"shot t-launch" + (live ? " live" : "")}>
        <div className="s-art">
          <svg viewBox="0 0 450 248" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="la-a" cx=".2" cy=".9" r=".6"><stop offset="0" stopColor="#ff3d8b" stopOpacity=".55" /><stop offset="1" stopColor="#ff3d8b" stopOpacity="0" /></radialGradient><radialGradient id="la-b" cx=".85" cy=".2" r=".55"><stop offset="0" stopColor="#5b5cf0" stopOpacity=".6" /><stop offset="1" stopColor="#5b5cf0" stopOpacity="0" /></radialGradient></defs><rect width="450" height="248" fill="url(#la-a)" /><rect width="450" height="248" fill="url(#la-b)" /><g fill="#fff" opacity=".6"><circle cx="60" cy="70" r="1.2" /><circle cx="390" cy="160" r="1.4" /><circle cx="330" cy="210" r="1" /><circle cx="120" cy="190" r="1" /><circle cx="420" cy="90" r="1" /></g></svg>
        </div>
        <div className="s-nav"><b>Nova Buds</b>
          <nav><span>Features</span><span>Reviews</span><span>FAQ</span></nav><span className="s-cta">Pre-order</span>{live && <Burger />}
        </div>
        <div className="s-copy">
          <h4>One Product.<br />Done Right.</h4>
          <p>Wireless earbuds with a 30-hour battery and a 2-year warranty.</p>
          <div className="s-btns"><span className="s-btn">Pre-order — ৳3,990</span></div>
        </div>
        <section className="s-more">
          <h5>Why Nova Buds</h5>
          <div className="s-grid">
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#ff7a59,#ff3d8b)" }} /><b>30h battery</b><em>A week on one charge</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#5b5cf0,#8a3fe0)" }} /><b>Fast charging</b><em>10 minutes for 2 hours</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#2a2b45,#5b5cf0)" }} /><b>2-year warranty</b><em>Replaced, no questions</em></div>
          </div>
        </section>
        <footer className="s-foot"><b>Nova Buds</b><span>© 2026 Nova Buds. All rights reserved.</span></footer>
      </div>
    ),
  },
  {
    id: "mia-personal",
    name: "Beauty & Cosmetics",
    desc: "স্কিনকেয়ার, কসমেটিকস ও বিউটি পণ্যের জন্য উষ্ণ, বন্ধুত্বপূর্ণ দোকান।",
    pop: 2,
    newest: 9,
    search: "beauty & cosmetics a warm, friendly store for skincare, cosmetics and beauty products. beauty cosmetics skincare makeup serum cream perfume glow",
    shot: (live) => (
      <div data-layout="profile" className={"shot t-mia" + (live ? " live" : "")}>
        <div className="s-nav"><b>Glow</b>
          <nav><span>Shop</span><span>Skincare</span><span>Contact</span></nav>{live && <Burger />}
        </div>
        <div className="s-art">
          <svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#f2c9a8" /><path d="M22 48c0-24 14-36 30-36s28 14 28 36c0 14-4 26-4 40H26c0-14-4-24-4-40z" fill="#5a3322" /><ellipse cx="51" cy="50" rx="17" ry="20" fill="#f6d2b8" /><path d="M33 46c4-14 14-20 26-18 6 6 10 12 10 20-8-8-20-10-36-2z" fill="#5a3322" /><path d="M18 100c4-20 18-28 33-28s29 8 33 28z" fill="#e0794f" /></svg>
        </div>
        <div className="s-copy">
          <h4>Skincare That<br />Loves You Back</h4>
          <p>Natural beauty, made for Bangladeshi skin.</p>
        </div>
        <section className="s-more">
          <h5>Best sellers</h5>
          <div className="s-grid">
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#f2c9a8,#e0794f)" }} /><b>Vitamin C Serum</b><em>৳1,250</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#f6e3cf,#c98f5a)" }} /><b>Rose Face Mist</b><em>৳650</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#e9d8f2,#a06cc9)" }} /><b>Aloe Night Cream</b><em>৳890</em></div>
          </div>
        </section>
        <footer className="s-foot"><b>Glow</b><span>© 2026 Glow. All rights reserved.</span></footer>
      </div>
    ),
  },
];
