import type { Metadata } from "next";
import "@/styles/start.css";
import StartFlow from "@/components/site/StartFlow";

export const metadata: Metadata = {
  title: "Get started — Shopilier",
  description: "Create your Shopilier website in a few clicks: pick your type of business, choose a template or create it with AI, then pick a plan.",
};

export default function SignUpPage() {
  return (
    <main className="start-wrap">
      <StartFlow />
      <noscript><p className="start-noscript">Please turn on JavaScript to create your Shopilier website.</p></noscript>
    </main>
  );
}
