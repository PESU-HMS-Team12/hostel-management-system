import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createJiti } from "jiti";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, "../src").replace(/\\/g, "/");

const jiti = createJiti(import.meta.url, {
  jsx: { runtime: "automatic" },
  alias: {
    "@": srcDir,
  },
});

const validation = await jiti.import("@/lib/validation/hms");
const fixtures = await jiti.import("@/lib/api/demo-fixtures");
const errorsMod = await jiti.import("@/lib/api/errors");
const providerMod = await jiti.import("@/lib/api/hms-provider");
const studentDashMod = await jiti.import(
  "@/components/dashboard/student-dashboard-view"
);
const wardenDashMod = await jiti.import(
  "@/components/dashboard/warden-dashboard-view"
);
const adminDashMod = await jiti.import(
  "@/components/dashboard/admin-dashboard-view"
);
const reportsViewMod = await jiti.import("@/components/reports/reports-view");
const studentsViewMod = await jiti.import(
  "@/components/students/students-directory-view"
);
const hostelsViewMod = await jiti.import("@/components/hostels/hostels-view");
const roomsViewMod = await jiti.import("@/components/rooms/rooms-view");
const allocationsViewMod = await jiti.import(
  "@/components/allocations/allocations-view"
);
const usersRolesViewMod = await jiti.import(
  "@/components/admin/users-roles-view"
);

const {
  validateStudent,
  validateRoom,
  validateAllocationCreate,
  validateAllocationTransfer,
  validateAllocationVacate,
  validateRoleAssignment,
  computeAvailabilityLabel,
} = validation;

const {
  createInitialDemoState,
  deriveRooms,
  deriveAllocations,
  deriveOccupancyReport,
  deriveAllocationReport,
  deriveCurrentStudentUser,
  demoCreateStudent,
  demoDeactivateStudent,
  demoUpdateRoom,
  demoCreateAllocation,
  demoTransferAllocation,
  demoVacateAllocation,
  demoAssignRole,
} = fixtures;

const { normalizeBackendError } = errorsMod;
const { HmsDataProvider } = providerMod;
const { StudentDashboardView } = studentDashMod;
const { WardenDashboardView } = wardenDashMod;
const { AdminDashboardView } = adminDashMod;
const { ReportsView } = reportsViewMod;
const { StudentsDirectoryView } = studentsViewMod;
const { HostelsView } = hostelsViewMod;
const { RoomsView } = roomsViewMod;
const { AllocationsView } = allocationsViewMod;
const { UsersRolesView } = usersRolesViewMod;

function renderWithDemoProvider(Component) {
  return renderToStaticMarkup(
    React.createElement(
      HmsDataProvider,
      { initialDemoMode: true },
      React.createElement(Component)
    )
  );
}

