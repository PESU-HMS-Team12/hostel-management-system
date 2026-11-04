import type {
  AdminUser,
  Allocation,
  AllocationCreateRequest,
  AllocationReport,
  AllocationTransferRequest,
  AllocationVacateRequest,
  CurrentUser,
  Hostel,
  HostelRequest,
  OccupancyReport,
  RoleAssignmentRequest,
  RoleEnum,
  Room,
  RoomAvailability,
  RoomOccupancyDetail,
  RoomRequest,
  Student,
  StudentRequest,
} from "../types/hms";
import {
  computeAvailabilityLabel,
  getTodayIsoDate,
  validateAllocationCreate,
  validateAllocationTransfer,
  validateAllocationVacate,
  validateHostel,
  validateRoleAssignment,
  validateRoom,
  validateStudent,
} from "../validation/hms";
import { HmsApiError } from "./errors";

export interface DemoStoreState {
  students: Student[];
  hostels: Array<Omit<Hostel, "rooms_count">>;
  rooms: Array<Omit<Room, "hostel_name" | "active_occupancy" | "available_beds">>;
  allocations: Array<{
    id: number;
    student: number;
    room: number;
    allocation_date: string;
    check_in_date: string | null;
    check_out_date: string | null;
  }>;
  users: AdminUser[];
  previewStudentId: string;
}

const ROLE_LABELS: Record<RoleEnum, string> = {
  STUDENT: "Student",
  WARDEN: "Warden",
  ADMINISTRATOR: "Administrator",
};

