import DashboardApp from "@/components/dash/DashboardApp";
import MasterShell from "@/components/dash/MasterShell";

export default function MasterAdminPage() {
  return (
    <>
      <MasterShell />
      <DashboardApp app="master" />
    </>
  );
}
