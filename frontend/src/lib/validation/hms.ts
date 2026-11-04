import type {
  AdminUser,
  Allocation,
  AllocationCreateRequest,
  AllocationTransferRequest,
  AllocationVacateRequest,
  AvailabilityLabel,
  Hostel,
  HostelRequest,
  RoleAssignmentRequest,
  Room,
  RoomRequest,
  Student,
  StudentRequest,
  ValidationErrors,
} from "../types/hms";

export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function computeAvailabilityLabel(
  status: string,
  capacity: number,
  activeOccupancy: number
): AvailabilityLabel {
  if (status !== "Available") {
    return "Unavailable";
  }
  if (activeOccupancy >= capacity) {
    return "Full";
  }
  if (activeOccupancy === 0) {
    return "Vacant";
  }
  return "Partially occupied";
}

export function validateStudent(
  input: Partial<StudentRequest>,
  existingStudents: Student[] = [],
  editingId?: number
): ValidationErrors {
  const errors: ValidationErrors = {};

  const studentId = input.student_id?.trim() ?? "";
  if (!studentId) {
    errors.student_id = "Student ID is required.";
  } else if (studentId.length > 20) {
    errors.student_id = "Student ID must not exceed 20 characters.";
  } else {
    const duplicate = existingStudents.some(
      (s) =>
        s.student_id.toLowerCase() === studentId.toLowerCase() &&
        s.id !== editingId
    );
    if (duplicate) {
      errors.student_id = "A student with this Student ID already exists.";
    }
  }

  const name = input.name?.trim() ?? "";
  if (!name) {
    errors.name = "Student name is required.";
  } else if (name.length > 100) {
    errors.name = "Student name must not exceed 100 characters.";
  }

  const contact = input.contact?.trim() ?? "";
  if (!contact) {
    errors.contact = "Contact information is required.";
  } else if (contact.length > 20) {
    errors.contact = "Contact must not exceed 20 characters.";
  }

  const courseProgram = input.course_program?.trim() ?? "";
  if (!courseProgram) {
    errors.course_program = "Course/program is required.";
  } else if (courseProgram.length > 100) {
    errors.course_program = "Course/program must not exceed 100 characters.";
  }

  if (
    input.year === undefined ||
    input.year === null ||
    !Number.isInteger(Number(input.year)) ||
    Number(input.year) <= 0
  ) {
    errors.year = "Year of study must be a positive integer.";
  }

  const status = input.status ?? "Active";
  if (status !== "Active" && status !== "Inactive") {
    errors.status = "Status must be either 'Active' or 'Inactive'.";
  }

  return errors;
}

export function validateHostel(
  input: Partial<HostelRequest>,
  existingHostels: Hostel[] = [],
  editingId?: number
): ValidationErrors {
  const errors: ValidationErrors = {};

  const hostelId = input.hostel_id?.trim() ?? "";
  if (!hostelId) {
    errors.hostel_id = "Hostel ID is required.";
  } else if (hostelId.length > 20) {
    errors.hostel_id = "Hostel ID must not exceed 20 characters.";
  } else {
    const duplicate = existingHostels.some(
      (h) =>
        h.hostel_id.toLowerCase() === hostelId.toLowerCase() &&
        h.id !== editingId
    );
    if (duplicate) {
      errors.hostel_id = "A hostel with this Hostel ID already exists.";
    }
  }

  const name = input.name?.trim() ?? "";
  if (!name) {
    errors.name = "Hostel name is required.";
  } else if (name.length > 100) {
    errors.name = "Hostel name must not exceed 100 characters.";
  }

  const blockLocation = input.block_location?.trim() ?? "";
  if (!blockLocation) {
    errors.block_location = "Block/location is required.";
  } else if (blockLocation.length > 100) {
    errors.block_location = "Block/location must not exceed 100 characters.";
  }

  const status = input.status ?? "Active";
  if (status !== "Active" && status !== "Inactive") {
    errors.status = "Status must be either 'Active' or 'Inactive'.";
  }

  return errors;
}