export function createInitialDemoState(): DemoStoreState {
  return {
    students: [
      {
        id: 1,
        student_id: "PES2UG24CS001",
        name: "Aarav Sharma",
        contact: "+91 98450 11201",
        course_program: "B.Tech Computer Science & Engineering",
        year: 2,
        status: "Active",
      },
      {
        id: 2,
        student_id: "PES2UG24CS014",
        name: "Diya Nair",
        contact: "+91 98450 11202",
        course_program: "B.Tech Computer Science & Engineering",
        year: 2,
        status: "Active",
      },
      {
        id: 3,
        student_id: "PES2UG23EC042",
        name: "Rohan Verma",
        contact: "+91 98450 11203",
        course_program: "B.Tech Electronics & Communication",
        year: 3,
        status: "Active",
      },
      {
        id: 4,
        student_id: "PES2UG25ME019",
        name: "Ananya Rao",
        contact: "+91 98450 11204",
        course_program: "B.Tech Mechanical Engineering",
        year: 1,
        status: "Active",
      },
      {
        id: 5,
        student_id: "PES2UG23CS088",
        name: "Vikram Kulkarni",
        contact: "+91 98450 11205",
        course_program: "B.Tech Artificial Intelligence & ML",
        year: 3,
        status: "Active",
      },
      {
        id: 6,
        student_id: "PES2UG24BT011",
        name: "Meera Iyer",
        contact: "+91 98450 11206",
        course_program: "B.Tech Biotechnology",
        year: 2,
        status: "Active",
      },
      {
        id: 7,
        student_id: "PES2UG22EE033",
        name: "Karthik Reddy",
        contact: "+91 98450 11207",
        course_program: "B.Tech Electrical & Electronics",
        year: 4,
        status: "Inactive",
      },
      {
        id: 8,
        student_id: "PES2UG25CS105",
        name: "Sneha Hegde",
        contact: "+91 98450 11208",
        course_program: "B.Tech Computer Science & Engineering",
        year: 1,
        status: "Active",
      },
    ],
    hostels: [
      {
        id: 1,
        hostel_id: "HSL-NB-01",
        name: "IT Block Boys Hostel",
        block_location: "North Campus · Block A",
        status: "Active",
      },
      {
        id: 2,
        hostel_id: "HSL-MM-02",
        name: "MM Block Boys Hostel",
        block_location: "Main Campus · West Wing",
        status: "Active",
      },
      {
        id: 3,
        hostel_id: "HSL-UG-03",
        name: "Unit-G Girls Hostel",
        block_location: "South Campus · Block C",
        status: "Active",
      },
      {
        id: 4,
        hostel_id: "HSL-IH-04",
        name: "International Annex Hostel",
        block_location: "East Campus · Block D",
        status: "Inactive",
      },
    ],
    rooms: [
      {
        id: 1,
        room_id: "RM-NB-101",
        hostel: 1,
        room_no: "101",
        room_type: "Double Sharing",
        capacity: 2,
        status: "Available",
      },
      {
        id: 2,
        room_id: "RM-NB-102",
        hostel: 1,
        room_no: "102",
        room_type: "Single Occupancy",
        capacity: 1,
        status: "Available",
      },
      {
        id: 3,
        room_id: "RM-NB-201",
        hostel: 1,
        room_no: "201",
        room_type: "Triple Sharing",
        capacity: 3,
        status: "Available",
      },
      {
        id: 4,
        room_id: "RM-MM-104",
        hostel: 2,
        room_no: "104",
        room_type: "Double Sharing",
        capacity: 2,
        status: "Available",
      },
      {
        id: 5,
        room_id: "RM-MM-105",
        hostel: 2,
        room_no: "105",
        room_type: "Double Sharing",
        capacity: 2,
        status: "Maintenance",
      },
      {
        id: 6,
        room_id: "RM-UG-301",
        hostel: 3,
        room_no: "301",
        room_type: "Double Sharing",
        capacity: 2,
        status: "Available",
      },
      {
        id: 7,
        room_id: "RM-UG-302",
        hostel: 3,
        room_no: "302",
        room_type: "Single Occupancy",
        capacity: 1,
        status: "Available",
      },
    ],
    allocations: [
      // Completed historical allocation for Aarav Sharma (Year 1)
      {
        id: 1,
        student: 1,
        room: 3,
        allocation_date: "2025-08-10",
        check_in_date: "2025-08-12",
        check_out_date: "2026-05-20",
      },
      // Active allocation for Aarav Sharma (Year 2 -> RM-NB-101)
      {
        id: 2,
        student: 1,
        room: 1,
        allocation_date: "2026-08-01",
        check_in_date: "2026-08-03",
        check_out_date: null,
      },
      // Active allocation for Rohan Verma (RM-NB-101 -> makes room 101 Full 2/2)
      {
        id: 3,
        student: 3,
        room: 1,
        allocation_date: "2026-08-02",
        check_in_date: "2026-08-04",
        check_out_date: null,
      },
      // Active allocation for Vikram Kulkarni (RM-NB-201 -> 1/3 Partially occupied)
      {
        id: 4,
        student: 5,
        room: 3,
        allocation_date: "2026-08-05",
        check_in_date: "2026-08-06",
        check_out_date: null,
      },
      // Active allocation for Diya Nair (RM-UG-301 -> 1/2 Partially occupied)
      {
        id: 5,
        student: 2,
        room: 6,
        allocation_date: "2026-08-07",
        check_in_date: "2026-08-08",
        check_out_date: null,
      },
      // Active allocation for Meera Iyer (RM-UG-302 -> 1/1 Full)
      {
        id: 6,
        student: 6,
        room: 7,
        allocation_date: "2026-08-09",
        check_in_date: "2026-08-10",
        check_out_date: null,
      },
      // Completed historical allocation for Karthik Reddy
      {
        id: 7,
        student: 7,
        room: 4,
        allocation_date: "2025-08-01",
        check_in_date: "2025-08-02",
        check_out_date: "2026-05-30",
      },
    ],
    users: [
      {
        id: 1,
        username: "admin.pesu",
        email: "admin.hms@pes.edu",
        first_name: "Rajesh",
        last_name: "deshmukh",
        is_active: true,
        role: "ADMINISTRATOR",
        role_label: "Administrator",
        student_id: null,
      },
      {
        id: 2,
        username: "warden.north",
        email: "warden.north@pes.edu",
        first_name: "Suresh",
        last_name: "menon",
        is_active: true,
        role: "WARDEN",
        role_label: "Warden",
        student_id: null,
      },
      {
        id: 3,
        username: "warden.south",
        email: "warden.south@pes.edu",
        first_name: "Kavitha",
        last_name: "rao",
        is_active: true,
        role: "WARDEN",
        role_label: "Warden",
        student_id: null,
      },
      {
        id: 4,
        username: "aarav.sharma",
        email: "aarav.cs24@pesu.pes.edu",
        first_name: "Aarav",
        last_name: "Sharma",
        is_active: true,
        role: "STUDENT",
        role_label: "Student",
        student_id: "PES2UG24CS001",
      },
      {
        id: 5,
        username: "diya.nair",
        email: "diya.cs24@pesu.pes.edu",
        first_name: "Diya",
        last_name: "Nair",
        is_active: true,
        role: "STUDENT",
        role_label: "Student",
        student_id: "PES2UG24CS014",
      },
      {
        id: 6,
        username: "ananya.rao",
        email: "ananya.me25@pesu.pes.edu",
        first_name: "Ananya",
        last_name: "Rao",
        is_active: true,
        role: "STUDENT",
        role_label: "Student",
        student_id: "PES2UG25ME019",
      },
      {
        id: 7,
        username: "sneha.hegde",
        email: "sneha.cs25@pesu.pes.edu",
        first_name: "Sneha",
        last_name: "Hegde",
        is_active: true,
        role: null,
        role_label: null,
        student_id: null,
      },
    ],
    previewStudentId: "PES2UG24CS001",
  };
}

