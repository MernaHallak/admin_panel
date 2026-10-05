import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {AUTH_COOKIES} from "@/lib/auth/cookies";
import {getBackendClient} from "@/lib/backend-client";
import {normalizeBackendError} from "@/lib/server/backend-error";
export async function DELETE(request: Request, {params}: {params: Promise<{id: string}>}) { const token = (await cookies()).get(AUTH_COOKIES.access)?.value; if (!token) return NextResponse.json({code: "UNAUTHENTICATED"}, {status: 401}); const {id} = await params; try { const response = await getBackendClient().delete(`/api/super-admin/products/${id}/images`, {headers: {Authorization: `Bearer ${token}`}, data: await request.json()}); return NextResponse.json(response.data); } catch (error) { const normalized = normalizeBackendError(error, "Unable to remove product image"); return NextResponse.json(normalized.body, {status: normalized.status}); } }
