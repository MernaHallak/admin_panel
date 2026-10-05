import type {NextResponse} from "next/server";

export const AUTH_COOKIES = {
  access: "admin_panel_access_token",
  refresh: "admin_panel_refresh_token",
} as const;

export const BACKEND_AUTH_COOKIES = {
  refresh: "lap_store_refresh_token",
} as const;

export const AUTH_COOKIE_PATHS = {
  access: "/",
  refresh: "/api/auth",
  legacyRefresh: "/api/auth/refresh",
} as const;

const LEGACY_AUTH_COOKIES = {
  access: "access_token",
  refresh: "refresh_token",
} as const;

export function clearLegacyAuthCookies(response: NextResponse) {
  response.cookies.set({
    name: LEGACY_AUTH_COOKIES.access,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set({
    name: LEGACY_AUTH_COOKIES.refresh,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/refresh",
    maxAge: 0,
  });
}

function clearCookie(response: NextResponse, name: string, path: string) {
  response.cookies.set({
    name,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path,
    maxAge: 0,
  });
}

export function clearAuthCookies(response: NextResponse) {
  clearCookie(response, AUTH_COOKIES.access, AUTH_COOKIE_PATHS.access);
  clearCookie(response, AUTH_COOKIES.refresh, AUTH_COOKIE_PATHS.refresh);
  clearLegacyRefreshCookie(response);
}

export function clearLegacyRefreshCookie(response: NextResponse) {
  clearCookie(response, AUTH_COOKIES.refresh, AUTH_COOKIE_PATHS.legacyRefresh);
}
