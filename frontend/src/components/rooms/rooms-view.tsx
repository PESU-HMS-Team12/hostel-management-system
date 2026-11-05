"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  DoorOpen,
  Pencil,
  Plus,
  Search,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { HmsApiError } from "@/lib/api/errors";
import { useHmsData } from "@/lib/api/hms-provider";
import type {
  AvailabilityLabel,
  Room,
  RoomOccupancyDetail,
  RoomRequest,
  ValidationErrors,
} from "@/lib/types/hms";
import {
  computeAvailabilityLabel,
  validateRoom,
} from "@/lib/validation/hms";

const AVAILABILITY_FILTERS: Array<"all" | AvailabilityLabel> = [
  "all",
  "Vacant",
  "Partially occupied",
  "Full",
  "Unavailable",
];

export function RoomsView() {
  const {
    rooms,
    hostels,
    createRoom,
    updateRoom,
    getRoomOccupancyDetail,
    isDemoMode,
    isLoading,
  } = useHmsData();

  const [searchQuery, setSearchQuery] = useState("");
  const [hostelFilter, setHostelFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] =
    useState<string>("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [occupancyModalData, setOccupancyModalData] =
    useState<RoomOccupancyDetail | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Room form state
  const [roomId, setRoomId] = useState("");
  const [hostelId, setHostelId] = useState<string>("");
  const [roomNo, setRoomNo] = useState("");
  const [roomType, setRoomType] = useState("Double Sharing");
  const [capacity, setCapacity] = useState<string>("2");
  const [status, setStatus] = useState<string>("Available");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const enrichedRooms = useMemo(() => {
    return rooms.map((room) => ({
      ...room,
      availability_label: computeAvailabilityLabel(
        room.status,
        room.capacity,
        room.active_occupancy
      ),
    }));
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedRooms.filter((r) => {
      if (hostelFilter !== "all" && String(r.hostel) !== hostelFilter) {
        return false;
      }
      if (
        availabilityFilter !== "all" &&
        r.availability_label !== availabilityFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        r.room_id.toLowerCase().includes(q) ||
        r.room_no.toLowerCase().includes(q) ||
        r.room_type.toLowerCase().includes(q) ||
        r.hostel_name.toLowerCase().includes(q)
      );
    });
  }, [enrichedRooms, searchQuery, hostelFilter, availabilityFilter]);

  function openCreateDialog() {
    setRoomId("");
    setHostelId(hostels[0] ? String(hostels[0].id) : "");
    setRoomNo("");
    setRoomType("Double Sharing");
    setCapacity("2");
    setStatus("Available");
    setErrors({});
    setCreateOpen(true);
  }

  function openEditDialog(room: Room) {
    setRoomId(room.room_id);
    setHostelId(String(room.hostel));
    setRoomNo(room.room_no);
    setRoomType(room.room_type);
    setCapacity(String(room.capacity));
    setStatus(room.status);
    setErrors({});
    setEditingRoom(room);
  }

  async function handleInspectOccupancy(roomIdToInspect: number) {
    const detail = await getRoomOccupancyDetail(roomIdToInspect);
    setOccupancyModalData(detail);
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: RoomRequest = {
      room_id: roomId.trim(),
      hostel: Number(hostelId),
      room_no: roomNo.trim(),
      room_type: roomType.trim(),
      capacity: Number(capacity),
      status,
    };

    const validationErrors = validateRoom(
      payload,
      rooms,
      editingRoom ?? undefined
    );
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      if (editingRoom) {
        const updated = await updateRoom(editingRoom.id, payload);
        setEditingRoom(null);
        setFeedback(
          `Updated room ${updated.room_id} (Room ${updated.room_no})${
            isDemoMode ? " in demo fixtures." : "."
          }`
        );
      } else {
        const created = await createRoom(payload);
        setCreateOpen(false);
        setFeedback(
          `Created room ${created.room_id} (Room ${created.room_no})${
            isDemoMode ? " in demo fixtures." : "."
          }`
        );
      }
    } catch (err) {
      if (err instanceof HmsApiError) {
        setErrors(
          Object.keys(err.fieldErrors).length > 0
            ? err.fieldErrors
            : { non_field_errors: err.message }
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        category="ROOM INVENTORY"
        title="Room Management"
        description="Manage room inventory, bed capacity, real-time occupancy, and availability across all hostel blocks."
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="size-4" />
            Create Room
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

      {/* Filters */}
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              type="search"
              aria-label="Search rooms"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search room ID, number or type..."
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-ring"
            />
          </div>

          <select
            aria-label="Filter by hostel"
            value={hostelFilter}
            onChange={(e) => setHostelFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium outline-none focus-visible:border-ring"
          >
            <option value="all">All Hostels</option>
            {hostels.map((h) => (
              <option key={h.id} value={String(h.id)}>
                {h.name} ({h.hostel_id})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {AVAILABILITY_FILTERS.map((avail) => (
            <button
              key={avail}
              type="button"
              onClick={() => setAvailabilityFilter(avail)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                availabilityFilter === avail
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {avail === "all" ? "All Availability" : avail}
            </button>
          ))}
        </div>
      </section>

      {/* Rooms Table */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        {isLoading ? (
          <div className="space-y-3 py-8 animate-pulse">
            <div className="h-10 rounded bg-muted" />
            <div className="h-10 rounded bg-muted" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="py-12 text-center">
            <DoorOpen className="mx-auto size-9 text-muted-foreground" />
            <h2 className="mt-3 text-base font-semibold">No Matching Rooms</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Adjust your hostel or availability filter, or create a new room.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pr-4">Room ID</th>
                  <th className="pb-3 px-3">Hostel</th>
                  <th className="pb-3 px-3">Room No &amp; Type</th>
                  <th className="pb-3 px-3">Capacity</th>
                  <th className="pb-3 px-3">Occupied</th>
                  <th className="pb-3 px-3">Available</th>
                  <th className="pb-3 px-3">Availability State</th>
                  <th className="pb-3 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredRooms.map((room) => (
                  <tr
                    key={room.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="py-3.5 pr-4 font-mono text-xs font-semibold text-primary">
                      {room.room_id}
                    </td>
                    <td className="py-3.5 px-3 text-xs font-medium text-foreground">
                      {room.hostel_name}
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-foreground">
                        Room {room.room_no}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {room.room_type}
                      </p>
                    </td>
                    <td className="py-3.5 px-3 font-semibold">
                      {room.capacity}
                    </td>
                    <td className="py-3.5 px-3 font-medium">
                      {room.active_occupancy}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      {room.available_beds}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={room.availability_label} />
                    </td>
                    <td className="py-3.5 pl-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void handleInspectOccupancy(room.id)}
                        >
                          <Users className="size-3.5" />
                          <span>Occupants</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(room)}
                        >
                          <Pencil className="size-3.5" />
                          <span>Edit</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create / Edit Room Dialog */}
      <Modal
        open={createOpen || Boolean(editingRoom)}
        onClose={() => {
          setCreateOpen(false);
          setEditingRoom(null);
        }}
        title={
          editingRoom
            ? `Edit Room · ${editingRoom.room_id}`
            : "Create New Room"
        }
        description="Configure room identifier, hostel assignment, room number, capacity, and operational status."
      >
        <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
          {errors.non_field_errors && (
            <div
              role="alert"
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-500"
            >
              {errors.non_field_errors}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="room-id-input"
                className="block text-xs font-semibold uppercase text-muted-foreground"
              >
                Room ID *
              </label>
              <input
                id="room-id-input"
                type="text"
                maxLength={20}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="e.g. RM-NB-103"
                className="h-9 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm outline-none focus-visible:border-ring"
              />
              {errors.room_id && (
                <p role="alert" className="text-xs text-rose-500">
                  {errors.room_id}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="room-hostel-select"
                className="block text-xs font-semibold uppercase text-muted-foreground"
              >
                Hostel *
              </label>
              <select
                id="room-hostel-select"
                value={hostelId}
                onChange={(e) => setHostelId(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
              >
                <option value="">Select hostel...</option>
                {hostels.map((h) => (
                  <option key={h.id} value={String(h.id)}>
                    {h.name} ({h.hostel_id})
                  </option>
                ))}
              </select>
              {errors.hostel && (
                <p role="alert" className="text-xs text-rose-500">
                  {errors.hostel}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="room-no-input"
                className="block text-xs font-semibold uppercase text-muted-foreground"
              >
                Room Number *
              </label>
              <input
                id="room-no-input"
                type="text"
                maxLength={20}
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                placeholder="e.g. 103"
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
              />
              {errors.room_no && (
                <p role="alert" className="text-xs text-rose-500">
                  {errors.room_no}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="room-type-input"
                className="block text-xs font-semibold uppercase text-muted-foreground"
              >
                Room Type *
              </label>
              <input
                id="room-type-input"
                type="text"
                maxLength={50}
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                placeholder="e.g. Double Sharing"
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
              />
              {errors.room_type && (
                <p role="alert" className="text-xs text-rose-500">
                  {errors.room_type}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="room-capacity-input"
                className="block text-xs font-semibold uppercase text-muted-foreground"
              >
                Bed Capacity *
              </label>
              <input
                id="room-capacity-input"
                type="number"
                min={
                  editingRoom
                    ? Math.max(1, editingRoom.active_occupancy)
                    : 1
                }
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
              />
              {editingRoom && editingRoom.active_occupancy > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  Minimum allowed capacity: {editingRoom.active_occupancy}{" "}
                  (current active occupancy).
                </p>
              )}
              {errors.capacity && (
                <p role="alert" className="text-xs text-rose-500">
                  {errors.capacity}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="room-status-select"
                className="block text-xs font-semibold uppercase text-muted-foreground"
              >
                Room Status *
              </label>
              <select
                id="room-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
              >
                <option value="Available">Available</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Unavailable">Unavailable</option>
              </select>
              {errors.status && (
                <p role="alert" className="text-xs text-rose-500">
                  {errors.status}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                setEditingRoom(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : editingRoom
                  ? "Save Room Changes"
                  : "Create Room"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Room Occupancy Detail Modal */}
      <Modal
        open={Boolean(occupancyModalData)}
        onClose={() => setOccupancyModalData(null)}
        title={`Room Occupancy · ${occupancyModalData?.room.room_id ?? ""}`}
        description={`${occupancyModalData?.room.hostel_name ?? ""} · Room ${occupancyModalData?.room.room_no ?? ""} (${occupancyModalData?.room.room_type ?? ""})`}
      >
        {occupancyModalData && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-background/50 p-3.5 text-center">
              <div>
                <p className="text-[11px] uppercase text-muted-foreground">
                  Capacity
                </p>
                <p className="text-lg font-bold">
                  {occupancyModalData.room.capacity}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-muted-foreground">
                  Occupied
                </p>
                <p className="text-lg font-bold">
                  {occupancyModalData.room.active_occupancy}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-muted-foreground">
                  Available
                </p>
                <p className="text-lg font-bold text-emerald-500">
                  {occupancyModalData.room.available_beds}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Residents ({occupancyModalData.active_residents.length})
              </h3>
              {occupancyModalData.active_residents.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  This room currently has no active resident allocations.
                </p>
              ) : (
                <ul className="space-y-2">
                  {occupancyModalData.active_residents.map((resident) => (
                    <li
                      key={resident.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-3 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {resident.student_name}
                        </p>
                        <p className="font-mono text-muted-foreground">
                          {resident.student_id}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="success">Checked In</Badge>
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                          Since {resident.check_in_date ?? resident.allocation_date}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
