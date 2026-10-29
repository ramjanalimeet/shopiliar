import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/dash.css";
import "@/styles/admin.css";
import "@/styles/editor.css";
import RootHtml, { DASH_FONTS, ICONS } from "@/components/RootHtml";

export const metadata: Metadata = {
  title: "Live demo · Shopilier dashboard",
  description: "Try the Shopilier store dashboard live: add products, record orders, customize your website and publish it — no sign-up needed.",
  icons: ICONS,
};

// The live demo: the store dashboard on a sample store kept in the visitor's browser
export default function DemoAppLayout({ children }: { children: ReactNode }) {
  return <RootHtml fonts={DASH_FONTS} bodyClass="store-admin demo" appName="Shopilier demo">{children}</RootHtml>;
}
