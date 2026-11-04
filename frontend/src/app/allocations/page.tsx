import { HmsShell } from "@/components/hms-shell";
import { AllocationsView } from "@/components/allocations/allocations-view";

export default function AllocationsPage() {
  return (
    <HmsShell breadcrumbs={[{ label: "Allocations" }]}>
      <AllocationsView />
    </HmsShell>
  );
}
