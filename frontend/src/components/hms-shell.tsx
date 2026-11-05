"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Users,
  Hotel,
  DoorOpen,
  ClipboardList,
  ChartNoAxesCombined,
  Settings,
  GraduationCap,
  Menu,
  X,
  ShieldAlert,
  BedDouble,
  History,
  UserCircle,
  KeyRound,
  Database,
  RotateCcw,
  LogOut,
  AlertTriangle,
  Lock,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
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

export interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

export const studentNavigation: NavItem[] = [
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

export const wardenNavigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/warden", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users },
  { label: "Hostels", href: "/hostels", icon: Hotel },
  { label: "Rooms", href: "/rooms", icon: DoorOpen },
  { label: "Allocations", href: "/allocations", icon: ClipboardList },
  { label: "Reports", href: "/reports", icon: ChartNoAxesCombined },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const adminNavigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users },
  { label: "Hostels", href: "/hostels", icon: Hotel },
  { label: "Rooms", href: "/rooms", icon: DoorOpen },
  { label: "Allocations", href: "/allocations", icon: ClipboardList },
  { label: "Reports", href: "/reports", icon: ChartNoAxesCombined },
  {
    label: "Role Management",
    href: "/admin/users",
    icon: KeyRound,
  },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function getNavigationForRole(
  role: RoleEnum | null | undefined
): NavItem[] {
  if (role === "STUDENT") {
    return studentNavigation;
  }
  if (role === "ADMINISTRATOR") {
    return adminNavigation;
  }
  return wardenNavigation;
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href.includes("#")) {
    return false;
  }
  const cleanPathname = pathname.split("?")[0].split("#")[0] || "/";
  if (href === "/") return cleanPathname === "/";
  return cleanPathname === href || cleanPathname.startsWith(`${href}/`);
}

export function getRoleHomePath(role: RoleEnum | null | undefined): string {
  if (role === "STUDENT") {
    return "/dashboard/student";
  }
  if (role === "ADMINISTRATOR") {
    return "/dashboard/admin";
  }
  return "/dashboard/warden";
}

export function isRouteAllowedForRole(
  pathname: string,
  role: RoleEnum | null | undefined
): boolean {
  if (!role) {
    return false;
  }

  const cleanPath = pathname.split("?")[0].split("#")[0] || "/";

  if (cleanPath === "/" || cleanPath === "/dashboard") {
    return true;
  }

  if (role === "STUDENT") {
    return cleanPath === "/dashboard/student";
  }

  const wardenAllowedPrefixes = [
    "/dashboard/warden",
    "/students",
    "/hostels",
    "/rooms",
    "/allocations",
    "/reports",
    "/settings",
  ];

  if (role === "WARDEN") {
    return wardenAllowedPrefixes.some(
      (prefix) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`)
    );
  }

  if (role === "ADMINISTRATOR") {
    const adminAllowedPrefixes = [
      "/dashboard/admin",
      "/admin/users",
      ...wardenAllowedPrefixes,
    ];
    return adminAllowedPrefixes.some(
      (prefix) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`)
    );
  }

  return false;
}

