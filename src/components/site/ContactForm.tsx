"use client";
import type { FormEvent } from "react";

// Contact form: opens the visitor's email app with the message filled in
export default function ContactForm() {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const subject = `Message from ${f.get("name")}`;
    const body = `${f.get("message")}\n\n${f.get("name")}\n${f.get("email")}`;
    location.href = `mailto:support@shopilier.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  return (
    <form className="card contact-form" id="contact-form" onSubmit={submit}>
      <h2>Send us a message</h2>
      <div className="field"><label htmlFor="c-name">Your name</label><input id="c-name" name="name" required autoComplete="name" /></div>
      <div className="field"><label htmlFor="c-email">Email</label><input id="c-email" name="email" type="email" required autoComplete="email" placeholder="you@business.com" /></div>
      <div className="field"><label htmlFor="c-msg">Message</label><textarea id="c-msg" name="message" rows={5} required placeholder="How can we help?" /></div>
      <button className="btn btn-dark btn-block" type="submit">Send message</button>
      <p className="form-note">This opens your email app with the message ready to send.</p>
    </form>
  );
}
