import {cookies} from "next/headers";
import {NextResponse} from "next/server";

import {AUTH_COOKIES} from "@/lib/auth/cookies";
import {getBackendClient} from "@/lib/backend-client";
import {normalizeBackendError} from "@/lib/server/backend-error";

interface StoreDetailsRouteProps {
  params: Promise<{id: string}>;
}

const nullableStringFields = [
  "name",
  "name_ar",
  "description",
  "description_ar",
  "location",
  "location_ar",
  "phone",
  "logo_url",
  "cover_url",
  "whatsapp_url",
  "facebook_url",
  "instagram_url",
  "telegram_url",
] as const;

const stringFields = ["slug"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getUpdateStorePayload(value: unknown) {
  if (!isRecord(value)) return undefined;

  const payload: Record<string, unknown> = {};

  for (const field of nullableStringFields) {
    if (typeof value[field] === "string" || value[field] === null) {
      payload[field] = value[field];
    }
  }

  for (const field of stringFields) {
    if (typeof value[field] === "string") payload[field] = value[field];
  }

  if (typeof value.is_active === "boolean") {
    payload.is_active = value.is_active;
  }

  if (isRecord(value.social_links)) {
    payload.social_links = value.social_links;
  }

  return Object.keys(payload).length ? payload : undefined;
}

export async function GET(_request: Request, {params}: StoreDetailsRouteProps) {
  const accessToken = (await cookies()).get(AUTH_COOKIES.access)?.value;
  if (!accessToken) {
    return NextResponse.json({code: "UNAUTHENTICATED"}, {status: 401});
  }

  const {id} = await params;

  try {
    const response = await getBackendClient().get(`/api/super-admin/stores/${id}`, {
      headers: {Authorization: `Bearer ${accessToken}`},
    });

    return NextResponse.json(response.data, {
      headers: {"Cache-Control": "no-store"},
    });
  } catch (error) {
    const normalized = normalizeBackendError(error, "Unable to load store details");
    return NextResponse.json(normalized.body, {status: normalized.status});
  }
}

export async function PATCH(request: Request, {params}: StoreDetailsRouteProps) {
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
  const payload = getUpdateStorePayload(body);

  if (!payload) {
    return NextResponse.json(
      {message: "Validation failed", code: "NO_FIELDS"},
      {status: 400},
    );
  }

  const {id} = await params;

  try {
    const response = await getBackendClient().patch(`/api/super-admin/stores/${id}`, payload, {
      headers: {Authorization: `Bearer ${accessToken}`},
    });

    return NextResponse.json(response.data, {
      headers: {"Cache-Control": "no-store"},
    });
  } catch (error) {
    const normalized = normalizeBackendError(error, "Unable to update store");
    return NextResponse.json(normalized.body, {status: normalized.status});
  }
}
