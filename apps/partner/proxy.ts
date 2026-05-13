import { apiFailure, ApiException } from "@cloud/request";
import { isPublicPath, getEnv } from "@cloud/config";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > getEnv().REQUEST_BODY_LIMIT_BYTES) {
    return apiFailure(new ApiException(413, "PAYLOAD_TOO_LARGE", "请求体不能超过 10MB"), {
      requestId,
      status: 413,
    });
  }

  const pathname = request.nextUrl.pathname;
  if (isPublicPath(pathname)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const hasSessionToken = request.cookies.has(getEnv().SESSION_COOKIE_NAME);
  if (hasSessionToken) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (pathname.startsWith("/api/")) {
    return apiFailure(new ApiException(401, "UNAUTHENTICATED", "请先登录"), {
      requestId,
      status: 401,
    });
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
