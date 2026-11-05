import { API_ENDPOINTS, ensureTrailingSlash } from "./endpoints";
import { HmsApiError, normalizeBackendError } from "./errors";

let cachedCsrfToken: string | null = null;
let inflightCsrfPromise: Promise<string | null> | null = null;

export function getCookieValue(name: string): string | null {
  if (typeof document === "undefined" || !document.cookie) {
    return null;
  }
  const cookies = document.cookie.split(";");
  for (const rawCookie of cookies) {
    const trimmed = rawCookie.trim();
    if (trimmed.startsWith(`${name}=`)) {
      return decodeURIComponent(trimmed.slice(name.length + 1));
    }
  }
  return null;
}

export function resetCsrfTokenCache(): void {
  cachedCsrfToken = null;
  inflightCsrfPromise = null;
}

export function buildApiUrl(
  endpoint: string,
  params?: Record<string, string | undefined>
): string {
  const [rawPath, existingQuery] = endpoint.split("?", 2);
  const slashTerminatedPath = ensureTrailingSlash(rawPath);

  const searchParams = new URLSearchParams(existingQuery || "");
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        searchParams.set(key, value);
      }
    }
  }

  const queryString = searchParams.toString();
  return queryString
    ? `${slashTerminatedPath}?${queryString}`
    : slashTerminatedPath;
}

export async function ensureCsrfToken(
  forceRefresh = false
): Promise<string | null> {
  if (!forceRefresh) {
    const cookieToken = getCookieValue("csrftoken");
    if (cookieToken) {
      cachedCsrfToken = cookieToken;
      return cookieToken;
    }
  }

  if (inflightCsrfPromise && !forceRefresh) {
    return inflightCsrfPromise;
  }

  const fetchPromise = (async (): Promise<string | null> => {
    try {
      const csrfUrl = buildApiUrl(API_ENDPOINTS.auth.csrf);
      const response = await fetch(csrfUrl, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });
      if (response.ok) {
        const data = (await response.json()) as { csrfToken?: string };
        const cookieToken = getCookieValue("csrftoken");
        const headerToken = response.headers?.get?.("X-CSRFToken") ?? null;
        const resolvedToken =
          cookieToken || data.csrfToken || headerToken || null;
        cachedCsrfToken = resolvedToken;
        return resolvedToken;
      }
    } catch {
      // Connection error will be surfaced by the subsequent request
    } finally {
      inflightCsrfPromise = null;
    }
    return getCookieValue("csrftoken") || cachedCsrfToken;
  })();

  inflightCsrfPromise = fetchPromise;
  return fetchPromise;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, string | undefined>;
}

function isCsrfFailure(status: number, payload: unknown): boolean {
  if (status !== 403 || !payload || typeof payload !== "object") {
    return false;
  }
  const text = JSON.stringify(payload).toLowerCase();
  return text.includes("csrf");
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, params } = options;

  const url = buildApiUrl(endpoint, params);
  const isStateChanging = method !== "GET";

  const executeFetch = async (forceNewCsrf: boolean): Promise<Response> => {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (isStateChanging) {
      const csrfToken = await ensureCsrfToken(forceNewCsrf);
      if (csrfToken) {
        headers["X-CSRFToken"] = csrfToken;
      }
    }

    try {
      return await fetch(url, {
        method,
        credentials: "include",
        cache: "no-store",
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new HmsApiError(
        "Unable to reach the HMS backend API (/api/v1). Ensure the Django backend server is running.",
        503
      );
    }
  };

  let response = await executeFetch(false);

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

  // If CSRF cookie was missing or rotated, refresh CSRF cookie once and retry
  if (isStateChanging && isCsrfFailure(response.status, payload)) {
    response = await executeFetch(true);
    if (response.status === 204) {
      return undefined as T;
    }
    payload = null;
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
  }

  if (!response.ok) {
    throw normalizeBackendError(payload, response.status);
  }

  return payload as T;
}
