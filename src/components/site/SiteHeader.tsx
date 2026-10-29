"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NAV = [["/", "Home"], ["/templates", "Templates"], ["/pricing", "Pricing"], ["/demo", "Demo"]] as const;

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  // Signed-in visitors get a Dashboard button instead of Sign in / Sign up
  useEffect(() => {
    fetch("/api/me").then((r) => setSignedIn(r.ok)).catch(() => {});
  }, []);

  // Escape closes the phone menu; so does growing past phone width
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); toggle.current?.focus(); } };
    const mq = matchMedia("(min-width: 761px)");
    const onChange = (e: MediaQueryListEvent) => { if (e.matches) setOpen(false); };
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onChange);
    return () => { document.removeEventListener("keydown", onKey); mq.removeEventListener("change", onChange); };
  }, [open]);

  const close = () => setOpen(false);
  return (
    <header className={"site-header" + (open ? " open" : "")}>
      <div className="container">
        <Link className="brand" href="/"><img className="brand-mark" src="/assets/logo.webp" width="34" height="34" alt="" />Shopilier</Link>
        <nav className="main-nav" aria-label="Main">
          {NAV.map(([href, label]) => {
            const active = pathname === href;
            return <Link key={href} href={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined} onClick={close}>{label}</Link>;
          })}
        </nav>
        <div className="auth">
          {signedIn ? (
            <a className="btn btn-dark" href="/admin" onClick={close}>Dashboard</a>
          ) : (
            <>
              <Link className="btn btn-outline" href="/signin" onClick={close}>Sign in</Link>
              <Link className="btn btn-dark" href="/signup" onClick={close}>Sign up</Link>
            </>
          )}
        </div>
        <button ref={toggle} className="menu-toggle" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
  );
}
