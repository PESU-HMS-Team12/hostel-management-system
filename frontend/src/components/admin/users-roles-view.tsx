"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Info,
  KeyRound,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { HmsApiError } from "@/lib/api/errors";
import { useHmsData } from "@/lib/api/hms-provider";
import type {
  AdminUser,
  RoleAssignmentRequest,
  RoleEnum,
  ValidationErrors,
} from "@/lib/types/hms";
import { validateRoleAssignment } from "@/lib/validation/hms";

export function UsersRolesView() {
  const { users, students, assignRole, isDemoMode, isLoading } = useHmsData();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const [assignModalUser, setAssignModalUser] = useState<AdminUser | null>(
    null
  );
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<RoleEnum>("STUDENT");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter === "UNASSIGNED" && u.role !== null) return false;
      if (
        roleFilter !== "all" &&
        roleFilter !== "UNASSIGNED" &&
        u.role !== roleFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
        (u.student_id ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery, roleFilter]);

  function openAssignDialog(user?: AdminUser) {
    const target = user ?? users[0] ?? null;
    setAssignModalUser(target);
    setSelectedUserId(target ? String(target.id) : "");
    const initialRole = target?.role ?? "STUDENT";
    setSelectedRole(initialRole);
    setSelectedStudentId(
      initialRole === "STUDENT" ? (target?.student_id ?? "") : ""
    );
    setErrors({});
  }

  function handleRoleChange(nextRole: RoleEnum) {
    setSelectedRole(nextRole);
    if (nextRole !== "STUDENT") {
      setSelectedStudentId("");
    }
  }

  async function handleAssignSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: RoleAssignmentRequest = {
      user_id: Number(selectedUserId),
      role: selectedRole,
      student_id:
        selectedRole === "STUDENT" ? selectedStudentId.trim() || null : null,
    };

    const validationErrors = validateRoleAssignment(payload, users, students);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const updated = await assignRole(payload);
      setAssignModalUser(null);
      setFeedback(
        `Assigned role ${updated.role} to account '${updated.username}'${
          updated.student_id ? ` (linked to ${updated.student_id})` : ""
        }${isDemoMode ? " in demo fixtures." : "."}`
      );
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
    <div className="space-y-8">
      <PageHeader
        category="SYSTEM ADMINISTRATION"
        title="User & Role Management"
        description="View registered Django user accounts and assign HMS role profiles (STUDENT, WARDEN, ADMINISTRATOR)."
        actions={
          <Button onClick={() => openAssignDialog()}>
            <KeyRound className="size-4" />
            Assign / Update Role
          </Button>
        }
      />

      {/* API Scope Note */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card/70 p-4 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          <strong className="text-foreground">Backend Contract Note:</strong>{" "}
          The HMS REST API provides account listing (
          <code>GET /api/v1/admin/users/</code>) and role assignment (
          <code>POST /api/v1/admin/roles/</code>). User account creation is
          managed via Django authentication provisioning. Student roles require
          a unique linked student record; Warden and Administrator roles cannot
          be linked to student records.
        </p>
      </div>

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

      {/* Search & Role Filters */}
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="search"
            aria-label="Search user accounts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search username, email, name or linked Student ID..."
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-ring"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { key: "all", label: "All Accounts" },
              { key: "ADMINISTRATOR", label: "Administrators" },
              { key: "WARDEN", label: "Wardens" },
              { key: "STUDENT", label: "Students" },
              { key: "UNASSIGNED", label: "Unassigned" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setRoleFilter(f.key)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                roleFilter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* Users Table */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        {isLoading ? (
          <div className="space-y-3 py-8 animate-pulse">
            <div className="h-10 rounded bg-muted" />
            <div className="h-10 rounded bg-muted" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center">
            <UserCheck className="mx-auto size-9 text-muted-foreground" />
            <h2 className="mt-3 text-base font-semibold">
              No Matching User Accounts
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Adjust your search query or role filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pr-4">Username</th>
                  <th className="pb-3 px-3">Email</th>
                  <th className="pb-3 px-3">First &amp; Last Name</th>
                  <th className="pb-3 px-3">Account State</th>
                  <th className="pb-3 px-3">Assigned HMS Role</th>
                  <th className="pb-3 px-3">Linked Student ID</th>
                  <th className="pb-3 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="py-3.5 pr-4 font-mono text-xs font-semibold text-foreground">
                      {user.username}
                    </td>
                    <td className="py-3.5 px-3 text-xs text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-foreground">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge
                        status={user.is_active ? "Active" : "Inactive"}
                      />
                    </td>
                    <td className="py-3.5 px-3">
                      {user.role ? (
                        <Badge
                          variant={
                            user.role === "ADMINISTRATOR"
                              ? "default"
                              : user.role === "WARDEN"
                                ? "info"
                                : "success"
                          }
                        >
                          {user.role_label ?? user.role} ({user.role})
                        </Badge>
                      ) : (
                        <Badge variant="warning">No Role Assigned</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-xs text-primary">
                      {user.student_id ?? "—"}
                    </td>
                    <td className="py-3.5 pl-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openAssignDialog(user)}
                      >
                        <KeyRound className="size-3.5" />
                        <span>Assign Role</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Role Management Section Anchor */}
      <section
        id="role-management"
        className="rounded-2xl border border-border bg-card p-6 shadow-xs"
      >
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              HMS Role Assignment Rules (RBAC)
            </h2>
            <p className="text-xs text-muted-foreground">
              Enforced identically by frontend validation and{" "}
              <code>RoleAssignmentSerializer</code>
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-background/50 p-4 space-y-1.5">
            <Badge variant="success">STUDENT</Badge>
            <p className="text-xs leading-5 text-muted-foreground">
              Requires a valid, existing <code>student_id</code> that is not
              already linked to another user account. Grants read-only access to
              the student&apos;s own profile and allocation records.
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-background/50 p-4 space-y-1.5">
            <Badge variant="info">WARDEN</Badge>
            <p className="text-xs leading-5 text-muted-foreground">
              Must not be linked to a student record. Grants operational access
              to manage students, hostels, rooms, allocations, transfers,
              vacations, and occupancy reports.
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-background/50 p-4 space-y-1.5">
            <Badge variant="default">ADMINISTRATOR</Badge>
            <p className="text-xs leading-5 text-muted-foreground">
              Must not be linked to a student record. Grants all Warden
              operational capabilities plus user account directory access and
              audited role assignment.
            </p>
          </div>
        </div>
      </section>

      {/* Role Assignment Dialog */}
      <Modal
        open={Boolean(assignModalUser)}
        onClose={() => setAssignModalUser(null)}
        title="Assign HMS Role Profile"
        description="Assign or update a user's HMS role and linked student record."
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4" noValidate>
          {errors.non_field_errors && (
            <p role="alert" className="text-xs text-rose-500">
              {errors.non_field_errors}
            </p>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="role-user-select"
              className="block text-xs font-semibold uppercase text-muted-foreground"
            >
              User Account *
            </label>
            <select
              id="role-user-select"
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                const u = users.find((item) => String(item.id) === e.target.value);
                if (u) {
                  setAssignModalUser(u);
                  const r = u.role ?? "STUDENT";
                  setSelectedRole(r);
                  setSelectedStudentId(
                    r === "STUDENT" ? (u.student_id ?? "") : ""
                  );
                }
              }}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
            >
              {users.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.username} ({u.first_name} {u.last_name}) —{" "}
                  {u.role ?? "Unassigned"}
                </option>
              ))}
            </select>
            {errors.user_id && (
              <p role="alert" className="text-xs text-rose-500">
                {errors.user_id}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="role-enum-select"
              className="block text-xs font-semibold uppercase text-muted-foreground"
            >
              HMS Role *
            </label>
            <select
              id="role-enum-select"
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value as RoleEnum)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
            >
              <option value="STUDENT">STUDENT (Requires linked Student ID)</option>
              <option value="WARDEN">WARDEN (Staff — No Student ID link)</option>
              <option value="ADMINISTRATOR">
                ADMINISTRATOR (System Admin — No Student ID link)
              </option>
            </select>
            {errors.role && (
              <p role="alert" className="text-xs text-rose-500">
                {errors.role}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="role-student-id-input"
              className="block text-xs font-semibold uppercase text-muted-foreground"
            >
              Linked Student ID {selectedRole === "STUDENT" ? "*" : "(Optional / Restricted)"}
            </label>
            <input
              id="role-student-id-input"
              type="text"
              list="student-id-suggestions"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              placeholder={
                selectedRole === "STUDENT"
                  ? "e.g. PES2UG25CS105"
                  : "Leave blank for Warden / Administrator"
              }
              className="h-9 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm outline-none focus-visible:border-ring"
            />
            <datalist id="student-id-suggestions">
              {students.map((s) => {
                const linkedToOther = users.find(
                  (u) =>
                    u.id !== Number(selectedUserId) &&
                    u.student_id === s.student_id
                );
                return (
                  <option key={s.id} value={s.student_id}>
                    {s.name} ({s.course_program})
                    {linkedToOther
                      ? ` [Linked to ${linkedToOther.username}]`
                      : ""}
                  </option>
                );
              })}
            </datalist>
            <p className="text-[11px] text-muted-foreground">
              {selectedRole === "STUDENT"
                ? "Select an existing Student ID not already mapped to another account."
                : "Warden and Administrator roles must not be linked to a student record."}
            </p>
            {errors.student_id && (
              <p role="alert" className="text-xs text-rose-500">
                {errors.student_id}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2.5 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAssignModalUser(null)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Assigning..." : "Save Role Assignment"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
