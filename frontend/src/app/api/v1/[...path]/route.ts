import { type NextRequest, NextResponse } from "next/server";

function getBackendOrigin(): string {
  return (process.env.BACKEND_ORIGIN || "http://127.0.0.1:8000").replace(
    /\/+$/,
    ""
  );
}

function normalizeSetCookieForProxy(rawCookie: string): string {
  // Remove any explicit Domain attribute so the browser stores the cookie
  // for the frontend origin (e.g. localhost:3000) and sends it on subsequent
  // same-origin /api/v1/* requests.
  return rawCookie.replace(/;\s*Domain=[^;]*/gi, "");
}

async function proxyToDjango(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await context.params;
  const backendOrigin = getBackendOrigin();
  const cleanSegments = (path || []).filter(Boolean);
  const search = request.nextUrl.search || "";

  // Always terminate the Django API path with a trailing slash before any query string
  const targetUrl = `${backendOrigin}/api/v1/${cleanSegments.join("/")}/${search}`;

  const upstreamHeaders = new Headers();
  upstreamHeaders.set(
    "Accept",
    request.headers.get("accept") || "application/json"
  );

  const contentType = request.headers.get("content-type");
  if (contentType) {
    upstreamHeaders.set("Content-Type", contentType);
  }

  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    upstreamHeaders.set("Cookie", cookieHeader);
  }

  const csrfHeader = request.headers.get("x-csrftoken");
  if (csrfHeader) {
    upstreamHeaders.set("X-CSRFToken", csrfHeader);
  }

  const originHeader = request.headers.get("origin");
  if (originHeader) {
    upstreamHeaders.set("Origin", originHeader);
  }

  const refererHeader = request.headers.get("referer");
  if (refererHeader) {
    upstreamHeaders.set("Referer", refererHeader);
  }

  const method = request.method.toUpperCase();
  let body: ArrayBuffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    const buffer = await request.arrayBuffer();
    if (buffer.byteLength > 0) {
      body = buffer;
    }
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(targetUrl, {
      method,
      headers: upstreamHeaders,
      body,
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Unable to reach the HMS backend API (/api/v1). Ensure the Django backend server is running.",
        details: {},
        status_code: 503,
      },
      { status: 503 }
    );
  }

  const responseHeaders = new Headers();
  const upstreamContentType = upstreamResponse.headers.get("content-type");
  if (upstreamContentType) {
    responseHeaders.set("Content-Type", upstreamContentType);
  }

  const upstreamCsrfToken = upstreamResponse.headers.get("x-csrftoken");
  if (upstreamCsrfToken) {
    responseHeaders.set("X-CSRFToken", upstreamCsrfToken);
  }

  responseHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate");

  const setCookies =
    typeof upstreamResponse.headers.getSetCookie === "function"
      ? upstreamResponse.headers.getSetCookie()
      : [];

  if (setCookies.length > 0) {
    for (const cookie of setCookies) {
      responseHeaders.append("Set-Cookie", normalizeSetCookieForProxy(cookie));
    }
  } else {
    const fallbackSetCookie = upstreamResponse.headers.get("set-cookie");
    if (fallbackSetCookie) {
      responseHeaders.append(
        "Set-Cookie",
        normalizeSetCookieForProxy(fallbackSetCookie)
      );
    }
  }

  if (upstreamResponse.status === 204) {
    return new NextResponse(null, {
      status: 204,
      headers: responseHeaders,
    });
  }

  const responseBody = await upstreamResponse.arrayBuffer();
  return new NextResponse(responseBody, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  return proxyToDjango(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  return proxyToDjango(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  return proxyToDjango(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  return proxyToDjango(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  return proxyToDjango(request, context);
}
