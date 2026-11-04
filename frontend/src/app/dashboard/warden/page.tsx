import { HmsShell } from "@/components/hms-shell";
import { WardenDashboardView } from "@/components/dashboard/warden-dashboard-view";

export default function WardenDashboardPage() {
  return (
    <HmsShell
      role="WARDEN"
      breadcrumbs={[
        { label: "Dashboards", href: "/dashboard" },
        { label: "Warden Workspace" },
      ]}
    >
      <WardenDashboardView />
    </HmsShell>
  );
}
