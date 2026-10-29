"use client";
import { useEffect, useRef, useState } from "react";

// Live demo: the real dashboard loads into a browser-style frame. On the Demo page the dashboard is the point,
// so it loads straight away; elsewhere it would load when scrolled to or when "Start the live demo" is pressed.
export default function DemoStage({ autoload = false }: { autoload?: boolean }) {
  const stage = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const start = () => setStarted(true);

  useEffect(() => {
    if (autoload || location.hash === "#demo") { start(); return; }
    if (!("IntersectionObserver" in window) || !stage.current) return;
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { start(); io.disconnect(); } }, { rootMargin: "200px 0px" });
    io.observe(stage.current);
    return () => io.disconnect();
  }, [autoload]);

  return (
    <div ref={stage} className={"demo-stage" + (ready ? " ready" : "")} id="demo-stage" data-autoload={autoload ? "" : undefined}>
      <img className="demo-placeholder" src="/assets/dashboard-1x.webp" width="1430" height="777" alt="" aria-hidden="true" loading="lazy" />
      <button className={"demo-start" + (started ? " loading" : "")} type="button" id="demo-start" onClick={start}>
        <span><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 4.6v14.8a1.3 1.3 0 0 0 2 1.1l11.6-7.4a1.3 1.3 0 0 0 0-2.2L9 3.5a1.3 1.3 0 0 0-2 1.1z" /></svg></span>Start the live demo
      </button>
      <iframe id="demo-iframe" title="Shopilier dashboard — live demo" src={started ? "/demo/app?embed=1" : undefined} allow="clipboard-write" onLoad={() => { if (started) setReady(true); }} />
    </div>
  );
}
