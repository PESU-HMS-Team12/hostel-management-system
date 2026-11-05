import { HmsShell } from "@/components/hms-shell";
import { StudentDashboardView } from "@/components/dashboard/student-dashboard-view";

export default function StudentDashboardPage() {
  return (
    <HmsShell
      role="STUDENT"
      breadcrumbs={[
        { label: "Dashboards", href: "/dashboard" },
        { label: "Student Portal" },
      ]}
    >
      <StudentDashboardView />
    </HmsShell>
  );
}
