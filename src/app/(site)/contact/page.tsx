import type { Metadata } from "next";
import ContactForm from "@/components/site/ContactForm";
import SiteFooter from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Contact Us — Shopilier",
  description: "Get in touch with the Shopilier team by email, Facebook or from your store dashboard.",
};

export default function ContactPage() {
  return (
    <>
      <main className="container info-page">
        <section className="page-head">
          <span className="pill">Contact Us</span>
          <h1>We&apos;re here to <span className="gradient-text">help</span></h1>
          <p>Questions about Shopilier, your plan or your store? Send us a message and our team will get back to you.</p>
        </section>
        <div className="contact-grid">
          <ContactForm />
          <div className="contact-list">
            <a className="card contact-item" href="mailto:support@shopilier.com">
              <span className="ci-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg></span>
              <span><strong>Email</strong>support@shopilier.com</span>
            </a>
            <a className="card contact-item" href="/admin">
              <span className="ci-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg></span>
              <span><strong>Already have a store?</strong>Message our team from your dashboard</span>
            </a>
            <a className="card contact-item" href="https://www.facebook.com/shopilier/" target="_blank" rel="noopener">
              <span className="ci-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" /></svg></span>
              <span><strong>Facebook</strong>Message us on our Facebook page</span>
            </a>
            <a className="card contact-item" href="https://www.youtube.com/@shopilier" target="_blank" rel="noopener">
              <span className="ci-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" /></svg></span>
              <span><strong>YouTube</strong>Watch guides and tutorials</span>
            </a>
            <a className="card contact-item" href="https://www.tiktok.com/@shopiliar" target="_blank" rel="noopener">
              <span className="ci-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.6 6.7a4.8 4.8 0 0 1-3.8-4.2V2h-3.4v13.7a2.9 2.9 0 1 1-2-2.8V9.4a6.3 6.3 0 1 0 5.4 6.3V8.7a8.2 8.2 0 0 0 4.8 1.5V6.8a4.9 4.9 0 0 1-1-.1z" /></svg></span>
              <span><strong>TikTok</strong>Tips and updates</span>
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
