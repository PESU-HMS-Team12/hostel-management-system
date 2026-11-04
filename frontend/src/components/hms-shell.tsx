"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Users,
  Hotel,
  DoorOpen,
  ClipboardList,
  ChartNoAxesCombined,
  Settings,
  CircleHelp,
  GraduationCap,
  Menu,
  X,
  UserCheck,
  ShieldAlert,
  BedDouble,
  History,
  UserCircle,
  KeyRound,
  Database,
  RotateCcw,
  LogIn,
  AlertTriangle,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { useHmsData } from "@/lib/api/hms-provider";
import type { RoleEnum } from "@/lib/types/hms";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface HmsShellProps {
  children: ReactNode;
  role?: RoleEnum;
  breadcrumbs?: BreadcrumbItem[];
}

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const studentNavigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/student", icon: LayoutDashboard },
  { label: "My Profile", href: "/dashboard/student#profile", icon: UserCircle },
  {
    label: "My Accommodation",
    href: "/dashboard/student#accommodation",
    icon: BedDouble,
  },
  {
    label: "Allocation History",
    href: "/dashboard/student#history",
    icon: History,
  },
];

const wardenNavigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/warden", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users },
  { label: "Hostels", href: "/hostels", icon: Hotel },
  { label: "Rooms", href: "/rooms", icon: DoorOpen },
  { label: "Allocations", href: "/allocations", icon: ClipboardList },
  { label: "Reports", href: "/reports", icon: ChartNoAxesCombined },
];

const adminNavigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users },
  { label: "Hostels", href: "/hostels", icon: Hotel },
  { label: "Rooms", href: "/rooms", icon: DoorOpen },
  { label: "Allocations", href: "/allocations", icon: ClipboardList },
  { label: "Reports", href: "/reports", icon: ChartNoAxesCombined },
  { label: "User Management", href: "/admin/users", icon: UserCheck },
  {
    label: "Role Management",
    href: "/admin/users#role-management",
    icon: KeyRound,
  },
  { label: "Settings", href: "/settings", icon: Settings },
];

const roleWorkspaceLinks = [
  { label: "Student Portal", href: "/dashboard/student", role: "STUDENT" },
  { label: "Warden Workspace", href: "/dashboard/warden", role: "WARDEN" },
  { label: "Admin Console", href: "/dashboard/admin", role: "ADMINISTRATOR" },
] as const;

