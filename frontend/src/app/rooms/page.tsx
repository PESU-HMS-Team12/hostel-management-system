import { HmsShell } from "@/components/hms-shell";
import { RoomsView } from "@/components/rooms/rooms-view";

export default function RoomsPage() {
  return (
    <HmsShell breadcrumbs={[{ label: "Rooms" }]}>
      <RoomsView />
    </HmsShell>
  );
}
