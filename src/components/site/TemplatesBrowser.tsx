"use client";
// Templates: search, sort, and a live preview at desktop, tablet or phone size
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { TEMPLATE_CARDS } from "./template-shots";

// Real screen sizes (CSS pixels) for each preview mode
const DEVICES: Record<string, [number, number]> = { desktop: [1440, 900], tablet: [768, 1024], mobile: [390, 844] };
type Device = keyof typeof DEVICES;
type Sort = "pop" | "new" | "az";

// Verified by Shopilier: a brand-green badge (a rounded seal with a white tick)
const VerifiedBadge = () => (
  <svg className="tcard-badge" viewBox="0 0 22 22" aria-hidden="true">
    <path fill="currentColor" d="M20.4 11c0-1.3-.8-2.5-2-3 .4-1.3.1-2.7-.9-3.6-.9-.9-2.3-1.2-3.6-.9-.5-1.2-1.7-2-3-2s-2.5.8-3 2c-1.3-.4-2.7-.1-3.6.9-.9.9-1.2 2.3-.9 3.6-1.2.5-2 1.7-2 3s.8 2.5 2 3c-.4 1.3-.1 2.7.9 3.6.9.9 2.3 1.2 3.6.9.5 1.2 1.7 2 3 2s2.5-.8 3-2c1.3.4 2.7.1 3.6-.9.9-.9 1.2-2.3.9-3.6 1.2-.5 2-1.7 2-3z" />
    <path d="M7.2 11.3l2.5 2.5 5.1-5.3" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PreviewIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>;

export default function TemplatesBrowser({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("pop");
  const [preview, setPreview] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [scale, setScale] = useState(1);
  const stage = useRef<HTMLDivElement>(null);
  const shot = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const cards = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const shown = TEMPLATE_CARDS.filter((c) => terms.every((t) => c.search.includes(t)));
    return [...shown].sort((a, b) => (sort === "az" ? a.name.localeCompare(b.name) : sort === "new" ? a.newest - b.newest : a.pop - b.pop));
  }, [query, sort]);
  const current = TEMPLATE_CARDS.find((c) => c.id === preview);

  // Fit the pretend screen into the popup, scaling it down when the window is smaller than the device
  useEffect(() => {
    if (!preview || !stage.current) return;
    const el = stage.current;
    const fit = () => {
      const [w, h] = DEVICES[device];
      const pad = parseFloat(getComputedStyle(el).paddingLeft) * 2;
      setScale(Math.min(1, (el.clientWidth - pad) / w, (el.clientHeight - pad) / h));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [preview, device]);

  // Opening locks the page behind, moves focus into the popup and lets Escape close it
  useEffect(() => {
    if (!preview) return;
    document.body.classList.add("no-scroll");
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPreview(null); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", onKey);
      lastFocus.current?.focus();
    };
  }, [preview]);

  const openPreview = (id: string, from: HTMLElement) => { lastFocus.current = from; setPreview(id); setDevice("desktop"); };
  const switchDevice = (d: Device) => { setDevice(d); if (shot.current) shot.current.scrollTop = 0; };
  const [w, h] = DEVICES[device];
  const label = device[0].toUpperCase() + device.slice(1);

  return (
    <>
      <main className="container tpl-page">
        {children}
        <div className="tpl-bar">
          <div className="tpl-tools">
            <label className="search">
              <span className="sr-only">Search templates</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              <input type="search" id="tpl-search" placeholder="Search templates…" autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <label className="sort">
              <span className="sr-only">Sort templates</span>
              <select id="tpl-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="pop">Popular</option>
                <option value="new">Newest</option>
                <option value="az">A–Z</option>
              </select>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
            </label>
          </div>
        </div>
        <section className="tpl-list" id="tpl-list">
          {cards.map((card) => (
            <article key={card.id} className="tcard" data-name={card.name}>
              {card.shot(false)}
              <div className="tcard-foot">
                <div>
                  <h3>{card.name}</h3>
                  <div className="tcard-meta">
                    <span className="tcard-verified" title="Checked and verified by Shopilier"><VerifiedBadge />Verified</span>
                    <span className="tcard-langs" title="Every template works in Bangla and English">বাংলা / English</span>
                  </div>
                  <p className="bn">{card.desc}</p>
                </div>
                <div className="tcard-actions">
                  <a className="btn btn-dark btn-use" href={`/signup?template=${card.id}`}>Use this template →</a>
                  <button className="btn btn-preview" type="button" onClick={(e) => openPreview(card.id, e.currentTarget)}><PreviewIcon />Preview</button>
                </div>
              </div>
            </article>
          ))}
        </section>
        <p className="empty" id="tpl-empty" hidden={cards.length > 0}>No templates match. Try another word — every template can sell any product.</p>
      </main>

      <div className="modal" id="tpl-modal" hidden={!preview} role="dialog" aria-modal="true" aria-labelledby="tpl-modal-title"
        onClick={(e) => { if (e.target === e.currentTarget) setPreview(null); }}>
        <div className="modal-box">
          <div className="modal-bar">
            <span className="dots"><i /><i /><i /></span>
            <strong id="tpl-modal-title">{current?.name}</strong>
            <div className="device-switch" id="tpl-devices" role="group" aria-label="Preview size">
              <button type="button" className={device === "desktop" ? "on" : undefined} data-device="desktop" aria-pressed={device === "desktop"} onClick={() => switchDevice("desktop")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg><span>Desktop</span>
              </button>
              <button type="button" className={device === "tablet" ? "on" : undefined} data-device="tablet" aria-pressed={device === "tablet"} onClick={() => switchDevice("tablet")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M11 18h2" /></svg><span>Tablet</span>
              </button>
              <button type="button" className={device === "mobile" ? "on" : undefined} data-device="mobile" aria-pressed={device === "mobile"} onClick={() => switchDevice("mobile")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></svg><span>Mobile</span>
              </button>
            </div>
            <span className="device-size" id="tpl-device-size">{label} · {w} × {h}{scale < 1 ? ` · ${Math.round(scale * 100)}%` : ""}</span>
            <a className="btn btn-dark btn-use" id="tpl-modal-use" href={current ? `/signup?template=${current.id}` : "/signup"}>Use this template</a>
            <button ref={closeBtn} className="modal-close" type="button" aria-label="Close preview" onClick={() => setPreview(null)}>×</button>
          </div>
          <div ref={stage} className="device-stage">
            <div className="device-fit" id="tpl-device-fit" style={{ width: w * scale, height: h * scale }}>
              <div className="device" id="tpl-device" data-device={device} style={{ width: w, height: h, transform: `scale(${scale})` }}>
                <div ref={shot} className="device-screen" id="tpl-modal-shot">{current?.shot(true)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
