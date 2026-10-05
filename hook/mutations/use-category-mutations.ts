import {useMutation, useQueryClient} from "@tanstack/react-query";
import {createSuperAdminCategory, deleteSuperAdminCategory, updateSuperAdminCategory} from "@/api/categories";
import {queryKeys} from "@/api/query-keys";
import type {CreateSuperAdminCategoryRequest, UpdateSuperAdminCategoryRequest} from "@/types/category";

async function invalidate(queryClient: ReturnType<typeof useQueryClient>, id?: string) { await Promise.all([queryClient.invalidateQueries({queryKey: queryKeys.categories()}), queryClient.invalidateQueries({queryKey: queryKeys.overview}), queryClient.invalidateQueries({queryKey: ["products"]}), queryClient.invalidateQueries({queryKey: ["store-products"]}), queryClient.invalidateQueries({queryKey: ["subcategories"]}), ...(id ? [queryClient.invalidateQueries({queryKey: queryKeys.category(id)})] : [])]); }
export function useCreateCategory() { const queryClient = useQueryClient(); return useMutation({mutationFn: createSuperAdminCategory, onSuccess: (data) => invalidate(queryClient, data.category.id)}); }
export function useUpdateCategory() { const queryClient = useQueryClient(); return useMutation({mutationFn: ({id, payload}: {id: string; payload: UpdateSuperAdminCategoryRequest}) => updateSuperAdminCategory(id, payload), onSuccess: (_data, vars) => invalidate(queryClient, vars.id)}); }
export function useDeleteCategory() { const queryClient = useQueryClient(); return useMutation({mutationFn: deleteSuperAdminCategory, onSuccess: (_data, id: string) => invalidate(queryClient, id)}); }
