import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/dash.css";
import "@/styles/admin.css";
import "@/styles/editor.css";
import RootHtml, { DASH_FONTS, ICONS } from "@/components/RootHtml";

export const metadata: Metadata = {
  title: "Dashboard · Shopilier",
  robots: { index: false, follow: false },
  icons: ICONS,
};

// The store owner dashboard has its own page shell (no site header, dashboard styles)
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <RootHtml fonts={DASH_FONTS} bodyClass="store-admin" appName="Shopilier">{children}</RootHtml>;
}
