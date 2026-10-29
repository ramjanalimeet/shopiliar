import type { ReactNode } from "react";
import { preload } from "react-dom";

export const SITE_FONTS = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Caveat:wght@500&family=Noto+Sans+Bengali:wght@400;500;700&display=swap";
export const DASH_FONTS = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Bengali:wght@500;700&display=swap";


type Props = { children: ReactNode; fonts: string; bodyClass?: string; appName?: string };

/** The <html> and <body> every page shares; marketing pages and each dashboard have their own root layout built on it. */
export default function RootHtml({ children, fonts, bodyClass, appName }: Props) {
  preload(fonts, { as: "style" });
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Fonts load without blocking the first paint: preloaded here, attached by fonts.js once they arrive */}
        <script src="/assets/fonts.js" async />
        <noscript><link rel="stylesheet" href={fonts} /></noscript>
      </head>
      <body className={bodyClass} data-app-name={appName}>{children}</body>
    </html>
  );
}

export const ICONS = {
  icon: [
    { url: "/favicon.ico", sizes: "any" },
    { url: "/assets/favicon-32.png", type: "image/png", sizes: "32x32" },
  ],
  apple: "/assets/apple-touch-icon.png",
};
