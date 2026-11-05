"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Eye,
  Pencil,
  Plus,
  Search,
  UserMinus,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { StudentForm } from "@/components/students/student-form";
import { useHmsData } from "@/lib/api/hms-provider";
import type { Student } from "@/lib/types/hms";

export function StudentsDirectoryView() {
  const {
    students,
    allocations,
    deactivateStudent,
    isDemoMode,
    isLoading,
  } = useHmsData();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deactivatingStudent, setDeactivatingStudent] =
    useState<Student | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((student) => {
      if (statusFilter !== "all" && student.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        student.student_id.toLowerCase().includes(q) ||
        student.name.toLowerCase().includes(q) ||
        student.course_program.toLowerCase().includes(q)
      );
    });
  }, [students, searchQuery, statusFilter]);

  async function handleConfirmDeactivate() {
    if (!deactivatingStudent) return;
    const updated = await deactivateStudent(deactivatingStudent.id);
    setDeactivatingStudent(null);
    setFeedback(
      `Student ${updated.student_id} (${updated.name}) marked as Inactive${
        isDemoMode ? " in demo fixtures." : "."
      }`
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader
        category="STUDENT RECORDS"
        title="Student Directory"
        description="Search, register, update and manage student accommodation profiles. Deactivation preserves historical allocation records."
        actions={
          <>
            <Link
              href="/students/new"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Full Registration Page
            </Link>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Register Student
            </Button>
          </>
        }
      />

      {feedback && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-600 dark:text-emerald-400"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Status Filters */}
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="search"
            aria-label="Search students by ID, name or course program"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Student ID, name or course/program..."
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(["all", "Active", "Inactive"] as const).map((statusOption) => (
            <button
              key={statusOption}
              type="button"
              onClick={() => setStatusFilter(statusOption)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === statusOption
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {statusOption === "all" ? "All Statuses" : statusOption}
            </button>
          ))}
          <Badge variant="neutral">
            {filteredStudents.length} of {students.length} students
          </Badge>
        </div>
      </section>

      {/* Students Table */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        {isLoading ? (
          <div className="space-y-3 py-8 animate-pulse">
            <div className="h-10 rounded bg-muted" />
            <div className="h-10 rounded bg-muted" />
            <div className="h-10 rounded bg-muted" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto size-9 text-muted-foreground" />
            <h2 className="mt-3 text-base font-semibold">
              No Matching Student Records
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Adjust your search query or status filter, or register a new
              student record.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pr-4">Student ID</th>
                  <th className="pb-3 px-3">Name &amp; Contact</th>
                  <th className="pb-3 px-3">Course / Program</th>
                  <th className="pb-3 px-3">Year</th>
                  <th className="pb-3 px-3">Current Room</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredStudents.map((student) => {
                  const activeAlloc = allocations.find(
                    (a) => a.student === student.id && a.is_active
                  );

                  return (
                    <tr
                      key={student.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="py-3.5 pr-4 font-mono text-xs font-semibold text-primary">
                        <Link
                          href={`/students/${student.id}`}
                          className="hover:underline"
                        >
                          {student.student_id}
                        </Link>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-medium text-foreground">
                          {student.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {student.contact}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 text-xs text-foreground">
                        {student.course_program}
                      </td>
                      <td className="py-3.5 px-3 text-xs font-semibold">
                        Year {student.year}
                      </td>
                      <td className="py-3.5 px-3 text-xs">
                        {activeAlloc ? (
                          <span className="font-medium text-foreground">
                            {activeAlloc.hostel_name} · Rm {activeAlloc.room_no}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Unallocated
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <StatusBadge status={student.status} />
                      </td>
                      <td className="py-3.5 pl-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/students/${student.id}`}
                            aria-label={`View ${student.name}`}
                            className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground hover:bg-accent"
                          >
                            <Eye className="size-3.5" />
                            <span>View</span>
                          </Link>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            aria-label={`Edit ${student.name}`}
                            onClick={() => setEditingStudent(student)}
                          >
                            <Pencil className="size-3.5" />
                            <span>Edit</span>
                          </Button>

                          {student.status === "Active" && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              aria-label={`Deactivate ${student.name}`}
                              onClick={() => setDeactivatingStudent(student)}
                            >
                              <UserMinus className="size-3.5" />
                              <span>Deactivate</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Register Student Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Register New Student"
        description="Create a student profile in the HMS directory."
      >
        <StudentForm
          onCancel={() => setCreateOpen(false)}
          onSuccess={(created) => {
            setCreateOpen(false);
            setFeedback(
              `Registered student ${created.student_id} (${created.name})${
                isDemoMode ? " in demo fixtures." : "."
              }`
            );
          }}
        />
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        open={Boolean(editingStudent)}
        onClose={() => setEditingStudent(null)}
        title={`Edit Student · ${editingStudent?.student_id ?? ""}`}
        description="Update student contact information, program, year of study, or status."
      >
        {editingStudent && (
          <StudentForm
            initialStudent={editingStudent}
            onCancel={() => setEditingStudent(null)}
            onSuccess={(updated) => {
              setEditingStudent(null);
              setFeedback(
                `Updated student ${updated.student_id} (${updated.name})${
                  isDemoMode ? " in demo fixtures." : "."
                }`
              );
            }}
          />
        )}
      </Modal>

      {/* Deactivate Confirmation Dialog */}
      <Modal
        open={Boolean(deactivatingStudent)}
        onClose={() => setDeactivatingStudent(null)}
        title="Deactivate Student Record"
        description="Deactivating a student marks their status as Inactive without deleting historical room allocation records."
      >
        {deactivatingStudent && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-background/60 p-4 text-sm">
              <p className="font-semibold text-foreground">
                {deactivatingStudent.name} ({deactivatingStudent.student_id})
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {deactivatingStudent.course_program} · Year{" "}
                {deactivatingStudent.year}
              </p>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Inactive students cannot receive new room allocations until their
              record status is restored to Active.
            </p>
            <div className="flex justify-end gap-2.5 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeactivatingStudent(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleConfirmDeactivate()}
              >
                Confirm Deactivation
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
