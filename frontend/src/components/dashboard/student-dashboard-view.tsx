"use client";

import {
  BedDouble,
  Building2,
  Calendar,
  Clock,
  GraduationCap,
  History,
  Info,
  Phone,
  ShieldCheck,
  UserCircle,
  AlertCircle,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { useHmsData } from "@/lib/api/hms-provider";

const DEMO_STUDENT_SCENARIOS = [
  {
    studentId: "PES2UG24CS001",
    label: "Allocated Student (Aarav Sharma · Active + Past History)",
  },
  {
    studentId: "PES2UG25ME019",
    label: "Unallocated Student (Ananya Rao · No Active Room)",
  },
  {
    studentId: "PES2UG24CS014",
    label: "Allocated Student (Diya Nair · Unit-G Girls Hostel)",
  },
] as const;

export function StudentDashboardView() {
  const {
    currentUser,
    students,
    studentOwnAllocations,
    isDemoMode,
    previewStudentId,
    setPreviewStudentId,
    isLoading,
  } = useHmsData();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <div className="h-20 rounded-2xl bg-muted" />
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="h-72 rounded-2xl bg-muted lg:col-span-5" />
          <div className="h-72 rounded-2xl bg-muted lg:col-span-7" />
        </div>
      </div>
    );
  }

  const student =
    currentUser?.student ??
    (isDemoMode
      ? students.find((s) => s.student_id === previewStudentId) ?? null
      : null);
  // Strictly filter allocations to only the authenticated/previewed student
  const ownAllocations = student
    ? studentOwnAllocations.filter((a) => a.student_id === student.student_id)
    : [];
  const activeAllocation = ownAllocations.find((a) => a.is_active) ?? null;

  return (
    <div className="space-y-8">
      <PageHeader
        category="STUDENT PORTAL"
        title={
          student ? `Welcome, ${student.name}` : "Student Accommodation Portal"
        }
        description="View your verified university profile, current hostel room assignment, and personal allocation history."
        actions={
          isDemoMode ? (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
              <label
                htmlFor="demo-student-scenario"
                className="text-xs font-semibold text-amber-600 dark:text-amber-400"
              >
                Demo Fixture State:
              </label>
              <select
                id="demo-student-scenario"
                value={previewStudentId}
                onChange={(e) => setPreviewStudentId(e.target.value)}
                className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground outline-none focus-visible:border-ring"
              >
                {DEMO_STUDENT_SCENARIOS.map((item) => (
                  <option key={item.studentId} value={item.studentId}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          ) : undefined
        }
      />

      {!student ? (
        <section className="rounded-2xl border border-border bg-card p-8 text-center">
          <AlertCircle className="mx-auto size-10 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-semibold">
            No Linked Student Profile
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Ensure your account is linked to an active university student
            record, or contact the Hostel Administration Office for assistance.
          </p>
        </section>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Profile Summary */}
            <section
              id="profile"
              aria-labelledby="student-profile-heading"
              className="rounded-2xl border border-border bg-card p-6 shadow-xs lg:col-span-5"
            >
              <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <UserCircle className="size-6" />
                  </div>
                  <div>
                    <h2
                      id="student-profile-heading"
                      className="text-base font-semibold tracking-tight"
                    >
                      My Profile Summary
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      University student record
                    </p>
                  </div>
                </div>
                <StatusBadge status={student.status} />
              </div>

              <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-background/50 p-3.5">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Student Name
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">
                    {student.name}
                  </dd>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/50 p-3.5">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Student ID (SRN)
                  </dt>
                  <dd className="mt-1 font-mono text-sm font-semibold text-primary">
                    {student.student_id}
                  </dd>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/50 p-3.5 sm:col-span-2">
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <GraduationCap className="size-3.5" />
                    Course / Program
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {student.course_program}
                  </dd>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/50 p-3.5">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Year of Study
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">
                    Year {student.year}
                  </dd>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/50 p-3.5">
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Phone className="size-3.5" />
                    Contact Information
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {student.contact}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0 text-primary" />
                <span>
                  Record isolated to{" "}
                  <strong className="text-foreground">
                    {student.student_id}
                  </strong>
                  . Other students&apos; records are restricted.
                </span>
              </div>
            </section>

            {/* Current Accommodation Summary */}
            <section
              id="accommodation"
              aria-labelledby="student-accommodation-heading"
              className="rounded-2xl border border-border bg-card p-6 shadow-xs lg:col-span-7"
            >
              <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BedDouble className="size-6" />
                  </div>
                  <div>
                    <h2
                      id="student-accommodation-heading"
                      className="text-base font-semibold tracking-tight"
                    >
                      Current Accommodation
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Active hostel &amp; room assignment
                    </p>
                  </div>
                </div>

                {activeAllocation ? (
                  <Badge variant="success">Active Allocation</Badge>
                ) : (
                  <Badge variant="neutral">No Active Allocation</Badge>
                )}
              </div>

              {activeAllocation ? (
                <div className="mt-5 space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Hostel Name
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {activeAllocation.hostel_name}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        ID: {activeAllocation.hostel_id}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Room Number
                      </p>
                      <p className="mt-1 text-lg font-bold text-primary">
                        Room {activeAllocation.room_no}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {activeAllocation.room_type}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Allocation Status
                      </p>
                      <div className="mt-1.5">
                        <StatusBadge status="Active" />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Checked in &amp; verified
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3.5">
                      <Calendar className="size-4 text-primary shrink-0" />
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Allocation Date
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {activeAllocation.allocation_date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3.5">
                      <Clock className="size-4 text-primary shrink-0" />
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Check-In Date
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {activeAllocation.check_in_date ?? "Pending check-in"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs leading-5 text-muted-foreground">
                    <strong className="text-foreground">
                      Accommodation Note:
                    </strong>{" "}
                    For room transfer requests or vacation check-out clearance,
                    please contact the Hostel Warden Office with your student ID{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {student.student_id}
                    </span>
                    .
                  </div>
                </div>
              ) : (
                <div
                  data-testid="student-no-allocation"
                  className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/40 px-6 py-10 text-center"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <Building2 className="size-6" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">
                    No Active Room Allocation
                  </h3>
                  <p className="mt-1.5 max-w-md text-xs leading-5 text-muted-foreground">
                    You do not currently have an active hostel room assignment
                    for this academic term. Once a Warden assigns a room to{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {student.student_id}
                    </span>
                    , your hostel block, room number, and check-in date will
                    appear here.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Allocation History & Timeline */}
          <section
            id="history"
            aria-labelledby="student-history-heading"
            className="rounded-2xl border border-border bg-card p-6 shadow-xs"
          >
            <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <History className="size-5" />
                </div>
                <div>
                  <h2
                    id="student-history-heading"
                    className="text-base font-semibold tracking-tight"
                  >
                    Allocation History &amp; Timeline
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Complete chronological record of your hostel assignments
                  </p>
                </div>
              </div>
              <Badge variant="neutral">
                {ownAllocations.length}{" "}
                {ownAllocations.length === 1 ? "Record" : "Records"}
              </Badge>
            </div>

            {ownAllocations.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No current or past room allocation records found for{" "}
                <span className="font-mono font-semibold text-foreground">
                  {student.student_id}
                </span>
                .
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="pb-3 pr-4">Hostel</th>
                      <th className="pb-3 px-4">Room</th>
                      <th className="pb-3 px-4">Room Type</th>
                      <th className="pb-3 px-4">Allocation Date</th>
                      <th className="pb-3 px-4">Check-In Date</th>
                      <th className="pb-3 px-4">Check-Out Date</th>
                      <th className="pb-3 pl-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {ownAllocations.map((alloc) => (
                      <tr
                        key={alloc.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <td className="py-3.5 pr-4">
                          <p className="font-medium text-foreground">
                            {alloc.hostel_name}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {alloc.hostel_id}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          Room {alloc.room_no}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">
                          {alloc.room_type}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-foreground">
                          {alloc.allocation_date}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                          {alloc.check_in_date ?? "—"}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                          {alloc.check_out_date ?? "Current"}
                        </td>
                        <td className="py-3.5 pl-4 text-right">
                          <StatusBadge
                            status={alloc.is_active ? "Active" : "Completed"}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Informational Guidelines Section */}
          <section className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3.5 rounded-2xl border border-border bg-card/70 p-5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Info className="size-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">
                  Hostel Check-In &amp; Transfer Policy
                </h3>
                <p className="text-xs leading-5 text-muted-foreground">
                  Students must complete physical room check-in on or after
                  their official allocation date. Room transfers and check-out
                  vacations are processed by the Hostel Warden and automatically
                  recorded in your allocation history.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-2xl border border-border bg-card/70 p-5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <ShieldCheck className="size-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">
                  Data Privacy &amp; Access Control
                </h3>
                <p className="text-xs leading-5 text-muted-foreground">
                  Your accommodation portal is protected by object-level
                  authorization (HMS-SR-002 / TC-ALLOC-05). Only your linked
                  student record and personal room allocations are accessible
                  from this account.
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
