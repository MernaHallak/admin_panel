import {cookies} from "next/headers";
import {NextResponse} from "next/server";

import {AUTH_COOKIES} from "@/lib/auth/cookies";
import {getBackendClient} from "@/lib/backend-client";
import {normalizeBackendError} from "@/lib/server/backend-error";

export async function GET() {
  const accessToken = (await cookies()).get(AUTH_COOKIES.access)?.value;
  if (!accessToken) return NextResponse.json({code: "UNAUTHENTICATED"}, {status: 401});

  try {
    const response = await getBackendClient().get("/api/super-admin/overview", {
      headers: {Authorization: `Bearer ${accessToken}`},
    });
    return NextResponse.json(response.data, {headers: {"Cache-Control": "no-store"}});
  } catch (error) {
    const normalized = normalizeBackendError(error, "Unable to load overview");
    return NextResponse.json(normalized.body, {status: normalized.status});
  }
}
