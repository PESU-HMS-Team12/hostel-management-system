"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  RoleEnum,
  Room,
  RoomAvailability,
  RoomOccupancyDetail,
  RoomRequest,
  Student,
  StudentRequest,
  StudentSignupRequest,
  StudentSignupResponse,
} from "../types/hms";
import {
  createInitialDemoState,
  demoApproveUser,
  demoAssignRole,
  demoCreateAllocation,
  demoCreateHostel,
  demoCreateRoom,
  demoCreateStudent,
  demoDeactivateStudent,
  demoSignupStudent,
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
import { apiRequest, ensureCsrfToken } from "./http-client";
import { buildRoleAssignmentPayload } from "../validation/hms";

const DEFAULT_DEMO_MODE =
  process.env.NEXT_PUBLIC_HMS_DEMO_MODE === "true";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "forbidden";

export interface HmsContextValue {
  // Mode & status
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  resetDemoFixtures: () => void;
  isLoading: boolean;
  apiError: string | null;
  clearApiError: () => void;
  refreshLiveData: () => Promise<void>;

  // Central authentication state
  authStatus: AuthStatus;
  loading: boolean;
  authenticated: boolean;
  unauthenticated: boolean;
  user: CurrentUser | null;
  currentUser: CurrentUser | null;
  role: RoleEnum | null;
  sessionExpiredMessage: string | null;
  clearSessionExpiredMessage: () => void;
  refreshUser: () => Promise<CurrentUser | null>;

  // Data collections
  students: Student[];
  hostels: Hostel[];
  rooms: Room[];
  roomAvailability: RoomAvailability[];
  allocations: Allocation[];
  users: AdminUser[];
  occupancyReport: OccupancyReport;
  allocationReport: AllocationReport;

  // Demo student fixture preview selector (only active when isDemoMode === true)
  previewStudentId: string;
  setPreviewStudentId: (studentId: string) => void;
  studentOwnAllocations: Allocation[];

  // Operations
  login: (credentials: LoginRequest) => Promise<CurrentUser>;
  signup: (payload: StudentSignupRequest) => Promise<StudentSignupResponse>;
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
  approveUser: (userId: number) => Promise<AdminUser>;
}

const HmsContext = createContext<HmsContextValue | null>(null);

export function HmsDataProvider({
  children,
  initialDemoMode = DEFAULT_DEMO_MODE,
  initialAuthStatus,
  initialDemoRole = "WARDEN",
}: {
  children: ReactNode;
  initialDemoMode?: boolean;
  initialAuthStatus?: AuthStatus;
  initialDemoRole?: RoleEnum;
}) {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(initialDemoMode);
  const [demoState, setDemoState] = useState<DemoStoreState>(() =>
    createInitialDemoState()
  );
  const [demoRole, setDemoRole] = useState<RoleEnum>(initialDemoRole);

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
  const [authStatus, setAuthStatus] = useState<AuthStatus>(
    initialAuthStatus ?? (initialDemoMode ? "authenticated" : "loading")
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<
    string | null
  >(null);

  const clearApiError = useCallback(() => setApiError(null), []);
  const clearSessionExpiredMessage = useCallback(
    () => setSessionExpiredMessage(null),
    []
  );

  const clearLiveCollections = useCallback(() => {
    setLiveStudents([]);
    setLiveHostels([]);
    setLiveRooms([]);
    setLiveAvailability([]);
    setLiveAllocations([]);
    setLiveUsers([]);
    setLiveOccupancyReport(null);
    setLiveAllocationReport(null);
    setLiveCurrentUser(null);
  }, []);

  const handleSessionExpiry = useCallback(() => {
    clearLiveCollections();
    setAuthStatus("unauthenticated");
    setSessionExpiredMessage(
      "Your session has expired. Please sign in again to continue."
    );
  }, [clearLiveCollections]);

  const loadRoleDatasets = useCallback(async (me: CurrentUser) => {
    if (me.role === "STUDENT") {
      const ownAllocations = await apiRequest<Allocation[]>(
        API_ENDPOINTS.allocations.list
      );
      setLiveAllocations(ownAllocations);
      setLiveStudents(me.student ? [me.student] : []);
      setLiveHostels([]);
      setLiveRooms([]);
      setLiveAvailability([]);
      setLiveUsers([]);
      return;
    }

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
      const usersRes = await apiRequest<AdminUser[]>(API_ENDPOINTS.admin.users);
      setLiveUsers(usersRes);
    } else {
      setLiveUsers([]);
    }
  }, []);

  const refreshLiveData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const me = await apiRequest<CurrentUser>(API_ENDPOINTS.auth.me);
      setLiveCurrentUser(me);
      if (!me.role) {
        setAuthStatus("forbidden");
        return;
      }
      setAuthStatus("authenticated");
      await loadRoleDatasets(me);
    } catch (err) {
      if (err instanceof HmsApiError) {
        if (err.statusCode === 401) {
          clearLiveCollections();
          setAuthStatus("unauthenticated");
          return;
        }
        if (err.statusCode === 403) {
          setLiveCurrentUser(null);
          setAuthStatus("forbidden");
          setApiError(err.message);
          return;
        }
        setApiError(err.message);
      } else {
        setApiError("Failed to load data from the live HMS API.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [clearLiveCollections, loadRoleDatasets]);

  const refreshUser = useCallback(async (): Promise<CurrentUser | null> => {
    if (isDemoMode) {
      return deriveCurrentStudentUser(demoState);
    }
    try {
      const me = await apiRequest<CurrentUser>(API_ENDPOINTS.auth.me);
      setLiveCurrentUser(me);
      if (!me.role) {
        setAuthStatus("forbidden");
        return me;
      }
      setAuthStatus("authenticated");
      await loadRoleDatasets(me);
      return me;
    } catch (err) {
      if (err instanceof HmsApiError && err.statusCode === 401) {
        clearLiveCollections();
        setAuthStatus("unauthenticated");
        return null;
      }
      if (err instanceof HmsApiError && err.statusCode === 403) {
        setLiveCurrentUser(null);
        setAuthStatus("forbidden");
        return null;
      }
      throw err;
    }
  }, [isDemoMode, demoState, clearLiveCollections, loadRoleDatasets]);

  useEffect(() => {
    if (isDemoMode) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await ensureCsrfToken();
        const me = await apiRequest<CurrentUser>(API_ENDPOINTS.auth.me);
        if (cancelled) return;
        setLiveCurrentUser(me);
        if (!me.role) {
          setAuthStatus("forbidden");
          return;
        }
        setAuthStatus("authenticated");
        setIsLoading(true);
        await loadRoleDatasets(me);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof HmsApiError) {
          if (err.statusCode === 401) {
            clearLiveCollections();
            setAuthStatus("unauthenticated");
          } else if (err.statusCode === 403) {
            setLiveCurrentUser(null);
            setAuthStatus("forbidden");
            setApiError(err.message);
          } else {
            clearLiveCollections();
            setAuthStatus("unauthenticated");
            setApiError(err.message);
          }
        } else {
          clearLiveCollections();
          setAuthStatus("unauthenticated");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isDemoMode, clearLiveCollections, loadRoleDatasets]);

  const setDemoMode = useCallback(
    (enabled: boolean) => {
      setIsDemoMode(enabled);
      if (enabled) {
        setApiError(null);
        setAuthStatus("authenticated");
      } else {
        setAuthStatus("loading");
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

  // Derived demo collections
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
  const demoCurrentUser = useMemo<CurrentUser>(() => {
    if (demoRole === "STUDENT") {
      return deriveCurrentStudentUser(demoState);
    }
    const staffAccount =
      demoState.users.find((u) => u.role === demoRole) ?? demoState.users[0];
    return {
      id: staffAccount?.id ?? 1,
      username: staffAccount?.username ?? "warden.north",
      email: staffAccount?.email ?? "warden.north@pes.edu",
      first_name: staffAccount?.first_name ?? "Suresh",
      last_name: staffAccount?.last_name ?? "Menon",
      role: demoRole,
      role_label: demoRole === "ADMINISTRATOR" ? "Administrator" : "Warden",
      student: null,
      current_allocation: null,
    };
  }, [demoState, demoRole]);

  const demoStudentOwnAllocations = useMemo(() => {
    const stuUser = deriveCurrentStudentUser(demoState);
    return deriveAllocations(demoState, {
      studentId: stuUser.student?.student_id,
    });
  }, [demoState]);

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
      setSessionExpiredMessage(null);
      setApiError(null);

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
          throw new HmsApiError("Invalid username/email or password.", 400);
        }
        if (!matchedUser.is_active) {
          throw new HmsApiError(
            "Your account is awaiting administrator approval or has been deactivated.",
            400
          );
        }
        if (!matchedUser.role) {
          throw new HmsApiError(
            "Your account has no assigned HMS role. Contact an administrator.",
            400
          );
        }
        setDemoRole(matchedUser.role);
        if (matchedUser.role === "STUDENT" && matchedUser.student_id) {
          setPreviewStudentId(matchedUser.student_id);
        }
        setAuthStatus("authenticated");
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
      setAuthStatus(user.role ? "authenticated" : "forbidden");
      if (user.role) {
        await loadRoleDatasets(user);
      }
      return user;
    },
    [
      isDemoMode,
      demoState.users,
      demoState.students,
      loadRoleDatasets,
      setPreviewStudentId,
    ]
  );

  const signup = useCallback(
    async (payload: StudentSignupRequest): Promise<StudentSignupResponse> => {
      setApiError(null);
      if (isDemoMode) {
        const { nextState, response } = demoSignupStudent(demoState, payload);
        setDemoState(nextState);
        return response;
      }

      return apiRequest<StudentSignupResponse>(API_ENDPOINTS.auth.signup, {
        method: "POST",
        body: payload,
      });
    },
    [isDemoMode, demoState]
  );

  const logout = useCallback(async () => {
    if (isDemoMode) {
      setAuthStatus("unauthenticated");
      return;
    }
    try {
      await apiRequest(API_ENDPOINTS.auth.logout, { method: "POST" });
    } catch {
      // Clear local session state even if network or server session is already gone
    } finally {
      clearLiveCollections();
      setApiError(null);
      setSessionExpiredMessage(null);
      setAuthStatus("unauthenticated");
    }
  }, [isDemoMode, clearLiveCollections]);

  const runLiveAction = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      try {
        return await fn();
      } catch (err) {
        if (err instanceof HmsApiError && err.statusCode === 401) {
          handleSessionExpiry();
        }
        throw err;
      }
    },
    [handleSessionExpiry]
  );

  const createStudent = useCallback(
    async (payload: StudentRequest): Promise<Student> => {
      if (isDemoMode) {
        const { nextState, created } = demoCreateStudent(demoState, payload);
        setDemoState(nextState);
        return created;
      }
      return runLiveAction(async () => {
        const created = await apiRequest<Student>(API_ENDPOINTS.students.list, {
          method: "POST",
          body: payload,
        });
        await refreshLiveData();
        return created;
      });
    },
    [isDemoMode, demoState, refreshLiveData, runLiveAction]
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
      return runLiveAction(async () => {
        const updated = await apiRequest<Student>(
          API_ENDPOINTS.students.detail(id),
          {
            method: "PATCH",
            body: payload,
          }
        );
        await refreshLiveData();
        return updated;
      });
    },
    [isDemoMode, demoState, refreshLiveData, runLiveAction]
  );

  const deactivateStudent = useCallback(
    async (id: number): Promise<Student> => {
      if (isDemoMode) {
        const { nextState, updated } = demoDeactivateStudent(demoState, id);
        setDemoState(nextState);
        return updated;
      }
      return runLiveAction(async () => {
        const updated = await apiRequest<Student>(
          API_ENDPOINTS.students.deactivate(id),
          {
            method: "POST",
          }
        );
        await refreshLiveData();
        return updated;
      });
    },
    [isDemoMode, demoState, refreshLiveData, runLiveAction]
  );

  const createHostel = useCallback(
    async (payload: HostelRequest): Promise<Hostel> => {
      if (isDemoMode) {
        const { nextState, created } = demoCreateHostel(demoState, payload);
        setDemoState(nextState);
        return created;
      }
      return runLiveAction(async () => {
        const created = await apiRequest<Hostel>(API_ENDPOINTS.hostels.list, {
          method: "POST",
          body: payload,
        });
        await refreshLiveData();
        return created;
      });
    },
    [isDemoMode, demoState, refreshLiveData, runLiveAction]
  );

  const updateHostel = useCallback(
    async (id: number, payload: Partial<HostelRequest>): Promise<Hostel> => {
      if (isDemoMode) {
        const { nextState, updated } = demoUpdateHostel(demoState, id, payload);
        setDemoState(nextState);
        return updated;
      }
      return runLiveAction(async () => {
        const updated = await apiRequest<Hostel>(
          API_ENDPOINTS.hostels.detail(id),
          {
            method: "PATCH",
            body: payload,
          }
        );
        await refreshLiveData();
        return updated;
      });
    },
    [isDemoMode, demoState, refreshLiveData, runLiveAction]
  );

  const createRoom = useCallback(
    async (payload: RoomRequest): Promise<Room> => {
      if (isDemoMode) {
        const { nextState, created } = demoCreateRoom(demoState, payload);
        setDemoState(nextState);
        return created;
      }
      return runLiveAction(async () => {
        const created = await apiRequest<Room>(API_ENDPOINTS.rooms.list, {
          method: "POST",
          body: payload,
        });
        await refreshLiveData();
        return created;
      });
    },
    [isDemoMode, demoState, refreshLiveData, runLiveAction]
  );

  const updateRoom = useCallback(
    async (id: number, payload: Partial<RoomRequest>): Promise<Room> => {
      if (isDemoMode) {
        const { nextState, updated } = demoUpdateRoom(demoState, id, payload);
        setDemoState(nextState);
        return updated;
      }
      return runLiveAction(async () => {
        const updated = await apiRequest<Room>(API_ENDPOINTS.rooms.detail(id), {
          method: "PATCH",
          body: payload,
        });
        await refreshLiveData();
        return updated;
      });
    },
    [isDemoMode, demoState, refreshLiveData, runLiveAction]
  );

  const getRoomOccupancyDetail = useCallback(
    async (roomId: number): Promise<RoomOccupancyDetail> => {
      if (isDemoMode) {
        return deriveRoomOccupancyDetail(demoState, roomId);
      }
      return runLiveAction(() =>
        apiRequest<RoomOccupancyDetail>(API_ENDPOINTS.rooms.occupancy(roomId))
      );
    },
    [isDemoMode, demoState, runLiveAction]
  );

  const createAllocation = useCallback(
    async (payload: AllocationCreateRequest): Promise<Allocation> => {
      if (isDemoMode) {
        const { nextState, created } = demoCreateAllocation(demoState, payload);
        setDemoState(nextState);
        return created;
      }
      return runLiveAction(async () => {
        const created = await apiRequest<Allocation>(
          API_ENDPOINTS.allocations.list,
          {
            method: "POST",
            body: payload,
          }
        );
        await refreshLiveData();
        return created;
      });
    },
    [isDemoMode, demoState, refreshLiveData, runLiveAction]
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
      return runLiveAction(async () => {
        const transferred = await apiRequest<Allocation>(
          API_ENDPOINTS.allocations.transfer(allocationId),
          {
            method: "POST",
            body: payload,
          }
        );
        await refreshLiveData();
        return transferred;
      });
    },
    [isDemoMode, demoState, refreshLiveData, runLiveAction]
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
      return runLiveAction(async () => {
        const vacated = await apiRequest<Allocation>(
          API_ENDPOINTS.allocations.vacate(allocationId),
          {
            method: "POST",
            body: payload,
          }
        );
        await refreshLiveData();
        return vacated;
      });
    },
    [isDemoMode, demoState, refreshLiveData, runLiveAction]
  );

  const assignRole = useCallback(
    async (payload: RoleAssignmentRequest): Promise<AdminUser> => {
      const normalizedPayload = buildRoleAssignmentPayload(payload);
      if (isDemoMode) {
        const { nextState, updated } = demoAssignRole(
          demoState,
          normalizedPayload
        );
        setDemoState(nextState);
        return updated;
      }
      return runLiveAction(async () => {
        const updated = await apiRequest<AdminUser>(API_ENDPOINTS.admin.roles, {
          method: "POST",
          body: normalizedPayload,
        });
        await refreshLiveData();
        return updated;
      });
    },
    [isDemoMode, demoState, refreshLiveData, runLiveAction]
  );

  const approveUser = useCallback(
    async (userId: number): Promise<AdminUser> => {
      if (isDemoMode) {
        const { nextState, approved } = demoApproveUser(demoState, userId);
        setDemoState(nextState);
        return approved;
      }
      return runLiveAction(async () => {
        const approved = await apiRequest<AdminUser>(
          API_ENDPOINTS.admin.approveUser(userId),
          {
            method: "POST",
          }
        );
        await refreshLiveData();
        return approved;
      });
    },
    [isDemoMode, demoState, refreshLiveData, runLiveAction]
  );

  const activeUser = isDemoMode
    ? authStatus === "authenticated"
      ? demoCurrentUser
      : null
    : liveCurrentUser;

  const value: HmsContextValue = {
    isDemoMode,
    setDemoMode,
    resetDemoFixtures,
    isLoading,
    apiError,
    clearApiError,
    refreshLiveData,
    authStatus,
    loading: authStatus === "loading",
    authenticated: authStatus === "authenticated",
    unauthenticated: authStatus === "unauthenticated",
    user: activeUser,
    currentUser: activeUser,
    role: activeUser?.role ?? null,
    sessionExpiredMessage,
    clearSessionExpiredMessage,
    refreshUser,
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
    previewStudentId: demoState.previewStudentId,
    setPreviewStudentId,
    studentOwnAllocations: isDemoMode
      ? demoStudentOwnAllocations
      : liveAllocations.filter(
          (a) => a.student_id === liveCurrentUser?.student?.student_id
        ),
    login,
    signup,
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
    approveUser,
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
