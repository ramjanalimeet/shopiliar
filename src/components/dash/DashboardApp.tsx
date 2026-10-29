"use client";
import { useEffect } from "react";

// The dashboards take over the page once React has drawn the shell. Each one is a bundle of its own
// (src/dashboard/*.entry.ts) that Next.js builds and loads here, after hydration, so the elements it needs exist.
const APPS = {
  admin: () => import("@/dashboard/admin.entry"),
  demo: () => import("@/dashboard/demo.entry"),
  master: () => import("@/dashboard/master.entry"),
};

export default function DashboardApp({ app }: { app: keyof typeof APPS }) {
  useEffect(() => {
    // A module runs once per page load, however many times this effect runs
    APPS[app]().catch((err) => console.error(err));
  }, [app]);
  return null;
}
