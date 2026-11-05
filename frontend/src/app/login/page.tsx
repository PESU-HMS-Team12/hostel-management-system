"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { HmsApiError } from "@/lib/api/errors";
import { useHmsData } from "@/lib/api/hms-provider";
import type { RoleEnum } from "@/lib/types/hms";

export function getRoleDashboardPath(role: RoleEnum | null | undefined): string {
  if (role === "STUDENT") {
    return "/dashboard/student";
  }
  if (role === "ADMINISTRATOR") {
    return "/dashboard/admin";
  }
  return "/dashboard/warden";
}

export default function LoginPage() {
  const router = useRouter();
  const {
    login,
    authenticated,
    role,
    sessionExpiredMessage,
    clearSessionExpiredMessage,
  } = useHmsData();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  useEffect(() => {
    if (authenticated && role) {
      router.replace(getRoleDashboardPath(role));
    }
  }, [authenticated, role, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMsg(null);
    clearSessionExpiredMessage();

    const nextFieldErrors: { username?: string; password?: string } = {};
    if (!username.trim()) {
      nextFieldErrors.username = "Username or university email is required.";
    }
    if (!password) {
      nextFieldErrors.password = "Password is required.";
    }
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setErrorMsg("Please enter both your username/email and password.");
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const user = await login({ username: username.trim(), password });
      setPassword("");
      router.replace(getRoleDashboardPath(user.role));
    } catch (err) {
      if (err instanceof HmsApiError) {
        setErrorMsg(err.message);
        if (Object.keys(err.fieldErrors).length > 0) {
          setFieldErrors({
            username: err.fieldErrors.username,
            password: err.fieldErrors.password,
          });
        }
      } else {
        setErrorMsg("Authentication failed. Please check your credentials.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Sign in to HMS"
      subtitle="Enter your university credentials to access your hostel workspace"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {sessionExpiredMessage && !errorMsg && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-xl border border-amber-500/35 bg-amber-500/10 p-3.5 text-xs font-medium text-amber-700 dark:text-amber-300"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{sessionExpiredMessage}</span>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-600 dark:text-rose-400"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{errorMsg}</span>
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
              placeholder="Enter username or university email"
              aria-invalid={Boolean(fieldErrors.username)}
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              required
            />
          </div>
          {fieldErrors.username && (
            <p className="text-xs text-rose-500">{fieldErrors.username}</p>
          )}
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
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              aria-invalid={Boolean(fieldErrors.password)}
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-10 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-2 inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-rose-500">{fieldErrors.password}</p>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </Button>
        </div>
      </form>

      <div className="mt-6 border-t border-border pt-5 text-center">
        <Link
          href="/signup"
          className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <UserPlus className="size-4" />
          <span>New student? Create an account</span>
        </Link>
      </div>

      <div className="mt-5 rounded-xl border border-border/70 bg-background/60 p-3.5 text-[11px] leading-4 text-muted-foreground">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <p>
            Protected by Django session authentication and CSRF verification.
            Role permissions are enforced on the server.
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
