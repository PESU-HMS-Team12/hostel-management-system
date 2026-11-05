"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { HmsShell } from "@/components/hms-shell";
import { PageHeader } from "@/components/layout/page-header";
import { StudentForm } from "@/components/students/student-form";

export default function NewStudentPage() {
  const router = useRouter();

  return (
    <HmsShell
      breadcrumbs={[
        { label: "Students", href: "/students" },
        { label: "Register Student" },
      ]}
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/students"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to Student Directory
        </Link>

        <PageHeader
          category="STUDENT REGISTRATION"
          title="Register New Student"
          description="Add a new student record to the Hostel Management System directory."
        />

        <section className="rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-8">
          <StudentForm
            onCancel={() => router.push("/students")}
            onSuccess={(created) => router.push(`/students/${created.id}`)}
          />
        </section>
      </div>
    </HmsShell>
  );
}
