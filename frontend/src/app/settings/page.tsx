"use client";

import { Database, RotateCcw, Server, ShieldCheck, UserCheck } from "lucide-react";
import { HmsShell } from "@/components/hms-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useHmsData } from "@/lib/api/hms-provider";

export default function SettingsPage() {
  const { isDemoMode, resetDemoFixtures, user, role, refreshLiveData } =
    useHmsData();

  return (
    <HmsShell breadcrumbs={[{ label: "Settings" }]}>
      <div className="space-y-8">
        <PageHeader
          category="PREFERENCES & CONFIGURATION"
          title="Workspace Settings"
          description="View your authenticated session profile, backend API connection status, and theme preferences."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Authenticated Session & API Connection */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  {isDemoMode ? (
                    <Database className="size-5" />
                  ) : (
                    <Server className="size-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-semibold">
                    Backend Connection &amp; Session
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Django REST API (/api/v1) &amp; Role Profile Status
                  </p>
                </div>
              </div>
              {isDemoMode ? (
                <Badge variant="warning">DEMO DATA</Badge>
              ) : (
                <Badge variant="success">LIVE API</Badge>
              )}
            </div>

            {user && (
              <div className="rounded-xl border border-border/70 bg-background/50 p-4 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <UserCheck className="size-4 text-primary" />
                  <span>Authenticated Account</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Username:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {user.username}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-foreground">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">HMS Role:</span>
                  <span className="font-semibold text-primary">
                    {user.role_label ?? role}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              {!isDemoMode ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void refreshLiveData()}
                >
                  <RotateCcw className="size-3.5" />
                  Refresh Live Data
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetDemoFixtures}
                >
                  <RotateCcw className="size-3.5" />
                  Reset Demo State
                </Button>
              )}
            </div>
          </section>

          {/* Appearance & Security Info */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-base font-semibold">Theme &amp; Display</h2>
                <p className="text-xs text-muted-foreground">
                  Persistent dark and light mode preference
                </p>
              </div>
              <ThemeToggle />
            </div>

            <div className="rounded-xl border border-border/70 bg-background/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <ShieldCheck className="size-4 text-primary" />
                <span>Security &amp; Session Architecture</span>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                HMS uses server-side Django session cookies and CSRF tokens (
                <code>/api/v1/auth/csrf/</code>). No passwords, tokens, or
                credentials are ever persisted in browser{" "}
                <code>localStorage</code>. Backend RBAC permission classes
                remain authoritative across all endpoints.
              </p>
            </div>
          </section>
        </div>
      </div>
    </HmsShell>
  );
}
