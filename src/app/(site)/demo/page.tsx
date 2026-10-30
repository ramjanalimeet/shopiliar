import type { Metadata } from "next";
import DemoStage from "@/components/site/DemoStage";
import SiteFooter from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Live demo — Shopilier dashboard",
  description: "Try the Shopilier store dashboard live, right in your browser: add products, record orders, customize the website and publish it. No sign-up needed.",
};

const Check = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" /></svg>;

export default function DemoPage() {
  return (
    <>
      <main className="container demo-page">
        <section className="page-head">
          <span className="pill">Live demo</span>
          <h1 className="bn">ড্যাশবোর্ডটি <span className="gradient-text">সরাসরি</span> চালিয়ে দেখুন</h1>
          <p className="bn">এটি Shopilier-এর আসল ড্যাশবোর্ড, যা Dhaka Threads নামের একটি স্যাম্পল দোকানে চলছে। প্রোডাক্ট যোগ করুন, অর্ডার লিখে রাখুন, ওয়েবসাইট কাস্টমাইজ করে পাবলিশ করুন — কিছু ইনস্টল করতে হবে না, সাইন-আপও লাগবে না।</p>
        </section>

        <section className="demo-section" id="demo" aria-label="Live demo of the Shopilier dashboard">
          <div className="demo-frame">
            <div className="demo-frame-bar"><i /><i /><i />
              <span className="demo-url"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>shopilier.com/demo</span>
              <span className="demo-live">Live</span>
              <a className="demo-open" href="/demo/app" target="_blank" rel="noopener"><span>Open full screen</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 3h6v6M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg></a>
            </div>
            <DemoStage autoload />
          </div>
          <p className="demo-note">Everything you change in the demo stays in this browser only. Use <b>Reset demo</b> in the green bar to start over.</p>
        </section>

        <section className="demo-try" aria-labelledby="try-title">
          <h2 id="try-title">Things to try</h2>
          <div className="try-grid">
            <div className="try-card"><span className="try-num">1</span><h3>Add a product</h3><p>Open <b>Products</b> → <b>Add product</b>. Give it a name, price, photo and sizes or colours.</p></div>
            <div className="try-card"><span className="try-num">2</span><h3>Record an order</h3><p>Open <b>Orders</b> → <b>New order</b>, the way you&apos;d note a Facebook or phone order. Stock updates by itself.</p></div>
            <div className="try-card"><span className="try-num">3</span><h3>Customize the website</h3><p>Open <b>Online Store</b> → <b>Themes</b> → <b>Customize</b>. Click any part of the page to edit it, then publish.</p></div>
            <div className="try-card"><span className="try-num">4</span><h3>Change the plan</h3><p>Open <b>Settings</b> → <b>Plan &amp; billing</b> and switch between Starter, Business and Pro to see what each unlocks.</p></div>
          </div>
          <div className="demo-cta">
            <a className="btn btn-dark btn-lg" href="/signup">Open your own store</a>
            <a className="btn btn-outline btn-lg" href="/pricing">See pricing</a>
          </div>
          <ul className="demo-perks">
            <li><Check />Plans from ৳149 a month</li>
            <li><Check />bKash, Nagad &amp; cash on delivery</li>
            <li><Check />Your store live in minutes</li>
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
