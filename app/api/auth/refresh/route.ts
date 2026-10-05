import {cookies} from "next/headers";
import {NextResponse} from "next/server";

import {getBackendClient} from "@/lib/backend-client";
import {
  AUTH_COOKIE_PATHS,
  AUTH_COOKIES,
  BACKEND_AUTH_COOKIES,
  clearAuthCookies,
  clearLegacyRefreshCookie,
} from "@/lib/auth/cookies";
import {normalizeBackendError} from "@/lib/server/backend-error";
import type {BackendRefreshResponse} from "@/types/auth";

function getRefreshToken(
  session: BackendRefreshResponse["session"],
  setCookie: string | string[] | undefined,
) {
  if (session.refresh_token) return session.refresh_token;

  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const prefix = `${BACKEND_AUTH_COOKIES.refresh}=`;
  const refreshCookie = cookies.find((cookie) => cookie.startsWith(prefix));

  return refreshCookie?.slice(prefix.length).split(";", 1)[0];
}

export async function POST() {
  const refreshToken = (await cookies()).get(AUTH_COOKIES.refresh)?.value;
  if (!refreshToken) {
    return NextResponse.json({code: "UNAUTHENTICATED"}, {status: 401});
  }

  try {
    const backendResponse = await getBackendClient().post<BackendRefreshResponse>(
      "/api/auth/refresh",
      undefined,
      {
        headers: {
          Cookie: `${BACKEND_AUTH_COOKIES.refresh}=${encodeURIComponent(refreshToken)}`,
        },
      },
    );
    const nextRefreshToken = getRefreshToken(
      backendResponse.data.session,
      backendResponse.headers["set-cookie"],
    );

    if (!nextRefreshToken) {
      throw new Error("Refresh token rotation did not return a refresh token");
    }

    const response = NextResponse.json({message: backendResponse.data.message});
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
      value: nextRefreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: AUTH_COOKIE_PATHS.refresh,
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    const normalized = normalizeBackendError(error, "Unable to refresh session");
    const response = NextResponse.json(normalized.body, {status: normalized.status});
    clearAuthCookies(response);
    return response;
  }
}
