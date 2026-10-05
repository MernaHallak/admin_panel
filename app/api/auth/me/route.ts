import {cookies} from "next/headers";
import {NextResponse} from "next/server";

import {getBackendClient} from "@/lib/backend-client";
import {AUTH_COOKIES, clearAuthCookies} from "@/lib/auth/cookies";
import {normalizeBackendError} from "@/lib/server/backend-error";
import type {SuperAdminIdentityResponse} from "@/types/auth";

export async function GET() {
  const accessToken = (await cookies()).get(AUTH_COOKIES.access)?.value;
  if (!accessToken) {
    return NextResponse.json({code: "UNAUTHENTICATED"}, {status: 401});
  }

  try {
    const response = await getBackendClient().get<SuperAdminIdentityResponse>(
      "/api/super-admin/me",
      {headers: {Authorization: `Bearer ${accessToken}`}},
    );

    return NextResponse.json({authenticated: true, ...response.data});
  } catch (error) {
    const status = error && typeof error === "object" && "response" in error
      ? (error as {response?: {status?: number}}).response?.status
      : undefined;

    if (status === 401) {
      const response = NextResponse.json({code: "UNAUTHENTICATED"}, {status: 401});
      clearAuthCookies(response);
      return response;
    }

    const normalized = normalizeBackendError(error, "Unable to verify the current session");
    return NextResponse.json(normalized.body, {status: normalized.status});
  }
}
