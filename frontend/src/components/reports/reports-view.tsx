"use client";

import {
  BedDouble,
  Building2,
  ChartNoAxesCombined,
  ClipboardList,
  Clock,
  DoorOpen,
  Percent,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { useHmsData } from "@/lib/api/hms-provider";

export function ReportsView() {
  const { occupancyReport, allocationReport, isLoading } = useHmsData();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <div className="h-20 rounded-2xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-28 rounded-2xl bg-muted" />
          <div className="h-28 rounded-2xl bg-muted" />
          <div className="h-28 rounded-2xl bg-muted" />
          <div className="h-28 rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  const programEntries = Object.entries(
    allocationReport.allocations_by_program
  ).sort((a, b) => b[1] - a[1]);

  const maxProgramCount = Math.max(
    1,
    ...programEntries.map(([, count]) => count)
  );

  const formattedGeneratedAt = new Date(
    occupancyReport.generated_at
  ).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-8">
      <PageHeader
        category="REPORTING & ANALYTICS"
        title="Hostel Occupancy & Allocation Reports"
        description="Real-time bed utilization, hostel-by-hostel capacity comparisons, and active allocation distribution by academic program."
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5 text-primary" />
            <span>Last generated: {formattedGeneratedAt}</span>
          </div>
        }
      />

      {/* Occupancy Report Top Summary */}
      <section
        aria-label="Occupancy report summary metrics"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          label="Overall Occupancy"
          value={`${occupancyReport.overall_occupancy_rate}%`}
          subtitle={`${occupancyReport.total_hostels} hostels · ${occupancyReport.total_rooms} rooms`}
          icon={Percent}
        />
        <StatCard
          label="Total Capacity (Beds)"
          value={occupancyReport.total_capacity}
          subtitle="Installed hostel beds"
          icon={DoorOpen}
        />
        <StatCard
          label="Occupied Beds"
          value={occupancyReport.total_occupied_beds}
          subtitle="Active student residents"
          icon={ClipboardList}
        />
        <StatCard
          label="Available Beds"
          value={occupancyReport.total_available_beds}
          subtitle="Ready for allocation"
          icon={BedDouble}
        />
      </section>

      {/* Hostel-by-Hostel Occupancy Chart & Table */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Hostel-by-Hostel Occupancy &amp; Capacity Comparison
              </h2>
              <p className="text-xs text-muted-foreground">
                Source: <code>GET /api/v1/reports/occupancy/</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary" />
              Occupied Beds
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-emerald-500/70" />
              Available Beds
            </span>
          </div>
        </div>

        {/* Visual Comparison Chart */}
        <div
          aria-label="Hostel capacity comparison chart"
          className="mt-5 grid gap-4 md:grid-cols-2"
        >
          {occupancyReport.hostels.map((h) => {
            const occupiedPct =
              h.total_capacity > 0
                ? Math.round((h.occupied_beds / h.total_capacity) * 100)
                : 0;
            const availablePct =
              h.total_capacity > 0 ? 100 - occupiedPct : 0;

            return (
              <div
                key={h.hostel_id}
                className="rounded-xl border border-border/70 bg-background/50 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {h.hostel_name}
                      </span>
                      <StatusBadge status={h.status} />
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {h.hostel_id} · {h.total_rooms} rooms
                    </p>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {h.occupancy_rate}%
                  </span>
                </div>

                {/* Stacked Bar */}
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    title={`Occupied: ${h.occupied_beds} beds`}
                    className="h-full bg-primary transition-all"
                    style={{ width: `${occupiedPct}%` }}
                  />
                  <div
                    title={`Available: ${h.available_beds} beds`}
                    className="h-full bg-emerald-500/60 transition-all"
                    style={{ width: `${availablePct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Occupied:{" "}
                    <strong className="text-foreground">
                      {h.occupied_beds}
                    </strong>{" "}
                    beds
                  </span>
                  <span>
                    Available:{" "}
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {h.available_beds}
                    </strong>{" "}
                    beds
                  </span>
                  <span>
                    Capacity:{" "}
                    <strong className="text-foreground">
                      {h.total_capacity}
                    </strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Hostel Occupancy Table */}
        <div className="mt-6 overflow-x-auto border-t border-border pt-5">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 pr-4">Hostel ID</th>
                <th className="pb-3 px-3">Hostel Name</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Total Rooms</th>
                <th className="pb-3 px-3">Total Capacity</th>
                <th className="pb-3 px-3">Occupied Beds</th>
                <th className="pb-3 px-3">Available Beds</th>
                <th className="pb-3 pl-3 text-right">Occupancy Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {occupancyReport.hostels.map((h) => (
                <tr key={h.hostel_id} className="hover:bg-muted/30">
                  <td className="py-3 pr-4 font-mono text-xs font-semibold text-primary">
                    {h.hostel_id}
                  </td>
                  <td className="py-3 px-3 font-medium text-foreground">
                    {h.hostel_name}
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={h.status} />
                  </td>
                  <td className="py-3 px-3">{h.total_rooms}</td>
                  <td className="py-3 px-3 font-semibold">
                    {h.total_capacity}
                  </td>
                  <td className="py-3 px-3 font-medium">{h.occupied_beds}</td>
                  <td className="py-3 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                    {h.available_beds}
                  </td>
                  <td className="py-3 pl-3 text-right font-bold">
                    {h.occupancy_rate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Allocation Report Section */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Allocation Summary Metrics */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-xs lg:col-span-5">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <ClipboardList className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Allocation Summary Report
              </h2>
              <p className="text-xs text-muted-foreground">
                Source: <code>GET /api/v1/reports/allocations/</code>
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-border/70 bg-background/50 p-4">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                Total
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {allocationReport.total_allocations}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                All-time
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/50 p-4">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                Active
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {allocationReport.active_allocations}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Current
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/50 p-4">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                Completed
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                {allocationReport.completed_allocations}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Checked out
              </p>
            </div>
          </div>

          {/* Active vs Completed Proportional Bar */}
          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Active vs. Completed Allocations</span>
              <span>
                {allocationReport.total_allocations > 0
                  ? Math.round(
                      (allocationReport.active_allocations /
                        allocationReport.total_allocations) *
                        100
                    )
                  : 0}
                % Active
              </span>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{
                  width: `${
                    allocationReport.total_allocations > 0
                      ? (allocationReport.active_allocations /
                          allocationReport.total_allocations) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </section>

        {/* Program-Wise Distribution Chart & Table */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-xs lg:col-span-7">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <ChartNoAxesCombined className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  Program-Wise Active Allocation Distribution
                </h2>
                <p className="text-xs text-muted-foreground">
                  Active resident count grouped by academic course/program
                </p>
              </div>
            </div>
            <Badge variant="default">
              {programEntries.length}{" "}
              {programEntries.length === 1 ? "Program" : "Programs"}
            </Badge>
          </div>

          {programEntries.length === 0 ? (
            <p className="py-10 text-center text-xs text-muted-foreground">
              No active program allocations available.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {programEntries.map(([program, count]) => {
                const widthPct = Math.round((count / maxProgramCount) * 100);
                const sharePct =
                  allocationReport.active_allocations > 0
                    ? Math.round(
                        (count / allocationReport.active_allocations) * 100
                      )
                    : 0;

                return (
                  <div key={program} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">
                        {program}
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        {count} {count === 1 ? "student" : "students"} (
                        {sharePct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
