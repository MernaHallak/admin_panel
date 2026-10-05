import {cookies} from "next/headers";
import {NextRequest, NextResponse} from "next/server";

import {AUTH_COOKIES} from "@/lib/auth/cookies";
import {getBackendClient} from "@/lib/backend-client";
import {normalizeBackendError} from "@/lib/server/backend-error";

const QUERY_PARAMETERS = [
  "q", "store_id", "category", "category_slug", "subcategory", "subcategory_id", "subcategory_slug",
  "status", "sort", "page", "limit",
] as const;
const CREATE_FIELDS = [
  "store_id", "name", "name_ar", "category", "subcategory_id", "price", "description", "description_ar", "is_active",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getCreatePayload(value: unknown) {
  if (!isRecord(value)) return undefined;
  const payload: Record<string, unknown> = {};

  for (const field of CREATE_FIELDS) {
    const candidate = value[field];
    if (typeof candidate === "string" || typeof candidate === "number" || typeof candidate === "boolean" || candidate === null) {
      payload[field] = candidate;
    }
  }

  return typeof payload.store_id === "string" && typeof payload.name === "string" &&
    typeof payload.category === "string" && typeof payload.price === "number"
    ? payload
    : undefined;
}

export async function GET(request: NextRequest) {
  const accessToken = (await cookies()).get(AUTH_COOKIES.access)?.value;
  if (!accessToken) {
    return NextResponse.json({code: "UNAUTHENTICATED"}, {status: 401});
  }

  const params = Object.fromEntries(
    QUERY_PARAMETERS.flatMap((key) => {
      const value = request.nextUrl.searchParams.get(key);
      return value ? [[key, value]] : [];
    }),
  );

  try {
    const response = await getBackendClient().get("/api/super-admin/products", {
      headers: {Authorization: `Bearer ${accessToken}`},
      params,
    });

    return NextResponse.json(response.data, {
      headers: {"Cache-Control": "no-store"},
    });
  } catch (error) {
    const normalized = normalizeBackendError(error, "Unable to load products");
    return NextResponse.json(normalized.body, {status: normalized.status});
  }
}

export async function POST(request: NextRequest) {
  const accessToken = (await cookies()).get(AUTH_COOKIES.access)?.value;
  if (!accessToken) return NextResponse.json({code: "UNAUTHENTICATED"}, {status: 401});

  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    try {
      const response = await getBackendClient().post("/api/super-admin/products", await request.formData(), {headers: {Authorization: `Bearer ${accessToken}`}});
      return NextResponse.json(response.data, {headers: {"Cache-Control": "no-store"}});
    } catch (error) { const normalized = normalizeBackendError(error, "Unable to create product"); return NextResponse.json(normalized.body, {status: normalized.status}); }
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({message: "Validation failed", code: "INVALID_JSON"}, {status: 400});
  }

  const payload = getCreatePayload(body);
  if (!payload) return NextResponse.json({message: "Validation failed", code: "INVALID_PRODUCT"}, {status: 400});

  try {
    const response = await getBackendClient().post("/api/super-admin/products", payload, {
      headers: {Authorization: `Bearer ${accessToken}`},
    });
    return NextResponse.json(response.data, {headers: {"Cache-Control": "no-store"}});
  } catch (error) {
    const normalized = normalizeBackendError(error, "Unable to create product");
    return NextResponse.json(normalized.body, {status: normalized.status});
  }
}
