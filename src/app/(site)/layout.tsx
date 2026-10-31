import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/main.css";
import RootHtml, { ICONS, SITE_FONTS } from "@/components/RootHtml";
import SiteHeader from "@/components/site/SiteHeader";
import { VideoProvider } from "@/components/site/VideoModal";
import PlatformLinks from "@/components/site/PlatformLinks";

export const metadata: Metadata = {
  title: "Shopilier — Create Your Business Website Online",
  description: "Shopilier is a Bangladeshi business that helps any business create a professional online store in minutes — without coding, designers, or technical skills. Plans from ৳149 a month.",
  icons: ICONS,
};

// The public website: header, the page, and the video popup every page can open
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <RootHtml fonts={SITE_FONTS}>
      <VideoProvider>
        <SiteHeader />
        {children}
        <PlatformLinks />
      </VideoProvider>
    </RootHtml>
  );
}
