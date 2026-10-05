import {useMutation, useQueryClient} from "@tanstack/react-query";
import {createSuperAdminSubcategory, deleteSuperAdminSubcategory, updateSuperAdminSubcategory} from "@/api/subcategories";
import {queryKeys} from "@/api/query-keys";
import type {CreateSuperAdminSubcategoryRequest, UpdateSuperAdminSubcategoryRequest} from "@/types/category";
async function invalidate(queryClient: ReturnType<typeof useQueryClient>, id?: string) { await Promise.all([queryClient.invalidateQueries({queryKey: queryKeys.subcategories()}), queryClient.invalidateQueries({queryKey: ["products"]}), queryClient.invalidateQueries({queryKey: ["store-products"]}), queryClient.invalidateQueries({queryKey: queryKeys.overview}), ...(id ? [queryClient.invalidateQueries({queryKey: queryKeys.subcategory(id)})] : [])]); }
export function useCreateSubcategory() { const queryClient = useQueryClient(); return useMutation({mutationFn: createSuperAdminSubcategory, onSuccess: (data) => invalidate(queryClient, data.subcategory.id)}); }
export function useUpdateSubcategory() { const queryClient = useQueryClient(); return useMutation({mutationFn: ({id,payload}: {id:string;payload:UpdateSuperAdminSubcategoryRequest}) => updateSuperAdminSubcategory(id,payload), onSuccess: (_data, vars) => invalidate(queryClient, vars.id)}); }
export function useDeleteSubcategory() { const queryClient = useQueryClient(); return useMutation({mutationFn: deleteSuperAdminSubcategory, onSuccess: (_data, id:string) => invalidate(queryClient,id)}); }
