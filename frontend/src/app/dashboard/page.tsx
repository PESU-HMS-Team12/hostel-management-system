"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getRoleHomePath, HmsShell } from "@/components/hms-shell";
import { PageHeader } from "@/components/layout/page-header";
import { useHmsData } from "@/lib/api/hms-provider";

export default function DashboardHubPage() {
  const router = useRouter();
  const { authStatus, role, user } = useHmsData();

  useEffect(() => {
    if (authStatus === "authenticated" && role) {
      router.replace(getRoleHomePath(role));
    }
  }, [authStatus, role, router]);

  const targetRoute = getRoleHomePath(role);

  return (
    <HmsShell breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="space-y-6">
        <PageHeader
          category="ROLE-BASED WORKSPACE"
          title="HMS Dashboard"
          description={`Signed in as ${user?.username ?? "authenticated user"} (${user?.role_label ?? role ?? "User"}).`}
        />

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
          <p className="text-sm text-muted-foreground">
            Redirecting you to your assigned role dashboard (
            <code>{targetRoute}</code>)...
          </p>
          <Link
            href={targetRoute}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground"
          >
            <span>Open Assigned Dashboard</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </HmsShell>
  );
}
