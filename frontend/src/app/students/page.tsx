import { HmsShell } from "@/components/hms-shell";
import { StudentsDirectoryView } from "@/components/students/students-directory-view";

export default function StudentsPage() {
  return (
    <HmsShell breadcrumbs={[{ label: "Students" }]}>
      <StudentsDirectoryView />
    </HmsShell>
  );
}
