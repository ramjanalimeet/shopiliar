import type { ReactNode } from "react";

// The template previews shown on the Templates page and in the preview popup (mock storefronts drawn with CSS and SVG).
// "live" adds the phone-size menu button the popup shows.
const Burger = () => (
  <span className="s-burger"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg></span>
);

export type TemplateCard = { id: string; name: string; desc: string; niches: string[]; pop: number; newest: number; search: string; shot: (live: boolean) => ReactNode };

export const TEMPLATE_CARDS: TemplateCard[] = [
  {
    id: "luxe-store",
    name: "Luxe Store",
    desc: "A modern and elegant online store template for fashion, beauty and lifestyle brands.",
    niches: ["fashion","beauty","jewellery"],
    pop: 0,
    newest: 4,
    search: "luxe store a modern and elegant online store template for fashion, beauty and lifestyle brands. fashion beauty lifestyle shop ecommerce clothing online store shop products clothing boutique saree cosmetics skincare perfume bags shoes fashion & clothing beauty & cosmetics jewellery & accessories",
    shot: (live) => (
      <div data-layout="split" className={"shot t-luxe" + (live ? " live" : "")}>
        <div className="s-nav"><b>LUXE</b>
          <nav><span>Home</span><span>Shop</span><span>Collections</span><span>About</span></nav>
          <div className="s-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 4h2l2.4 11h11l2-8H6.3" /><circle cx="9" cy="20" r="1.3" /><circle cx="17" cy="20" r="1.3" /></svg>
          </div>{live && <Burger />}
        </div>
        <div className="s-copy">
          <h4>Modern<br />Fashion<br />For Everyone</h4>
          <p>Premium quality. Timeless style.</p>
          <div className="s-btns"><span className="s-btn">Shop Now</span></div>
        </div>
        <div className="s-art">
          <svg viewBox="0 0 200 220" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="lx-coat" x1="0" x2="1"><stop offset="0" stopColor="#e3c6a5" /><stop offset=".55" stopColor="#d4b08a" /><stop offset="1" stopColor="#b98f68" /></linearGradient><linearGradient id="lx-hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6b4630" /><stop offset="1" stopColor="#3d2617" /></linearGradient></defs><ellipse cx="106" cy="58" rx="27" ry="31" fill="url(#lx-hair)" /><path d="M84 60c-2 26 4 40 22 44s26-8 24-40z" fill="url(#lx-hair)" /><path d="M96 86h20v16H96z" fill="#e9c4a6" /><path d="M60 112c6-14 26-20 46-20s40 6 48 20l14 108H46z" fill="url(#lx-coat)" /><path d="M106 96c-8 6-14 16-16 30l16 94h4l-2-94c0-12 2-22-2-30z" fill="#c69d75" opacity=".55" /><path d="M140 102c4 30 8 56 10 74" stroke="#1e1a17" strokeWidth="3.5" fill="none" /><path d="M136 170h34l4 44h-42z" fill="#1e1a17" /><path d="M140 176h26" stroke="#3a332e" strokeWidth="1.5" /></svg>
        </div>
        <section className="s-more">
          <h5>New Arrivals</h5>
          <div className="s-grid">
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#d8b48f,#b98f68)" }} /><b>Wool Coat</b><em>৳4,500</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#3a2f28,#1e1a17)" }} /><b>Leather Tote</b><em>৳3,200</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#e9c9b8,#c98f7a)" }} /><b>Silk Scarf</b><em>৳1,200</em></div>
          </div>
        </section>
        <footer className="s-foot"><b>LUXE</b><span>© 2026 LUXE. All rights reserved.</span></footer>
      </div>
    ),
  },
  {
    id: "saas-landing",
    name: "SaaS Landing",
    desc: "A clean and modern template for SaaS, startup and tech businesses.",
    niches: ["electronics","health"],
    pop: 1,
    newest: 2,
    search: "saas landing a clean and modern template for saas, startup and tech businesses. saas startup tech software app product online store shop products gadgets phone accessories software digital products courses electronics & gadgets health & fitness",
    shot: (live) => (
      <div data-layout="center" className={"shot t-saas" + (live ? " live" : "")}>
        <div className="s-nav"><b>SaaSly</b>
          <nav><span>Home</span><span>Features</span><span>Pricing</span><span>Blog</span></nav><span className="s-cta">Get Started</span>{live && <Burger />}
        </div>
        <div className="s-copy">
          <h4>Build Better<br />Products Faster</h4>
          <p>All the tools you need to launch, grow and manage your business.</p>
        </div>
        <div className="s-art">
          <svg viewBox="0 0 300 66" preserveAspectRatio="xMidYMax meet"><rect x="0" y="0" width="300" height="80" rx="5" fill="#fff" stroke="#e3e1f3" /><rect x="0" y="0" width="22" height="80" rx="5" fill="#1b1f3b" /><g fill="#5a6390"><circle cx="11" cy="14" r="2.3" /><circle cx="11" cy="25" r="2.3" /><circle cx="11" cy="36" r="2.3" /><circle cx="11" cy="47" r="2.3" /></g><text x="30" y="12" fontSize="6" fontWeight="700" fill="#111">Dashboard</text><text x="84" y="12" fontSize="4.5" fill="#999">Home</text><rect x="262" y="6" width="30" height="8" rx="3" fill="#4b5cf0" /><text x="267" y="11.6" fontSize="3.6" fill="#fff">Get Started</text><g fontSize="4" fill="#666"><text x="34" y="26">Products</text><text x="34" y="36">Orders</text><text x="34" y="46">Customers</text><text x="34" y="56">Analytics</text></g><rect x="30" y="20" width="44" height="9" rx="2" fill="#eef0fb" opacity=".6" /><g fontSize="3.8" fill="#999"><text x="84" y="28">Total Revenue</text><text x="150" y="28">Orders</text><text x="216" y="28">Customers</text></g><g fontSize="6.4" fontWeight="700" fill="#111"><text x="84" y="37">$12,480</text><text x="150" y="37">320</text><text x="216" y="37">1,245</text></g><path d="M84 60l14-6 10 3 14-9 12 5 16-10 12 6 16-10 14 4 18-9 14 3 18-7" stroke="#6b7cf6" strokeWidth="1.4" fill="none" /><g fontSize="3.6" fill="#999"><text x="84" y="48">Orders</text><text x="216" y="48">Orders</text></g></svg>
        </div>
        <section className="s-more">
          <h5>Everything you need</h5>
          <div className="s-grid">
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#c7cdfd,#6b7cf6)" }} /><b>Analytics</b><em>Track growth in real time</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#e3defb,#8a6af0)" }} /><b>Automation</b><em>Save hours every week</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#d4f1ff,#4fa3e8)" }} /><b>Integrations</b><em>Connect your favorite tools</em></div>
          </div>
        </section>
        <footer className="s-foot"><b>SaaSly</b><span>© 2026 SaaSly. All rights reserved.</span></footer>
      </div>
    ),
  },
  {
    id: "bistro-restaurant",
    name: "Bistro Restaurant",
    desc: "A stylish template for restaurants, cafes and food businesses.",
    niches: ["food"],
    pop: 2,
    newest: 5,
    search: "bistro restaurant a stylish template for restaurants, cafes and food businesses. restaurant cafe food menu dining bar online store shop products grocery bakery sweets cake homemade pitha catering tea coffee food & grocery",
    shot: (live) => (
      <div data-layout="bleed" className={"shot t-bistro" + (live ? " live" : "")}>
        <div className="s-art">
          <svg viewBox="0 0 270 220" preserveAspectRatio="xMaxYMid slice"><defs><radialGradient id="bi-glow" cx=".62" cy=".55" r=".7"><stop offset="0" stopColor="#5a3a1c" /><stop offset=".5" stopColor="#24170d" /><stop offset="1" stopColor="#0f0c0a" /></radialGradient><linearGradient id="bi-fade" x1="0" x2="1"><stop offset="0" stopColor="#0f0c0a" /><stop offset=".35" stopColor="#0f0c0a" stopOpacity="0" /></linearGradient><linearGradient id="bi-salmon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f08a4b" /><stop offset=".6" stopColor="#d4582a" /><stop offset="1" stopColor="#8f2f14" /></linearGradient><radialGradient id="bi-plate" cx=".5" cy=".4" r=".6"><stop offset="0" stopColor="#3a3632" /><stop offset="1" stopColor="#151311" /></radialGradient></defs><rect width="270" height="220" fill="url(#bi-glow)" /><g fill="#ffb35c" opacity=".25"><circle cx="236" cy="78" r="5" /><circle cx="252" cy="96" r="3" /><circle cx="214" cy="70" r="2.5" /></g><ellipse cx="170" cy="160" rx="100" ry="48" fill="url(#bi-plate)" /><ellipse cx="170" cy="156" rx="78" ry="34" fill="#2a2622" /><g transform="rotate(-12 165 140)"><rect x="112" y="118" width="104" height="44" rx="14" fill="url(#bi-salmon)" /><g stroke="#ffd0b0" strokeWidth="2" opacity=".75"><path d="M130 120c-4 14-4 28 0 40" /><path d="M148 119c-4 14-4 28 0 42" /><path d="M166 119c-4 14-4 28 0 42" /><path d="M184 119c-4 14-4 28 0 42" /><path d="M200 120c-4 14-4 28 0 40" /></g><rect x="112" y="118" width="104" height="10" rx="6" fill="#5b2a14" opacity=".55" /></g><g fill="#4f8a2b"><circle cx="160" cy="104" r="9" /><circle cx="174" cy="96" r="10" /><circle cx="190" cy="104" r="9" /><circle cx="168" cy="110" r="8" /><circle cx="182" cy="112" r="8" /></g><g fill="#7cbf3b"><circle cx="166" cy="98" r="5" /><circle cx="184" cy="100" r="5" /><circle cx="176" cy="88" r="5" /></g><g fill="#f2e7c9"><circle cx="128" cy="168" r="2" /><circle cx="214" cy="170" r="2" /><circle cx="222" cy="150" r="1.6" /></g><rect width="270" height="220" fill="url(#bi-fade)" /></svg>
        </div>
        <div className="s-nav"><b>Bistro</b>
          <nav><span>Home</span><span>Menu</span><span>About</span><span>Contact</span></nav><span className="s-cta">Book a Table</span>{live && <Burger />}
        </div>
        <div className="s-copy">
          <h4>Good Food<br />Brings People<br />Together</h4>
          <p>Fresh ingredients. Amazing taste.<br />Unforgettable experience.</p>
          <div className="s-btns"><span className="s-btn">View Menu</span><span className="s-btn ghost">Book a Table</span></div>
        </div>
        <section className="s-more">
          <h5>Our Menu</h5>
          <div className="s-grid">
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#f08a4b,#8f2f14)" }} /><b>Grilled Salmon</b><em>৳850</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#7cbf3b,#2f6b2a)" }} /><b>Garden Salad</b><em>৳420</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#6b3f2a,#2a1810)" }} /><b>Chocolate Lava Cake</b><em>৳380</em></div>
          </div>
        </section>
        <footer className="s-foot"><b>Bistro</b><span>© 2026 Bistro. All rights reserved.</span></footer>
      </div>
    ),
  },
  {
    id: "nova-portfolio",
    name: "Nova Portfolio",
    desc: "A minimalist portfolio template for creatives, designers and professionals.",
    niches: ["crafts","home","jewellery"],
    pop: 3,
    newest: 3,
    search: "nova portfolio a minimalist portfolio template for creatives, designers and professionals. designer creative freelancer resume work online store shop products handmade art prints decor minimal gallery furniture home & furniture jewellery & accessories handicrafts & art",
    shot: (live) => (
      <div data-layout="split" className={"shot t-nova" + (live ? " live" : "")}>
        <div className="s-nav"><b>Nova</b>
          <nav><span>Home</span><span>Work</span><span>About</span><span>Contact</span></nav>{live && <Burger />}
        </div>
        <div className="s-copy"><small>Hi, I’m Alex.</small>
          <h4>Product Designer<br />& Creative Thinker</h4>
          <p>I design digital experiences that<br />make a difference.</p>
          <div className="s-btns"><span className="s-btn">View My Work</span></div>
        </div>
        <div className="s-art">
          <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="nv-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#eeeef0" /><stop offset="1" stopColor="#c9cacd" /></linearGradient><linearGradient id="nv-top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#ececee" /></linearGradient><linearGradient id="nv-left" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f7f7f8" /><stop offset="1" stopColor="#d7d8db" /></linearGradient><linearGradient id="nv-right" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#dedfe2" /><stop offset="1" stopColor="#b6b8bc" /></linearGradient><filter id="nv-blur"><feGaussianBlur stdDeviation="6" /></filter></defs><rect width="200" height="200" fill="url(#nv-bg)" /><ellipse cx="112" cy="168" rx="70" ry="14" fill="#8e9094" opacity=".45" filter="url(#nv-blur)" /><path d="M60 74l52-26 46 22-50 28z" fill="url(#nv-top)" /><path d="M60 74l48 24-2 68-46-26z" fill="url(#nv-left)" /><path d="M108 98l50-28-2 66-50 30z" fill="url(#nv-right)" /></svg>
        </div>
        <section className="s-more">
          <h5>Selected Work</h5>
          <div className="s-grid">
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#eeeef0,#b6b8bc)" }} /><b>Fintech App</b><em>UI/UX Design</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#f3e6d6,#c9a27e)" }} /><b>Brand Identity</b><em>Branding</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#dfe7f5,#8ea4c9)" }} /><b>Store Redesign</b><em>Web Design</em></div>
          </div>
        </section>
        <footer className="s-foot"><b>Nova</b><span>© 2026 Nova. All rights reserved.</span></footer>
      </div>
    ),
  },
  {
    id: "growify-agency",
    name: "Growify Agency",
    desc: "A modern template for agencies, consultancies and service-based businesses.",
    niches: ["home","food","health"],
    pop: 4,
    newest: 6,
    search: "growify agency a modern template for agencies, consultancies and service-based businesses. agency consultancy marketing business services online store shop products furniture decor organic grocery plants wellness food & grocery home & furniture health & fitness",
    shot: (live) => (
      <div data-layout="split" className={"shot t-growify" + (live ? " live" : "")}>
        <div className="s-nav"><b>Growify</b>
          <nav><span>Home</span><span>Services</span><span>Work</span><span>About</span></nav><span className="s-cta">Get a Quote</span>{live && <Burger />}
        </div>
        <div className="s-copy"><small>Digital Agency</small>
          <h4>We Help Brands<br />Grow Online</h4>
          <p>Strategy, design, and development<br />to take your business further.</p>
          <div className="s-btns"><span className="s-btn">Get Started</span></div>
        </div>
        <div className="s-art">
          <svg viewBox="0 0 200 180" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="gr-wall" x1="0" x2="1"><stop offset="0" stopColor="#fbfaf7" /><stop offset="1" stopColor="#ece8e1" /></linearGradient><linearGradient id="gr-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#cdb79a" /><stop offset="1" stopColor="#a88c6b" /></linearGradient></defs><rect width="200" height="180" fill="url(#gr-wall)" /><rect x="12" y="10" width="78" height="112" fill="#f4f8fb" stroke="#d9d6cf" strokeWidth="3" /><path d="M51 10v112M12 50h78M12 88h78" stroke="#d9d6cf" strokeWidth="2.4" /><rect x="15" y="13" width="34" height="35" fill="#e7f0f6" /><rect x="53" y="52" width="34" height="34" fill="#eaf2f7" /><rect y="132" width="200" height="48" fill="url(#gr-floor)" /><g stroke="#2f6b2a" strokeWidth="2.4" strokeLinecap="round"><path d="M178 132V70" /><path d="M178 92c-14-8-20-20-18-30M178 84c12-8 18-20 16-30M178 108c-16-4-24-14-24-24M178 104c14-4 20-14 20-24" /></g><g fill="#3f8a34"><ellipse cx="160" cy="62" rx="9" ry="5" transform="rotate(-40 160 62)" /><ellipse cx="194" cy="54" rx="9" ry="5" transform="rotate(40 194 54)" /><ellipse cx="154" cy="84" rx="9" ry="5" transform="rotate(-30 154 84)" /><ellipse cx="198" cy="80" rx="9" ry="5" transform="rotate(30 198 80)" /><ellipse cx="178" cy="66" rx="5" ry="10" /></g><path d="M168 132h20l-3 18h-14z" fill="#e8e2d8" /><g fill="#2e7d32"><ellipse cx="8" cy="100" rx="10" ry="5" transform="rotate(-30 8 100)" /><ellipse cx="18" cy="108" rx="10" ry="5" transform="rotate(30 18 108)" /><ellipse cx="10" cy="118" rx="10" ry="5" /></g><rect x="6" y="122" width="14" height="22" fill="#eae4da" /><ellipse cx="104" cy="122" rx="56" ry="9" fill="#6b4a2f" /><rect x="48" y="118" width="112" height="6" fill="#5a3d25" /><path d="M70 124l-4 34M138 124l4 34" stroke="#3b2a1c" strokeWidth="3" /><g fill="#1d1d1f"><path d="M58 112h18l-2 26H60z" /><path d="M130 112h18l-2 26h-14z" /><path d="M94 108h20l-2 22H96z" /></g><g stroke="#1d1d1f" strokeWidth="2.2"><path d="M60 138l-2 24M74 138l2 24M132 138l-2 24M146 138l2 24" /></g></svg>
        </div>
        <section className="s-more">
          <h5>Our Services</h5>
          <div className="s-grid">
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#efe9df,#cdb79a)" }} /><b>Brand Strategy</b><em>Find your voice</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#e3efe0,#5f9a55)" }} /><b>Web Development</b><em>Fast, modern websites</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#e8e4f8,#8a7ad6)" }} /><b>Digital Marketing</b><em>Reach more customers</em></div>
          </div>
        </section>
        <footer className="s-foot"><b>Growify</b><span>© 2026 Growify. All rights reserved.</span></footer>
      </div>
    ),
  },
  {
    id: "writely-blog",
    name: "Writely Blog",
    desc: "A clean blog template for writers, creators and thought leaders.",
    niches: ["books","crafts"],
    pop: 5,
    newest: 1,
    search: "writely blog a clean blog template for writers, creators and thought leaders. blog writer articles magazine news journal online store shop products stationery magazine publisher notebooks gifts books & stationery handicrafts & art",
    shot: (live) => (
      <div data-layout="split" className={"shot t-writely" + (live ? " live" : "")}>
        <div className="s-nav"><b>Writely</b>
          <nav><span>Home</span><span>Blog</span><span>About</span></nav>
          <div className="s-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 8h14l-1 13H6z" /><path d="M9 8V6a3 3 0 016 0v2" /></svg>
          </div>{live && <Burger />}
        </div>
        <div className="s-copy">
          <h4>Stories, Ideas<br />and Insights</h4>
          <p>A blog about design, business,<br />productivity and life.</p>
          <div className="s-btns"><span className="s-btn">Read the Latest</span></div>
        </div>
        <div className="s-art">
          <svg viewBox="0 0 240 180" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="wr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8fb5dc" /><stop offset="1" stopColor="#e3edf6" /></linearGradient><linearGradient id="wr-lake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5b7ea1" /><stop offset="1" stopColor="#1f3b57" /></linearGradient><linearGradient id="wr-mtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7b8a9c" /><stop offset="1" stopColor="#3d4a5a" /></linearGradient></defs><rect width="240" height="180" fill="url(#wr-sky)" /><path d="M0 108l40-34 26 18 30-42 30 30 22-48 30 40 22-16 40 52z" fill="#9fb0c4" /><path d="M30 112l50-46 22 18 34-48 40 52 20-14 44 38z" fill="url(#wr-mtn)" /><path d="M136 36l-14 20 8-4 6 8 6-8 8 6z M80 66l-10 12 8-2 4 6 6-6z" fill="#fff" /><path d="M136 36l-12 18 6-2 6 6z" fill="#f2f6fa" /><rect y="110" width="240" height="70" fill="url(#wr-lake)" /><path d="M30 112l50 30 22-10 34 30 40-34 20 8 44-24z" fill="#4c6680" opacity=".45" /><g fill="#1a3324"><path d="M0 120l8-30 8 30zM10 124l10-40 10 40zM24 120l7-26 7 26z" /><path d="M196 120l9-34 9 34zM210 124l10-42 10 42zM226 120l7-28 7 28z" /></g><rect y="118" width="240" height="2" fill="#dfe8f0" opacity=".5" /></svg>
        </div>
        <section className="s-more">
          <h5>Latest Posts</h5>
          <div className="s-grid">
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#bcd3ea,#5b7ea1)" }} /><b>10 Habits of Productive Creators</b><em>5 min read</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#f2e3cf,#c58b5a)" }} /><b>Designing With Intention</b><em>7 min read</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#cfe3d6,#3d6b52)" }} /><b>Lessons From the Mountains</b><em>4 min read</em></div>
          </div>
        </section>
        <footer className="s-foot"><b>Writely</b><span>© 2026 Writely. All rights reserved.</span></footer>
      </div>
    ),
  },
  {
    id: "fixly-services",
    name: "Fixly Services",
    desc: "A trustworthy template for repair, cleaning and local service businesses.",
    niches: ["health","electronics","kids"],
    pop: 6,
    newest: 7,
    search: "fixly services a trustworthy template for repair, cleaning and local service businesses. services repair plumber cleaning home local booking online store shop products pharmacy fitness gym equipment repair toys electronics & gadgets kids & toys health & fitness",
    shot: (live) => (
      <div data-layout="split" className={"shot t-fixly" + (live ? " live" : "")}>
        <div className="s-nav"><b>Fixly</b>
          <nav><span>Home</span><span>Services</span><span>Pricing</span><span>Contact</span></nav><span className="s-cta">Book Now</span>{live && <Burger />}
        </div>
        <div className="s-copy"><small>Home Repair Experts</small>
          <h4>Fast, Reliable<br />Home Services</h4>
          <p>Book trusted local pros in<br />under 60 seconds.</p>
          <div className="s-btns"><span className="s-btn">Book a Service</span></div>
        </div>
        <div className="s-art">
          <svg viewBox="0 0 200 170" preserveAspectRatio="xMidYMax meet"><rect x="34" y="70" width="132" height="100" rx="4" fill="#fff" stroke="#c7d6f5" strokeWidth="2" /><path d="M20 78l80-60 80 60" fill="none" stroke="#1d4ed8" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" /><rect x="86" y="112" width="30" height="58" rx="3" fill="#1d4ed8" /><circle cx="110" cy="142" r="2.4" fill="#fff" /><rect x="48" y="92" width="26" height="24" rx="3" fill="#dbe7ff" /><rect x="128" y="92" width="26" height="24" rx="3" fill="#dbe7ff" /><circle cx="160" cy="44" r="22" fill="#ffb020" /><path d="M150 54l14-14m-4-6a7 7 0 109 9l-5-1-2-5z" stroke="#7a4b00" strokeWidth="3.2" fill="none" strokeLinecap="round" /></svg>
        </div>
        <section className="s-more">
          <h5>Popular Services</h5>
          <div className="s-grid">
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#dbe7ff,#1d4ed8)" }} /><b>Plumbing</b><em>From ৳500</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#e0f2fe,#0ea5e9)" }} /><b>AC Repair</b><em>From ৳800</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#fff1d6,#ffb020)" }} /><b>Home Cleaning</b><em>From ৳1,200</em></div>
          </div>
        </section>
        <footer className="s-foot"><b>Fixly</b><span>© 2026 Fixly. All rights reserved.</span></footer>
      </div>
    ),
  },
  {
    id: "launchly-landing",
    name: "Launchly",
    desc: "A bold one-page template to launch a product and collect sign-ups.",
    niches: ["electronics","kids","beauty"],
    pop: 7,
    newest: 8,
    search: "launchly a bold one-page template to launch a product and collect sign-ups. landing page launch product waitlist app online store shop products gadgets launch pre-order toys skincare new product beauty & cosmetics electronics & gadgets kids & toys",
    shot: (live) => (
      <div data-layout="bleed" className={"shot t-launch" + (live ? " live" : "")}>
        <div className="s-art">
          <svg viewBox="0 0 450 248" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="la-a" cx=".2" cy=".9" r=".6"><stop offset="0" stopColor="#ff3d8b" stopOpacity=".55" /><stop offset="1" stopColor="#ff3d8b" stopOpacity="0" /></radialGradient><radialGradient id="la-b" cx=".85" cy=".2" r=".55"><stop offset="0" stopColor="#5b5cf0" stopOpacity=".6" /><stop offset="1" stopColor="#5b5cf0" stopOpacity="0" /></radialGradient></defs><rect width="450" height="248" fill="url(#la-a)" /><rect width="450" height="248" fill="url(#la-b)" /><g fill="#fff" opacity=".6"><circle cx="60" cy="70" r="1.2" /><circle cx="390" cy="160" r="1.4" /><circle cx="330" cy="210" r="1" /><circle cx="120" cy="190" r="1" /><circle cx="420" cy="90" r="1" /></g></svg>
        </div>
        <div className="s-nav"><b>Launchly</b>
          <nav><span>Features</span><span>Pricing</span><span>FAQ</span></nav><span className="s-cta">Join Waitlist</span>{live && <Burger />}
        </div>
        <div className="s-copy">
          <h4>Launch Your Idea<br />This Weekend</h4>
          <p>Everything you need to go from idea to paying customers.</p>
          <div className="s-btns"><span className="s-btn">Get Early Access</span></div>
        </div>
        <section className="s-more">
          <h5>Why Launchly</h5>
          <div className="s-grid">
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#ff7a59,#ff3d8b)" }} /><b>Fast setup</b><em>Go live in minutes</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#5b5cf0,#8a3fe0)" }} /><b>Built-in payments</b><em>Start earning on day one</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#2a2b45,#5b5cf0)" }} /><b>Waitlist</b><em>Collect early sign-ups</em></div>
          </div>
        </section>
        <footer className="s-foot"><b>Launchly</b><span>© 2026 Launchly. All rights reserved.</span></footer>
      </div>
    ),
  },
  {
    id: "mia-personal",
    name: "Mia Personal",
    desc: "A warm personal site for your bio, links and contact details.",
    niches: ["beauty","crafts","jewellery"],
    pop: 8,
    newest: 9,
    search: "mia personal a warm personal site for your bio, links and contact details. personal profile bio link resume about me online store shop products handmade cosmetics personal brand creator gifts beauty & cosmetics jewellery & accessories handicrafts & art",
    shot: (live) => (
      <div data-layout="profile" className={"shot t-mia" + (live ? " live" : "")}>
        <div className="s-nav"><b>Mia Chen</b>
          <nav><span>About</span><span>Links</span><span>Contact</span></nav>{live && <Burger />}
        </div>
        <div className="s-art">
          <svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#f2c9a8" /><path d="M22 48c0-24 14-36 30-36s28 14 28 36c0 14-4 26-4 40H26c0-14-4-24-4-40z" fill="#5a3322" /><ellipse cx="51" cy="50" rx="17" ry="20" fill="#f6d2b8" /><path d="M33 46c4-14 14-20 26-18 6 6 10 12 10 20-8-8-20-10-36-2z" fill="#5a3322" /><path d="M18 100c4-20 18-28 33-28s29 8 33 28z" fill="#e0794f" /></svg>
        </div>
        <div className="s-copy">
          <h4>Hi, I’m Mia</h4>
          <p>Writer, speaker & coffee lover.</p>
        </div>
        <section className="s-more">
          <h5>Find me online</h5>
          <div className="s-grid">
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#f2c9a8,#e0794f)" }} /><b>Blog</b><em>Weekly essays</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#f6e3cf,#c98f5a)" }} /><b>Newsletter</b><em>Join 2,000 readers</em></div>
            <div className="s-item"><span className="s-swatch" style={{ background: "linear-gradient(135deg,#e9d8f2,#a06cc9)" }} /><b>Podcast</b><em>New episode every Friday</em></div>
          </div>
        </section>
        <footer className="s-foot"><b>Mia Chen</b><span>© 2026 Mia Chen. All rights reserved.</span></footer>
      </div>
    ),
  },
];
