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
      const studentPayload = validation.buildRoleAssignmentPayload({
        user_id: 7,
        role: "STUDENT",
        student_id: "PES2UG25CS105",
      });
      assert.deepEqual(studentPayload, {
        user_id: 7,
        role: "STUDENT",
        student_id: "PES2UG25CS105",
      });

      const { nextState: stateAfterStudent, updated } = demoAssignRole(
        state,
        studentPayload
      );
      assert.equal(updated.role, "STUDENT");
      assert.equal(updated.student_id, "PES2UG25CS105");

      // Assigning WARDEN or ADMINISTRATOR omits student_id from payload and unlinks student record
      const wardenPayload = validation.buildRoleAssignmentPayload({
        user_id: 7,
        role: "WARDEN",
        student_id: "PES2UG25CS105",
      });
      assert.deepEqual(wardenPayload, {
        user_id: 7,
        role: "WARDEN",
      });
      assert.equal("student_id" in wardenPayload, false);

      const { nextState: stateAfterWarden, updated: updatedWarden } =
        demoAssignRole(stateAfterStudent, wardenPayload);
      assert.equal(updatedWarden.role, "WARDEN");
      assert.equal(updatedWarden.student_id, null);

      const adminPayload = validation.buildRoleAssignmentPayload({
        user_id: 7,
        role: "ADMINISTRATOR",
      });
      assert.deepEqual(adminPayload, {
        user_id: 7,
        role: "ADMINISTRATOR",
      });
      assert.equal("student_id" in adminPayload, false);

      const { updated: updatedAdmin } = demoAssignRole(
        stateAfterWarden,
        adminPayload
      );
      assert.equal(updatedAdmin.role, "ADMINISTRATOR");
      assert.equal(updatedAdmin.student_id, null);
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


const shellMod = await jiti.import("@/components/hms-shell");
const {
  isRouteAllowedForRole,
  getRoleHomePath,
  getNavigationForRole,
  isNavItemActive,
} = shellMod;
const { validateStudentSignup } = validation;
const { demoSignupStudent, demoApproveUser } = fixtures;

