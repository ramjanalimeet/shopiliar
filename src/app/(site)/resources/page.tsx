import type { Metadata } from "next";
import SiteFooter from "@/components/site/SiteFooter";
import { WatchButton } from "@/components/site/VideoModal";

export const metadata: Metadata = {
  title: "Resources — Shopilier",
  description: "Guides, videos and articles to help you build and grow your online store with Shopilier.",
};

export default function ResourcesPage() {
  return (
    <>
      <main className="container info-page">
        <section className="page-head">
          <span className="pill">Resources</span>
          <h1>Guides &amp; <span className="gradient-text">blog</span></h1>
          <p>Videos and articles to help you build, launch and grow your online store.</p>
        </section>
        <section className="res-section">
          <h2>Start here</h2>
          <WatchButton className="card video-card watch-btn-card" videoId="S8p31Sg69RY">
            <span className="vc-thumb">
              <img src="https://i.ytimg.com/vi/S8p31Sg69RY/hqdefault.jpg" alt="" loading="lazy" width="480" height="360" />
              <span className="vc-play"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 4.6v14.8a1.3 1.3 0 0 0 2 1.1l11.6-7.4a1.3 1.3 0 0 0 0-2.2L9 3.5a1.3 1.3 0 0 0-2 1.1z" /></svg></span>
            </span>
            <span className="vc-body"><strong>How to start with Shopilier</strong>A quick walkthrough: pick a template, choose a plan and open your store.</span>
          </WatchButton>
        </section>
        <section className="res-section">
          <h2>Blog</h2>
          <div className="card blog-empty">
            <h3>Our first articles are on the way</h3>
            <p>We&apos;re writing guides on selling online in Bangladesh, getting more orders and growing your brand. Meanwhile, watch our videos on YouTube.</p>
            <a className="btn btn-outline" href="https://www.youtube.com/@shopilier" target="_blank" rel="noopener">Visit our YouTube channel</a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
