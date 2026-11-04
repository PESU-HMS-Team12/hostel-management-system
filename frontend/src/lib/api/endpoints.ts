const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";

export const API_ENDPOINTS = {
  health: `${API_BASE}/health/`,
  auth: {
    csrf: `${API_BASE}/auth/csrf/`,
    login: `${API_BASE}/auth/login/`,
    logout: `${API_BASE}/auth/logout/`,
    me: `${API_BASE}/auth/me/`,
  },
  students: {
    list: `${API_BASE}/students/`,
    detail: (id: number) => `${API_BASE}/students/${id}/`,
    deactivate: (id: number) => `${API_BASE}/students/${id}/deactivate/`,
  },
  hostels: {
    list: `${API_BASE}/hostels/`,
    detail: (id: number) => `${API_BASE}/hostels/${id}/`,
  },
  rooms: {
    list: `${API_BASE}/rooms/`,
    detail: (id: number) => `${API_BASE}/rooms/${id}/`,
    availability: `${API_BASE}/rooms/availability/`,
    occupancy: (id: number) => `${API_BASE}/rooms/${id}/occupancy/`,
  },
  allocations: {
    list: `${API_BASE}/allocations/`,
    detail: (id: number) => `${API_BASE}/allocations/${id}/`,
    transfer: (id: number) => `${API_BASE}/allocations/${id}/transfer/`,
    vacate: (id: number) => `${API_BASE}/allocations/${id}/vacate/`,
  },
  reports: {
    occupancy: `${API_BASE}/reports/occupancy/`,
    allocations: `${API_BASE}/reports/allocations/`,
  },
  admin: {
    users: `${API_BASE}/admin/users/`,
    roles: `${API_BASE}/admin/roles/`,
  },
} as const;
