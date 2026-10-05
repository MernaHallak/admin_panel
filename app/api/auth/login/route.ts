import {NextRequest, NextResponse} from "next/server";

import {getBackendClient} from "@/lib/backend-client";
import {
  AUTH_COOKIE_PATHS,
  AUTH_COOKIES,
  BACKEND_AUTH_COOKIES,
  clearLegacyAuthCookies,
  clearLegacyRefreshCookie,
} from "@/lib/auth/cookies";
import {normalizeBackendError} from "@/lib/server/backend-error";
import type {BackendLoginResponse, LoginRequest, LoginResponse} from "@/types/auth";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRefreshToken(
  session: BackendLoginResponse["session"],
  setCookie: string | string[] | undefined,
) {
  if (session.refresh_token) return session.refresh_token;

  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const prefix = `${BACKEND_AUTH_COOKIES.refresh}=`;
  const refreshCookie = cookies.find((cookie) => cookie.startsWith(prefix));

  return refreshCookie?.slice(prefix.length).split(";", 1)[0];
}

function validateLoginRequest(value: unknown):
  | {success: true; data: LoginRequest}
  | {success: false; response: NextResponse} {
  if (!isRecord(value) || Object.keys(value).some((key) => key !== "email" && key !== "password")) {
    return {
      success: false,
      response: NextResponse.json({code: "VALIDATION_ERROR"}, {status: 400}),
    };
  }

  const email = typeof value.email === "string" ? value.email.trim() : "";
  const password = typeof value.password === "string" ? value.password : "";

  if (!email || !email.includes("@") || !password) {
    return {
      success: false,
      response: NextResponse.json({
        code: "VALIDATION_ERROR",
        errors: [
          ...(!email || !email.includes("@") ? [{field: "email", code: "INVALID_EMAIL"}] : []),
          ...(!password ? [{field: "password", code: "REQUIRED"}] : []),
        ],
      }, {status: 400}),
    };
  }

  return {success: true, data: {email, password}};
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({code: "INVALID_JSON"}, {status: 400});
  }

  const validation = validateLoginRequest(body);
  if (!validation.success) return validation.response;

  try {
    const backendResponse = await getBackendClient().post<BackendLoginResponse>(
      "/api/auth/login",
      validation.data,
    );
    const refreshToken = getRefreshToken(
      backendResponse.data.session,
      backendResponse.headers["set-cookie"],
    );

    if (!refreshToken) {
      return NextResponse.json({code: "REFRESH_TOKEN_MISSING"}, {status: 502});
    }

    const body: LoginResponse = {
      message: backendResponse.data.message,
      user: backendResponse.data.user,
      profile: backendResponse.data.profile,
    };
    const response = NextResponse.json(body);

    clearLegacyRefreshCookie(response);
    response.cookies.set({
      name: AUTH_COOKIES.access,
      value: backendResponse.data.session.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: backendResponse.data.session.expires_in,
    });
    response.cookies.set({
      name: AUTH_COOKIES.refresh,
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: AUTH_COOKIE_PATHS.refresh,
      maxAge: 60 * 60 * 24 * 30,
    });
    clearLegacyAuthCookies(response);

    return response;
  } catch (error) {
    const normalized = normalizeBackendError(error, "Authentication service is unavailable");
    return NextResponse.json(normalized.body, {status: normalized.status});
  }
}
