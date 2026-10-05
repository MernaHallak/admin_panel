import {useQuery} from "@tanstack/react-query";
import {getSuperAdminCategories, getSuperAdminCategory} from "@/api/categories";
import {queryKeys} from "@/api/query-keys";
import {normalizeApiError} from "@/lib/api-error";
import type {SuperAdminCategoriesParams} from "@/types/category";

function retry(failureCount: number, error: unknown) { const status = normalizeApiError(error).status; return status !== 401 && status !== 403 && status !== 404 && failureCount < 2; }
export function useSuperAdminCategories(params: SuperAdminCategoriesParams) { return useQuery({queryKey: queryKeys.categories(params), queryFn: () => getSuperAdminCategories(params), retry}); }
export function useSuperAdminCategory(id: string, enabled = true) { return useQuery({queryKey: queryKeys.category(id), queryFn: () => getSuperAdminCategory(id), enabled, retry}); }
