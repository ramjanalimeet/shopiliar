import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/dash.css";
import "@/styles/admin.css";
import "@/styles/editor.css";
import RootHtml, { DASH_FONTS, ICONS } from "@/components/RootHtml";

export const metadata: Metadata = {
  title: "Master admin · Shopilier",
  robots: { index: false, follow: false },
  icons: ICONS,
};

// The business owner dashboard. Cloudflare Access protects this address; its API checks the Access token too.
export default function MasterLayout({ children }: { children: ReactNode }) {
  return <RootHtml fonts={DASH_FONTS} bodyClass="store-admin master-admin" appName="Shopilier Master">{children}</RootHtml>;
}
