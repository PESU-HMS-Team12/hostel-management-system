"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Building2, GraduationCap } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

export interface AuthShellProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top unauthenticated bar */}
      <header className="flex h-16 items-center justify-between border-b border-border/70 bg-card/60 px-5 backdrop-blur-md sm:px-8">
        <Link
          href="/login"
          className="flex items-center gap-3 focus-visible:outline-none"
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <Building2 className="size-4" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-foreground">
              HMS
            </p>
            <p className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground">
              HOSTEL MANAGEMENT SYSTEM
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
            <GraduationCap className="size-3.5 text-primary" />
            <span>PES University</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Centered authentication container */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/15">
              <Building2 className="size-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            {children}
          </section>
        </div>
      </main>
    </div>
  );
}
