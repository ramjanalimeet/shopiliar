import type { ReactNode } from "react";

// Google Fonts, as normal stylesheets so each page paints once, in the right fonts (no swap after the first paint)
export const SITE_FONTS = ["https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Caveat:wght@500&family=Noto+Sans+Bengali:wght@400;500;700&display=swap"];
// The dashboards only need the ৳ sign from the Bengali font, so it comes as a tiny subset in its own request
export const DASH_FONTS = [
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  "https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@500;700&text=%E0%A7%B3&display=swap",
];

type Props = { children: ReactNode; fonts: string[]; bodyClass?: string; appName?: string };

/** The <html> and <body> every page shares; marketing pages and each dashboard have their own root layout built on it. */
export default function RootHtml({ children, fonts, bodyClass, appName }: Props) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {fonts.map((href) => <link key={href} rel="stylesheet" href={href} />)}
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
