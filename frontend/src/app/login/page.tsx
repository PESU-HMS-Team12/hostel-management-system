"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  KeyRound,
  Lock,
  ShieldCheck,
  User,
  ArrowRight,
  Database,
} from "lucide-react";

import { HmsShell } from "@/components/hms-shell";
import { Button } from "@/components/ui/button";
import { HmsApiError } from "@/lib/api/errors";
import { useHmsData } from "@/lib/api/hms-provider";

export default function LoginPage() {
  const router = useRouter();
  const { login, isDemoMode } = useHmsData();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg("Please enter both your username/email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const user = await login({ username: username.trim(), password });
      setPassword("");
      if (user.role === "STUDENT") {
        router.push("/dashboard/student");
      } else if (user.role === "ADMINISTRATOR") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/warden");
      }
    } catch (err) {
      setErrorMsg(
        err instanceof HmsApiError
          ? err.message
          : "Authentication failed. Please check your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <HmsShell breadcrumbs={[{ label: "Session Sign-In" }]}>
      <div className="mx-auto max-w-4xl py-4">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Login Form Card */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:col-span-7">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <KeyRound className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  HMS Session Sign-In
                </h1>
                <p className="text-xs text-muted-foreground">
                  Django Session Authentication &amp; CSRF-protected endpoint
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-600 dark:text-rose-400"
                >
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="login-username"
                  className="block text-xs font-semibold tracking-wide uppercase text-muted-foreground"
                >
                  Username or University Email
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <input
                    id="login-username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. warden.north or aarav.sharma"
                    className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold tracking-wide uppercase text-muted-foreground"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? "Verifying session..." : "Sign in to HMS"}
                </Button>
              </div>
            </form>

            <div className="mt-6 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <p>
                  <strong>Security Notice:</strong> Passwords and session
                  credentials are never stored in browser{" "}
                  <code>localStorage</code>. Production authentication uses
                  HTTP-only server-side session cookies via{" "}
                  <code>POST /api/v1/auth/login/</code>.
                </p>
              </div>
            </div>
          </section>

          {/* Direct Demo Workspace Navigation */}
          <aside className="flex flex-col justify-between rounded-2xl border border-border bg-card/70 p-6 sm:p-7 lg:col-span-5">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Database className="size-3.5" />
                <span>{isDemoMode ? "Demo Mode Active" : "Workspace Links"}</span>
              </div>

              <h2 className="text-base font-semibold tracking-tight">
                Direct Role Dashboard Access
              </h2>

              <p className="text-xs leading-5 text-muted-foreground">
                While backend PR #17 (HMS-34) awaits merge, role dashboards can
                be opened directly for UI inspection or tested with demo
                usernames (<code>aarav.sharma</code>, <code>warden.north</code>,{" "}
                <code>admin.pesu</code>).
              </p>

              <div className="space-y-2.5 pt-2">
                <Link
                  href="/dashboard/student"
                  className="flex items-center justify-between rounded-xl border border-border bg-background p-3 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  <span>Student Dashboard (/dashboard/student)</span>
                  <ArrowRight className="size-3.5 text-primary" />
                </Link>

                <Link
                  href="/dashboard/warden"
                  className="flex items-center justify-between rounded-xl border border-border bg-background p-3 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  <span>Warden Dashboard (/dashboard/warden)</span>
                  <ArrowRight className="size-3.5 text-primary" />
                </Link>

                <Link
                  href="/dashboard/admin"
                  className="flex items-center justify-between rounded-xl border border-border bg-background p-3 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  <span>Admin Dashboard (/dashboard/admin)</span>
                  <ArrowRight className="size-3.5 text-primary" />
                </Link>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2.5 border-t border-border/60 pt-4 text-xs text-muted-foreground">
              <Building2 className="size-4 text-primary" />
              <span>PES University · Hostel Management System</span>
            </div>
          </aside>
        </div>
      </div>
    </HmsShell>
  );
}