export function validateRoom(
  input: Partial<RoomRequest>,
  existingRooms: Room[] = [],
  editingRoom?: Room
): ValidationErrors {
  const errors: ValidationErrors = {};

  const roomId = input.room_id?.trim() ?? "";
  if (!roomId) {
    errors.room_id = "Room ID is required.";
  } else if (roomId.length > 20) {
    errors.room_id = "Room ID must not exceed 20 characters.";
  } else {
    const duplicateId = existingRooms.some(
      (r) =>
        r.room_id.toLowerCase() === roomId.toLowerCase() &&
        r.id !== editingRoom?.id
    );
    if (duplicateId) {
      errors.room_id = "A room with this Room ID already exists.";
    }
  }

  const hostelId = Number(input.hostel);
  if (!input.hostel || !Number.isInteger(hostelId) || hostelId <= 0) {
    errors.hostel = "Please select a valid hostel.";
  }

  const roomNo = input.room_no?.trim() ?? "";
  if (!roomNo) {
    errors.room_no = "Room number is required.";
  } else if (roomNo.length > 20) {
    errors.room_no = "Room number must not exceed 20 characters.";
  } else if (hostelId > 0) {
    const duplicateRoomNo = existingRooms.some(
      (r) =>
        r.hostel === hostelId &&
        r.room_no.toLowerCase() === roomNo.toLowerCase() &&
        r.id !== editingRoom?.id
    );
    if (duplicateRoomNo) {
      errors.room_no =
        "This room number already exists in the selected hostel.";
    }
  }

  const roomType = input.room_type?.trim() ?? "";
  if (!roomType) {
    errors.room_type = "Room type is required.";
  } else if (roomType.length > 50) {
    errors.room_type = "Room type must not exceed 50 characters.";
  }

  const capacity = Number(input.capacity);
  if (
    input.capacity === undefined ||
    input.capacity === null ||
    !Number.isInteger(capacity) ||
    capacity <= 0
  ) {
    errors.capacity = "Room capacity must be greater than zero.";
  } else if (
    editingRoom &&
    capacity < editingRoom.active_occupancy
  ) {
    errors.capacity = `Capacity cannot be less than current occupancy (${editingRoom.active_occupancy}).`;
  }

  const status = input.status?.trim() || "Available";
  if (status.length > 20) {
    errors.status = "Status must not exceed 20 characters.";
  }

  return errors;
}

export function validateAllocationCreate(
  input: Partial<AllocationCreateRequest>,
  students: Student[],
  rooms: Room[],
  allocations: Allocation[],
  hostels: Hostel[] = [],
  today: string = getTodayIsoDate()
): ValidationErrors {
  const errors: ValidationErrors = {};

  const studentPk = Number(input.student);
  const student = students.find((s) => s.id === studentPk);
  if (!student) {
    errors.student = "Please select a valid student.";
  } else {
    if (student.status !== "Active") {
      errors.student = "Only active students can receive an allocation.";
    } else {
      const hasActive = allocations.some(
        (a) => a.student === student.id && a.check_out_date === null
      );
      if (hasActive) {
        errors.student = "This student already has an active room allocation.";
      }
    }
  }

  const roomPk = Number(input.room);
  const room = rooms.find((r) => r.id === roomPk);
  if (!room) {
    errors.room = "Please select a valid room.";
  } else {
    const hostel = hostels.find((h) => h.id === room.hostel);
    if (hostel && hostel.status !== "Active") {
      errors.room = "Cannot allocate a room in an inactive hostel.";
    } else if (room.status !== "Available") {
      errors.room = "The selected room is currently unavailable.";
    } else {
      const activeCount = allocations.filter(
        (a) => a.room === room.id && a.check_out_date === null
      ).length;
      if (activeCount >= room.capacity) {
        errors.room = "The selected room has reached its capacity.";
      }
    }
  }

  const allocationDate = input.allocation_date?.trim() || today;
  if (allocationDate > today) {
    errors.allocation_date = "Allocation date cannot be in the future.";
  }

  const checkInDate = input.check_in_date?.trim() || null;
  if (checkInDate) {
    if (checkInDate > today) {
      errors.check_in_date = "Check-in date cannot be in the future.";
    } else if (checkInDate < allocationDate) {
      errors.check_in_date =
        "Check-in date cannot be before the allocation date.";
    }
  }

  return errors;
}

