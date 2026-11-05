"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  DoorOpen,
  MapPin,
  Pencil,
  Plus,
  Power,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { HmsApiError } from "@/lib/api/errors";
import { useHmsData } from "@/lib/api/hms-provider";
import type {
  Hostel,
  HostelRequest,
  RecordStatus,
  ValidationErrors,
} from "@/lib/types/hms";
import { validateHostel } from "@/lib/validation/hms";

export function HostelsView() {
  const {
    hostels,
    rooms,
    createHostel,
    updateHostel,
    isDemoMode,
    isLoading,
  } = useHmsData();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState<Hostel | null>(null);
  const [inspectingHostel, setInspectingHostel] = useState<Hostel | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form state
  const [hostelId, setHostelId] = useState("");
  const [name, setName] = useState("");
  const [blockLocation, setBlockLocation] = useState("");
  const [status, setStatus] = useState<RecordStatus>("Active");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function openCreateDialog() {
    setHostelId("");
    setName("");
    setBlockLocation("");
    setStatus("Active");
    setErrors({});
    setCreateOpen(true);
  }

  function openEditDialog(hostel: Hostel) {
    setHostelId(hostel.hostel_id);
    setName(hostel.name);
    setBlockLocation(hostel.block_location);
    setStatus(hostel.status);
    setErrors({});
    setEditingHostel(hostel);
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: HostelRequest = {
      hostel_id: hostelId.trim(),
      name: name.trim(),
      block_location: blockLocation.trim(),
      status,
    };

    const validationErrors = validateHostel(
      payload,
      hostels,
      editingHostel?.id
    );
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      if (editingHostel) {
        const updated = await updateHostel(editingHostel.id, payload);
        setEditingHostel(null);
        setFeedback(
          `Updated hostel ${updated.name} (${updated.hostel_id})${
            isDemoMode ? " in demo fixtures." : "."
          }`
        );
      } else {
        const created = await createHostel(payload);
        setCreateOpen(false);
        setFeedback(
          `Created hostel ${created.name} (${created.hostel_id})${
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

  async function handleToggleHostelStatus(hostel: Hostel) {
    const nextStatus: RecordStatus =
      hostel.status === "Active" ? "Inactive" : "Active";
    const updated = await updateHostel(hostel.id, { status: nextStatus });
    setFeedback(
      `Hostel ${updated.name} status changed to ${updated.status}${
        isDemoMode ? " in demo fixtures." : "."
      }`
    );
  }

  const associatedRooms = inspectingHostel
    ? rooms.filter((r) => r.hostel === inspectingHostel.id)
    : [];

  return (
    <div className="space-y-7">
      <PageHeader
        category="ACCOMMODATION INFRASTRUCTURE"
        title="Hostel Management"
        description="Manage campus hostel blocks, locations, associated room counts, and operational status."
        actions={
          <>
            <Link
              href="/rooms"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-accent"
            >
              <DoorOpen className="size-3.5" />
              Room Inventory
            </Link>
            <Button onClick={openCreateDialog}>
              <Plus className="size-4" />
              Create Hostel
            </Button>
          </>
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

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="h-48 animate-pulse rounded-2xl bg-card" />
          <div className="h-48 animate-pulse rounded-2xl bg-card" />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {hostels.map((hostel) => {
            const hostelRooms = rooms.filter((r) => r.hostel === hostel.id);
            const totalBeds = hostelRooms.reduce(
              (sum, r) => sum + r.capacity,
              0
            );
            const occupiedBeds = hostelRooms.reduce(
              (sum, r) => sum + r.active_occupancy,
              0
            );

            return (
              <article
                key={hostel.id}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs transition-colors hover:border-primary/30"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                        <Building2 className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-semibold tracking-tight text-foreground">
                            {hostel.name}
                          </h2>
                          <span className="font-mono text-xs text-muted-foreground">
                            {hostel.hostel_id}
                          </span>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3.5" />
                          {hostel.block_location}
                        </p>
                      </div>
                    </div>

                    <StatusBadge status={hostel.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-3 rounded-xl border border-border/60 bg-background/50 p-3.5 text-center">
                    <div>
                      <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                        Rooms
                      </p>
                      <p className="mt-0.5 text-lg font-bold text-foreground">
                        {hostel.rooms_count}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                        Occupied Beds
                      </p>
                      <p className="mt-0.5 text-lg font-bold text-foreground">
                        {occupiedBeds}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                        Total Capacity
                      </p>
                      <p className="mt-0.5 text-lg font-bold text-foreground">
                        {totalBeds}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setInspectingHostel(hostel)}
                  >
                    <DoorOpen className="size-3.5" />
                    View Associated Rooms ({hostel.rooms_count})
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(hostel)}
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant={
                        hostel.status === "Active" ? "destructive" : "secondary"
                      }
                      size="sm"
                      onClick={() => void handleToggleHostelStatus(hostel)}
                    >
                      <Power className="size-3.5" />
                      {hostel.status === "Active" ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create / Edit Hostel Modal */}
      <Modal
        open={createOpen || Boolean(editingHostel)}
        onClose={() => {
          setCreateOpen(false);
          setEditingHostel(null);
        }}
        title={
          editingHostel
            ? `Edit Hostel · ${editingHostel.hostel_id}`
            : "Create New Hostel"
        }
        description="Configure hostel identifier, block name, campus location, and operational status."
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
                htmlFor="hostel-id-input"
                className="block text-xs font-semibold uppercase text-muted-foreground"
              >
                Hostel ID *
              </label>
              <input
                id="hostel-id-input"
                type="text"
                maxLength={20}
                value={hostelId}
                onChange={(e) => setHostelId(e.target.value)}
                placeholder="e.g. HSL-NB-05"
                className="h-9 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm outline-none focus-visible:border-ring"
              />
              {errors.hostel_id && (
                <p role="alert" className="text-xs text-rose-500">
                  {errors.hostel_id}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="hostel-status-select"
                className="block text-xs font-semibold uppercase text-muted-foreground"
              >
                Status *
              </label>
              <select
                id="hostel-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as RecordStatus)}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="hostel-name-input"
              className="block text-xs font-semibold uppercase text-muted-foreground"
            >
              Hostel Name *
            </label>
            <input
              id="hostel-name-input"
              type="text"
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CV Raman Boys Hostel"
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
            />
            {errors.name && (
              <p role="alert" className="text-xs text-rose-500">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="hostel-location-input"
              className="block text-xs font-semibold uppercase text-muted-foreground"
            >
              Block / Location *
            </label>
            <input
              id="hostel-location-input"
              type="text"
              maxLength={100}
              value={blockLocation}
              onChange={(e) => setBlockLocation(e.target.value)}
              placeholder="e.g. North Campus · Block B"
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
            />
            {errors.block_location && (
              <p role="alert" className="text-xs text-rose-500">
                {errors.block_location}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2.5 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                setEditingHostel(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : editingHostel
                  ? "Save Hostel"
                  : "Create Hostel"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Associated Rooms Modal */}
      <Modal
        open={Boolean(inspectingHostel)}
        onClose={() => setInspectingHostel(null)}
        title={`Rooms in ${inspectingHostel?.name ?? ""}`}
        description={`${inspectingHostel?.hostel_id ?? ""} · ${inspectingHostel?.block_location ?? ""}`}
        maxWidthClass="max-w-2xl"
      >
        {associatedRooms.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No rooms have been created for this hostel block yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold uppercase text-muted-foreground">
                  <th className="pb-2.5 pr-3">Room ID</th>
                  <th className="pb-2.5 px-3">Room No</th>
                  <th className="pb-2.5 px-3">Type</th>
                  <th className="pb-2.5 px-3">Occupancy</th>
                  <th className="pb-2.5 pl-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {associatedRooms.map((room) => (
                  <tr key={room.id}>
                    <td className="py-2.5 pr-3 font-mono text-xs font-semibold">
                      {room.room_id}
                    </td>
                    <td className="py-2.5 px-3 font-medium">
                      Room {room.room_no}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">
                      {room.room_type}
                    </td>
                    <td className="py-2.5 px-3 text-xs">
                      <Badge variant="neutral">
                        {room.active_occupancy} / {room.capacity} beds
                      </Badge>
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      <StatusBadge status={room.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
