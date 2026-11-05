"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { HmsApiError } from "@/lib/api/errors";
import { useHmsData } from "@/lib/api/hms-provider";
import type {
  RecordStatus,
  Student,
  StudentRequest,
  ValidationErrors,
} from "@/lib/types/hms";
import { validateStudent } from "@/lib/validation/hms";

export interface StudentFormProps {
  initialStudent?: Student;
  onSuccess?: (student: Student) => void;
  onCancel?: () => void;
}

export function StudentForm({
  initialStudent,
  onSuccess,
  onCancel,
}: StudentFormProps) {
  const { students, createStudent, updateStudent } = useHmsData();

  const [studentId, setStudentId] = useState(initialStudent?.student_id ?? "");
  const [name, setName] = useState(initialStudent?.name ?? "");
  const [contact, setContact] = useState(initialStudent?.contact ?? "");
  const [courseProgram, setCourseProgram] = useState(
    initialStudent?.course_program ?? ""
  );
  const [year, setYear] = useState<string>(
    initialStudent?.year ? String(initialStudent.year) : "1"
  );
  const [status, setStatus] = useState<RecordStatus>(
    initialStudent?.status ?? "Active"
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedYear = Number(year);
    const payload: StudentRequest = {
      student_id: studentId.trim(),
      name: name.trim(),
      contact: contact.trim(),
      course_program: courseProgram.trim(),
      year: parsedYear,
      status,
    };

    const validationErrors = validateStudent(
      payload,
      students,
      initialStudent?.id
    );
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const saved = initialStudent
        ? await updateStudent(initialStudent.id, payload)
        : await createStudent(payload);
      onSuccess?.(saved);
    } catch (err) {
      if (err instanceof HmsApiError) {
        setErrors(
          Object.keys(err.fieldErrors).length > 0
            ? err.fieldErrors
            : { non_field_errors: err.message }
        );
      } else {
        setErrors({
          non_field_errors: "Unable to save student record. Please try again.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {errors.non_field_errors && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-600 dark:text-rose-400"
        >
          {errors.non_field_errors}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="student-id-input"
            className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Student ID (SRN) *
          </label>
          <input
            id="student-id-input"
            name="student_id"
            type="text"
            maxLength={20}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="e.g. PES2UG24CS099"
            aria-invalid={Boolean(errors.student_id)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          {errors.student_id && (
            <p role="alert" className="text-xs text-rose-500">
              {errors.student_id}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="student-name-input"
            className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Full Name *
          </label>
          <input
            id="student-name-input"
            name="name"
            type="text"
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aditya Menon"
            aria-invalid={Boolean(errors.name)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          {errors.name && (
            <p role="alert" className="text-xs text-rose-500">
              {errors.name}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="student-contact-input"
            className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Contact Number *
          </label>
          <input
            id="student-contact-input"
            name="contact"
            type="text"
            maxLength={20}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="e.g. +91 98450 12345"
            aria-invalid={Boolean(errors.contact)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          {errors.contact && (
            <p role="alert" className="text-xs text-rose-500">
              {errors.contact}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="student-course-input"
            className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Course / Program *
          </label>
          <input
            id="student-course-input"
            name="course_program"
            type="text"
            maxLength={100}
            value={courseProgram}
            onChange={(e) => setCourseProgram(e.target.value)}
            placeholder="e.g. B.Tech Computer Science & Engineering"
            aria-invalid={Boolean(errors.course_program)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          {errors.course_program && (
            <p role="alert" className="text-xs text-rose-500">
              {errors.course_program}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="student-year-input"
            className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Year of Study *
          </label>
          <input
            id="student-year-input"
            name="year"
            type="number"
            min={1}
            max={6}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            aria-invalid={Boolean(errors.year)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          {errors.year && (
            <p role="alert" className="text-xs text-rose-500">
              {errors.year}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="student-status-select"
            className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Record Status *
          </label>
          <select
            id="student-status-select"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as RecordStatus)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          {errors.status && (
            <p role="alert" className="text-xs text-rose-500">
              {errors.status}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2.5 border-t border-border pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Saving..."
            : initialStudent
              ? "Save Student Changes"
              : "Register Student"}
        </Button>
      </div>
    </form>
  );
}
