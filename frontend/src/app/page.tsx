"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Lock } from "lucide-react";

import { getRoleHomePath } from "@/components/hms-shell";
import { useHmsData } from "@/lib/api/hms-provider";

export default function Home() {
  const router = useRouter();
  const { authStatus, role } = useHmsData();

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    } else if (authStatus === "authenticated" && role) {
      router.replace(getRoleHomePath(role));
    }
  }, [authStatus, role, router]);

  if (authStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Building2 className="size-6 animate-pulse" />
          </div>
          <p className="text-sm font-semibold">Loading HMS Workspace...</p>
        </div>
      </div>
    );
  }

  if (authStatus === "authenticated" && role) {
    const dest = getRoleHomePath(role);
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm space-y-4">
          <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">
            Redirecting to Workspace
          </h1>
          <p className="text-xs text-muted-foreground">
            Opening your {role.toLowerCase()} dashboard...
          </p>
          <Link
            href={dest}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground"
          >
            Continue to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm space-y-4">
        <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Lock className="size-5" />
        </div>
        <h1 className="text-lg font-bold tracking-tight">
          Hostel Management System
        </h1>
        <p className="text-xs leading-5 text-muted-foreground">
          Please sign in with your university credentials to continue.
        </p>
        <Link
          href="/login"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground"
        >
          Sign In to HMS
        </Link>
      </div>
    </div>
  );
}
