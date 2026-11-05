"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BedDouble,
  CheckCircle2,
  History,
  Pencil,
  UserCircle,
  UserMinus,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StudentForm } from "@/components/students/student-form";
import { useHmsData } from "@/lib/api/hms-provider";

export function StudentDetailView({ studentIdParam }: { studentIdParam: string }) {
  const { students, allocations, deactivateStudent, isDemoMode } = useHmsData();
  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const numericId = Number(studentIdParam);
  const student = students.find(
    (s) =>
      s.id === numericId ||
      s.student_id.toLowerCase() === studentIdParam.toLowerCase()
  );

  if (!student) {
    return (
      <div className="space-y-6">
        <Link
          href="/students"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          Back to Student Directory
        </Link>
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-lg font-semibold">Student Record Not Found</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            No student record matches identifier &ldquo;{studentIdParam}&rdquo;.
          </p>
        </div>
      </div>
    );
  }

  const studentAllocations = allocations.filter(
    (a) => a.student === student.id
  );
  const activeAlloc = studentAllocations.find((a) => a.is_active);

  async function handleConfirmDeactivate() {
    if (!student) return;
    const updated = await deactivateStudent(student.id);
    setDeactivateOpen(false);
    setFeedback(
      `Student ${updated.student_id} marked as Inactive${
        isDemoMode ? " in demo fixtures." : "."
      }`
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <Link
          href="/students"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to Student Directory
        </Link>
      </div>

      <PageHeader
        category="STUDENT RECORD DETAIL"
        title={`${student.name} (${student.student_id})`}
        description={`${student.course_program} · Year ${student.year}`}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-3.5" />
              Edit Profile
            </Button>
            {student.status === "Active" && (
              <Button
                variant="destructive"
                onClick={() => setDeactivateOpen(true)}
              >
                <UserMinus className="size-3.5" />
                Deactivate Student
              </Button>
            )}
          </>
        }
      />

      {feedback && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-600 dark:text-emerald-400"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Profile Card */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-xs lg:col-span-5">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2.5">
              <UserCircle className="size-5 text-primary" />
              <h2 className="text-base font-semibold">Student Information</h2>
            </div>
            <StatusBadge status={student.status} />
          </div>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between border-b border-border/50 pb-2.5">
              <dt className="text-muted-foreground">Student ID</dt>
              <dd className="font-mono font-semibold text-foreground">
                {student.student_id}
              </dd>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2.5">
              <dt className="text-muted-foreground">Full Name</dt>
              <dd className="font-medium text-foreground">{student.name}</dd>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2.5">
              <dt className="text-muted-foreground">Contact</dt>
              <dd className="font-medium text-foreground">{student.contact}</dd>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2.5">
              <dt className="text-muted-foreground">Course / Program</dt>
              <dd className="font-medium text-foreground text-right">
                {student.course_program}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Year of Study</dt>
              <dd className="font-semibold text-foreground">
                Year {student.year}
              </dd>
            </div>
          </dl>
        </section>

        {/* Active Room Assignment */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-xs lg:col-span-7">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2.5">
              <BedDouble className="size-5 text-primary" />
              <h2 className="text-base font-semibold">
                Current Room Allocation
              </h2>
            </div>
            {activeAlloc ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="neutral">Unallocated</Badge>
            )}
          </div>

          {activeAlloc ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                <p className="text-xs text-muted-foreground">Hostel Block</p>
                <p className="mt-1 font-semibold text-foreground">
                  {activeAlloc.hostel_name} ({activeAlloc.hostel_id})
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                <p className="text-xs text-muted-foreground">Room &amp; Type</p>
                <p className="mt-1 font-semibold text-primary">
                  Room {activeAlloc.room_no} · {activeAlloc.room_type}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                <p className="text-xs text-muted-foreground">Allocation Date</p>
                <p className="mt-1 font-mono text-sm">
                  {activeAlloc.allocation_date}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                <p className="text-xs text-muted-foreground">Check-In Date</p>
                <p className="mt-1 font-mono text-sm">
                  {activeAlloc.check_in_date ?? "—"}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm font-medium text-foreground">
                No Active Room Assignment
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                This student does not currently occupy a hostel bed.
              </p>
              {student.status === "Active" && (
                <Link
                  href="/allocations"
                  className="mt-4 inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"
                >
                  Assign Room in Allocations
                </Link>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Student Allocation History */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-center gap-2.5 border-b border-border pb-4">
          <History className="size-5 text-primary" />
          <h2 className="text-base font-semibold">Allocation History</h2>
        </div>

        {studentAllocations.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No allocation history records found for this student.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pr-4">Hostel</th>
                  <th className="pb-3 px-4">Room</th>
                  <th className="pb-3 px-4">Allocation Date</th>
                  <th className="pb-3 px-4">Check-In</th>
                  <th className="pb-3 px-4">Check-Out</th>
                  <th className="pb-3 pl-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {studentAllocations.map((a) => (
                  <tr key={a.id}>
                    <td className="py-3 pr-4 font-medium">{a.hostel_name}</td>
                    <td className="py-3 px-4">
                      Room {a.room_no} ({a.room_type})
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {a.allocation_date}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {a.check_in_date ?? "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {a.check_out_date ?? "Current"}
                    </td>
                    <td className="py-3 pl-4 text-right">
                      <StatusBadge
                        status={a.is_active ? "Active" : "Completed"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit Student · ${student.student_id}`}
      >
        <StudentForm
          initialStudent={student}
          onCancel={() => setEditOpen(false)}
          onSuccess={(updated) => {
            setEditOpen(false);
            setFeedback(
              `Updated student ${updated.student_id}${
                isDemoMode ? " in demo fixtures." : "."
              }`
            );
          }}
        />
      </Modal>

      <Modal
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title="Confirm Student Deactivation"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to mark{" "}
            <strong className="text-foreground">
              {student.name} ({student.student_id})
            </strong>{" "}
            as Inactive?
          </p>
          <div className="flex justify-end gap-2.5 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeactivateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleConfirmDeactivate()}
            >
              Deactivate Student
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
