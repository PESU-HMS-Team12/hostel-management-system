const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

export function ensureTrailingSlash(path: string): string {
  const [pathname, query] = path.split("?", 2);
  const normalizedPathname = `${pathname.replace(/\/+$/, "")}/`;
  return query ? `${normalizedPathname}?${query}` : normalizedPathname;
}

export const API_ENDPOINTS = {
  health: ensureTrailingSlash(`${API_BASE}/health/`),
  auth: {
    csrf: ensureTrailingSlash(`${API_BASE}/auth/csrf/`),
    login: ensureTrailingSlash(`${API_BASE}/auth/login/`),
    signup: ensureTrailingSlash(`${API_BASE}/auth/signup/`),
    logout: ensureTrailingSlash(`${API_BASE}/auth/logout/`),
    me: ensureTrailingSlash(`${API_BASE}/auth/me/`),
  },
  students: {
    list: ensureTrailingSlash(`${API_BASE}/students/`),
    detail: (id: number) => ensureTrailingSlash(`${API_BASE}/students/${id}/`),
    deactivate: (id: number) =>
      ensureTrailingSlash(`${API_BASE}/students/${id}/deactivate/`),
  },
  hostels: {
    list: ensureTrailingSlash(`${API_BASE}/hostels/`),
    detail: (id: number) => ensureTrailingSlash(`${API_BASE}/hostels/${id}/`),
  },
  rooms: {
    list: ensureTrailingSlash(`${API_BASE}/rooms/`),
    detail: (id: number) => ensureTrailingSlash(`${API_BASE}/rooms/${id}/`),
    availability: ensureTrailingSlash(`${API_BASE}/rooms/availability/`),
    occupancy: (id: number) =>
      ensureTrailingSlash(`${API_BASE}/rooms/${id}/occupancy/`),
  },
  allocations: {
    list: ensureTrailingSlash(`${API_BASE}/allocations/`),
    detail: (id: number) =>
      ensureTrailingSlash(`${API_BASE}/allocations/${id}/`),
    transfer: (id: number) =>
      ensureTrailingSlash(`${API_BASE}/allocations/${id}/transfer/`),
    vacate: (id: number) =>
      ensureTrailingSlash(`${API_BASE}/allocations/${id}/vacate/`),
  },
  reports: {
    occupancy: ensureTrailingSlash(`${API_BASE}/reports/occupancy/`),
    allocations: ensureTrailingSlash(`${API_BASE}/reports/allocations/`),
  },
  admin: {
    users: ensureTrailingSlash(`${API_BASE}/admin/users/`),
    approveUser: (userId: number) =>
      ensureTrailingSlash(`${API_BASE}/admin/users/${userId}/approve/`),
    roles: ensureTrailingSlash(`${API_BASE}/admin/roles/`),
  },
} as const;
