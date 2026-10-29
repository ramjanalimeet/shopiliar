import DashboardShell from "@/components/dash/DashboardShell";
import LegacyScripts from "@/components/dash/LegacyScripts";

// demo.js loads first: it answers the dashboard's /api calls from the browser's sample store
const SCRIPTS = ["/assets/demo.js", "/assets/dash.js", "/assets/password.js", "/assets/inbox.js", "/assets/site.js", "/assets/editor.js", "/assets/admin-app.js"];

export default function DemoAppPage() {
  return (
    <>
      <DashboardShell demo />
      <LegacyScripts scripts={SCRIPTS} />
    </>
  );
}
