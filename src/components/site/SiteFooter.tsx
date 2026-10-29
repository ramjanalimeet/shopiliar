import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <Link className="brand footer-brand" href="/"><img className="brand-mark" src="/assets/logo.webp" width="34" height="34" alt="" />Shopilier</Link>
        <nav className="footer-nav" aria-label="Footer">
          <Link href="/">Home</Link><Link href="/templates">Templates</Link><Link href="/pricing">Pricing</Link><Link href="/demo">Demo</Link>
          <Link href="/resources">Resources</Link><Link href="/contact">Contact Us</Link><Link href="/privacy">Privacy Policy</Link>
        </nav>
        <div className="social">
          <a href="https://www.youtube.com/@shopilier" target="_blank" rel="noopener" aria-label="Shopilier on YouTube">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" /></svg>
          </a>
          <a href="https://www.facebook.com/shopilier/" target="_blank" rel="noopener" aria-label="Shopilier on Facebook">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" /></svg>
          </a>
          <a href="https://www.tiktok.com/@shopiliar" target="_blank" rel="noopener" aria-label="Shopilier on TikTok">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.6 6.7a4.8 4.8 0 0 1-3.8-4.2V2h-3.4v13.7a2.9 2.9 0 1 1-2-2.8V9.4a6.3 6.3 0 1 0 5.4 6.3V8.7a8.2 8.2 0 0 0 4.8 1.5V6.8a4.9 4.9 0 0 1-1-.1z" /></svg>
          </a>
        </div>
      </div>
      <div className="container footer-bottom"><span>© 2026 Shopilier. All rights reserved.</span></div>
    </footer>
  );
}
