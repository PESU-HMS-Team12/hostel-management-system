export type RoleEnum = "STUDENT" | "WARDEN" | "ADMINISTRATOR";

export type RecordStatus = "Active" | "Inactive";

export type RoomStatus = "Available" | "Maintenance" | "Unavailable";

export type AvailabilityLabel =
  | "Vacant"
  | "Partially occupied"
  | "Full"
  | "Unavailable";

export interface Student {
  id: number;
  student_id: string;
  name: string;
  contact: string;
  course_program: string;
  year: number;
  status: RecordStatus;
}

export interface StudentRequest {
  student_id: string;
  name: string;
  contact: string;
  course_program: string;
  year: number;
  status?: RecordStatus;
}

export interface Hostel {
  id: number;
  hostel_id: string;
  name: string;
  block_location: string;
  status: RecordStatus;
  rooms_count: number;
}

export interface HostelRequest {
  hostel_id: string;
  name: string;
  block_location: string;
  status?: RecordStatus;
}

export interface Room {
  id: number;
  room_id: string;
  hostel: number;
  hostel_name: string;
  room_no: string;
  room_type: string;
  capacity: number;
  status: string;
  active_occupancy: number;
  available_beds: number;
}

export interface RoomRequest {
  room_id: string;
  hostel: number;
  room_no: string;
  room_type: string;
  capacity: number;
  status?: string;
}

export interface RoomAvailability {
  id: number;
  room_id: string;
  hostel_id: string;
  hostel_name: string;
  room_no: string;
  room_type: string;
  capacity: number;
  status: string;
  active_occupancy: number;
  available_beds: number;
  availability_label: AvailabilityLabel;
}

export interface Allocation {
  id: number;
  student: number;
  student_id: string;
  student_name: string;
  room: number;
  room_no: string;
  room_type: string;
  hostel_id: string;
  hostel_name: string;
  allocation_date: string;
  check_in_date: string | null;
  check_out_date: string | null;
  is_active: boolean;
}

export interface RoomOccupancyDetail {
  room: Room;
  active_residents: Allocation[];
}

export interface AllocationCreateRequest {
  student: number;
  room: number;
  allocation_date?: string;
  check_in_date?: string | null;
}

export interface AllocationTransferRequest {
  new_room: number;
  transfer_date?: string;
}

export interface AllocationVacateRequest {
  checkout_date?: string;
}

export interface NestedCurrentAllocation {
  id: number;
  allocation_date: string;
  check_in_date: string | null;
  check_out_date: string | null;
  hostel_name: string;
  room_no: string;
  room_type: string;
}

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: RoleEnum | null;
  role_label: string | null;
  student: Student | null;
  current_allocation: NestedCurrentAllocation | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface StudentSignupRequest {
  student_id: string;
  contact: string;
  email: string;
  username: string;
  password: string;
  confirm_password: string;
}

export interface StudentSignupResponse {
  message: string;
  username: string;
  student_id: string;
  status: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  role: RoleEnum | null;
  role_label: string | null;
  student_id: string | null;
}

export interface RoleAssignmentRequest {
  user_id: number;
  role: RoleEnum;
  student_id?: string | null;
}

export interface HostelOccupancySummary {
  hostel_id: string;
  hostel_name: string;
  status: string;
  total_rooms: number;
  total_capacity: number;
  occupied_beds: number;
  available_beds: number;
  occupancy_rate: number;
}

export interface OccupancyReport {
  generated_at: string;
  total_hostels: number;
  total_rooms: number;
  total_capacity: number;
  total_occupied_beds: number;
  total_available_beds: number;
  overall_occupancy_rate: number;
  hostels: HostelOccupancySummary[];
}

export interface AllocationReport {
  generated_at: string;
  total_allocations: number;
  active_allocations: number;
  completed_allocations: number;
  allocations_by_program: Record<string, number>;
}

export interface ApiErrorResponse {
  error: string;
  details: Record<string, string[] | string>;
  status_code: number;
}

export type ValidationErrors = Record<string, string>;
