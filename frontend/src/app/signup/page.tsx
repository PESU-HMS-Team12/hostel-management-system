"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  IdCard,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { HmsApiError } from "@/lib/api/errors";
import { useHmsData } from "@/lib/api/hms-provider";
import type {
  StudentSignupRequest,
  StudentSignupResponse,
  ValidationErrors,
} from "@/lib/types/hms";
import { validateStudentSignup } from "@/lib/validation/hms";

export default function SignupPage() {
  const { signup } = useHmsData();

  const [form, setForm] = useState<StudentSignupRequest>({
    student_id: "",
    contact: "",
    email: "",
    username: "",
    password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] =
    useState<StudentSignupResponse | null>(null);

  function updateField<K extends keyof StudentSignupRequest>(
    key: K,
    value: StudentSignupRequest[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateStudentSignup(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const response = await signup({
        student_id: form.student_id.trim(),
        contact: form.contact.trim(),
        email: form.email.trim().toLowerCase(),
        username: form.username.trim(),
        password: form.password,
        confirm_password: form.confirm_password,
      });
      setSubmittedResult(response);
    } catch (err) {
      if (err instanceof HmsApiError) {
        setErrors(
          Object.keys(err.fieldErrors).length > 0
            ? err.fieldErrors
            : { non_field_errors: err.message }
        );
      } else {
        setErrors({
          non_field_errors:
            "Registration could not be completed. Please try again.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedResult) {
    return (
      <AuthShell
        title="Registration Submitted"
        subtitle="Pending Hostel Administration Verification"
      >
        <div className="space-y-5 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-6" />
          </div>

          <div
            role="status"
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium leading-6 text-emerald-700 dark:text-emerald-300"
          >
            Your account registration has been submitted and is awaiting hostel
            administration approval.
          </div>

          <div className="rounded-xl border border-border bg-background/60 p-4 text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username:</span>
              <span className="font-mono font-semibold text-foreground">
                {submittedResult.username}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Linked Student ID:</span>
              <span className="font-mono font-semibold text-primary">
                {submittedResult.student_id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Status:</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                Pending Administrator Approval
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-xs transition-opacity hover:opacity-90"
            >
              <ArrowLeft className="size-4" />
              <span>Return to Sign In</span>
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create Student Account"
      subtitle="Verify your university student record to request portal access"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {errors.non_field_errors && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-600 dark:text-rose-400"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{errors.non_field_errors}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="signup-student-id"
            className="block text-xs font-semibold tracking-wide uppercase text-muted-foreground"
          >
            University Student ID (SRN) *
          </label>
          <div className="relative">
            <IdCard className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              id="signup-student-id"
              name="student_id"
              type="text"
              value={form.student_id}
              onChange={(e) => updateField("student_id", e.target.value)}
              placeholder="e.g. PES2UG24CS001"
              aria-invalid={Boolean(errors.student_id)}
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 font-mono text-sm text-foreground outline-none focus-visible:border-ring"
              required
            />
          </div>
          {errors.student_id && (
            <p role="alert" className="text-xs text-rose-500">
              {errors.student_id}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="signup-contact"
            className="block text-xs font-semibold tracking-wide uppercase text-muted-foreground"
          >
            Registered Contact Number *
          </label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              id="signup-contact"
              name="contact"
              type="tel"
              value={form.contact}
              onChange={(e) => updateField("contact", e.target.value)}
              placeholder="Must match your registered hostel student record"
              aria-invalid={Boolean(errors.contact)}
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus-visible:border-ring"
              required
            />
          </div>
          {errors.contact && (
            <p role="alert" className="text-xs text-rose-500">
              {errors.contact}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="signup-email"
            className="block text-xs font-semibold tracking-wide uppercase text-muted-foreground"
          >
            University Email Address *
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="e.g. student@stu.pes.edu"
              aria-invalid={Boolean(errors.email)}
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus-visible:border-ring"
              required
            />
          </div>
          {errors.email && (
            <p role="alert" className="text-xs text-rose-500">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="signup-username"
            className="block text-xs font-semibold tracking-wide uppercase text-muted-foreground"
          >
            Username *
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              id="signup-username"
              name="username"
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={(e) => updateField("username", e.target.value)}
              placeholder="Choose a unique login username"
              aria-invalid={Boolean(errors.username)}
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus-visible:border-ring"
              required
            />
          </div>
          {errors.username && (
            <p role="alert" className="text-xs text-rose-500">
              {errors.username}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="signup-password"
            className="block text-xs font-semibold tracking-wide uppercase text-muted-foreground"
          >
            Password *
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              id="signup-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="Minimum 8 characters, mix of letters & symbols"
              aria-invalid={Boolean(errors.password)}
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-10 text-sm text-foreground outline-none focus-visible:border-ring"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1.5 inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Must be at least 8 characters and not purely numeric or common.
          </p>
          {errors.password && (
            <p role="alert" className="text-xs text-rose-500">
              {errors.password}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="signup-confirm-password"
            className="block text-xs font-semibold tracking-wide uppercase text-muted-foreground"
          >
            Confirm Password *
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              id="signup-confirm-password"
              name="confirm_password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.confirm_password}
              onChange={(e) => updateField("confirm_password", e.target.value)}
              placeholder="Re-enter your password"
              aria-invalid={Boolean(errors.confirm_password)}
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-10 text-sm text-foreground outline-none focus-visible:border-ring"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={
                showConfirmPassword
                  ? "Hide confirmation password"
                  : "Show confirmation password"
              }
              className="absolute right-2.5 top-1.5 inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.confirm_password && (
            <p role="alert" className="text-xs text-rose-500">
              {errors.confirm_password}
            </p>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full"
          >
            {submitting
              ? "Submitting Registration..."
              : "Submit Student Registration"}
          </Button>
        </div>
      </form>

      <div className="mt-6 border-t border-border pt-5 text-center">
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" />
          <span>Already have an approved account? Sign in</span>
        </Link>
      </div>

      <div className="mt-5 rounded-xl border border-border/70 bg-background/60 p-3.5 text-[11px] leading-4 text-muted-foreground">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <p>
            Self-registration is restricted to active students already enrolled
            in the hostel directory. New accounts require Administrator approval
            before sign-in is enabled.
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
