import type { Metadata } from "next";
import SiteFooter from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy Policy — Shopilier",
  description: "How Shopilier collects, uses and protects your information.",
};

export default function PrivacyPage() {
  return (
    <>
    <main className="container info-page">
      <section className="page-head"><span className="pill">Privacy Policy</span>
        <h1>Privacy Policy</h1>
        <p>Last updated: 26 October 2026</p>
      </section>
      <article className="card legal">
        <p>This policy explains what information Shopilier (&quot;we&quot;, &quot;us&quot;) collects when you visit our website or use our service to build an online store, how we use it and the choices you have.</p>
        <h2>Information we collect</h2>
        <ul>
          <li><strong>Account details:</strong>{" "}your name, business name, email address and password when you sign up. Passwords are stored only in hashed form; we never see them in plain text.</li>
          <li><strong>Google sign-in:</strong>{" "}if you choose &quot;Continue with Google&quot;, we receive your name and email address from Google.</li>
          <li><strong>Store content:</strong>{" "}the website, products, orders, pages and settings you create in your dashboard.</li>
          <li><strong>Support messages:</strong>{" "}messages you send to our team from your dashboard or by email.</li>
          <li><strong>Technical data:</strong>{" "}your IP address and basic request details, used to keep the service secure (for example, to limit repeated sign-in attempts).</li>
        </ul>
        <h2>How we use your information</h2>
        <ul>
          <li>To create and run your account and online store.</li>
          <li>To keep you signed in and protect your account.</li>
          <li>To answer your questions and provide support.</li>
          <li>To improve Shopilier and fix problems.</li>
        </ul>
        <p>When you use &quot;Create with AI&quot;, the details you type are used to write a first draft of your website.</p>
        <h2>Cookies</h2>
        <p>We use a small number of essential cookies to keep you signed in and to complete Google sign-in securely. We do not use advertising cookies.</p>
        <h2>Sharing your information</h2>
        <p>We do not sell your personal information. We share it only with the service providers we need to run Shopilier, such as Cloudflare (hosting, database and security) and Google (if you sign in with Google), or when the law requires it.</p>
        <p>Videos on our site are played from YouTube. YouTube loads only when you press play and may then set its own cookies under Google's privacy policy.</p>
        <h2>Keeping your information safe</h2>
        <p>All connections to Shopilier use HTTPS, passwords are hashed, and access to your store data requires you to be signed in.</p>
        <h2>Your choices</h2>
        <p>You can view and update your account and store details from your dashboard. To delete your account and its data, contact us and we will remove it.</p>
        <h2>Changes to this policy</h2>
        <p>If we change this policy, we will update the date at the top of this page.</p>
        <h2>Contact us</h2>
        <p>Questions about your privacy? Email{" "}<a className="link" href="mailto:support@shopilier.com">support@shopilier.com</a>{" "}or visit our{" "}<a className="link" href="/contact">Contact page</a>.</p>
      </article>
    </main>
      <SiteFooter />
    </>
  );
}
