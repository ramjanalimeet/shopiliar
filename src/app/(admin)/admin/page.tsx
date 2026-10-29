import { redirect } from "next/navigation";
import { preload } from "react-dom";
import DashboardShell from "@/components/dash/DashboardShell";
import AdminApp from "@/components/dash/AdminApp";
import { currentUserFromCookies } from "@/lib/auth";
import { getEnv } from "@/lib/cf";

export const dynamic = "force-dynamic";

// The store dashboard needs a signed-in user; everyone else goes to sign in and comes back here afterwards
export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const env = await getEnv();
  const user = await currentUserFromCookies(env);
  if (!user) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(await searchParams)) for (const value of Array.isArray(v) ? v : v == null ? [] : [v]) params.append(k, value);
    const qs = params.toString();
    redirect("/signin?next=" + encodeURIComponent("/admin" + (qs ? "?" + qs : "")));
  }
  // The dashboard asks for the account as soon as it runs; start that request now
  preload("/api/me", { as: "fetch", crossOrigin: "anonymous" });
  return (
    <>
      <DashboardShell />
      <AdminApp />
    </>
  );
}
