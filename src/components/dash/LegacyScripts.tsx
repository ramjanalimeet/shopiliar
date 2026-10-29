"use client";
import { useEffect } from "react";

// The dashboards are plain scripts (public/assets/*.js) that take over the page once React has drawn the shell.
// They load one after another, in order, because each builds on the one before (dash.js defines Dash, and so on).
const started = new Set<string>();

export default function LegacyScripts({ scripts }: { scripts: string[] }) {
  useEffect(() => {
    const key = scripts.join("|");
    if (started.has(key)) return; // React's development double-mount, or a remount: scripts run once per page load
    started.add(key);
    (async () => {
      for (const src of scripts) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = src;
          s.async = false;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Couldn't load " + src));
          document.body.appendChild(s);
        });
      }
    })().catch((err) => console.error(err));
  }, [scripts]);
  return null;
}
