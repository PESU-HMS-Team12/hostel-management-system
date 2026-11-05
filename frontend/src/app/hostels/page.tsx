import { HmsShell } from "@/components/hms-shell";
import { HostelsView } from "@/components/hostels/hostels-view";

export default function HostelsPage() {
  return (
    <HmsShell breadcrumbs={[{ label: "Hostels" }]}>
      <HostelsView />
    </HmsShell>
  );
}
