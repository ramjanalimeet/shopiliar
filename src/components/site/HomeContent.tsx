import type { CSSProperties } from "react";
import { WatchButton } from "./VideoModal";

// The home page (also shown for addresses that don't exist)
export default function HomeContent() {
  return (
    <main>
      <section className="hero container"><span className="pill">Build{" "}<i />{" "}Launch{" "}<i />{" "}Grow</span>
        <h1>Create Your Business<br /><span className="gradient-text">Website Online</span></h1>
        <p className="lead bn">Shopilier একটি বাংলাদেশি প্রতিষ্ঠান, যা যেকোনো ব্যবসাকে মাত্র কয়েক মিনিটে একটি প্রফেশনাল ওয়েবসাইট তৈরি করতে সাহায্য করে — without coding, designers, or technical skills.</p>
        <div className="cta"><a className="btn btn-dark btn-lg bn" href="/signup">আজই শুরু করুন{" "}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </a>
          <div className="watch">
            <WatchButton className="watch-btn" videoId="S8p31Sg69RY" aria-label="Watch the video: how to start with Shopilier">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 4.6v14.8a1.3 1.3 0 0 0 2 1.1l11.6-7.4a1.3 1.3 0 0 0 0-2.2L9 3.5a1.3 1.3 0 0 0-2 1.1z" /></svg>
            </WatchButton><span className="watch-note">Not sure how to start?<br />Watch this video{" "}
              <svg viewBox="0 0 60 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M56 6C40 4 18 10 8 30" /><path d="M5 20l3 11 10-5" /></svg>
            </span>
          </div>
        </div>
        <div className="checks"><span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>No-code needed
          </span><span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>Easy to use
          </span><span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>Launch in minutes
          </span></div>
        <div className="showcase">
          <div className="note note-left">Beautiful templates<br />for every business{" "}
            <svg viewBox="0 0 50 46" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M6 4c-2 18 8 32 34 34" /><path d="M33 31l8 7-9 4" /></svg>
          </div>
          <div className="note note-right">Your website,<br />ready in minutes{" "}
            <svg viewBox="0 0 50 46" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M30 4c6 18-2 32-22 36" /><path d="M15 33l-8 7 10 3" /></svg>
          </div>
          {/* Template picker */}
          <div className="panel picker">
            <h4>Choose a template</h4>
            <div className="tpl"><span className="badge">Selected</span>
              <div className="thumb thumb-store" />
              <div className="label">Modern Store</div>
            </div>
            <div className="tpl">
              <div className="thumb thumb-agency" />
              <div className="label">Business Agency</div>
            </div>
            <div className="tpl">
              <div className="thumb thumb-portfolio" />
              <div className="label">Portfolio</div>
            </div>
          </div>
          {/* Dashboard */}
          <div className="panel dash">
            <div className="dash-bar"><i /><i /><i /></div><a className="demo-pill" href="/demo">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 4.6v14.8a1.3 1.3 0 0 0 2 1.1l11.6-7.4a1.3 1.3 0 0 0 0-2.2L9 3.5a1.3 1.3 0 0 0-2 1.1z" /></svg>Try the live demo
            </a><img className="dash-shot" src="/assets/dashboard.webp" srcSet="/assets/dashboard-1x.webp 1430w, /assets/dashboard.webp 2860w" sizes="(max-width: 760px) 100vw, 720px" width="1430" height="777" alt="The Shopilier dashboard: sales, orders, visitors, a sales chart and top products" fetchPriority="high" />
          </div>
          {/* Storefront phone */}
          <div className="panel phone">
            <div className="phone-top">Lume{" "}<span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 8h14l-1 13H6z" /><path d="M9 8V6a3 3 0 016 0v2" /></svg>
              </span></div>
            <div className="phone-hero">
              <h5>Modern Furniture for Modern Living</h5>
              <p>Premium quality. Timeless design.</p><b>Shop Now</b>
              <div className="floor" />
              <div className="chair" />
              <svg className="plant" viewBox="0 0 34 70" fill="#3f6b3a"><path d="M17 70V30" /><path d="M17 40C5 36 2 22 4 14c8 4 13 14 13 26z" /><path d="M17 36c10-4 14-16 13-26-8 4-13 14-13 26z" /><path d="M17 26C10 20 10 8 14 2c5 6 6 16 3 24z" /><rect x="10" y="56" width="14" height="14" rx="2" fill="#e7e0d4" /></svg>
            </div>
            <div className="sellers">Best Sellers{" "}<a>View all</a></div>
            <div className="seller-grid">
              <div>
                <div className="img">
                  <svg viewBox="0 0 40 46"><rect x="6" y="6" width="28" height="22" rx="8" fill="#c8a98a" /><rect x="4" y="22" width="32" height="10" rx="4" fill="#b8987a" /><path d="M8 32l-2 12M32 32l2 12" stroke="#5b4636" strokeWidth="2" /></svg>
                </div><small>Accent Chair<br />$249</small>
              </div>
              <div>
                <div className="img">
                  <svg viewBox="0 0 40 46"><path d="M12 4h16l5 14H7z" fill="#f2efe9" stroke="#d8d2c6" /><path d="M20 18v24" stroke="#2a2a2a" strokeWidth="2" /><rect x="13" y="41" width="14" height="3" rx="1.5" fill="#2a2a2a" /></svg>
                </div><small>Table Lamp<br />$89</small>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="trusted" aria-label="Businesses that use Shopilier">
        <h6>TRUSTED BY 10,000+ BANGLADESHI BUSINESSES</h6>
        <div className="logo-marquee">
          <div className="logo-track"><span className="logo" style={{ "--c": "#1f2937" } as CSSProperties}>
              <svg className="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--c)" /><path d="M10 22c4-1 5-4 6-7s2-6 6-7" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /><circle cx="10" cy="22" r="2.4" fill="#fff" /><circle cx="22" cy="8" r="2.4" fill="#fff" /></svg><span className="word">Dhaka Threads</span>
            </span><span className="logo" style={{ "--c": "#2f7d0c" } as CSSProperties}>
              <svg className="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--c)" /><path d="M9 23C9 14 15 9 24 9c0 9-5 15-15 14z" fill="#fff" /><path d="M10 22l9-9" stroke="var(--c)" strokeWidth="1.8" strokeLinecap="round" /></svg><span className="word">Sylhet Tea Co.</span>
            </span><span className="logo" style={{ "--c": "#b45309" } as CSSProperties}>
              <svg className="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--c)" /><path d="M10 12l3-4h6l3 4-6 12z" fill="#fff" /><path d="M10 12h12M13 8l3 4 3-4M13 12l3 12 3-12" stroke="var(--c)" strokeWidth="1.2" fill="none" strokeLinejoin="round" /></svg><span className="word">Rupkotha Jewellers</span>
            </span><span className="logo" style={{ "--c": "#16a34a" } as CSSProperties}>
              <svg className="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--c)" /><path d="M16 25V14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /><path d="M16 16c-6 0-8-4-8-8 5 0 8 3 8 8zM16 14c0-5 3-8 8-8 0 4-2 8-8 8z" fill="#fff" /></svg><span className="word">Khulna Organics</span>
            </span><span className="logo" style={{ "--c": "#2563eb" } as CSSProperties}>
              <svg className="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--c)" /><rect x="10" y="6" width="12" height="20" rx="3" fill="#fff" /><path d="M17 10l-4 7h3l-1 5 4-7h-3z" fill="var(--c)" /></svg><span className="word">GadgetBari</span>
            </span><span className="logo" style={{ "--c": "#db2777" } as CSSProperties}>
              <svg className="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--c)" /><circle cx="16" cy="15" r="7" fill="#fff" /><path d="M8 24h16" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /><circle cx="13.5" cy="13" r="1" fill="var(--c)" /><circle cx="18" cy="16.5" r="1" fill="var(--c)" /></svg><span className="word">Mithai Ghor</span>
            </span><span className="logo" style={{ "--c": "#7c3aed" } as CSSProperties}>
              <svg className="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--c)" /><path d="M20 7a9 9 0 1 0 5 15 8 8 0 0 1-5-15z" fill="#fff" /><circle cx="23" cy="10" r="1.6" fill="#fff" /></svg><span className="word">Noor Attire</span>
            </span><span className="logo" style={{ "--c": "#be123c" } as CSSProperties}>
              <svg className="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--c)" /><path d="M7 20c4-9 8-9 12 0s6 4 7-2" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" /></svg><span className="word">Rajshahi Silk</span>
            </span><span className="logo" style={{ "--c": "#dc2626" } as CSSProperties}>
              <svg className="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--c)" /><path d="M11 24c-3-6 1-13 8-15 1 6-1 13-8 15z" fill="#fff" /><path d="M19 9c1-2 3-3 5-2" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" /></svg><span className="word">Chattogram Spice Co.</span>
            </span><span className="logo" style={{ "--c": "#0f766e" } as CSSProperties}>
              <svg className="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--c)" /><path d="M8 9c3-1 5-1 8 1 3-2 5-2 8-1v14c-3-1-5-1-8 1-3-2-5-2-8-1z" fill="#fff" /><path d="M16 10v14" stroke="var(--c)" strokeWidth="1.4" /></svg><span className="word">BookBari</span>
            </span></div>
          <div className="logo-track" aria-hidden="true"><span className="logo" style={{ "--c": "#1f2937" } as CSSProperties}>
              <svg className="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--c)" /><path d="M10 22c4-1 5-4 6-7s2-6 6-7" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /><circle cx="10" cy="22" r="2.4" fill="#fff" /><circle cx="22" cy="8" r="2.4" fill="#fff" /></svg><span className="word">Dhaka Threads</span>
            </span><span className="logo" style={{ "--c": "#2f7d0c" } as CSSProperties}>
              <svg className="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--c)" /><path d="M9 23C9 14 15 9 24 9c0 9-5 15-15 14z" fill="#fff" /><path d="M10 22l9-9" stroke="var(--c)" strokeWidth="1.8" strokeLinecap="round" /></svg><span className="word">Sylhet Tea Co.</span>
            </span><span className="logo" style={{ "--c": "#b45309" } as CSSProperties}>
              <svg className="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--c)" /><path d="M10 12l3-4h6l3 4-6 12z" fill="#fff" /><path d="M10 12h12M13 8l3 4 3-4M13 12l3 12 3-12" stroke="var(--c)" strokeWidth="1.2" fill="none" strokeLinejoin="round" /></svg><span className="word">Rupkotha Jewellers</span>
            </span><span className="logo" style={{ "--c": "#16a34a" } as CSSProperties}>
              <svg className="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--c)" /><path d="M16 25V14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /><path d="M16 16c-6 0-8-4-8-8 5 0 8 3 8 8zM16 14c0-5 3-8 8-8 0 4-2 8-8 8z" fill="#fff" /></svg><span className="word">Khulna Organics</span>
            </span><span className="logo" style={{ "--c": "#2563eb" } as CSSProperties}>
              <svg className="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--c)" /><rect x="10" y="6" width="12" height="20" rx="3" fill="#fff" /><path d="M17 10l-4 7h3l-1 5 4-7h-3z" fill="var(--c)" /></svg><span className="word">GadgetBari</span>
            </span><span className="logo" style={{ "--c": "#db2777" } as CSSProperties}>
              <svg className="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--c)" /><circle cx="16" cy="15" r="7" fill="#fff" /><path d="M8 24h16" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /><circle cx="13.5" cy="13" r="1" fill="var(--c)" /><circle cx="18" cy="16.5" r="1" fill="var(--c)" /></svg><span className="word">Mithai Ghor</span>
            </span><span className="logo" style={{ "--c": "#7c3aed" } as CSSProperties}>
              <svg className="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--c)" /><path d="M20 7a9 9 0 1 0 5 15 8 8 0 0 1-5-15z" fill="#fff" /><circle cx="23" cy="10" r="1.6" fill="#fff" /></svg><span className="word">Noor Attire</span>
            </span><span className="logo" style={{ "--c": "#be123c" } as CSSProperties}>
              <svg className="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--c)" /><path d="M7 20c4-9 8-9 12 0s6 4 7-2" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" /></svg><span className="word">Rajshahi Silk</span>
            </span><span className="logo" style={{ "--c": "#dc2626" } as CSSProperties}>
              <svg className="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--c)" /><path d="M11 24c-3-6 1-13 8-15 1 6-1 13-8 15z" fill="#fff" /><path d="M19 9c1-2 3-3 5-2" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" /></svg><span className="word">Chattogram Spice Co.</span>
            </span><span className="logo" style={{ "--c": "#0f766e" } as CSSProperties}>
              <svg className="mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--c)" /><path d="M8 9c3-1 5-1 8 1 3-2 5-2 8-1v14c-3-1-5-1-8 1-3-2-5-2-8-1z" fill="#fff" /><path d="M16 10v14" stroke="var(--c)" strokeWidth="1.4" /></svg><span className="word">BookBari</span>
            </span></div>
        </div>
      </section>
      <section className="reviews container" aria-labelledby="reviews-title">
        <div className="sec-head"><span className="pill">Customer reviews</span>
          <h2 id="reviews-title">Loved by store owners{" "}<span className="gradient-text">across Bangladesh</span></h2>
          <p>From Dhaka to Sylhet, businesses of every size run their online stores on Shopilier.</p>
        </div>
        <div className="review-grid">
          <article className="review">
            <div className="stars" aria-label="5 out of 5 stars">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
            </div>
            <p className="bn">“শুক্রবার রাতে আমার কাপড়ের দোকানটা সাজিয়েছিলাম, রবিবারের মধ্যেই প্রথম বিকাশ অর্ডার পেয়ে গেছি। ড্যাশবোর্ডটা এত সহজ যে এখন আমার ছোট ভাই-ই অর্ডারগুলো সামলায়।”</p>
            <div className="reviewer"><span className="r-avatar" style={{ background: "#1f2937" }}>SA</span><span className="bn"><b>সাব্বির আহমেদ</b><small>Dhaka Threads · ঢাকা</small></span></div>
          </article>
          <article className="review">
            <div className="stars" aria-label="5 out of 5 stars">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
            </div>
            <p className="bn">“Shopilier-এর আগে সব অর্ডার নিতাম ফেসবুক ইনবক্সে। এখন কাস্টমাররা আমার ওয়েবসাইট থেকেই অর্ডার করে, আমি শুধু স্ট্যাটাস আপডেট করি। শুরু করার জন্য স্টার্টার প্ল্যানই যথেষ্ট ছিল।”</p>
            <div className="reviewer"><span className="r-avatar" style={{ background: "#db2777" }}>FI</span><span className="bn"><b>ফারহানা ইসলাম</b><small>Glow by Farhana · চট্টগ্রাম</small></span></div>
          </article>
          <article className="review">
            <div className="stars" aria-label="5 out of 5 stars">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
            </div>
            <p className="bn">“প্রোডাক্ট, ডিসকাউন্ট, মেটা পিক্সেল — যা যা দরকার ছিল সবই আগে থেকেই ছিল। কোনো ডেভেলপার লাগেনি, প্রতি মাসের ঝামেলাও নেই। বিজনেস প্ল্যানের খরচটা প্রতি মাসেই উঠে আসে।”</p>
            <div className="reviewer"><span className="r-avatar" style={{ background: "#2563eb" }}>TR</span><span className="bn"><b>তানভীর রহমান</b><small>GadgetBari · ঢাকা</small></span></div>
          </article>
          <article className="review">
            <div className="stars" aria-label="5 out of 5 stars">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
            </div>
            <p className="bn">“টেমপ্লেটগুলো দেখে মনে হয় কোনো এজেন্সি এর জন্য ৫০,০০০ টাকা নিত। এক দুপুরেই রং আর ছবি বদলে সেদিনই সাইট লাইভ করে দিয়েছি।”</p>
            <div className="reviewer"><span className="r-avatar" style={{ background: "#b45309" }}>NJ</span><span className="bn"><b>নুসরাত জাহান</b><small>Mithai Ghor · সিলেট</small></span></div>
          </article>
          <article className="review">
            <div className="stars" aria-label="5 out of 5 stars">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
            </div>
            <p className="bn">“ক্যাশ অন ডেলিভারি আর নগদ শুরু থেকেই কাজ করেছে। গ্রামের কাস্টমাররা কার্ড ছাড়াই অর্ডার করতে পারে, আর অর্ডারটা আমি ফোনেই পেয়ে যাই।”</p>
            <div className="reviewer"><span className="r-avatar" style={{ background: "#16a34a" }}>RH</span><span className="bn"><b>রাকিব হোসেন</b><small>Khulna Organics · খুলনা</small></span></div>
          </article>
          <article className="review">
            <div className="stars" aria-label="5 out of 5 stars">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" /></svg>
            </div>
            <p className="bn">“ডোমেইন কানেক্ট করতে গিয়ে আটকে গিয়েছিলাম, সাপোর্ট এক ঘণ্টার মধ্যেই উত্তর দিয়েছে। মনে হয় যেন একটা টেক টিম সবসময় হাতের কাছে আছে — আমার চায়ের খরচের চেয়েও কমে।”</p>
            <div className="reviewer"><span className="r-avatar" style={{ background: "#7c3aed" }}>SA</span><span className="bn"><b>সুমাইয়া আক্তার</b><small>Rupkotha Jewellers · রাজশাহী</small></span></div>
          </article>
        </div>
      </section>
    </main>
  );
}
