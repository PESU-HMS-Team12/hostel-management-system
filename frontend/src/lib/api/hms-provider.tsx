"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
  LoginRequest,
  OccupancyReport,
  RoleAssignmentRequest,
  Room,
  RoomAvailability,
  RoomOccupancyDetail,
  RoomRequest,
  Student,
  StudentRequest,
} from "../types/hms";
import {
  createInitialDemoState,
  demoAssignRole,
  demoCreateAllocation,
  demoCreateHostel,
  demoCreateRoom,
  demoCreateStudent,
  demoDeactivateStudent,
  demoTransferAllocation,
  demoUpdateHostel,
  demoUpdateRoom,
  demoUpdateStudent,
  demoVacateAllocation,
  deriveAllocationReport,
  deriveAllocations,
  deriveCurrentStudentUser,
  deriveHostels,
  deriveOccupancyReport,
  deriveRoomAvailability,
  deriveRoomOccupancyDetail,
  deriveRooms,
  type DemoStoreState,
} from "./demo-fixtures";
import { API_ENDPOINTS } from "./endpoints";
import { HmsApiError } from "./errors";
import { apiRequest } from "./http-client";

const DEFAULT_DEMO_MODE =
  process.env.NEXT_PUBLIC_HMS_DEMO_MODE !== "false";

export interface HmsContextValue {
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  resetDemoFixtures: () => void;
  isLoading: boolean;
  apiError: string | null;
  clearApiError: () => void;
  refreshLiveData: () => Promise<void>;

  // Data collections
  students: Student[];
  hostels: Hostel[];
  rooms: Room[];
  roomAvailability: RoomAvailability[];
  allocations: Allocation[];
  users: AdminUser[];
  occupancyReport: OccupancyReport;
  allocationReport: AllocationReport;
  currentUser: CurrentUser | null;

  // Demo student fixture preview selector (strictly for demo fixture inspection)
  previewStudentId: string;
  setPreviewStudentId: (studentId: string) => void;
  studentOwnAllocations: Allocation[];

  // Operations
  login: (credentials: LoginRequest) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  createStudent: (payload: StudentRequest) => Promise<Student>;
  updateStudent: (
    id: number,
    payload: Partial<StudentRequest>
  ) => Promise<Student>;
  deactivateStudent: (id: number) => Promise<Student>;
  createHostel: (payload: HostelRequest) => Promise<Hostel>;
  updateHostel: (
    id: number,
    payload: Partial<HostelRequest>
  ) => Promise<Hostel>;
  createRoom: (payload: RoomRequest) => Promise<Room>;
  updateRoom: (id: number, payload: Partial<RoomRequest>) => Promise<Room>;
  getRoomOccupancyDetail: (roomId: number) => Promise<RoomOccupancyDetail>;
  createAllocation: (payload: AllocationCreateRequest) => Promise<Allocation>;
  transferAllocation: (
    allocationId: number,
    payload: AllocationTransferRequest
  ) => Promise<Allocation>;
  vacateAllocation: (
    allocationId: number,
    payload: AllocationVacateRequest
  ) => Promise<Allocation>;
  assignRole: (payload: RoleAssignmentRequest) => Promise<AdminUser>;
}

const HmsContext = createContext<HmsContextValue | null>(null);

