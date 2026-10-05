import {cookies} from "next/headers";
import {NextRequest, NextResponse} from "next/server";
import {AUTH_COOKIES} from "@/lib/auth/cookies";
import {getBackendClient} from "@/lib/backend-client";
import {normalizeBackendError} from "@/lib/server/backend-error";

const QUERY_PARAMETERS = ["q", "status", "store_id", "sort", "page", "limit"] as const;
const CREATE_FIELDS = ["email", "password", "full_name", "store_id"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function GET(request: NextRequest) {
  const accessToken = (await cookies()).get(AUTH_COOKIES.access)?.value;
  if (!accessToken) return NextResponse.json({code: "UNAUTHENTICATED"}, {status: 401});
  const params = Object.fromEntries(QUERY_PARAMETERS.flatMap((key) => {
    const value = request.nextUrl.searchParams.get(key);
    return value ? [[key, value]] : [];
  }));
  try {
    const response = await getBackendClient().get("/api/super-admin/store-admins", {headers: {Authorization: `Bearer ${accessToken}`}, params});
    return NextResponse.json(response.data, {headers: {"Cache-Control": "no-store"}});
  } catch (error) {
    const normalized = normalizeBackendError(error, "Unable to load store admins");
    return NextResponse.json(normalized.body, {status: normalized.status});
  }
}

export async function POST(request: NextRequest) {
  const accessToken = (await cookies()).get(AUTH_COOKIES.access)?.value;
  if (!accessToken) return NextResponse.json({code: "UNAUTHENTICATED"}, {status: 401});
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({code: "INVALID_JSON"}, {status: 400}); }
  if (!isRecord(body) || !CREATE_FIELDS.every((field) => typeof body[field] === "string")) return NextResponse.json({code: "INVALID_STORE_ADMIN"}, {status: 400});
  const payload = Object.fromEntries(CREATE_FIELDS.map((field) => [field, body[field]]));
  try {
    const response = await getBackendClient().post("/api/super-admin/store-admins", payload, {headers: {Authorization: `Bearer ${accessToken}`}});
    return NextResponse.json(response.data, {headers: {"Cache-Control": "no-store"}});
  } catch (error) {
    const normalized = normalizeBackendError(error, "Unable to create store admin");
    return NextResponse.json(normalized.body, {status: normalized.status});
  }
}