describe("6. Authentication, Student Self-Registration, Admin Approval & Route Guards", () => {
  it("exposes Role Management (/admin/users) only to ADMINISTRATOR in sidebar and highlights it when active", () => {
    const studentNav = getNavigationForRole("STUDENT");
    const wardenNav = getNavigationForRole("WARDEN");
    const adminNav = getNavigationForRole("ADMINISTRATOR");

    assert.equal(
      studentNav.some((item) => item.label === "Role Management"),
      false
    );
    assert.equal(
      studentNav.some((item) => item.href.startsWith("/admin/users")),
      false
    );
    assert.equal(
      wardenNav.some((item) => item.label === "Role Management"),
      false
    );
    assert.equal(
      wardenNav.some((item) => item.href.startsWith("/admin/users")),
      false
    );

    const roleMgmtItem = adminNav.find(
      (item) => item.label === "Role Management"
    );
    assert.ok(roleMgmtItem, "ADMINISTRATOR sidebar must include Role Management");
    assert.equal(roleMgmtItem.href, "/admin/users");
    assert.equal(isNavItemActive("/admin/users", roleMgmtItem.href), true);
    assert.equal(isNavItemActive("/dashboard/admin", roleMgmtItem.href), false);
  });

  it("enforces strict role-based route permissions for STUDENT, WARDEN, and ADMINISTRATOR", () => {
    // Unauthenticated (null role) cannot access any protected route
    assert.equal(isRouteAllowedForRole("/dashboard/student", null), false);
    assert.equal(isRouteAllowedForRole("/students", null), false);

    // STUDENT can only access /dashboard/student (and / or /dashboard redirect entrypoints)
    assert.equal(isRouteAllowedForRole("/dashboard/student", "STUDENT"), true);
    assert.equal(isRouteAllowedForRole("/dashboard/warden", "STUDENT"), false);
    assert.equal(isRouteAllowedForRole("/dashboard/admin", "STUDENT"), false);
    assert.equal(isRouteAllowedForRole("/students", "STUDENT"), false);
    assert.equal(isRouteAllowedForRole("/students/new", "STUDENT"), false);
    assert.equal(isRouteAllowedForRole("/students/1", "STUDENT"), false);
    assert.equal(isRouteAllowedForRole("/hostels", "STUDENT"), false);
    assert.equal(isRouteAllowedForRole("/rooms", "STUDENT"), false);
    assert.equal(isRouteAllowedForRole("/allocations", "STUDENT"), false);
    assert.equal(isRouteAllowedForRole("/reports", "STUDENT"), false);
    assert.equal(isRouteAllowedForRole("/admin/users", "STUDENT"), false);
    assert.equal(isRouteAllowedForRole("/settings", "STUDENT"), false);

    // WARDEN can access operational modules and /dashboard/warden, but NOT /admin/users or /dashboard/admin
    assert.equal(isRouteAllowedForRole("/dashboard/warden", "WARDEN"), true);
    assert.equal(isRouteAllowedForRole("/students", "WARDEN"), true);
    assert.equal(isRouteAllowedForRole("/students/new", "WARDEN"), true);
    assert.equal(isRouteAllowedForRole("/students/1", "WARDEN"), true);
    assert.equal(isRouteAllowedForRole("/hostels", "WARDEN"), true);
    assert.equal(isRouteAllowedForRole("/rooms", "WARDEN"), true);
    assert.equal(isRouteAllowedForRole("/allocations", "WARDEN"), true);
    assert.equal(isRouteAllowedForRole("/reports", "WARDEN"), true);
    assert.equal(isRouteAllowedForRole("/settings", "WARDEN"), true);
    assert.equal(isRouteAllowedForRole("/admin/users", "WARDEN"), false);
    assert.equal(isRouteAllowedForRole("/dashboard/admin", "WARDEN"), false);
    assert.equal(isRouteAllowedForRole("/dashboard/student", "WARDEN"), false);

    // ADMINISTRATOR can access /dashboard/admin, /admin/users, and all Warden modules
    assert.equal(
      isRouteAllowedForRole("/dashboard/admin", "ADMINISTRATOR"),
      true
    );
    assert.equal(isRouteAllowedForRole("/admin/users", "ADMINISTRATOR"), true);
    assert.equal(isRouteAllowedForRole("/students", "ADMINISTRATOR"), true);
    assert.equal(isRouteAllowedForRole("/hostels", "ADMINISTRATOR"), true);
    assert.equal(isRouteAllowedForRole("/rooms", "ADMINISTRATOR"), true);
    assert.equal(isRouteAllowedForRole("/allocations", "ADMINISTRATOR"), true);
    assert.equal(isRouteAllowedForRole("/reports", "ADMINISTRATOR"), true);
    assert.equal(isRouteAllowedForRole("/settings", "ADMINISTRATOR"), true);

    assert.equal(getRoleHomePath("STUDENT"), "/dashboard/student");
    assert.equal(getRoleHomePath("WARDEN"), "/dashboard/warden");
    assert.equal(getRoleHomePath("ADMINISTRATOR"), "/dashboard/admin");
  });

  it("validates student self-registration fields and password rules", () => {
    const emptyErrors = validateStudentSignup({
      student_id: "",
      contact: "123",
      email: "invalid-email",
      username: "ab",
      password: "12345678",
      confirm_password: "different",
    });
    assert.ok(emptyErrors.student_id);
    assert.ok(emptyErrors.contact);
    assert.ok(emptyErrors.email);
    assert.ok(emptyErrors.username);
    assert.equal(
      emptyErrors.password,
      "Password cannot be entirely numeric."
    );
    assert.equal(
      emptyErrors.confirm_password,
      "Password and confirmation password do not match."
    );

    const validErrors = validateStudentSignup({
      student_id: "PES2UG23EC042",
      contact: "+91 98450 11203",
      email: "rohan.verma@stu.pes.edu",
      username: "rohan.verma",
      password: "StrongPassword!2026",
      confirm_password: "StrongPassword!2026",
    });
    assert.equal(Object.keys(validErrors).length, 0);
  });

  it("handles student self-registration in pending state and administrator account approval", () => {
    const state = createInitialDemoState();

    // 1. Reject mismatched contact number for active student PES2UG23EC042
    assert.throws(
      () =>
        demoSignupStudent(state, {
          student_id: "PES2UG23EC042",
          contact: "+91 00000 00000",
          email: "rohan.verma@stu.pes.edu",
          username: "rohan.verma",
          password: "StrongPassword!2026",
          confirm_password: "StrongPassword!2026",
        }),
      /No active student record matches/
    );

    // 2. Reject inactive student PES2UG22EE033 (Karthik Reddy)
    assert.throws(
      () =>
        demoSignupStudent(state, {
          student_id: "PES2UG22EE033",
          contact: "+91 98450 11207",
          email: "karthik@stu.pes.edu",
          username: "karthik.reddy",
          password: "StrongPassword!2026",
          confirm_password: "StrongPassword!2026",
        }),
      /No active student record matches/
    );

    // 3. Reject student record already linked to an account (PES2UG24CS001 -> aarav.sharma)
    assert.throws(
      () =>
        demoSignupStudent(state, {
          student_id: "PES2UG24CS001",
          contact: "+91 98450 11201",
          email: "aarav2@stu.pes.edu",
          username: "aarav.second",
          password: "StrongPassword!2026",
          confirm_password: "StrongPassword!2026",
        }),
      /already been registered/
    );

    // 4. Valid signup for unlinked active student PES2UG23EC042 (Rohan Verma)
    const { nextState, createdUser, response } = demoSignupStudent(state, {
      student_id: "PES2UG23EC042",
      contact: "+91 98450 11203",
      email: "rohan.verma@stu.pes.edu",
      username: "rohan.verma",
      password: "StrongPassword!2026",
      confirm_password: "StrongPassword!2026",
    });
    assert.equal(createdUser.is_active, false);
    assert.equal(createdUser.role, "STUDENT");
    assert.equal(createdUser.student_id, "PES2UG23EC042");
    assert.equal(
      response.message,
      "Your account registration has been submitted and is awaiting hostel administration approval."
    );

    // 5. Administrator approves the pending account
    const { approved } = demoApproveUser(nextState, createdUser.id);
    assert.equal(approved.is_active, true);
    assert.equal(approved.role, "STUDENT");
  });

  it("defaults HmsDataProvider to Live API Mode (isDemoMode = false) with no demo banner", () => {
    function ModeProbe() {
      const ctx = providerMod.useHmsData();
      return React.createElement(
        "div",
        null,
        `demo:${String(ctx.isDemoMode)}|status:${ctx.authStatus}`
      );
    }

    const html = renderToStaticMarkup(
      React.createElement(HmsDataProvider, null, React.createElement(ModeProbe))
    );
    assert.match(html, /demo:false\|status:loading/);
    assert.doesNotMatch(html, /DEMO DATA/);
  });
});