export function HmsShell({ children, role, breadcrumbs }: HmsShellProps) {
  const pathname = usePathname() || "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const {
    isDemoMode,
    setDemoMode,
    resetDemoFixtures,
    apiError,
    refreshLiveData,
  } = useHmsData();

  useEffect(() => {
    if (!mobileOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  const effectiveRole: RoleEnum =
    role ??
    (pathname.startsWith("/dashboard/student")
      ? "STUDENT"
      : pathname.startsWith("/dashboard/admin") ||
          pathname.startsWith("/admin") ||
          pathname.startsWith("/settings")
        ? "ADMINISTRATOR"
        : "WARDEN");

  const activeNavList =
    effectiveRole === "STUDENT"
      ? studentNavigation
      : effectiveRole === "ADMINISTRATOR"
        ? adminNavigation
        : wardenNavigation;

  const isActive = (href: string) => {
    if (href.includes("#")) {
      return false;
    }
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const activePage =
    activeNavList.find((item) => isActive(item.href)) ??
    (pathname === "/"
      ? { label: "Overview", href: "/", icon: LayoutDashboard }
      : pathname === "/login"
        ? { label: "Sign In", href: "/login", icon: LogIn }
        : activeNavList[0]);

  const roleBadgeLabel =
    effectiveRole === "STUDENT"
      ? "Student View"
      : effectiveRole === "ADMINISTRATOR"
        ? "Administrator View"
        : "Warden View";

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-sidebar-border px-6">
        <Link
          href="/"
          className="flex items-center gap-3 focus-visible:outline-none"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Building2 className="size-5" />
          </div>

          <div className="min-w-0">
            <p className="text-base font-bold tracking-tight text-sidebar-foreground">
              HMS
            </p>
            <p className="text-[11px] font-semibold tracking-[0.15em] text-muted-foreground">
              HOSTEL MANAGEMENT
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
          className="ml-auto inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent lg:hidden"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Workspace context card */}
      <div className="px-4 pt-5">
        <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-background/50 p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <GraduationCap className="size-[18px]" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-sidebar-foreground">
              PES University
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {roleBadgeLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main navigation"
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <p className="mb-2.5 px-3 text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
          {effectiveRole === "STUDENT"
            ? "Student Portal"
            : effectiveRole === "ADMINISTRATOR"
              ? "Admin Navigation"
              : "Warden Navigation"}
        </p>

        <ul className="space-y-1">
          {activeNavList.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <Icon className="size-[17px] shrink-0" />
                  <span>{item.label}</span>

                  {active && (
                    <span className="ml-auto size-1.5 rounded-full bg-current" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="my-5 border-t border-sidebar-border" />

        <p className="mb-2.5 px-3 text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
          Role Dashboards
        </p>

        <ul className="space-y-1">
          {roleWorkspaceLinks.map((ws) => {
            const active = pathname === ws.href;
            return (
              <li key={ws.href}>
                <Link
                  href={ws.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                    active
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <span>{ws.label}</span>
                  <span className="rounded border border-border/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {ws.role}
                  </span>
                </Link>
              </li>
            );
          })}
          <li>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                pathname === "/login"
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <LogIn className="size-3.5" />
              <span>Session Sign-In</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Sidebar footer */}
      <div className="shrink-0 border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-xl p-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <CircleHelp className="size-[17px]" />
          </div>

          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-sidebar-foreground">
              HMS Workspace
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Backend RBAC authoritative
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar and backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 size-full bg-black/60 backdrop-blur-sm"
          />

          <aside
            aria-label="Mobile navigation"
            className="absolute inset-y-0 left-0 w-[min(84vw,17rem)] border-r border-sidebar-border bg-sidebar shadow-2xl"
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main application area */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:hidden"
            >
              <Menu className="size-5" />
            </button>

            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="size-[18px]" />
              </div>
              <span className="text-[15px] font-bold tracking-tight">HMS</span>
            </div>

            <nav
              aria-label="Breadcrumb"
              className="hidden items-center text-sm text-muted-foreground sm:flex truncate"
            >
              <Link
                href="/dashboard"
                className="transition-colors hover:text-foreground"
              >
                Workspace
              </Link>
              {breadcrumbs && breadcrumbs.length > 0 ? (
                breadcrumbs.map((crumb, idx) => (
                  <span key={crumb.label} className="flex items-center">
                    <span className="mx-2 text-border">/</span>
                    {crumb.href && idx < breadcrumbs.length - 1 ? (
                      <Link
                        href={crumb.href}
                        className="transition-colors hover:text-foreground"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="font-semibold text-foreground">
                        {crumb.label}
                      </span>
                    )}
                  </span>
                ))
              ) : (
                <>
                  <span className="mx-2 text-border">/</span>
                  <span className="font-semibold text-foreground">
                    {activePage.label}
                  </span>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            {isDemoMode ? (
              <div className="flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Database className="size-3.5 shrink-0" />
                <span>DEMO DATA</span>
                <button
                  type="button"
                  onClick={resetDemoFixtures}
                  title="Reset in-memory demo fixtures to defaults"
                  aria-label="Reset demo fixtures"
                  className="ml-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] hover:bg-amber-500/20"
                >
                  <RotateCcw className="size-3" />
                  <span className="hidden md:inline">Reset</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldAlert className="size-3.5 shrink-0" />
                <span>LIVE API MODE</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setDemoMode(!isDemoMode)}
              className="hidden rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground xl:inline-flex"
            >
              {isDemoMode ? "Switch to Live API" : "Use Demo Fixtures"}
            </button>

            <ThemeToggle />
          </div>
        </header>

        {/* Demo Mode or Live API Status Banner */}
        {isDemoMode && (
          <div className="border-b border-amber-500/20 bg-amber-500/5 px-5 py-2 text-xs text-muted-foreground sm:px-8">
            <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-2">
              <p>
                <strong className="font-semibold text-amber-600 dark:text-amber-400">
                  DEMO DATA ACTIVE:
                </strong>{" "}
                Viewing isolated in-memory sample fixtures while backend PR #17
                (HMS-34) awaits merge. Workflow changes update local demo state
                only and are not persisted to PostgreSQL.
              </p>
              <Link
                href="/settings"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Data source settings
              </Link>
            </div>
          </div>
        )}

        {!isDemoMode && apiError && (
          <div
            role="alert"
            className="border-b border-rose-500/30 bg-rose-500/10 px-5 py-3 text-xs text-rose-600 dark:text-rose-400 sm:px-8"
          >
            <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>
                  <strong>Live Backend API Error:</strong> {apiError} (No fake
                  records have been substituted.)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void refreshLiveData()}
                  className="rounded-lg border border-rose-500/30 bg-background px-2.5 py-1 font-semibold text-foreground hover:bg-accent"
                >
                  Retry Live API
                </button>
                <button
                  type="button"
                  onClick={() => setDemoMode(true)}
                  className="rounded-lg bg-primary px-2.5 py-1 font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Enable Demo Fixtures
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-5 py-8 sm:px-8 lg:px-10">
          {children}
        </main>

        {/* Team byline */}
        <footer className="border-t border-border/60 px-4 py-3">
          <p className="text-center text-[10px] leading-4 text-muted-foreground">
            Pranav Shashikiran Atreya (PES2UG24CS912) · Kaushik Balaji
            (PES2UG24CS220) · Kanishk Kartik (PES2UG24CS213) · Harshith Manish
            (PES2UG24CS187)
          </p>
        </footer>
      </div>
    </div>
  );
}
