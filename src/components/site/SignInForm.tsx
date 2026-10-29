"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { GOOGLE_ERRORS } from "@/lib/catalog";
import { postJson } from "@/lib/client-api";
import GoogleButton from "./GoogleButton";
import PasswordField from "./PasswordField";

// Only send people back to pages inside their dashboard
const nextPath = (v: string | null) => (/^\/admin(\/|$)/.test(v || "") ? (v as string) : "/admin");

export default function SignInForm() {
  const [next, setNext] = useState("/admin");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Where to go after signing in, and any error Google sign-in came back with
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setNext(nextPath(params.get("next")));
    const err = params.get("error");
    if (err && GOOGLE_ERRORS[err]) setError(GOOGLE_ERRORS[err]);
  }, []);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setError("");
    setBusy(true);
    try {
      await postJson("/api/signin", { email: String(f.get("email") || "").trim(), password: f.get("password"), remember: f.get("remember") === "on" });
      location.href = next;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <form className="auth-card" data-auth="signin" onSubmit={submit}>
      <h1>Welcome back</h1>
      <p>Sign in to manage your website.</p>
      <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" placeholder="you@business.com" required autoComplete="email" /></div>
      <div className="field"><label htmlFor="password">Password</label><PasswordField id="password" name="password" placeholder="••••••••" required autoComplete="current-password" /></div>
      <div className="row-between"><label><input type="checkbox" id="remember" name="remember" defaultChecked /> Remember me</label></div>
      <button className="btn btn-dark btn-block" type="submit" disabled={busy}>Sign in</button>
      <div className="divider" data-google>or</div>
      <GoogleButton href={"/api/auth/google?" + new URLSearchParams({ next })} />
      <p className="form-msg" role="status" style={error ? { color: "#e03e3e" } : undefined}>{error}</p>
      <p className="auth-foot">Don&apos;t have an account? <Link className="link" href="/signup">Sign up</Link></p>
    </form>
  );
}
