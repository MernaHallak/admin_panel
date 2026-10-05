import {cookies} from "next/headers";
import {NextResponse} from "next/server";

import {AUTH_COOKIES} from "@/lib/auth/cookies";
import {getBackendClient} from "@/lib/backend-client";
import {normalizeBackendError} from "@/lib/server/backend-error";

interface ProductRouteProps { params: Promise<{id: string}>; }

const UPDATE_FIELDS = ["name", "name_ar", "category", "subcategory_id", "price", "description", "description_ar", "is_active"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getUpdatePayload(value: unknown) {
  if (!isRecord(value)) return undefined;
  const payload: Record<string, unknown> = {};
  for (const field of UPDATE_FIELDS) {
    const candidate = value[field];
    if (typeof candidate === "string" || typeof candidate === "number" || typeof candidate === "boolean" || candidate === null) payload[field] = candidate;
  }
  return Object.keys(payload).length ? payload : undefined;
}

async function getAccessToken() {
  return (await cookies()).get(AUTH_COOKIES.access)?.value;
}

export async function GET(_request: Request, {params}: ProductRouteProps) {
  const accessToken = await getAccessToken();
  if (!accessToken) return NextResponse.json({code: "UNAUTHENTICATED"}, {status: 401});
  const {id} = await params;
  try {
    const response = await getBackendClient().get(`/api/super-admin/products/${id}`, {headers: {Authorization: `Bearer ${accessToken}`}});
    return NextResponse.json(response.data, {headers: {"Cache-Control": "no-store"}});
  } catch (error) {
    const normalized = normalizeBackendError(error, "Unable to load product");
    return NextResponse.json(normalized.body, {status: normalized.status});
  }
}

export async function PATCH(request: Request, {params}: ProductRouteProps) {
  const accessToken = await getAccessToken();
  if (!accessToken) return NextResponse.json({code: "UNAUTHENTICATED"}, {status: 401});
  const {id} = await params;
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    try { const response = await getBackendClient().patch(`/api/super-admin/products/${id}`, await request.formData(), {headers: {Authorization: `Bearer ${accessToken}`}}); return NextResponse.json(response.data, {headers: {"Cache-Control": "no-store"}}); } catch (error) { const normalized = normalizeBackendError(error, "Unable to update product"); return NextResponse.json(normalized.body, {status: normalized.status}); }
  }
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({message: "Validation failed", code: "INVALID_JSON"}, {status: 400}); }
  const payload = getUpdatePayload(body);
  if (!payload) return NextResponse.json({message: "Validation failed", code: "NO_FIELDS"}, {status: 400});
  try {
    const response = await getBackendClient().patch(`/api/super-admin/products/${id}`, payload, {headers: {Authorization: `Bearer ${accessToken}`}});
    return NextResponse.json(response.data, {headers: {"Cache-Control": "no-store"}});
  } catch (error) {
    const normalized = normalizeBackendError(error, "Unable to update product");
    return NextResponse.json(normalized.body, {status: normalized.status});
  }
}

export async function DELETE(_request: Request, {params}: ProductRouteProps) {
  const accessToken = await getAccessToken();
  if (!accessToken) return NextResponse.json({code: "UNAUTHENTICATED"}, {status: 401});
  const {id} = await params;
  try {
    const response = await getBackendClient().delete(`/api/super-admin/products/${id}`, {headers: {Authorization: `Bearer ${accessToken}`}});
    return NextResponse.json(response.data, {headers: {"Cache-Control": "no-store"}});
  } catch (error) {
    const normalized = normalizeBackendError(error, "Unable to delete product");
    return NextResponse.json(normalized.body, {status: normalized.status});
  }
}
