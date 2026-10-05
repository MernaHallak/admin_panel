import "server-only";

import {cookies} from "next/headers";

import {getBackendClient} from "@/lib/backend-client";
import {AUTH_COOKIES} from "@/lib/auth/cookies";
import type {SuperAdminIdentityResponse} from "@/types/auth";

export type SessionStatus =
  | "authenticated"
  | "unauthenticated"
  | "unavailable"
  | "forbidden";

export async function getSessionStatus(): Promise<SessionStatus> {
  const accessToken = (await cookies()).get(AUTH_COOKIES.access)?.value;
  if (!accessToken) return "unauthenticated";

  try {
    await getBackendClient().get<SuperAdminIdentityResponse>("/api/super-admin/me", {
      headers: {Authorization: `Bearer ${accessToken}`},
    });
    return "authenticated";
  } catch (error) {
    const status = error && typeof error === "object" && "response" in error
      ? (error as {response?: {status?: number}}).response?.status
      : undefined;

    if (status === 401) return "unauthenticated";
    if (status === 403) return "forbidden";
    return "unavailable";
  }
}

export async function hasValidSession(): Promise<boolean> {
  return (await getSessionStatus()) === "authenticated";
}
