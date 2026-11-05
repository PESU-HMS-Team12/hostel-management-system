"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeftRight,
  CheckCircle2,
  ClipboardList,
  Eye,
  LogOut,
  Plus,
  Search,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { HmsApiError } from "@/lib/api/errors";
import { useHmsData } from "@/lib/api/hms-provider";
import type {
  Allocation,
  AllocationCreateRequest,
  ValidationErrors,
} from "@/lib/types/hms";
import {
  getTodayIsoDate,
  validateAllocationCreate,
  validateAllocationTransfer,
  validateAllocationVacate,
} from "@/lib/validation/hms";

export function AllocationsView() {
  const {
    allocations,
    students,
    rooms,
    hostels,
    createAllocation,
    transferAllocation,
    vacateAllocation,
    isDemoMode,
    isLoading,
  } = useHmsData();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "completed"
  >("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [detailAllocation, setDetailAllocation] = useState<Allocation | null>(
    null
  );
  const [transferringAllocation, setTransferringAllocation] =
    useState<Allocation | null>(null);
  const [vacatingAllocation, setVacatingAllocation] =
    useState<Allocation | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Create Allocation Form State
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [allocationDate, setAllocationDate] = useState<string>("2026-11-04");
  const [checkInDate, setCheckInDate] = useState<string>("2026-11-04");
  const [createErrors, setCreateErrors] = useState<ValidationErrors>({});
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Transfer Form State
  const [destinationRoomId, setDestinationRoomId] = useState<string>("");
  const [transferDate, setTransferDate] = useState<string>("2026-11-04");
  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [transferErrors, setTransferErrors] = useState<ValidationErrors>({});
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  // Vacate Form State
  const [checkoutDate, setCheckoutDate] = useState<string>("2026-11-04");
  const [vacateErrors, setVacateErrors] = useState<ValidationErrors>({});
  const [submittingVacate, setSubmittingVacate] = useState(false);

  const filteredAllocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allocations.filter((alloc) => {
      if (statusFilter === "active" && !alloc.is_active) return false;
      if (statusFilter === "completed" && alloc.is_active) return false;
      if (!q) return true;
      return (
        alloc.student_id.toLowerCase().includes(q) ||
        alloc.student_name.toLowerCase().includes(q) ||
        alloc.room_no.toLowerCase().includes(q) ||
        alloc.hostel_name.toLowerCase().includes(q)
      );
    });
  }, [allocations, searchQuery, statusFilter]);

  const eligibleStudents = useMemo(() => {
    return students.filter((s) => {
      if (s.status !== "Active") return false;
      const hasActive = allocations.some(
        (a) => a.student === s.id && a.is_active
      );
      return !hasActive;
    });
  }, [students, allocations]);

  const availableRooms = useMemo(() => {
    return rooms.filter((r) => {
      const hostel = hostels.find((h) => h.id === r.hostel);
      return (
        hostel?.status === "Active" &&
        r.status === "Available" &&
        r.available_beds > 0
      );
    });
  }, [rooms, hostels]);

  function openCreateDialog() {
    const today = getTodayIsoDate();
    setSelectedStudentId(
      eligibleStudents[0] ? String(eligibleStudents[0].id) : ""
    );
    setSelectedRoomId(availableRooms[0] ? String(availableRooms[0].id) : "");
    setAllocationDate(today);
    setCheckInDate(today);
    setCreateErrors({});
    setCreateOpen(true);
  }

  function openTransferDialog(alloc: Allocation) {
    const candidateRooms = availableRooms.filter((r) => r.id !== alloc.room);
    setDestinationRoomId(candidateRooms[0] ? String(candidateRooms[0].id) : "");
    setTransferDate(getTodayIsoDate());
    setTransferConfirmed(false);
    setTransferErrors({});
    setTransferringAllocation(alloc);
  }

  function openVacateDialog(alloc: Allocation) {
    setCheckoutDate(getTodayIsoDate());
    setVacateErrors({});
    setVacatingAllocation(alloc);
  }

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: AllocationCreateRequest = {
      student: Number(selectedStudentId),
      room: Number(selectedRoomId),
      allocation_date: allocationDate,
      check_in_date: checkInDate || null,
    };

    const validationErrors = validateAllocationCreate(
      payload,
      students,
      rooms,
      allocations,
      hostels
    );
    if (Object.keys(validationErrors).length > 0) {
      setCreateErrors(validationErrors);
      return;
    }

    setCreateErrors({});
    setSubmittingCreate(true);
    try {
      const created = await createAllocation(payload);
      setCreateOpen(false);
      setFeedback(
        `Created room allocation for ${created.student_name} (${created.student_id}) in ${created.hostel_name} Room ${created.room_no}${
          isDemoMode ? " in demo fixtures." : "."
        }`
      );
    } catch (err) {
      if (err instanceof HmsApiError) {
        setCreateErrors(
          Object.keys(err.fieldErrors).length > 0
            ? err.fieldErrors
            : { non_field_errors: err.message }
        );
      }
    } finally {
      setSubmittingCreate(false);
    }
  }

  async function handleTransferSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!transferringAllocation) return;

    if (!transferConfirmed) {
      setTransferErrors({
        confirm:
          "Please confirm the room transfer details before submitting.",
      });
      return;
    }

    const payload = {
      new_room: Number(destinationRoomId),
      transfer_date: transferDate,
    };

    const validationErrors = validateAllocationTransfer(
      transferringAllocation,
      payload,
      rooms,
      allocations,
      hostels
    );
    if (Object.keys(validationErrors).length > 0) {
      setTransferErrors(validationErrors);
      return;
    }

    setTransferErrors({});
    setSubmittingTransfer(true);
    try {
      const transferred = await transferAllocation(
        transferringAllocation.id,
        payload
      );
      setTransferringAllocation(null);
      setFeedback(
        `Transferred ${transferred.student_name} (${transferred.student_id}) to ${transferred.hostel_name} Room ${transferred.room_no}${
          isDemoMode ? " in demo fixtures." : "."
        }`
      );
    } catch (err) {
      if (err instanceof HmsApiError) {
        setTransferErrors(
          Object.keys(err.fieldErrors).length > 0
            ? err.fieldErrors
            : { non_field_errors: err.message }
        );
      }
    } finally {
      setSubmittingTransfer(false);
    }
  }

  async function handleVacateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!vacatingAllocation) return;

    const payload = {
      checkout_date: checkoutDate,
    };

    const validationErrors = validateAllocationVacate(
      vacatingAllocation,
      payload
    );
    if (Object.keys(validationErrors).length > 0) {
      setVacateErrors(validationErrors);
      return;
    }

    setVacateErrors({});
    setSubmittingVacate(true);
    try {
      const vacated = await vacateAllocation(vacatingAllocation.id, payload);
      setVacatingAllocation(null);
      setFeedback(
        `Checked out ${vacated.student_name} (${vacated.student_id}) from ${vacated.hostel_name} Room ${vacated.room_no} on ${vacated.check_out_date}${
          isDemoMode ? " in demo fixtures." : "."
        }`
      );
    } catch (err) {
      if (err instanceof HmsApiError) {
        setVacateErrors(
          Object.keys(err.fieldErrors).length > 0
            ? err.fieldErrors
            : { non_field_errors: err.message }
        );
      }
    } finally {
      setSubmittingVacate(false);
    }
  }

  const selectedDestinationRoom = rooms.find(
    (r) => r.id === Number(destinationRoomId)
  );

  return (
    <div className="space-y-7">
      <PageHeader
        category="ALLOCATION MANAGEMENT"
        title="Room Allocations & History"
        description="Assign active students to available rooms, execute atomic inter-room transfers, and process student check-outs."
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="size-4" />
            New Room Allocation
          </Button>
        }
      />

      {feedback && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-600 dark:text-emerald-400"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Status Filters */}
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="search"
            aria-label="Search allocations by student, room or hostel"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student name, Student ID, room or hostel..."
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-ring"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: "all", label: "All Records" },
              { key: "active", label: "Active" },
              { key: "completed", label: "Completed History" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === item.key
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
          <Badge variant="neutral">
            {filteredAllocations.length} allocations
          </Badge>
        </div>
      </section>

      {/* Allocations Table */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        {isLoading ? (
          <div className="space-y-3 py-8 animate-pulse">
            <div className="h-10 rounded bg-muted" />
            <div className="h-10 rounded bg-muted" />
          </div>
        ) : filteredAllocations.length === 0 ? (
          <div className="py-12 text-center">
            <ClipboardList className="mx-auto size-9 text-muted-foreground" />
            <h2 className="mt-3 text-base font-semibold">
              No Matching Allocations
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Adjust your search or status filter, or create a new room
              allocation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pr-4">Student</th>
                  <th className="pb-3 px-3">Hostel Block</th>
                  <th className="pb-3 px-3">Room</th>
                  <th className="pb-3 px-3">Allocation Date</th>
                  <th className="pb-3 px-3">Check-In</th>
                  <th className="pb-3 px-3">Check-Out</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredAllocations.map((alloc) => (
                  <tr
                    key={alloc.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="py-3.5 pr-4">
                      <p className="font-semibold text-foreground">
                        {alloc.student_name}
                      </p>
                      <p className="font-mono text-xs text-primary">
                        {alloc.student_id}
                      </p>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-medium text-foreground">
                        {alloc.hostel_name}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {alloc.hostel_id}
                      </p>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-foreground">
                        Room {alloc.room_no}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {alloc.room_type}
                      </p>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-xs">
                      {alloc.allocation_date}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-xs text-muted-foreground">
                      {alloc.check_in_date ?? "—"}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-xs text-muted-foreground">
                      {alloc.check_out_date ?? "Active"}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge
                        status={alloc.is_active ? "Active" : "Completed"}
                      />
                    </td>
                    <td className="py-3.5 pl-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setDetailAllocation(alloc)}
                        >
                          <Eye className="size-3.5" />
                          <span>Details</span>
                        </Button>

                        {alloc.is_active && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openTransferDialog(alloc)}
                            >
                              <ArrowLeftRight className="size-3.5" />
                              <span>Transfer</span>
                            </Button>

                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => openVacateDialog(alloc)}
                            >
                              <LogOut className="size-3.5" />
                              <span>Vacate</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create Allocation Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Room Allocation"
        description="Assign an active, unallocated student to an available hostel room with free capacity."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4" noValidate>
          {createErrors.non_field_errors && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-500"
            >
              {createErrors.non_field_errors}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="alloc-student-select"
              className="block text-xs font-semibold uppercase text-muted-foreground"
            >
              Student (Active &amp; Unallocated) *
            </label>
            <select
              id="alloc-student-select"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
            >
              <option value="">Select eligible student...</option>
              {students.map((s) => {
                const hasActive = allocations.some(
                  (a) => a.student === s.id && a.is_active
                );
                const disabledReason =
                  s.status !== "Active"
                    ? " (Inactive)"
                    : hasActive
                      ? " (Already Allocated)"
                      : "";
                return (
                  <option
                    key={s.id}
                    value={String(s.id)}
                    disabled={Boolean(disabledReason)}
                  >
                    {s.student_id} — {s.name} ({s.course_program})
                    {disabledReason}
                  </option>
                );
              })}
            </select>
            {createErrors.student && (
              <p role="alert" className="text-xs text-rose-500">
                {createErrors.student}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="alloc-room-select"
              className="block text-xs font-semibold uppercase text-muted-foreground"
            >
              Room (Available Capacity) *
            </label>
            <select
              id="alloc-room-select"
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
            >
              <option value="">Select room...</option>
              {rooms.map((r) => {
                const hostel = hostels.find((h) => h.id === r.hostel);
                const isInactiveHostel = hostel?.status !== "Active";
                const isUnavailable = r.status !== "Available";
                const isFull = r.available_beds <= 0;
                const disabled = isInactiveHostel || isUnavailable || isFull;
                return (
                  <option
                    key={r.id}
                    value={String(r.id)}
                    disabled={disabled}
                  >
                    {r.hostel_name} · Room {r.room_no} ({r.room_type}) —{" "}
                    {r.available_beds}/{r.capacity} beds free
                    {isFull ? " [FULL]" : isUnavailable ? ` [${r.status}]` : ""}
                  </option>
                );
              })}
            </select>
            {createErrors.room && (
              <p role="alert" className="text-xs text-rose-500">
                {createErrors.room}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="alloc-date-input"
                className="block text-xs font-semibold uppercase text-muted-foreground"
              >
                Allocation Date *
              </label>
              <input
                id="alloc-date-input"
                type="date"
                value={allocationDate}
                onChange={(e) => setAllocationDate(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm outline-none focus-visible:border-ring"
              />
              {createErrors.allocation_date && (
                <p role="alert" className="text-xs text-rose-500">
                  {createErrors.allocation_date}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="alloc-checkin-input"
                className="block text-xs font-semibold uppercase text-muted-foreground"
              >
                Check-In Date
              </label>
              <input
                id="alloc-checkin-input"
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm outline-none focus-visible:border-ring"
              />
              {createErrors.check_in_date && (
                <p role="alert" className="text-xs text-rose-500">
                  {createErrors.check_in_date}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submittingCreate}>
              {submittingCreate ? "Creating..." : "Create Allocation"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Workflow Dialog */}
      <Modal
        open={Boolean(transferringAllocation)}
        onClose={() => setTransferringAllocation(null)}
        title="Transfer Room Allocation"
        description="Atomically close the current room assignment and create a replacement active allocation."
      >
        {transferringAllocation && (
          <form
            onSubmit={handleTransferSubmit}
            className="space-y-4"
            noValidate
          >
            <div className="rounded-xl border border-border bg-background/60 p-3.5 text-xs space-y-1">
              <p className="font-semibold text-foreground">
                Student: {transferringAllocation.student_name} (
                {transferringAllocation.student_id})
              </p>
              <p className="text-muted-foreground">
                Current Room: {transferringAllocation.hostel_name} · Room{" "}
                {transferringAllocation.room_no} (
                {transferringAllocation.room_type})
              </p>
              <p className="font-mono text-muted-foreground">
                Current Start Date:{" "}
                {transferringAllocation.check_in_date ??
                  transferringAllocation.allocation_date}
              </p>
            </div>

            {transferErrors.non_field_errors && (
              <p role="alert" className="text-xs text-rose-500">
                {transferErrors.non_field_errors}
              </p>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="transfer-room-select"
                className="block text-xs font-semibold uppercase text-muted-foreground"
              >
                Destination Room *
              </label>
              <select
                id="transfer-room-select"
                value={destinationRoomId}
                onChange={(e) => setDestinationRoomId(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
              >
                <option value="">Select destination room...</option>
                {rooms
                  .filter((r) => r.id !== transferringAllocation.room)
                  .map((r) => {
                    const isAvail =
                      r.status === "Available" && r.available_beds > 0;
                    return (
                      <option
                        key={r.id}
                        value={String(r.id)}
                        disabled={!isAvail}
                      >
                        {r.hostel_name} · Room {r.room_no} ({r.room_type}) —{" "}
                        {r.available_beds} of {r.capacity} beds available
                      </option>
                    );
                  })}
              </select>
              {selectedDestinationRoom && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Destination availability:{" "}
                  {selectedDestinationRoom.available_beds} free of{" "}
                  {selectedDestinationRoom.capacity} beds (
                  {selectedDestinationRoom.room_type}).
                </p>
              )}
              {transferErrors.new_room && (
                <p role="alert" className="text-xs text-rose-500">
                  {transferErrors.new_room}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="transfer-date-input"
                className="block text-xs font-semibold uppercase text-muted-foreground"
              >
                Transfer Date *
              </label>
              <input
                id="transfer-date-input"
                type="date"
                min={
                  transferringAllocation.check_in_date ??
                  transferringAllocation.allocation_date
                }
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm outline-none focus-visible:border-ring"
              />
              {transferErrors.transfer_date && (
                <p role="alert" className="text-xs text-rose-500">
                  {transferErrors.transfer_date}
                </p>
              )}
            </div>

            <label className="flex items-start gap-2.5 rounded-xl border border-border bg-background/40 p-3 text-xs">
              <input
                type="checkbox"
                checked={transferConfirmed}
                onChange={(e) => setTransferConfirmed(e.target.checked)}
                className="mt-0.5 size-4 rounded border-input"
              />
              <span>
                I confirm closing the current allocation in Room{" "}
                <strong>{transferringAllocation.room_no}</strong> and
                transferring{" "}
                <strong>{transferringAllocation.student_name}</strong> on{" "}
                <strong className="font-mono">{transferDate}</strong>.
              </span>
            </label>
            {transferErrors.confirm && (
              <p role="alert" className="text-xs text-rose-500">
                {transferErrors.confirm}
              </p>
            )}

            <div className="flex justify-end gap-2.5 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTransferringAllocation(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submittingTransfer}>
                {submittingTransfer ? "Transferring..." : "Confirm Transfer"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Vacation / Checkout Workflow Dialog */}
      <Modal
        open={Boolean(vacatingAllocation)}
        onClose={() => setVacatingAllocation(null)}
        title="Vacate Room / Student Check-Out"
        description="Record student check-out date and mark this room allocation as completed."
      >
        {vacatingAllocation && (
          <form onSubmit={handleVacateSubmit} className="space-y-4" noValidate>
            <div className="rounded-xl border border-border bg-background/60 p-4 text-xs space-y-1.5">
              <p className="text-sm font-semibold text-foreground">
                {vacatingAllocation.student_name} (
                {vacatingAllocation.student_id})
              </p>
              <p className="text-muted-foreground">
                Hostel &amp; Room: {vacatingAllocation.hostel_name} · Room{" "}
                {vacatingAllocation.room_no} ({vacatingAllocation.room_type})
              </p>
              <p className="font-mono text-muted-foreground">
                Check-In / Start Date:{" "}
                {vacatingAllocation.check_in_date ??
                  vacatingAllocation.allocation_date}
              </p>
            </div>

            {vacateErrors.non_field_errors && (
              <p role="alert" className="text-xs text-rose-500">
                {vacateErrors.non_field_errors}
              </p>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="vacate-checkout-input"
                className="block text-xs font-semibold uppercase text-muted-foreground"
              >
                Check-Out Date *
              </label>
              <input
                id="vacate-checkout-input"
                type="date"
                min={
                  vacatingAllocation.check_in_date ??
                  vacatingAllocation.allocation_date
                }
                value={checkoutDate}
                onChange={(e) => setCheckoutDate(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm outline-none focus-visible:border-ring"
              />
              {vacateErrors.checkout_date && (
                <p role="alert" className="text-xs text-rose-500">
                  {vacateErrors.checkout_date}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2.5 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setVacatingAllocation(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={submittingVacate}
              >
                {submittingVacate
                  ? "Recording check-out..."
                  : "Confirm Check-Out"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Allocation Detail Modal */}
      <Modal
        open={Boolean(detailAllocation)}
        onClose={() => setDetailAllocation(null)}
        title={`Allocation Record #${detailAllocation?.id ?? ""}`}
        description="Complete room assignment metadata"
      >
        {detailAllocation && (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border/50 pb-2">
              <dt className="text-muted-foreground">Student</dt>
              <dd className="font-semibold">
                {detailAllocation.student_name} ({detailAllocation.student_id})
              </dd>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <dt className="text-muted-foreground">Hostel</dt>
              <dd className="font-medium">
                {detailAllocation.hostel_name} ({detailAllocation.hostel_id})
              </dd>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <dt className="text-muted-foreground">Room</dt>
              <dd className="font-semibold text-primary">
                Room {detailAllocation.room_no} ({detailAllocation.room_type})
              </dd>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <dt className="text-muted-foreground">Allocation Date</dt>
              <dd className="font-mono">{detailAllocation.allocation_date}</dd>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <dt className="text-muted-foreground">Check-In Date</dt>
              <dd className="font-mono">
                {detailAllocation.check_in_date ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-2">
              <dt className="text-muted-foreground">Check-Out Date</dt>
              <dd className="font-mono">
                {detailAllocation.check_out_date ?? "Active Resident"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <StatusBadge
                  status={detailAllocation.is_active ? "Active" : "Completed"}
                />
              </dd>
            </div>
          </dl>
        )}
      </Modal>
    </div>
  );
}