export function deriveHostels(state: DemoStoreState): Hostel[] {
  return state.hostels
    .map((h) => ({
      ...h,
      rooms_count: state.rooms.filter((r) => r.hostel === h.id).length,
    }))
    .sort((a, b) => a.hostel_id.localeCompare(b.hostel_id));
}

export function deriveRooms(state: DemoStoreState): Room[] {
  return state.rooms
    .map((r) => {
      const hostel = state.hostels.find((h) => h.id === r.hostel);
      const activeOccupancy = state.allocations.filter(
        (a) => a.room === r.id && a.check_out_date === null
      ).length;
      return {
        ...r,
        hostel_name: hostel?.name ?? "Unknown Hostel",
        active_occupancy: activeOccupancy,
        available_beds: Math.max(0, r.capacity - activeOccupancy),
      };
    })
    .sort((a, b) => a.room_id.localeCompare(b.room_id));
}

export function deriveRoomAvailability(
  state: DemoStoreState
): RoomAvailability[] {
  return state.rooms
    .filter((r) => {
      const hostel = state.hostels.find((h) => h.id === r.hostel);
      return hostel?.status === "Active";
    })
    .map((r) => {
      const hostel = state.hostels.find((h) => h.id === r.hostel);
      const activeOccupancy = state.allocations.filter(
        (a) => a.room === r.id && a.check_out_date === null
      ).length;
      const availableBeds = Math.max(0, r.capacity - activeOccupancy);
      return {
        id: r.id,
        room_id: r.room_id,
        hostel_id: hostel?.hostel_id ?? "",
        hostel_name: hostel?.name ?? "Unknown Hostel",
        room_no: r.room_no,
        room_type: r.room_type,
        capacity: r.capacity,
        status: r.status,
        active_occupancy: activeOccupancy,
        available_beds: availableBeds,
        availability_label: computeAvailabilityLabel(
          r.status,
          r.capacity,
          activeOccupancy
        ),
      };
    });
}

