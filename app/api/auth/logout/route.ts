import {cookies} from "next/headers";
import {NextResponse} from "next/server";

import {getBackendClient} from "@/lib/backend-client";
import {
  AUTH_COOKIES,
  BACKEND_AUTH_COOKIES,
  clearAuthCookies,
} from "@/lib/auth/cookies";

export async function POST() {
  const refreshToken = (await cookies()).get(AUTH_COOKIES.refresh)?.value;

  try {
    await getBackendClient().post(
      "/api/auth/logout",
      undefined,
      refreshToken
        ? {
          headers: {
            Cookie: `${BACKEND_AUTH_COOKIES.refresh}=${encodeURIComponent(refreshToken)}`,
          },
        }
        : undefined,
    );
  } catch {
    // Local logout must complete even when the backend is unavailable.
  }

  const response = NextResponse.json({message: "Logout successful"});
  clearAuthCookies(response);
  return response;
}