describe("HMS-33 Automated Frontend Validation Suite", () => {
  describe("1. Role-Based Dashboard Rendering & Empty States", () => {
    it("renders the Student Dashboard with personal profile, active room, and allocation history without exposing other students", () => {
      const html = renderWithDemoProvider(StudentDashboardView);
      assert.match(html, /Welcome, Aarav Sharma/);
      assert.match(html, /PES2UG24CS001/);
      assert.match(html, /B\.Tech Computer Science &amp; Engineering/);
      assert.match(html, /IT Block Boys Hostel/);
      assert.match(html, /Room 101/);
      assert.match(html, /Allocation History &amp; Timeline/);
      // Verify another student's allocation (e.g. Meera Iyer in Room 302) is NOT exposed on Aarav's student dashboard
      assert.doesNotMatch(html, /Meera Iyer/);
      assert.doesNotMatch(html, /Room 302/);
    });

    it("handles unallocated students cleanly with no fake room data", () => {
      const state = {
        ...createInitialDemoState(),
        previewStudentId: "PES2UG25ME019", // Ananya Rao (unallocated)
      };
      const currentUser = deriveCurrentStudentUser(state);
      assert.equal(currentUser.student?.name, "Ananya Rao");
      assert.equal(currentUser.current_allocation, null);
    });

    it("renders the Warden Dashboard with all 7 summary cards, hostel occupancy, room availability, and recent activity", () => {
      const html = renderWithDemoProvider(WardenDashboardView);
      assert.match(html, /Hostel Operations Dashboard/);
      assert.match(html, /Total Students/);
      assert.match(html, /Active Students/);
      assert.match(html, /Total Hostels/);
      assert.match(html, /Total Rooms/);
      assert.match(html, /Active Allocations/);
      assert.match(html, /Available Beds/);
      assert.match(html, /Overall Occupancy/);
      assert.match(html, /Hostel Occupancy Overview/);
      assert.match(html, /Room Availability Summary/);
      assert.match(html, /Recent Allocation Activity/);
    });

    it("renders the Administrator Dashboard with system summaries, user accounts, and HMS role distribution", () => {
      const html = renderWithDemoProvider(AdminDashboardView);
      assert.match(html, /System Administration Dashboard/);
      assert.match(html, /HMS Role Distribution/);
      assert.match(html, /Registered User Accounts/);
      assert.match(html, /ADMINISTRATOR/);
      assert.match(html, /WARDEN/);
      assert.match(html, /STUDENT/);
      assert.match(html, /admin\.pesu/);
    });

    it("renders the Reports & Analytics view with occupancy report and program-wise allocation breakdown", () => {
      const html = renderWithDemoProvider(ReportsView);
      assert.match(html, /Hostel Occupancy &amp; Allocation Reports/);
      assert.match(
        html,
        /Hostel-by-Hostel Occupancy &amp; Capacity Comparison/
      );
      assert.match(html, /Program-Wise Active Allocation Distribution/);
      assert.match(html, /IT Block Boys Hostel/);
      assert.match(html, /Unit-G Girls Hostel/);
    });

    it("renders all operational management views (Students, Hostels, Rooms, Allocations, User/Role Admin)", () => {
      const studentsHtml = renderWithDemoProvider(StudentsDirectoryView);
      assert.match(studentsHtml, /Student Directory/);
      assert.match(studentsHtml, /PES2UG24CS001/);

      const hostelsHtml = renderWithDemoProvider(HostelsView);
      assert.match(hostelsHtml, /Hostel Management/);
      assert.match(hostelsHtml, /HSL-NB-01/);

      const roomsHtml = renderWithDemoProvider(RoomsView);
      assert.match(roomsHtml, /Room Management/);
      assert.match(roomsHtml, /RM-NB-101/);
      assert.match(roomsHtml, /Partially occupied/);

      const allocationsHtml = renderWithDemoProvider(AllocationsView);
      assert.match(allocationsHtml, /Room Allocations &amp; History/);
      assert.match(allocationsHtml, /Transfer/);
      assert.match(allocationsHtml, /Vacate/);

      const usersRolesHtml = renderWithDemoProvider(UsersRolesView);
      assert.match(usersRolesHtml, /User &amp; Role Management/);
      assert.match(usersRolesHtml, /Assign Role/);
    });
  });

  describe("2. Student Form Validation & Deactivation Workflow", () => {
    it("rejects empty fields, non-positive year of study, and duplicate student_id", () => {
      const state = createInitialDemoState();

      const emptyErrors = validateStudent(
        {
          student_id: "",
          name: "",
          contact: "",
          course_program: "",
          year: 0,
          status: "Active",
        },
        state.students
      );
      assert.ok(emptyErrors.student_id);
      assert.ok(emptyErrors.name);
      assert.ok(emptyErrors.contact);
      assert.ok(emptyErrors.course_program);
      assert.equal(
        emptyErrors.year,
        "Year of study must be a positive integer."
      );

      const duplicateErrors = validateStudent(
        {
          student_id: "PES2UG24CS001",
          name: "Duplicate Student",
          contact: "+91 90000 00000",
          course_program: "B.Tech CSE",
          year: 2,
          status: "Active",
        },
        state.students
      );
      assert.match(duplicateErrors.student_id, /already exists/);
    });

    it("creates and deactivates a student record while preserving history", () => {
      const state = createInitialDemoState();
      const { nextState, created } = demoCreateStudent(state, {
        student_id: "PES2UG25CS999",
        name: "Neha Hegde",
        contact: "+91 98450 99999",
        course_program: "B.Tech CSE",
        year: 1,
        status: "Active",
      });
      assert.equal(created.status, "Active");
      assert.equal(nextState.students.length, state.students.length + 1);

      const { updated } = demoDeactivateStudent(nextState, created.id);
      assert.equal(updated.status, "Inactive");
    });
  });

  describe("3. Room Capacity & Availability Validation", () => {
    it("rejects zero or negative room capacity and duplicate room numbers in the same hostel", () => {
      const state = createInitialDemoState();
      const rooms = deriveRooms(state);

      const zeroCapErrors = validateRoom(
        {
          room_id: "RM-NB-999",
          hostel: 1,
          room_no: "999",
          room_type: "Single",
          capacity: 0,
          status: "Available",
        },
        rooms
      );
      assert.equal(
        zeroCapErrors.capacity,
        "Room capacity must be greater than zero."
      );

      const dupRoomNoErrors = validateRoom(
        {
          room_id: "RM-NB-101-DUP",
          hostel: 1,
          room_no: "101",
          room_type: "Double",
          capacity: 2,
          status: "Available",
        },
        rooms
      );
      assert.equal(
        dupRoomNoErrors.room_no,
        "This room number already exists in the selected hostel."
      );
    });

    it("prevents reducing room capacity below current active occupancy", () => {
      const state = createInitialDemoState();
      // Room id=1 (RM-NB-101) has 2 active allocations
      assert.throws(
        () => demoUpdateRoom(state, 1, { capacity: 1 }),
        /Capacity cannot be less than current occupancy \(2\)/
      );
    });

    it("distinguishes Vacant, Partially occupied, Full, and Unavailable rooms", () => {
      assert.equal(computeAvailabilityLabel("Available", 2, 0), "Vacant");
      assert.equal(
        computeAvailabilityLabel("Available", 3, 1),
        "Partially occupied"
      );
      assert.equal(computeAvailabilityLabel("Available", 2, 2), "Full");
      assert.equal(
        computeAvailabilityLabel("Maintenance", 2, 0),
        "Unavailable"
      );
    });
  });

  describe("4. Allocation, Transfer, and Vacation Workflows", () => {
    it("prevents allocating inactive students, already-allocated students, full rooms, or future dates", () => {
      const state = createInitialDemoState();
      const rooms = deriveRooms(state);
      const allocations = deriveAllocations(state);

      // Inactive student (id=7 Karthik Reddy)
      const inactiveErr = validateAllocationCreate(
        { student: 7, room: 2, allocation_date: "2026-10-01" },
        state.students,
        rooms,
        allocations,
        state.hostels,
        "2026-10-15"
      );
      assert.equal(
        inactiveErr.student,
        "Only active students can receive an allocation."
      );

      // Already allocated student (id=1 Aarav Sharma)
      const dupAllocErr = validateAllocationCreate(
        { student: 1, room: 2, allocation_date: "2026-10-01" },
        state.students,
        rooms,
        allocations,
        state.hostels,
        "2026-10-15"
      );
      assert.equal(
        dupAllocErr.student,
        "This student already has an active room allocation."
      );

      // Full room (id=1 RM-NB-101 has 2/2 occupied)
      const fullRoomErr = validateAllocationCreate(
        { student: 4, room: 1, allocation_date: "2026-10-01" },
        state.students,
        rooms,
        allocations,
        state.hostels,
        "2026-10-15"
      );
      assert.equal(
        fullRoomErr.room,
        "The selected room has reached its capacity."
      );

      // Future date
      const futureErr = validateAllocationCreate(
        { student: 4, room: 2, allocation_date: "2026-12-01" },
        state.students,
        rooms,
        allocations,
        state.hostels,
        "2026-10-15"
      );
      assert.equal(
        futureErr.allocation_date,
        "Allocation date cannot be in the future."
      );
    });

    it("executes atomic allocation creation, transfer, and check-out vacation", () => {
      let state = createInitialDemoState();

      // 1. Allocate unallocated active student (id=4 Ananya Rao) to vacant room (id=2 RM-NB-102)
      const createdRes = demoCreateAllocation(
        state,
        {
          student: 4,
          room: 2,
          allocation_date: "2026-09-01",
          check_in_date: "2026-09-02",
        },
        "2026-10-15"
      );
      state = createdRes.nextState;
      assert.equal(createdRes.created.is_active, true);
      assert.equal(createdRes.created.room_no, "102");

      // 2. Transfer Ananya Rao from Room 102 (id=2) to Room 104 (id=4)
      const transferRes = demoTransferAllocation(
        state,
        createdRes.created.id,
        {
          new_room: 4,
          transfer_date: "2026-09-15",
        },
        "2026-10-15"
      );
      state = transferRes.nextState;
      assert.equal(transferRes.transferred.is_active, true);
      assert.equal(transferRes.transferred.room_no, "104");

      const previousAlloc = deriveAllocations(state).find(
        (a) => a.id === createdRes.created.id
      );
      assert.equal(previousAlloc.is_active, false);
      assert.equal(previousAlloc.check_out_date, "2026-09-15");

      // 3. Vacate the transferred allocation
      const vacateRes = demoVacateAllocation(
        state,
        transferRes.transferred.id,
        {
          checkout_date: "2026-10-10",
        },
        "2026-10-15"
      );
      assert.equal(vacateRes.vacated.is_active, false);
      assert.equal(vacateRes.vacated.check_out_date, "2026-10-10");
    });

    it("validates transfer and vacation boundary dates and destination rooms", () => {
      const state = createInitialDemoState();
      const allocations = deriveAllocations(state);
      const rooms = deriveRooms(state);
      const activeAlloc = allocations.find((a) => a.id === 2); // Aarav in Room 1 (start 2026-08-03)

      // Same room rejection
      const sameRoomErr = validateAllocationTransfer(
        activeAlloc,
        { new_room: 1, transfer_date: "2026-09-01" },
        rooms,
        allocations,
        state.hostels,
        "2026-10-15"
      );
      assert.equal(
        sameRoomErr.new_room,
        "Destination room must be different from the current room."
      );

      // Checkout date before check-in date rejection
      const earlyVacateErr = validateAllocationVacate(
        activeAlloc,
        { checkout_date: "2026-07-01" },
        "2026-10-15"
      );
      assert.equal(
        earlyVacateErr.checkout_date,
        "Check-out date cannot be before check-in or allocation date."
      );
    });
  });

  describe("5. Role Assignment Validation & API Error Handling", () => {
    it("enforces Student ID linking rules for STUDENT, WARDEN, and ADMINISTRATOR roles", () => {
      const state = createInitialDemoState();

      // Student role without student_id
      const missingStudentErr = validateRoleAssignment(
        { user_id: 7, role: "STUDENT", student_id: "" },
        state.users,
        state.students
      );
      assert.equal(
        missingStudentErr.student_id,
        "A student account must be linked to a valid student record."
      );

      // Student role with already-linked student_id (PES2UG24CS001 is linked to user 4)
      const duplicateLinkErr = validateRoleAssignment(
        { user_id: 7, role: "STUDENT", student_id: "PES2UG24CS001" },
        state.users,
        state.students
      );
      assert.equal(
        duplicateLinkErr.student_id,
        "This student record is already linked to another user account."
      );

      // Warden role with student_id (prohibited)
      const staffWithStudentErr = validateRoleAssignment(
        { user_id: 2, role: "WARDEN", student_id: "PES2UG25CS105" },
        state.users,
        state.students
      );
      assert.equal(
        staffWithStudentErr.student_id,
        "Only Student role profiles can be linked to a student record."
      );

      // Valid role assignment for user 7 (Sneha Hegde -> PES2UG25CS105)
      const { updated } = demoAssignRole(state, {
        user_id: 7,
        role: "STUDENT",
        student_id: "PES2UG25CS105",
      });
      assert.equal(updated.role, "STUDENT");
      assert.equal(updated.student_id, "PES2UG25CS105");
    });

    it("computes accurate occupancy and allocation reports from state", () => {
      const state = createInitialDemoState();
      const occ = deriveOccupancyReport(state);
      const allocRep = deriveAllocationReport(state);

      assert.equal(occ.total_hostels, 4);
      assert.equal(occ.total_rooms, 7);
      assert.equal(occ.total_capacity, 13);
      assert.equal(occ.total_occupied_beds, 5);
      assert.equal(occ.total_available_beds, 8);
      assert.equal(allocRep.total_allocations, 7);
      assert.equal(allocRep.active_allocations, 5);
      assert.equal(allocRep.completed_allocations, 2);
    });

    it("normalizes standardized Django REST API error responses", () => {
      const apiErr = normalizeBackendError(
        {
          error: "Validation failed.",
          details: {
            capacity: ["Room capacity must be greater than zero."],
          },
          status_code: 400,
        },
        400
      );
      assert.equal(apiErr.statusCode, 400);
      assert.equal(
        apiErr.fieldErrors.capacity,
        "Room capacity must be greater than zero."
      );
    });
  });
});
