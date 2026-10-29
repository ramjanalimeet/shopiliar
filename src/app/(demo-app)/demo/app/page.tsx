import DashboardShell from "@/components/dash/DashboardShell";
import DashboardApp from "@/components/dash/DashboardApp";

export default function DemoAppPage() {
  return (
    <>
      <DashboardShell demo />
      <DashboardApp app="demo" />
    </>
  );
}
