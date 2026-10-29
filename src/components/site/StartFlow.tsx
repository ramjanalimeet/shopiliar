"use client";
// Get started: template or Create with AI → plan → account, then the store dashboard.
// Links from Pricing (?plan=&billing=) and Templates (?template=) skip the steps already answered.
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { GOOGLE_ERRORS, PLANS, TEMPLATES, planById, taka, templateById, type Billing, type PlanId, type Template } from "@/lib/catalog";
import Icon from "@/components/Icon";
import { postJson } from "@/lib/client-api";
import GoogleButton from "./GoogleButton";
import PasswordField from "./PasswordField";

type Step = "site" | "template" | "ai" | "ai-form" | "plan" | "account";
type SiteDraft = { template: string; headline: string; sub: string; cta: string; about: string; source: string };
type Draft = SiteDraft & { name: string; city: string; input: string };
type State = {
  start: "template" | "ai" | null; template: string | null; ai: Draft | null; plan: PlanId | null; billing: Billing; step: Step;
  planPreset: boolean; presetTemplate: string | null; alert: string;
};

const STEPS: [string, string][] = [["site", "Your website"], ["plan", "Plan"], ["account", "Account"]];
const STEP_OF: Record<Step, string> = { site: "site", template: "site", ai: "site", "ai-form": "site", plan: "plan", account: "account" };
const published = TEMPLATES.filter((t) => t.status === "published");

// Seeded from the link that brought the visitor here
const initial = (): State => {
  const params = new URLSearchParams(location.search);
  const presetTpl = templateById(params.get("template"));
  const presetPlan = planById(params.get("plan"));
  const err = params.get("error") || "";
  const s: State = {
    start: presetTpl ? "template" : null, template: presetTpl?.id || null, ai: null,
    plan: presetPlan?.id || null, billing: params.get("billing") === "yearly" ? "yearly" : "monthly",
    step: "site", planPreset: !!presetPlan, presetTemplate: presetTpl?.id || null, alert: GOOGLE_ERRORS[err] || "",
  };
  s.step = !s.template ? "site" : !s.plan ? "plan" : "account";
  return s;
};

// The price for a plan on the chosen billing
const Price = ({ plan, billing }: { plan: PlanId; billing: Billing }) => {
  const price = planById(plan)!.price;
  return price ? <>{taka(billing === "yearly" ? price * 12 : price)}<small>/{billing === "yearly" ? "year" : "month"}</small></> : <>৳0<small>forever</small></>;
};

// A tiny mock of the template's home page
const Mini = ({ t, copy = {} }: { t: Template; copy?: Partial<Draft> }) => (
  <div className="mini" style={{ "--bg": t.bg, "--fg": t.text, "--ac": t.accent } as CSSProperties}>
    <div className="mini-nav"><b>{copy.name || t.name.split(" ")[0]}</b><span></span><span></span><span></span></div>
    <div className="mini-hero"><strong>{copy.headline || t.headline}</strong><p>{copy.sub || t.sub}</p><i>{copy.cta || t.cta}</i></div>
  </div>
);

