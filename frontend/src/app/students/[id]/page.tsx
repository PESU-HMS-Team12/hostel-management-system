import { Suspense } from "react";
import { HmsShell } from "@/components/hms-shell";
import { StudentDetailView } from "@/components/students/student-detail-view";

export function generateStaticParams() {
  return ["1", "2", "3", "4", "5", "6", "7", "8"].map((id) => ({ id }));
}

async function StudentDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudentDetailView studentIdParam={id} />;
}

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background p-8">
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
        </div>
      }
    >
      <HmsShell
        breadcrumbs={[
          { label: "Students", href: "/students" },
          { label: "Student Detail" },
        ]}
      >
        <Suspense
          fallback={
            <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
          }
        >
          <StudentDetailContent params={params} />
        </Suspense>
      </HmsShell>
    </Suspense>
  );
}
