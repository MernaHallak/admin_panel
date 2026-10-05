import {cookies} from "next/headers";
import {NextRequest, NextResponse} from "next/server";
import axios from "axios";
import {AUTH_COOKIES} from "@/lib/auth/cookies";
import {getBackendClient} from "@/lib/backend-client";
import {normalizeBackendError} from "@/lib/server/backend-error";

const UPDATE_FIELDS = ["full_name", "profile_is_active", "assignment_is_active", "store_id"] as const;
interface RouteProps {params: Promise<{id: string}>;}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }

function responseDiagnostic(value: unknown) {
  if (!isRecord(value) || !isRecord(value.response)) return undefined;

  return {
    status: value.response.status,
    data: value.response.data,
    code: value.code,
    message: typeof value.message === "string" ? value.message : undefined,
  };
}

export async function GET(_: NextRequest, {params}: RouteProps) {
  const accessToken = (await cookies()).get(AUTH_COOKIES.access)?.value;
  if (!accessToken) return NextResponse.json({code: "UNAUTHENTICATED"}, {status: 401});
  const {id} = await params;
  try {
    const response = await getBackendClient().get(`/api/super-admin/store-admins/${id}`, {headers: {Authorization: `Bearer ${accessToken}`}});
    return NextResponse.json(response.data, {headers: {"Cache-Control": "no-store"}});
  } catch (error) {
    const normalized = normalizeBackendError(error, "Unable to load store admin");
    return NextResponse.json(normalized.body, {status: normalized.status});
  }
}

export async function PATCH(request: NextRequest, {params}: RouteProps) {
  const accessToken = (await cookies()).get(AUTH_COOKIES.access)?.value;
  if (!accessToken) return NextResponse.json({code: "UNAUTHENTICATED"}, {status: 401});
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({code: "INVALID_JSON"}, {status: 400}); }
  if (!isRecord(body)) return NextResponse.json({code: "INVALID_STORE_ADMIN"}, {status: 400});
  const payload = Object.fromEntries(UPDATE_FIELDS.flatMap((field) => {
    const value = body[field];
    const valid = field === "full_name" || field === "store_id" ? typeof value === "string" : typeof value === "boolean";
    return valid ? [[field, value]] : [];
  }));
  if (!Object.keys(payload).length) return NextResponse.json({code: "INVALID_STORE_ADMIN"}, {status: 400});
  const {id} = await params;
  try {
    const response = await getBackendClient().patch(`/api/super-admin/store-admins/${id}`, payload, {headers: {Authorization: `Bearer ${accessToken}`}});
    return NextResponse.json(response.data, {headers: {"Cache-Control": "no-store"}});
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      const errorRecord = isRecord(error) ? error : undefined;
      console.error("Store admin PATCH upstream failure", {
        axiosError: axios.isAxiosError(error),
        responseStatus: errorRecord?.response && isRecord(errorRecord.response) ? errorRecord.response.status : undefined,
        responseData: errorRecord?.response && isRecord(errorRecord.response) ? errorRecord.response.data : undefined,
        code: errorRecord?.code,
        message: error instanceof Error ? error.message : undefined,
        cause: responseDiagnostic(errorRecord?.cause),
      });
    }
    const normalized = normalizeBackendError(error, "Unable to update store admin");
    return NextResponse.json(normalized.body, {status: normalized.status});
  }
}
