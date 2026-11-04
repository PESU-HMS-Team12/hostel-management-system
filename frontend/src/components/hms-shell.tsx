
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
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

const navigation = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users },
  { label: "Hostels", href: "/hostels", icon: Hotel },
  { label: "Rooms", href: "/rooms", icon: DoorOpen },
  { label: "Allocations", href: "/allocations", icon: ClipboardList },
  { label: "Reports", href: "/reports", icon: ChartNoAxesCombined },
];

const settingsItem = {
  label: "Settings",
  href: "/settings",
  icon: Settings,
};

interface HmsShellProps {
  children: ReactNode;
}

export function HmsShell({ children }: HmsShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const activePage =
    [...navigation, settingsItem].find((item) => isActive(item.href)) ??
    navigation[0];

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-sidebar-border px-6">
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

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
          className="ml-auto inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent lg:hidden"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Workspace selector */}
      <div className="px-4 pt-6">
        <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-background/50 p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <GraduationCap className="size-[18px]" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-sidebar-foreground">
              PES University
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Campus workspace
            </p>
          </div>

          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-4 py-7">
        <p className="mb-3 px-3 text-[11px] font-bold tracking-[0.16em] text-muted-foreground">
          WORKSPACE
        </p>

        <ul className="space-y-1.5">
          {navigation.map((item) => {
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

        <div className="my-6 border-t border-sidebar-border" />

        <p className="mb-3 px-3 text-[11px] font-bold tracking-[0.16em] text-muted-foreground">
          PREFERENCES
        </p>

        <Link
          href={settingsItem.href}
          aria-current={isActive(settingsItem.href) ? "page" : undefined}
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive(settingsItem.href)
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          }`}
        >
          <Settings className="size-[17px]" />
          <span>Settings</span>
        </Link>
      </nav>

      {/* Sidebar footer */}
      <div className="shrink-0 border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-xl p-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <CircleHelp className="size-[17px]" />
          </div>

          <div>
            <p className="text-[13px] font-semibold text-sidebar-foreground">
              HMS Workspace
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Hostel administration
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:hidden"
            >
              <Menu className="size-5" />
            </button>

            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="size-[18px]" />
              </div>
              <span className="text-[15px] font-bold tracking-tight">
                HMS
              </span>
            </div>

            <div className="hidden text-[15px] text-muted-foreground sm:flex">
              Workspace
              <span className="mx-2 text-border">/</span>
              <span className="font-semibold text-foreground">
                {activePage.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-[13px] text-muted-foreground sm:block">
              Campus workspace
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-5 py-8 sm:px-8 lg:px-10">
          {children}
        </main>

        {/* Team byline */}
        <footer className="border-t border-border/60 px-4 py-3">
          <p className="text-center text-[10px] leading-4 text-muted-foreground">
            Pranav Shashikiran Atreya (PES2UG24CS912) · Kaushik Balaji
            (PES2UG24CS220) · Kanishk Kartik (PES2UG24CS213) · Harshith
            Manish (PES2UG24CS187)
          </p>
        </footer>
      </div>
    </div>
  );
}
