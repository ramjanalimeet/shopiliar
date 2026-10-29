import type { Metadata } from "next";
import SignInForm from "@/components/site/SignInForm";

export const metadata: Metadata = {
  title: "Sign in — Shopilier",
  description: "Sign in to manage your website.",
};

export default function SignInPage() {
  return (
    <main className="auth-wrap">
      <SignInForm />
    </main>
  );
}
