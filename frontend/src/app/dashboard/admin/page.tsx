import { HmsShell } from "@/components/hms-shell";
import { AdminDashboardView } from "@/components/dashboard/admin-dashboard-view";

export default function AdminDashboardPage() {
  return (
    <HmsShell
      role="ADMINISTRATOR"
      breadcrumbs={[
        { label: "Dashboards", href: "/dashboard" },
        { label: "Administrator Console" },
      ]}
    >
      <AdminDashboardView />
    </HmsShell>
  );
}