export default function StartFlow() {
  const [s, setS] = useState<State | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const set = (patch: Partial<State>) => setS((cur) => (cur ? { ...cur, ...patch } : cur));

  useEffect(() => {
    const st = initial();
    setS(st);
    // Already signed in: straight to the dashboard (applying a template picked on the Templates page)
    fetch("/api/me").then((r) => { if (r.ok) location.replace("/admin" + (st.presetTemplate ? "?template=" + st.presetTemplate : "")); }).catch(() => {});
  }, []);

  // Each step gets a fresh title and focus
  useEffect(() => {
    if (!s) return;
    document.title = (s.step === "account" ? "Create your account" : "Get started") + " — Shopilier";
    root.current?.querySelector("h1")?.focus({ preventScroll: true });
    if (s.step === "ai-form") root.current?.querySelector<HTMLInputElement>("#ai-name")?.focus();
  }, [s?.step]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!s) return <div className="start" id="start"><ol className="start-steps" id="start-steps" aria-label="Sign-up steps" /><div id="start-step"><p className="start-loading">Loading…</p></div></div>;

  const go = (step: Step) => { set({ step }); setMsg(""); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const nextAfterSite = () => go(s.plan ? "account" : "plan");
  const tpl = (id: string | null) => templateById(id) || published[0];

  // Text written in Create with AI goes to the new dashboard (admin-app.js reads it once)
  const handOver = () => {
    try {
      if (s.start === "ai" && s.ai) sessionStorage.setItem("shopilier.start", JSON.stringify({ headline: s.ai.headline, sub: s.ai.sub, cta: s.ai.cta, about: s.ai.about, at: Date.now() }));
      else sessionStorage.removeItem("shopilier.start");
    } catch { /* storage blocked: the dashboard uses the template's text */ }
  };

  const createSite = async (values: { name: string; city: string; about: string }) => {
    setBusy(true); setMsg("");
    try {
      const data = await postJson<SiteDraft>("/api/ai/site", values);
      set({ ai: { ...data, name: values.name, city: values.city, input: values.about }, template: data.template });
      setBusy(false);
      go("ai");
    } catch (err) {
      setMsg((err as Error).message);
      setBusy(false);
    }
  };
  const submitAiForm = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const val = (k: string) => String(f.get(k) || "").trim();
    createSite({ name: val("name"), city: val("city"), about: val("about") });
  };
  const submitAiEdit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const val = (k: string) => String(f.get(k) || "").trim();
    const a = s.ai!;
    set({ ai: { ...a, headline: val("headline") || a.headline, sub: val("sub"), cta: val("cta") || a.cta, about: val("about") } });
    nextAfterSite();
  };
  const submitAccount = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const val = (k: string) => String(f.get(k) || "").trim();
    setBusy(true); setMsg("");
    try {
      await postJson("/api/signup", { name: val("name"), business: val("business"), email: val("email"), password: f.get("password"), plan: s.plan, billing: s.billing, template: s.template });
      handOver();
      location.href = "/admin";
    } catch (err) {
      setMsg((err as Error).message);
      setBusy(false);
    }
  };

  const Back = ({ step, label = "Back" }: { step: Step; label?: string }) => (
    <button type="button" className="start-back" onClick={() => go(step)}><Icon name="chevronDown" className="i back-ico" />{label}</button>
  );
  const Head = ({ title, sub }: { title: string; sub?: React.ReactNode }) => (
    <div className="start-head"><h1 tabIndex={-1}>{title}</h1>{sub ? <p>{sub}</p> : null}</div>
  );
  const errorStyle = msg ? { color: "#e03e3e" } : undefined;

  const view = () => {
    switch (s.step) {
      case "site": return (
        <>
          <Head title="How do you want to start?" sub="Your online store — you can change everything later." />
          <div className="choice-grid two">
            <button type="button" className="choice big" onClick={() => { set({ start: "template" }); go("template"); }}><span className="choice-ico"><Icon name="grid" /></span><b>Pick a template</b><span>Choose from ready-made designs for your online store.</span></button>
            <button type="button" className="choice big ai" onClick={() => { set({ start: "ai" }); go(s.ai?.headline ? "ai" : "ai-form"); }}><span className="choice-ico"><Icon name="sparkle" /></span><b>Create with AI</b><span>Describe your business and we&apos;ll write your website&apos;s first draft.</span></button>
          </div>
        </>
      );
      case "template": return (
        <>
          <Back step="site" />
          <Head title="Pick a template" sub={<>Designs for your online store. <Link className="link" href="/templates" target="_blank" rel="noopener">See full previews</Link></>} />
          <div className="tpl-pick">
            {published.map((t) => (
              <button key={t.id} type="button" className={"tpl-option" + (s.template === t.id ? " on" : "")} onClick={() => { set({ template: t.id, ai: null }); nextAfterSite(); }}>
                <Mini t={t} /><b>{t.name}</b><span>{t.desc}</span>
              </button>
            ))}
          </div>
        </>
      );
      case "ai": {
        const a = s.ai;
        if (!a || !a.headline) return aiForm();
        const t = tpl(a.template);
        return (
          <>
            <Back step="ai-form" label="Change the description" />
            <Head title={a.source === "ai" ? "Here's your website, written by AI" : "Here's a first draft of your website"} sub="Edit anything you like — you can change it all later in your dashboard." />
            <div className="ai-result">
              <div className="ai-preview"><Mini t={t} copy={{ name: a.name, headline: a.headline, sub: a.sub, cta: a.cta }} /><p className="muted small">Style: {t.name}</p></div>
              <form className="ai-edit" id="ai-edit" onSubmit={submitAiEdit}>
                <div className="field"><label htmlFor="ai-headline">Headline</label><input id="ai-headline" name="headline" maxLength={60} defaultValue={a.headline} /></div>
                <div className="field"><label htmlFor="ai-sub">Short description</label><input id="ai-sub" name="sub" maxLength={120} defaultValue={a.sub} /></div>
                <div className="field"><label htmlFor="ai-cta">Button text</label><input id="ai-cta" name="cta" maxLength={20} defaultValue={a.cta} /></div>
                <div className="field"><label htmlFor="ai-about">About your business</label><textarea id="ai-about" name="about" rows={3} maxLength={300} defaultValue={a.about} /></div>
                <p className="form-msg" role="status" style={errorStyle}>{msg}</p>
                <div className="start-actions">
                  <button type="button" className="btn btn-outline" disabled={busy} onClick={() => createSite({ name: a.name, city: a.city, about: a.input })}><Icon name="sparkle" />{busy ? "Writing your website…" : "Write it again"}</button>
                  <button className="btn btn-dark" type="submit" disabled={busy}>Use this website</button>
                </div>
              </form>
            </div>
          </>
        );
      }
      case "ai-form": return aiForm();
      case "plan": return (
        <>
          <Back step={s.start === "ai" ? "ai" : "template"} />
          <Head title="Choose your plan" sub="Start free, or pick a paid plan with a custom domain and support. You can change it any time." />
          <div className="start-toggle" role="group" aria-label="Billing period">
            <button type="button" className={s.billing === "monthly" ? "on" : undefined} aria-pressed={s.billing === "monthly"} onClick={() => set({ billing: "monthly" })}>Monthly</button>
            <button type="button" className={s.billing === "yearly" ? "on" : undefined} aria-pressed={s.billing === "yearly"} onClick={() => set({ billing: "yearly" })}>Yearly <small>Free domain</small></button>
          </div>
          <div className="plan-pick">
            {PLANS.map((p) => (
              <button key={p.id} type="button" className={"plan-option" + (s.plan === p.id ? " on" : "") + (p.id === "business" ? " pop" : "")} onClick={() => { set({ plan: p.id }); go("account"); }}>
                {p.id === "business" && <span className="pop-tag">Most popular</span>}
                <b>{p.name}</b>
                <span className="plan-price"><Price plan={p.id} billing={s.billing} /></span>
                <ul>{p.features.map((f) => <li key={f}><Icon name="check" />{f}</li>)}</ul>
                <span className="plan-cta">Choose {p.name}</span>
              </button>
            ))}
          </div>
        </>
      );
      case "account": {
        const plan = planById(s.plan)!;
        const t = tpl(s.template);
        const google = new URLSearchParams({ next: "/admin", plan: plan.id, billing: s.billing, template: t.id });
        return (
          <>
            <Back step={s.planPreset ? (s.start === "ai" ? "ai" : "template") : "plan"} />
            <Head title="Create your account" sub="Last step — then you're in your dashboard." />
            <div className="account-grid">
              <form className="start-form" id="account-form" onSubmit={submitAccount}>
                <div className="field"><label htmlFor="name">Your name</label><input id="name" name="name" required maxLength={80} autoComplete="name" placeholder="Akash Rahman" /></div>
                <div className="field"><label htmlFor="business">Business name</label><input id="business" name="business" maxLength={80} autoComplete="organization" defaultValue={s.ai?.name || ""} placeholder="Your business" /></div>
                <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" placeholder="you@business.com" /></div>
                <div className="field"><label htmlFor="password">Password</label><PasswordField id="password" name="password" minLength={8} required autoComplete="new-password" placeholder="At least 8 characters" /></div>
                <button className="btn btn-dark btn-block btn-lg" type="submit" disabled={busy}>Create account &amp; start</button>
                <div className="divider">or</div>
                <GoogleButton id="google-start" href={"/api/auth/google?" + google} onClick={handOver} />
                <p className="form-msg" role="status" style={errorStyle}>{msg}</p>
                <p className="auth-foot">Already have an account? <Link className="link" href="/signin">Sign in</Link></p>
              </form>
              <aside className="summary">
                <h2>Your order</h2>
                <dl>
                  <div><dt>Website</dt><dd>{s.start === "ai" ? "Created with AI · " : ""}{t.name} <button type="button" className="link-btn" onClick={() => go(s.start === "ai" ? "ai" : "template")}>Change</button></dd></div>
                  <div><dt>Plan</dt><dd>{plan.name} · {s.billing === "yearly" ? "Yearly" : "Monthly"} <button type="button" className="link-btn" onClick={() => go("plan")}>Change</button></dd></div>
                </dl>
                <div className="summary-total"><span>Total</span><b>{plan.price ? <Price plan={plan.id} billing={s.billing} /> : "Free"}</b></div>
                {plan.price
                  ? <div className="pay-note"><Icon name="info" /><span><b>Payment:</b> online payment with bKash, Nagad and card is coming soon. Your plan starts today and you won&apos;t be charged until payments are switched on.</span></div>
                  : <div className="pay-note"><Icon name="info" /><span><b>No payment needed.</b> The Free plan is free forever — 5 pages, 3 products and your own shopilier.com address. Upgrade any time from your dashboard.</span></div>}
              </aside>
            </div>
          </>
        );
      }
    }
  };
  function aiForm() {
    return (
      <>
        <Back step="site" />
        <Head title="Tell us about your business" sub="A couple of sentences is enough. We'll write your headline, description and About section." />
        <form className="start-form" id="ai-form" onSubmit={submitAiForm}>
          <div className="row2">
            <div className="field"><label htmlFor="ai-name">Business name</label><input id="ai-name" name="name" required maxLength={60} defaultValue={s!.ai?.name || ""} placeholder="Lume Furniture" /></div>
            <div className="field"><label htmlFor="ai-city">City</label><input id="ai-city" name="city" maxLength={40} defaultValue={s!.ai?.city || ""} placeholder="Dhaka" /></div>
          </div>
          <div className="field"><label htmlFor="ai-about-in">What do you do?</label><textarea id="ai-about-in" name="about" required minLength={10} maxLength={500} rows={4} defaultValue={s!.ai?.input || ""} placeholder="We sell handmade wooden furniture and home decor, delivered across Bangladesh." /></div>
          <p className="form-msg" role="status" style={errorStyle}>{msg}</p>
          <div className="start-actions"><button className="btn btn-dark btn-lg" type="submit" disabled={busy}><Icon name="sparkle" />{busy ? "Writing your website…" : "Create my website"}</button></div>
        </form>
      </>
    );
  }

  const current = STEPS.findIndex(([id]) => id === STEP_OF[s.step]);
  return (
    <div className="start" id="start">
      <ol className="start-steps" id="start-steps" aria-label="Sign-up steps">
        {STEPS.map(([, label], i) => (
          <li key={label} className={i < current ? "done" : i === current ? "on" : undefined} aria-current={i === current ? "step" : undefined}>
            <span>{i < current ? <Icon name="check" /> : i + 1}</span>{label}
          </li>
        ))}
      </ol>
      <div id="start-step" ref={root}>
        {s.alert && <p className="start-alert" role="alert">{s.alert}</p>}
        {view()}
      </div>
    </div>
  );
}
