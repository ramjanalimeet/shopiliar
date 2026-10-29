import LegacyScripts from "@/components/dash/LegacyScripts";
import MasterShell from "@/components/dash/MasterShell";

const SCRIPTS = ["/assets/dash.js", "/assets/inbox.js", "/assets/master-admin.js"];

export default function MasterAdminPage() {
  return (
    <>
      <MasterShell />
      <LegacyScripts scripts={SCRIPTS} />
    </>
  );
}
