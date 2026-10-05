import {useQuery} from "@tanstack/react-query";
import {getSuperAdminSubcategories, getSuperAdminSubcategory} from "@/api/subcategories";
import {queryKeys} from "@/api/query-keys";
import {normalizeApiError} from "@/lib/api-error";
import type {SuperAdminSubcategoriesParams} from "@/types/category";
function retry(failureCount: number, error: unknown) { const status = normalizeApiError(error).status; return status !== 401 && status !== 403 && status !== 404 && failureCount < 2; }
export function useSuperAdminSubcategories(params: SuperAdminSubcategoriesParams) { return useQuery({queryKey: queryKeys.subcategories(params), queryFn: () => getSuperAdminSubcategories(params), retry}); }
export function useSuperAdminSubcategory(id: string, enabled = true) { return useQuery({queryKey: queryKeys.subcategory(id), queryFn: () => getSuperAdminSubcategory(id), enabled, retry}); }