export function HmsShell({ children, role, breadcrumbs }: HmsShellProps) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const {
    isDemoMode,
    resetDemoFixtures,
    apiError,
    refreshLiveData,
    authStatus,
    user,
    logout,
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

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  async function handleSignOut() {
    await logout();
    router.replace("/login");
  }

  // 1. Loading session state — do not flash unauthenticated or wrong role UI
  if (authStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Building2 className="size-6 animate-pulse" />
          </div>
          <p className="text-sm font-semibold">Verifying HMS session...</p>
          <p className="text-xs text-muted-foreground">
            Checking role permissions with the hostel management server
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated state — redirect to /login without rendering protected layout
  if (authStatus === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm space-y-4">
          <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Lock className="size-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">
            Authentication Required
          </h1>
          <p className="text-xs leading-5 text-muted-foreground">
            Please sign in with your university account to access the Hostel
            Management System.
          </p>
          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // 3. Forbidden / No assigned HMS Role state
  if (authStatus === "forbidden") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm space-y-4">
          <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="size-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">
            HMS Role Not Assigned
          </h1>
          <p className="text-xs leading-5 text-muted-foreground">
            Your account is authenticated, but no Hostel Management System role
            profile (Student, Warden, or Administrator) is currently assigned.
            Please contact the hostel administrator.
          </p>
          <div className="flex justify-center gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => void handleSignOut()}>
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const effectiveRole: RoleEnum =
    user?.role ??
    role ??
    (pathname.startsWith("/dashboard/student")
      ? "STUDENT"
      : pathname.startsWith("/dashboard/admin") ||
          pathname.startsWith("/admin")
        ? "ADMINISTRATOR"
        : "WARDEN");

  const activeNavList = getNavigationForRole(effectiveRole);

  const isActive = (href: string) => isNavItemActive(pathname, href);

  const activePage =
    activeNavList.find((item) => isActive(item.href)) ?? activeNavList[0];

  const roleBadgeLabel =
    effectiveRole === "STUDENT"
      ? "Student Portal"
      : effectiveRole === "ADMINISTRATOR"
        ? "Administrator Console"
        : "Warden Workspace";

  const displayName = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.username
    : roleBadgeLabel;

  const displayRoleLabel =
    user?.role_label ??
    (effectiveRole === "STUDENT"
      ? "Student"
      : effectiveRole === "ADMINISTRATOR"
        ? "Administrator"
        : "Warden");

  const routeAllowed = isRouteAllowedForRole(pathname, effectiveRole);
  const roleHomePath = getRoleHomePath(effectiveRole);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-sidebar-border px-6">
        <Link
          href={roleHomePath}
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

      {/* Navigation strictly for the authenticated user's role */}
      <nav
        aria-label="Main navigation"
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <p className="mb-2.5 px-3 text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
          {effectiveRole === "STUDENT"
            ? "Student Navigation"
            : effectiveRole === "ADMINISTRATOR"
              ? "Administrator Navigation"
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
      </nav>

      {/* Authenticated User Account Footer & Sign Out */}
      <div className="shrink-0 border-t border-sidebar-border p-4 space-y-2.5">
        <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            {displayName.slice(0, 2).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-sidebar-foreground">
              {displayName}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {displayRoleLabel}
              {user?.username ? ` · @${user.username}` : ""}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-sidebar-border bg-background/70 px-3 py-2 text-xs font-semibold text-sidebar-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
        >
          <LogOut className="size-3.5" />
          <span>Sign Out</span>
        </button>
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
                href={roleHomePath}
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
            {isDemoMode && (
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
            )}

            <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-foreground">
                {displayRoleLabel}
              </span>
            </div>

            <ThemeToggle />
          </div>
        </header>

        {/* Live API Error Banner (no silent fallback to demo data) */}
        {!isDemoMode && apiError && (
          <div
            role="alert"
            className="border-b border-rose-500/30 bg-rose-500/10 px-5 py-3 text-xs text-rose-600 dark:text-rose-400 sm:px-8"
          >
            <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>
                  <strong>Backend API Error:</strong> {apiError}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void refreshLiveData()}
                className="rounded-lg border border-rose-500/30 bg-background px-2.5 py-1 font-semibold text-foreground hover:bg-accent"
              >
                Retry Request
              </button>
            </div>
          </div>
        )}

        {/* Page content with strict role route guard */}
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-5 py-8 sm:px-8 lg:px-10">
          {routeAllowed ? (
            children
          ) : (
            <div
              role="alert"
              className="mx-auto my-8 max-w-lg rounded-2xl border border-rose-500/30 bg-card p-6 text-center shadow-xs space-y-4"
            >
              <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="size-5" />
              </div>
              <h1 className="text-lg font-bold tracking-tight">
                Access Restricted
              </h1>
              <p className="text-xs leading-5 text-muted-foreground">
                Your current role (<strong>{displayRoleLabel}</strong>) does not
                have permission to access <code>{pathname}</code>.
              </p>
              <div className="pt-1">
                <Link
                  href={roleHomePath}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground"
                >
                  Return to {displayRoleLabel} Dashboard
                </Link>
              </div>
            </div>
          )}
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