export function deriveAllocations(
  state: DemoStoreState,
  params?: { q?: string; status?: string; studentId?: string }
): Allocation[] {
  const fullList: Allocation[] = state.allocations
    .map((a) => {
      const student = state.students.find((s) => s.id === a.student);
      const room = state.rooms.find((r) => r.id === a.room);
      const hostel = state.hostels.find((h) => h.id === room?.hostel);
      return {
        id: a.id,
        student: a.student,
        student_id: student?.student_id ?? "",
        student_name: student?.name ?? "Unknown Student",
        room: a.room,
        room_no: room?.room_no ?? "",
        room_type: room?.room_type ?? "",
        hostel_id: hostel?.hostel_id ?? "",
        hostel_name: hostel?.name ?? "",
        allocation_date: a.allocation_date,
        check_in_date: a.check_in_date,
        check_out_date: a.check_out_date,
        is_active: a.check_out_date === null,
      };
    })
    .sort((a, b) => {
      const cmp = b.allocation_date.localeCompare(a.allocation_date);
      return cmp !== 0 ? cmp : b.id - a.id;
    });

  return fullList.filter((item) => {
    if (params?.studentId && item.student_id !== params.studentId) {
      return false;
    }
    if (params?.status === "active" && !item.is_active) {
      return false;
    }
    if (params?.status === "completed" && item.is_active) {
      return false;
    }
    if (params?.q) {
      const q = params.q.trim().toLowerCase();
      if (
        !item.student_id.toLowerCase().includes(q) &&
        !item.student_name.toLowerCase().includes(q) &&
        !item.room_no.toLowerCase().includes(q) &&
        !item.hostel_name.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });
}

export function deriveRoomOccupancyDetail(
  state: DemoStoreState,
  roomId: number
): RoomOccupancyDetail {
  const room = deriveRooms(state).find((r) => r.id === roomId);
  if (!room) {
    throw new HmsApiError("Room not found.", 404);
  }
  const activeResidents = deriveAllocations(state, { status: "active" }).filter(
    (a) => a.room === roomId
  );
  return {
    room,
    active_residents: activeResidents,
  };
}

export function deriveOccupancyReport(
  state: DemoStoreState,
  generatedAt: string = new Date().toISOString()
): OccupancyReport {
  const rooms = deriveRooms(state);
  let totalRooms = 0;
  let totalCapacity = 0;
  let totalOccupiedBeds = 0;

  const hostelSummaries = state.hostels.map((hostel) => {
    const hRooms = rooms.filter((r) => r.hostel === hostel.id);
    const hRoomCount = hRooms.length;
    const hCap = hRooms.reduce((sum, r) => sum + r.capacity, 0);
    const hOcc = hRooms.reduce((sum, r) => sum + r.active_occupancy, 0);
    const hAvail = Math.max(0, hCap - hOcc);
    const hRate = hCap > 0 ? Number(((hOcc / hCap) * 100).toFixed(2)) : 0;

    totalRooms += hRoomCount;
    totalCapacity += hCap;
    totalOccupiedBeds += hOcc;

    return {
      hostel_id: hostel.hostel_id,
      hostel_name: hostel.name,
      status: hostel.status,
      total_rooms: hRoomCount,
      total_capacity: hCap,
      occupied_beds: hOcc,
      available_beds: hAvail,
      occupancy_rate: hRate,
    };
  });

  const totalAvailableBeds = Math.max(0, totalCapacity - totalOccupiedBeds);
  const overallOccupancyRate =
    totalCapacity > 0
      ? Number(((totalOccupiedBeds / totalCapacity) * 100).toFixed(2))
      : 0;

  return {
    generated_at: generatedAt,
    total_hostels: state.hostels.length,
    total_rooms: totalRooms,
    total_capacity: totalCapacity,
    total_occupied_beds: totalOccupiedBeds,
    total_available_beds: totalAvailableBeds,
    overall_occupancy_rate: overallOccupancyRate,
    hostels: hostelSummaries,
  };
}

export function deriveAllocationReport(
  state: DemoStoreState,
  generatedAt: string = new Date().toISOString()
): AllocationReport {
  const totalAllocations = state.allocations.length;
  const activeAllocationsList = state.allocations.filter(
    (a) => a.check_out_date === null
  );
  const activeAllocations = activeAllocationsList.length;
  const completedAllocations = totalAllocations - activeAllocations;

  const allocationsByProgram: Record<string, number> = {};
  for (const alloc of activeAllocationsList) {
    const student = state.students.find((s) => s.id === alloc.student);
    const program = student?.course_program || "Unknown";
    allocationsByProgram[program] = (allocationsByProgram[program] ?? 0) + 1;
  }

  return {
    generated_at: generatedAt,
    total_allocations: totalAllocations,
    active_allocations: activeAllocations,
    completed_allocations: completedAllocations,
    allocations_by_program: allocationsByProgram,
  };
}

export function deriveCurrentStudentUser(state: DemoStoreState): CurrentUser {
  const student =
    state.students.find((s) => s.student_id === state.previewStudentId) ??
    state.students[0];
  const userAccount = state.users.find(
    (u) => u.student_id === student?.student_id
  );
  const activeAllocation = deriveAllocations(state, {
    status: "active",
    studentId: student?.student_id,
  })[0];

  const [firstName = "Student", ...restNames] = (student?.name ?? "").split(" ");

  return {
    id: userAccount?.id ?? 100,
    username:
      userAccount?.username ??
      student?.student_id.toLowerCase() ??
      "student.demo",
    email:
      userAccount?.email ??
      `${student?.student_id.toLowerCase()}@pesu.pes.edu`,
    first_name: userAccount?.first_name ?? firstName,
    last_name: userAccount?.last_name ?? restNames.join(" "),
    role: "STUDENT",
    role_label: "Student",
    student: student ?? null,
    current_allocation: activeAllocation
      ? {
          id: activeAllocation.id,
          allocation_date: activeAllocation.allocation_date,
          check_in_date: activeAllocation.check_in_date,
          check_out_date: activeAllocation.check_out_date,
          hostel_name: activeAllocation.hostel_name,
          room_no: activeAllocation.room_no,
          room_type: activeAllocation.room_type,
        }
      : null,
  };
}

// State mutation helpers for Demo Provider (with backend-identical validation)

export function demoCreateStudent(
  state: DemoStoreState,
  payload: StudentRequest
): { nextState: DemoStoreState; created: Student } {
  const errors = validateStudent(payload, state.students);
  if (Object.keys(errors).length > 0) {
    throw new HmsApiError(
      Object.values(errors)[0] ?? "Validation error.",
      400,
      errors
    );
  }

  const nextId =
    state.students.reduce((max, s) => Math.max(max, s.id), 0) + 1;
  const created: Student = {
    id: nextId,
    student_id: payload.student_id.trim(),
    name: payload.name.trim(),
    contact: payload.contact.trim(),
    course_program: payload.course_program.trim(),
    year: Number(payload.year),
    status: payload.status ?? "Active",
  };

  return {
    nextState: {
      ...state,
      students: [...state.students, created],
    },
    created,
  };
}

export function demoUpdateStudent(
  state: DemoStoreState,
  id: number,
  payload: Partial<StudentRequest>
): { nextState: DemoStoreState; updated: Student } {
  const existing = state.students.find((s) => s.id === id);
  if (!existing) {
    throw new HmsApiError("Student not found.", 404);
  }

  const merged: StudentRequest = {
    student_id: payload.student_id ?? existing.student_id,
    name: payload.name ?? existing.name,
    contact: payload.contact ?? existing.contact,
    course_program: payload.course_program ?? existing.course_program,
    year: payload.year !== undefined ? Number(payload.year) : existing.year,
    status: payload.status ?? existing.status,
  };

  const errors = validateStudent(merged, state.students, id);
  if (Object.keys(errors).length > 0) {
    throw new HmsApiError(
      Object.values(errors)[0] ?? "Validation error.",
      400,
      errors
    );
  }

  const updated: Student = {
    id,
    student_id: merged.student_id.trim(),
    name: merged.name.trim(),
    contact: merged.contact.trim(),
    course_program: merged.course_program.trim(),
    year: Number(merged.year),
    status: merged.status ?? "Active",
  };

  return {
    nextState: {
      ...state,
      students: state.students.map((s) => (s.id === id ? updated : s)),
    },
    updated,
  };
}

export function demoDeactivateStudent(
  state: DemoStoreState,
  id: number
): { nextState: DemoStoreState; updated: Student } {
  return demoUpdateStudent(state, id, { status: "Inactive" });
}

export function demoCreateHostel(
  state: DemoStoreState,
  payload: HostelRequest
): { nextState: DemoStoreState; created: Hostel } {
  const currentHostels = deriveHostels(state);
  const errors = validateHostel(payload, currentHostels);
  if (Object.keys(errors).length > 0) {
    throw new HmsApiError(
      Object.values(errors)[0] ?? "Validation error.",
      400,
      errors
    );
  }

  const nextId = state.hostels.reduce((max, h) => Math.max(max, h.id), 0) + 1;
  const rawHostel = {
    id: nextId,
    hostel_id: payload.hostel_id.trim(),
    name: payload.name.trim(),
    block_location: payload.block_location.trim(),
    status: payload.status ?? "Active",
  };

  const nextState: DemoStoreState = {
    ...state,
    hostels: [...state.hostels, rawHostel],
  };

  const created = deriveHostels(nextState).find((h) => h.id === nextId)!;
  return { nextState, created };
}

export function demoUpdateHostel(
  state: DemoStoreState,
  id: number,
  payload: Partial<HostelRequest>
): { nextState: DemoStoreState; updated: Hostel } {
  const existing = state.hostels.find((h) => h.id === id);
  if (!existing) {
    throw new HmsApiError("Hostel not found.", 404);
  }

  const merged: HostelRequest = {
    hostel_id: payload.hostel_id ?? existing.hostel_id,
    name: payload.name ?? existing.name,
    block_location: payload.block_location ?? existing.block_location,
    status: payload.status ?? existing.status,
  };

  const errors = validateHostel(merged, deriveHostels(state), id);
  if (Object.keys(errors).length > 0) {
    throw new HmsApiError(
      Object.values(errors)[0] ?? "Validation error.",
      400,
      errors
    );
  }

  const nextState: DemoStoreState = {
    ...state,
    hostels: state.hostels.map((h) =>
      h.id === id
        ? {
            id,
            hostel_id: merged.hostel_id.trim(),
            name: merged.name.trim(),
            block_location: merged.block_location.trim(),
            status: merged.status ?? "Active",
          }
        : h
    ),
  };

  const updated = deriveHostels(nextState).find((h) => h.id === id)!;
  return { nextState, updated };
}

export function demoCreateRoom(
  state: DemoStoreState,
  payload: RoomRequest
): { nextState: DemoStoreState; created: Room } {
  const currentRooms = deriveRooms(state);
  const errors = validateRoom(payload, currentRooms);
  if (Object.keys(errors).length > 0) {
    throw new HmsApiError(
      Object.values(errors)[0] ?? "Validation error.",
      400,
      errors
    );
  }

  const nextId = state.rooms.reduce((max, r) => Math.max(max, r.id), 0) + 1;
  const rawRoom = {
    id: nextId,
    room_id: payload.room_id.trim(),
    hostel: Number(payload.hostel),
    room_no: payload.room_no.trim(),
    room_type: payload.room_type.trim(),
    capacity: Number(payload.capacity),
    status: payload.status?.trim() || "Available",
  };

  const nextState: DemoStoreState = {
    ...state,
    rooms: [...state.rooms, rawRoom],
  };

  const created = deriveRooms(nextState).find((r) => r.id === nextId)!;
  return { nextState, created };
}

export function demoUpdateRoom(
  state: DemoStoreState,
  id: number,
  payload: Partial<RoomRequest>
): { nextState: DemoStoreState; updated: Room } {
  const currentRooms = deriveRooms(state);
  const existing = currentRooms.find((r) => r.id === id);
  if (!existing) {
    throw new HmsApiError("Room not found.", 404);
  }

  const merged: RoomRequest = {
    room_id: payload.room_id ?? existing.room_id,
    hostel:
      payload.hostel !== undefined ? Number(payload.hostel) : existing.hostel,
    room_no: payload.room_no ?? existing.room_no,
    room_type: payload.room_type ?? existing.room_type,
    capacity:
      payload.capacity !== undefined
        ? Number(payload.capacity)
        : existing.capacity,
    status: payload.status ?? existing.status,
  };

  const errors = validateRoom(merged, currentRooms, existing);
  if (Object.keys(errors).length > 0) {
    throw new HmsApiError(
      Object.values(errors)[0] ?? "Validation error.",
      400,
      errors
    );
  }

  const nextState: DemoStoreState = {
    ...state,
    rooms: state.rooms.map((r) =>
      r.id === id
        ? {
            id,
            room_id: merged.room_id.trim(),
            hostel: Number(merged.hostel),
            room_no: merged.room_no.trim(),
            room_type: merged.room_type.trim(),
            capacity: Number(merged.capacity),
            status: merged.status?.trim() || "Available",
          }
        : r
    ),
  };

  const updated = deriveRooms(nextState).find((r) => r.id === id)!;
  return { nextState, updated };
}

export function demoCreateAllocation(
  state: DemoStoreState,
  payload: AllocationCreateRequest,
  today: string = getTodayIsoDate()
): { nextState: DemoStoreState; created: Allocation } {
  const rooms = deriveRooms(state);
  const allocations = deriveAllocations(state);
  const hostels = deriveHostels(state);

  const errors = validateAllocationCreate(
    payload,
    state.students,
    rooms,
    allocations,
    hostels,
    today
  );
  if (Object.keys(errors).length > 0) {
    throw new HmsApiError(
      Object.values(errors)[0] ?? "Validation error.",
      400,
      errors
    );
  }

  const nextId =
    state.allocations.reduce((max, a) => Math.max(max, a.id), 0) + 1;
  const allocationDate = payload.allocation_date?.trim() || today;
  const checkInDate = payload.check_in_date?.trim() || allocationDate;

  const nextState: DemoStoreState = {
    ...state,
    allocations: [
      ...state.allocations,
      {
        id: nextId,
        student: Number(payload.student),
        room: Number(payload.room),
        allocation_date: allocationDate,
        check_in_date: checkInDate,
        check_out_date: null,
      },
    ],
  };

  const created = deriveAllocations(nextState).find((a) => a.id === nextId)!;
  return { nextState, created };
}

export function demoTransferAllocation(
  state: DemoStoreState,
  allocationId: number,
  payload: AllocationTransferRequest,
  today: string = getTodayIsoDate()
): { nextState: DemoStoreState; transferred: Allocation } {
  const allocations = deriveAllocations(state);
  const currentAlloc = allocations.find((a) => a.id === allocationId);
  const rooms = deriveRooms(state);
  const hostels = deriveHostels(state);

  const errors = validateAllocationTransfer(
    currentAlloc,
    payload,
    rooms,
    allocations,
    hostels,
    today
  );
  if (Object.keys(errors).length > 0) {
    throw new HmsApiError(
      Object.values(errors)[0] ?? "Validation error.",
      400,
      errors
    );
  }

  const transferDate = payload.transfer_date?.trim() || today;
  const nextId =
    state.allocations.reduce((max, a) => Math.max(max, a.id), 0) + 1;

  const updatedRawAllocations = state.allocations.map((a) =>
    a.id === allocationId ? { ...a, check_out_date: transferDate } : a
  );

  const nextState: DemoStoreState = {
    ...state,
    allocations: [
      ...updatedRawAllocations,
      {
        id: nextId,
        student: currentAlloc!.student,
        room: Number(payload.new_room),
        allocation_date: transferDate,
        check_in_date: transferDate,
        check_out_date: null,
      },
    ],
  };

  const transferred = deriveAllocations(nextState).find(
    (a) => a.id === nextId
  )!;
  return { nextState, transferred };
}

export function demoVacateAllocation(
  state: DemoStoreState,
  allocationId: number,
  payload: AllocationVacateRequest,
  today: string = getTodayIsoDate()
): { nextState: DemoStoreState; vacated: Allocation } {
  const allocations = deriveAllocations(state);
  const currentAlloc = allocations.find((a) => a.id === allocationId);

  const errors = validateAllocationVacate(currentAlloc, payload, today);
  if (Object.keys(errors).length > 0) {
    throw new HmsApiError(
      Object.values(errors)[0] ?? "Validation error.",
      400,
      errors
    );
  }

  const checkoutDate = payload.checkout_date?.trim() || today;
  const nextState: DemoStoreState = {
    ...state,
    allocations: state.allocations.map((a) =>
      a.id === allocationId ? { ...a, check_out_date: checkoutDate } : a
    ),
  };

  const vacated = deriveAllocations(nextState).find(
    (a) => a.id === allocationId
  )!;
  return { nextState, vacated };
}

export function demoAssignRole(
  state: DemoStoreState,
  payload: RoleAssignmentRequest
): { nextState: DemoStoreState; updated: AdminUser } {
  const errors = validateRoleAssignment(payload, state.users, state.students);
  if (Object.keys(errors).length > 0) {
    throw new HmsApiError(
      Object.values(errors)[0] ?? "Validation error.",
      400,
      errors
    );
  }

  const userId = Number(payload.user_id);
  const role = payload.role;
  const studentId =
    role === "STUDENT" ? payload.student_id?.trim() || null : null;

  const nextState: DemoStoreState = {
    ...state,
    users: state.users.map((u) =>
      u.id === userId
        ? {
            ...u,
            role,
            role_label: ROLE_LABELS[role],
            student_id: studentId,
          }
        : u
    ),
  };

  const updated = nextState.users.find((u) => u.id === userId)!;
  return { nextState, updated };
}