const endpointsMod = await jiti.import("@/lib/api/endpoints");
const httpClientMod = await jiti.import("@/lib/api/http-client");
const { API_ENDPOINTS, ensureTrailingSlash } = endpointsMod;
const { buildApiUrl, apiRequest } = httpClientMod;

describe("7. Django API URL Trailing Slash Contract & HTTP Client Verification", () => {
  it("defines every static and dynamic endpoint with a required trailing slash matching Django urls.py", () => {
    assert.equal(API_ENDPOINTS.health, "/api/v1/health/");

    // Authentication endpoints
    assert.equal(API_ENDPOINTS.auth.csrf, "/api/v1/auth/csrf/");
    assert.equal(API_ENDPOINTS.auth.login, "/api/v1/auth/login/");
    assert.equal(API_ENDPOINTS.auth.signup, "/api/v1/auth/signup/");
    assert.equal(API_ENDPOINTS.auth.logout, "/api/v1/auth/logout/");
    assert.equal(API_ENDPOINTS.auth.me, "/api/v1/auth/me/");

    // Administration endpoints
    assert.equal(API_ENDPOINTS.admin.users, "/api/v1/admin/users/");
    assert.equal(
      API_ENDPOINTS.admin.approveUser(42),
      "/api/v1/admin/users/42/approve/"
    );
    assert.equal(API_ENDPOINTS.admin.roles, "/api/v1/admin/roles/");

    // Student endpoints
    assert.equal(API_ENDPOINTS.students.list, "/api/v1/students/");
    assert.equal(API_ENDPOINTS.students.detail(7), "/api/v1/students/7/");
    assert.equal(
      API_ENDPOINTS.students.deactivate(7),
      "/api/v1/students/7/deactivate/"
    );

    // Hostel & Room endpoints
    assert.equal(API_ENDPOINTS.hostels.list, "/api/v1/hostels/");
    assert.equal(API_ENDPOINTS.hostels.detail(3), "/api/v1/hostels/3/");
    assert.equal(API_ENDPOINTS.rooms.list, "/api/v1/rooms/");
    assert.equal(API_ENDPOINTS.rooms.detail(12), "/api/v1/rooms/12/");
    assert.equal(
      API_ENDPOINTS.rooms.availability,
      "/api/v1/rooms/availability/"
    );
    assert.equal(
      API_ENDPOINTS.rooms.occupancy(12),
      "/api/v1/rooms/12/occupancy/"
    );

    // Allocation & Report endpoints
    assert.equal(API_ENDPOINTS.allocations.list, "/api/v1/allocations/");
    assert.equal(API_ENDPOINTS.allocations.detail(9), "/api/v1/allocations/9/");
    assert.equal(
      API_ENDPOINTS.allocations.transfer(9),
      "/api/v1/allocations/9/transfer/"
    );
    assert.equal(
      API_ENDPOINTS.allocations.vacate(9),
      "/api/v1/allocations/9/vacate/"
    );
    assert.equal(
      API_ENDPOINTS.reports.occupancy,
      "/api/v1/reports/occupancy/"
    );
    assert.equal(
      API_ENDPOINTS.reports.allocations,
      "/api/v1/reports/allocations/"
    );
  });

  it("preserves and enforces trailing slashes in buildApiUrl with and without query parameters", () => {
    assert.equal(ensureTrailingSlash("/api/v1/auth/login"), "/api/v1/auth/login/");
    assert.equal(ensureTrailingSlash("/api/v1/auth/login///"), "/api/v1/auth/login/");
    assert.equal(
      buildApiUrl(API_ENDPOINTS.students.list, { q: "aarav", status: "Active" }),
      "/api/v1/students/?q=aarav&status=Active"
    );
    assert.equal(
      buildApiUrl("/api/v1/allocations", { status: "active" }),
      "/api/v1/allocations/?status=active"
    );
  });

  it("sends GET and POST requests via apiRequest to exact slash-terminated paths", async () => {
    const originalFetch = globalThis.fetch;
    const recordedCalls = [];

    globalThis.fetch = async (url, init) => {
      recordedCalls.push({
        url: String(url),
        method: init?.method || "GET",
      });
      if (String(url).endsWith("/api/v1/auth/csrf/")) {
        return new Response(JSON.stringify({ csrfToken: "test-csrf-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    try {
      await apiRequest(API_ENDPOINTS.auth.me, { method: "GET" });
      await apiRequest(API_ENDPOINTS.students.list, {
        method: "GET",
        params: { status: "Active" },
      });
      await apiRequest(API_ENDPOINTS.auth.login, {
        method: "POST",
        body: { username: "warden.north", password: "SecretPassword!123" },
      });

      assert.deepEqual(recordedCalls, [
        { url: "/api/v1/auth/me/", method: "GET" },
        { url: "/api/v1/students/?status=Active", method: "GET" },
        { url: "/api/v1/auth/csrf/", method: "GET" },
        { url: "/api/v1/auth/login/", method: "POST" },
      ]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("initializes CSRF token, attaches X-CSRFToken to login and signup POST requests, and retries once if CSRF cookie is missing", async () => {
    const originalFetch = globalThis.fetch;
    const { resetCsrfTokenCache } = httpClientMod;
    resetCsrfTokenCache();

    const recordedCalls = [];
    let loginAttempt = 0;

    globalThis.fetch = async (url, init) => {
      const urlStr = String(url);
      const method = init?.method || "GET";
      const headers = init?.headers || {};

      recordedCalls.push({
        url: urlStr,
        method,
        csrfHeader: headers["X-CSRFToken"] || null,
        credentials: init?.credentials || null,
        cache: init?.cache || null,
      });

      if (urlStr === "/api/v1/auth/csrf/") {
        const token =
          loginAttempt === 0 ? "initial-csrf-token" : "refreshed-csrf-token";
        return new Response(JSON.stringify({ csrfToken: token }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": token,
          },
        });
      }

      if (urlStr === "/api/v1/auth/login/") {
        loginAttempt += 1;
        if (loginAttempt === 1) {
          return new Response(
            JSON.stringify({
              error: "CSRF Failed: CSRF cookie not set.",
              details: { detail: "CSRF Failed: CSRF cookie not set." },
              status_code: 403,
            }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        return new Response(
          JSON.stringify({
            id: 1,
            username: "admin.pesu",
            role: "ADMINISTRATOR",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (urlStr === "/api/v1/auth/signup/") {
        return new Response(
          JSON.stringify({
            message:
              "Your account registration has been submitted and is awaiting hostel administration approval.",
            username: "rohan.verma",
            student_id: "PES2UG23EC042",
            status: "PENDING_APPROVAL",
          }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    };

    try {
      const loginRes = await apiRequest(API_ENDPOINTS.auth.login, {
        method: "POST",
        body: { username: "admin.pesu", password: "ValidPassword!123" },
      });
      assert.equal(loginRes.username, "admin.pesu");

      const signupRes = await apiRequest(API_ENDPOINTS.auth.signup, {
        method: "POST",
        body: {
          student_id: "PES2UG23EC042",
          contact: "+91 98450 11203",
          email: "rohan.verma@stu.pes.edu",
          username: "rohan.verma",
          password: "StrongPassword!2026",
          confirm_password: "StrongPassword!2026",
        },
      });
      assert.equal(signupRes.status, "PENDING_APPROVAL");

      assert.equal(recordedCalls.length, 6);
      assert.equal(recordedCalls[0].url, "/api/v1/auth/csrf/");
      assert.equal(recordedCalls[0].credentials, "include");
      assert.equal(recordedCalls[0].cache, "no-store");

      assert.equal(recordedCalls[1].url, "/api/v1/auth/login/");
      assert.equal(recordedCalls[1].csrfHeader, "initial-csrf-token");

      // Automatic CSRF refresh after 403 CSRF cookie not set
      assert.equal(recordedCalls[2].url, "/api/v1/auth/csrf/");
      assert.equal(recordedCalls[3].url, "/api/v1/auth/login/");
      assert.equal(recordedCalls[3].csrfHeader, "refreshed-csrf-token");

      // Subsequent signup POST also fetches/sends CSRF token and credentials: include
      assert.equal(recordedCalls[5].url, "/api/v1/auth/signup/");
      assert.equal(recordedCalls[5].csrfHeader, "refreshed-csrf-token");
      assert.equal(recordedCalls[5].credentials, "include");
    } finally {
      globalThis.fetch = originalFetch;
      resetCsrfTokenCache();
    }
  });
});
