import { API_ENDPOINTS } from "./endpoints";
import { HmsApiError, normalizeBackendError } from "./errors";

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

async function ensureCsrfToken(): Promise<string | null> {
  const existing = getCookieValue("csrftoken");
  if (existing) {
    return existing;
  }

  try {
    const response = await fetch(API_ENDPOINTS.auth.csrf, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });
    if (response.ok) {
      const data = (await response.json()) as { csrfToken?: string };
      return data.csrfToken || getCookieValue("csrftoken");
    }
  } catch {
    // Connection error will be surfaced by the subsequent request
  }

  return null;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, string | undefined>;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, params } = options;

  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        searchParams.set(key, value);
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url = `${endpoint}?${queryString}`;
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (method !== "GET") {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) {
      headers["X-CSRFToken"] = csrfToken;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      credentials: "include",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new HmsApiError(
      "Could not connect to the HMS backend API (/api/v1). Ensure backend PR #17 is merged and the Django server is running, or enable Demo Mode.",
      503
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    if (!response.ok) {
      throw new HmsApiError(
        `Backend request failed with HTTP ${response.status}.`,
        response.status
      );
    }
  }

  if (!response.ok) {
    throw normalizeBackendError(payload, response.status);
  }

  return payload as T;
}
