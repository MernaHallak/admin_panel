import {cookies} from "next/headers";
import {NextRequest, NextResponse} from "next/server";

import {getBackendClient} from "@/lib/backend-client";
import {AUTH_COOKIES} from "@/lib/auth/cookies";
import {normalizeBackendError} from "@/lib/server/backend-error";

const nullableStringFields = [
  "name_ar",
  "description",
  "description_ar",
  "location",
  "location_ar",
  "logo_url",
  "cover_url",
  "phone",
  "whatsapp_url",
  "facebook_url",
  "instagram_url",
  "telegram_url",
] as const;

const stringFields = ["name", "slug"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getCreateStorePayload(value: unknown) {
  if (!isRecord(value)) return undefined;

  const payload: Record<string, unknown> = {};

  for (const field of stringFields) {
    if (typeof value[field] === "string") payload[field] = value[field];
  }

  for (const field of nullableStringFields) {
    if (typeof value[field] === "string" || value[field] === null) {
      payload[field] = value[field];
    }
  }

  if (typeof value.is_active === "boolean") {
    payload.is_active = value.is_active;
  }

  if (isRecord(value.social_links)) {
    payload.social_links = value.social_links;
  }

  return payload;
}

export async function GET(request: NextRequest) {
  const {searchParams} = request.nextUrl;
  const q = searchParams.get("q");
  const status = searchParams.get("status");
  const sort = searchParams.get("sort");
  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  const params = {
    ...(q ? {q} : {}),
    ...(status ? {status} : {}),
    ...(sort ? {sort} : {}),
    ...(page ? {page} : {}),
    ...(limit ? {limit} : {}),
  };

  const accessToken = (await cookies()).get(AUTH_COOKIES.access)?.value;
  if (!accessToken) {
    return NextResponse.json({code: "UNAUTHENTICATED"}, {status: 401});
  }

  try {
    const response = await getBackendClient().get("/api/super-admin/stores", {
      headers: {Authorization: `Bearer ${accessToken}`},
      params,
    });

    return NextResponse.json(response.data, {
      headers: {"Cache-Control": "no-store"},
    });
  } catch (error) {
    const normalized = normalizeBackendError(error, "Unable to load stores");
    return NextResponse.json(normalized.body, {status: normalized.status});
  }
}

export async function POST(request: NextRequest) {
  const accessToken = (await cookies()).get(AUTH_COOKIES.access)?.value;
  if (!accessToken) {
    return NextResponse.json({code: "UNAUTHENTICATED"}, {status: 401});
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {message: "Invalid JSON body", code: "INVALID_JSON"},
      {status: 400},
    );
  }

  const payload = getCreateStorePayload(body);
  if (!payload) {
    return NextResponse.json(
      {message: "Validation failed", code: "INVALID_BODY"},
      {status: 400},
    );
  }

  try {
    const response = await getBackendClient().post(
      "/api/super-admin/stores",
      payload,
      {headers: {Authorization: `Bearer ${accessToken}`}},
    );

    return NextResponse.json(response.data, {
      headers: {"Cache-Control": "no-store"},
    });
  } catch (error) {
    const normalized = normalizeBackendError(error, "Unable to create store");
    return NextResponse.json(normalized.body, {status: normalized.status});
  }
}
