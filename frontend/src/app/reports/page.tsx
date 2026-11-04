import { HmsShell } from "@/components/hms-shell";
import { ReportsView } from "@/components/reports/reports-view";

export default function ReportsPage() {
  return (
    <HmsShell breadcrumbs={[{ label: "Reports & Analytics" }]}>
      <ReportsView />
    </HmsShell>
  );
}