export function HmsDataProvider({
  children,
  initialDemoMode = DEFAULT_DEMO_MODE,
}: {
  children: ReactNode;
  initialDemoMode?: boolean;
}) {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(initialDemoMode);
  const [demoState, setDemoState] = useState<DemoStoreState>(() =>
    createInitialDemoState()
  );

  // Isolated live state (never mixed with demo fixtures)
  const [liveStudents, setLiveStudents] = useState<Student[]>([]);
  const [liveHostels, setLiveHostels] = useState<Hostel[]>([]);
  const [liveRooms, setLiveRooms] = useState<Room[]>([]);
  const [liveAvailability, setLiveAvailability] = useState<RoomAvailability[]>(
    []
  );
  const [liveAllocations, setLiveAllocations] = useState<Allocation[]>([]);
  const [liveUsers, setLiveUsers] = useState<AdminUser[]>([]);
  const [liveOccupancyReport, setLiveOccupancyReport] =
    useState<OccupancyReport | null>(null);
  const [liveAllocationReport, setLiveAllocationReport] =
    useState<AllocationReport | null>(null);
  const [liveCurrentUser, setLiveCurrentUser] = useState<CurrentUser | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const clearApiError = useCallback(() => setApiError(null), []);

  const refreshLiveData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const me = await apiRequest<CurrentUser>(API_ENDPOINTS.auth.me);
      setLiveCurrentUser(me);

      if (me.role === "STUDENT") {
        const ownAllocations = await apiRequest<Allocation[]>(
          API_ENDPOINTS.allocations.list
        );
        setLiveAllocations(ownAllocations);
        if (me.student) {
          setLiveStudents([me.student]);
        }
      } else {
        const [
          studentsRes,
          hostelsRes,
          roomsRes,
          availRes,
          allocsRes,
          occRes,
          allocReportRes,
        ] = await Promise.all([
          apiRequest<Student[]>(API_ENDPOINTS.students.list),
          apiRequest<Hostel[]>(API_ENDPOINTS.hostels.list),
          apiRequest<Room[]>(API_ENDPOINTS.rooms.list),
          apiRequest<RoomAvailability[]>(API_ENDPOINTS.rooms.availability),
          apiRequest<Allocation[]>(API_ENDPOINTS.allocations.list),
          apiRequest<OccupancyReport>(API_ENDPOINTS.reports.occupancy),
          apiRequest<AllocationReport>(API_ENDPOINTS.reports.allocations),
        ]);
        setLiveStudents(studentsRes);
        setLiveHostels(hostelsRes);
        setLiveRooms(roomsRes);
        setLiveAvailability(availRes);
        setLiveAllocations(allocsRes);
        setLiveOccupancyReport(occRes);
        setLiveAllocationReport(allocReportRes);

        if (me.role === "ADMINISTRATOR") {
          const usersRes = await apiRequest<AdminUser[]>(
            API_ENDPOINTS.admin.users
          );
          setLiveUsers(usersRes);
        }
      }
    } catch (err) {
      const message =
        err instanceof HmsApiError
          ? err.message
          : "Failed to load data from the live HMS API.";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setDemoMode = useCallback(
    (enabled: boolean) => {
      setIsDemoMode(enabled);
      if (enabled) {
        setApiError(null);
      } else {
        void refreshLiveData();
      }
    },
    [refreshLiveData]
  );

  const resetDemoFixtures = useCallback(() => {
    setDemoState(createInitialDemoState());
    setApiError(null);
  }, []);

  const setPreviewStudentId = useCallback((studentId: string) => {
    setDemoState((prev) => ({
      ...prev,
      previewStudentId: studentId,
    }));
  }, []);

  // Derived collections
  const demoHostels = useMemo(() => deriveHostels(demoState), [demoState]);
  const demoRooms = useMemo(() => deriveRooms(demoState), [demoState]);
  const demoAvailability = useMemo(
    () => deriveRoomAvailability(demoState),
    [demoState]
  );
  const demoAllocations = useMemo(
    () => deriveAllocations(demoState),
    [demoState]
  );
  const demoOccupancyReport = useMemo(
    () => deriveOccupancyReport(demoState, "2026-11-04T16:30:00.000Z"),
    [demoState]
  );
  const demoAllocationReport = useMemo(
    () => deriveAllocationReport(demoState, "2026-11-04T16:30:00.000Z"),
    [demoState]
  );
  const demoCurrentUser = useMemo(
    () => deriveCurrentStudentUser(demoState),
    [demoState]
  );
  const demoStudentOwnAllocations = useMemo(
    () =>
      deriveAllocations(demoState, {
        studentId: demoCurrentUser.student?.student_id,
      }),
    [demoState, demoCurrentUser]
  );

  const emptyOccupancyReport: OccupancyReport = {
    generated_at: "2026-11-04T16:30:00.000Z",
    total_hostels: 0,
    total_rooms: 0,
    total_capacity: 0,
    total_occupied_beds: 0,
    total_available_beds: 0,
    overall_occupancy_rate: 0,
    hostels: [],
  };

  const emptyAllocationReport: AllocationReport = {
    generated_at: "2026-11-04T16:30:00.000Z",
    total_allocations: 0,
    active_allocations: 0,
    completed_allocations: 0,
    allocations_by_program: {},
  };

  // Operations
  const login = useCallback(
    async (credentials: LoginRequest): Promise<CurrentUser> => {
      if (isDemoMode) {
        if (!credentials.username.trim() || !credentials.password.trim()) {
          throw new HmsApiError("Username and password are required.", 400, {
            username: !credentials.username.trim()
              ? "Username or email is required."
              : "",
            password: !credentials.password.trim()
              ? "Password is required."
              : "",
          });
        }
        const matchedUser = demoState.users.find(
          (u) =>
            u.username.toLowerCase() ===
              credentials.username.trim().toLowerCase() ||
            u.email.toLowerCase() === credentials.username.trim().toLowerCase()
        );
        if (!matchedUser) {
          throw new HmsApiError(
            "Invalid username/email or password in demo fixtures.",
            400
          );
        }
        if (!matchedUser.is_active) {
          throw new HmsApiError("This user account is disabled.", 400);
        }
        if (!matchedUser.role) {
          throw new HmsApiError(
            "Your account has no assigned HMS role. Contact an administrator.",
            400
          );
        }
        if (matchedUser.role === "STUDENT" && matchedUser.student_id) {
          setPreviewStudentId(matchedUser.student_id);
        }
        const studentRecord = matchedUser.student_id
          ? demoState.students.find(
              (s) => s.student_id === matchedUser.student_id
            ) ?? null
          : null;
        return {
          id: matchedUser.id,
          username: matchedUser.username,
          email: matchedUser.email,
          first_name: matchedUser.first_name,
          last_name: matchedUser.last_name,
          role: matchedUser.role,
          role_label: matchedUser.role_label,
          student: studentRecord,
          current_allocation: null,
        };
      }

      const user = await apiRequest<CurrentUser>(API_ENDPOINTS.auth.login, {
        method: "POST",
        body: credentials,
      });
      setLiveCurrentUser(user);
      await refreshLiveData();
      return user;
    },
    [isDemoMode, demoState.users, demoState.students, refreshLiveData, setPreviewStudentId]
  );

  const logout = useCallback(async () => {
    if (isDemoMode) {
      return;
    }
    await apiRequest(API_ENDPOINTS.auth.logout, { method: "POST" });
    setLiveCurrentUser(null);
  }, [isDemoMode]);

  const createStudent = useCallback(
    async (payload: StudentRequest): Promise<Student> => {
      if (isDemoMode) {
        const { nextState, created } = demoCreateStudent(demoState, payload);
        setDemoState(nextState);
        return created;
      }
      const created = await apiRequest<Student>(API_ENDPOINTS.students.list, {
        method: "POST",
        body: payload,
      });
      await refreshLiveData();
      return created;
    },
    [isDemoMode, demoState, refreshLiveData]
  );

  const updateStudent = useCallback(
    async (id: number, payload: Partial<StudentRequest>): Promise<Student> => {
      if (isDemoMode) {
        const { nextState, updated } = demoUpdateStudent(
          demoState,
          id,
          payload
        );
        setDemoState(nextState);
        return updated;
      }
      const updated = await apiRequest<Student>(
        API_ENDPOINTS.students.detail(id),
        {
          method: "PATCH",
          body: payload,
        }
      );
      await refreshLiveData();
      return updated;
    },
    [isDemoMode, demoState, refreshLiveData]
  );

  const deactivateStudent = useCallback(
    async (id: number): Promise<Student> => {
      if (isDemoMode) {
        const { nextState, updated } = demoDeactivateStudent(demoState, id);
        setDemoState(nextState);
        return updated;
      }
      const updated = await apiRequest<Student>(
        API_ENDPOINTS.students.deactivate(id),
        {
          method: "POST",
        }
      );
      await refreshLiveData();
      return updated;
    },
    [isDemoMode, demoState, refreshLiveData]
  );

  const createHostel = useCallback(
    async (payload: HostelRequest): Promise<Hostel> => {
      if (isDemoMode) {
        const { nextState, created } = demoCreateHostel(demoState, payload);
        setDemoState(nextState);
        return created;
      }
      const created = await apiRequest<Hostel>(API_ENDPOINTS.hostels.list, {
        method: "POST",
        body: payload,
      });
      await refreshLiveData();
      return created;
    },
    [isDemoMode, demoState, refreshLiveData]
  );

  const updateHostel = useCallback(
    async (id: number, payload: Partial<HostelRequest>): Promise<Hostel> => {
      if (isDemoMode) {
        const { nextState, updated } = demoUpdateHostel(demoState, id, payload);
        setDemoState(nextState);
        return updated;
      }
      const updated = await apiRequest<Hostel>(
        API_ENDPOINTS.hostels.detail(id),
        {
          method: "PATCH",
          body: payload,
        }
      );
      await refreshLiveData();
      return updated;
    },
    [isDemoMode, demoState, refreshLiveData]
  );

  const createRoom = useCallback(
    async (payload: RoomRequest): Promise<Room> => {
      if (isDemoMode) {
        const { nextState, created } = demoCreateRoom(demoState, payload);
        setDemoState(nextState);
        return created;
      }
      const created = await apiRequest<Room>(API_ENDPOINTS.rooms.list, {
        method: "POST",
        body: payload,
      });
      await refreshLiveData();
      return created;
    },
    [isDemoMode, demoState, refreshLiveData]
  );

  const updateRoom = useCallback(
    async (id: number, payload: Partial<RoomRequest>): Promise<Room> => {
      if (isDemoMode) {
        const { nextState, updated } = demoUpdateRoom(demoState, id, payload);
        setDemoState(nextState);
        return updated;
      }
      const updated = await apiRequest<Room>(API_ENDPOINTS.rooms.detail(id), {
        method: "PATCH",
        body: payload,
      });
      await refreshLiveData();
      return updated;
    },
    [isDemoMode, demoState, refreshLiveData]
  );

  const getRoomOccupancyDetail = useCallback(
    async (roomId: number): Promise<RoomOccupancyDetail> => {
      if (isDemoMode) {
        return deriveRoomOccupancyDetail(demoState, roomId);
      }
      return apiRequest<RoomOccupancyDetail>(
        API_ENDPOINTS.rooms.occupancy(roomId)
      );
    },
    [isDemoMode, demoState]
  );

  const createAllocation = useCallback(
    async (payload: AllocationCreateRequest): Promise<Allocation> => {
      if (isDemoMode) {
        const { nextState, created } = demoCreateAllocation(demoState, payload);
        setDemoState(nextState);
        return created;
      }
      const created = await apiRequest<Allocation>(
        API_ENDPOINTS.allocations.list,
        {
          method: "POST",
          body: payload,
        }
      );
      await refreshLiveData();
      return created;
    },
    [isDemoMode, demoState, refreshLiveData]
  );

  const transferAllocation = useCallback(
    async (
      allocationId: number,
      payload: AllocationTransferRequest
    ): Promise<Allocation> => {
      if (isDemoMode) {
        const { nextState, transferred } = demoTransferAllocation(
          demoState,
          allocationId,
          payload
        );
        setDemoState(nextState);
        return transferred;
      }
      const transferred = await apiRequest<Allocation>(
        API_ENDPOINTS.allocations.transfer(allocationId),
        {
          method: "POST",
          body: payload,
        }
      );
      await refreshLiveData();
      return transferred;
    },
    [isDemoMode, demoState, refreshLiveData]
  );

  const vacateAllocation = useCallback(
    async (
      allocationId: number,
      payload: AllocationVacateRequest
    ): Promise<Allocation> => {
      if (isDemoMode) {
        const { nextState, vacated } = demoVacateAllocation(
          demoState,
          allocationId,
          payload
        );
        setDemoState(nextState);
        return vacated;
      }
      const vacated = await apiRequest<Allocation>(
        API_ENDPOINTS.allocations.vacate(allocationId),
        {
          method: "POST",
          body: payload,
        }
      );
      await refreshLiveData();
      return vacated;
    },
    [isDemoMode, demoState, refreshLiveData]
  );

  const assignRole = useCallback(
    async (payload: RoleAssignmentRequest): Promise<AdminUser> => {
      if (isDemoMode) {
        const { nextState, updated } = demoAssignRole(demoState, payload);
        setDemoState(nextState);
        return updated;
      }
      const updated = await apiRequest<AdminUser>(API_ENDPOINTS.admin.roles, {
        method: "POST",
        body: payload,
      });
      await refreshLiveData();
      return updated;
    },
    [isDemoMode, demoState, refreshLiveData]
  );

  const value: HmsContextValue = {
    isDemoMode,
    setDemoMode,
    resetDemoFixtures,
    isLoading,
    apiError,
    clearApiError,
    refreshLiveData,
    students: isDemoMode ? demoState.students : liveStudents,
    hostels: isDemoMode ? demoHostels : liveHostels,
    rooms: isDemoMode ? demoRooms : liveRooms,
    roomAvailability: isDemoMode ? demoAvailability : liveAvailability,
    allocations: isDemoMode ? demoAllocations : liveAllocations,
    users: isDemoMode ? demoState.users : liveUsers,
    occupancyReport: isDemoMode
      ? demoOccupancyReport
      : (liveOccupancyReport ?? emptyOccupancyReport),
    allocationReport: isDemoMode
      ? demoAllocationReport
      : (liveAllocationReport ?? emptyAllocationReport),
    currentUser: isDemoMode ? demoCurrentUser : liveCurrentUser,
    previewStudentId: demoState.previewStudentId,
    setPreviewStudentId,
    studentOwnAllocations: isDemoMode
      ? demoStudentOwnAllocations
      : liveAllocations.filter(
          (a) => a.student_id === liveCurrentUser?.student?.student_id
        ),
    login,
    logout,
    createStudent,
    updateStudent,
    deactivateStudent,
    createHostel,
    updateHostel,
    createRoom,
    updateRoom,
    getRoomOccupancyDetail,
    createAllocation,
    transferAllocation,
    vacateAllocation,
    assignRole,
  };

  return <HmsContext.Provider value={value}>{children}</HmsContext.Provider>;
}

export function useHmsData(): HmsContextValue {
  const ctx = useContext(HmsContext);
  if (!ctx) {
    throw new Error("useHmsData must be used within an HmsDataProvider");
  }
  return ctx;
}