export function validateAllocationTransfer(
  allocation: Allocation | undefined,
  input: Partial<AllocationTransferRequest>,
  rooms: Room[],
  allocations: Allocation[],
  hostels: Hostel[] = [],
  today: string = getTodayIsoDate()
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!allocation || allocation.check_out_date !== null) {
    errors.non_field_errors = "This allocation is no longer active.";
    return errors;
  }

  const newRoomPk = Number(input.new_room);
  const newRoom = rooms.find((r) => r.id === newRoomPk);
  if (!newRoom) {
    errors.new_room = "Please select a destination room.";
  } else if (newRoom.id === allocation.room) {
    errors.new_room =
      "Destination room must be different from the current room.";
  } else {
    const hostel = hostels.find((h) => h.id === newRoom.hostel);
    if (hostel && hostel.status !== "Active") {
      errors.new_room = "Destination room belongs to an inactive hostel.";
    } else if (newRoom.status !== "Available") {
      errors.new_room = "Destination room is not available.";
    } else {
      const activeCount = allocations.filter(
        (a) => a.room === newRoom.id && a.check_out_date === null
      ).length;
      if (activeCount >= newRoom.capacity) {
        errors.new_room = "The destination room has reached its capacity.";
      }
    }
  }

  const transferDate = input.transfer_date?.trim() || today;
  const startDate = allocation.check_in_date || allocation.allocation_date;
  if (transferDate > today) {
    errors.transfer_date = "Transfer date cannot be in the future.";
  } else if (transferDate < startDate) {
    errors.transfer_date =
      "Transfer date cannot be before current allocation start date.";
  }

  return errors;
}

export function validateAllocationVacate(
  allocation: Allocation | undefined,
  input: Partial<AllocationVacateRequest>,
  today: string = getTodayIsoDate()
): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!allocation || allocation.check_out_date !== null) {
    errors.non_field_errors = "This allocation has already been checked out.";
    return errors;
  }

  const checkoutDate = input.checkout_date?.trim() || today;
  const startDate = allocation.check_in_date || allocation.allocation_date;
  if (checkoutDate > today) {
    errors.checkout_date = "Check-out date cannot be in the future.";
  } else if (checkoutDate < startDate) {
    errors.checkout_date =
      "Check-out date cannot be before check-in or allocation date.";
  }

  return errors;
}

export function validateRoleAssignment(
  input: Partial<RoleAssignmentRequest>,
  users: AdminUser[],
  students: Student[]
): ValidationErrors {
  const errors: ValidationErrors = {};

  const userId = Number(input.user_id);
  const user = users.find((u) => u.id === userId);
  if (!user) {
    errors.user_id = "User not found.";
  }

  const role = input.role;
  if (
    !role ||
    !["STUDENT", "WARDEN", "ADMINISTRATOR"].includes(role)
  ) {
    errors.role = "Please select a valid HMS role.";
    return errors;
  }

  const studentId = input.student_id?.trim() || null;

  if (role === "STUDENT") {
    if (!studentId) {
      errors.student_id =
        "A student account must be linked to a valid student record.";
    } else {
      const student = students.find((s) => s.student_id === studentId);
      if (!student) {
        errors.student_id = `Student record '${studentId}' does not exist.`;
      } else {
        const linkedUser = users.find(
          (u) => u.id !== userId && u.student_id === student.student_id
        );
        if (linkedUser) {
          errors.student_id =
            "This student record is already linked to another user account.";
        }
      }
    }
  } else {
    if (studentId) {
      errors.student_id =
        "Only Student role profiles can be linked to a student record.";
    }
  }

  return errors;
}
