import {apiClient} from "@/api/client";
import type {CreateSuperAdminSubcategoryRequest, SubcategoryMutationResponse, SuperAdminSubcategoriesParams, SuperAdminSubcategoriesResponse, SuperAdminSubcategoryResponse, UpdateSuperAdminSubcategoryRequest} from "@/types/category";
export async function getSuperAdminSubcategories(params: SuperAdminSubcategoriesParams) { return (await apiClient.get<SuperAdminSubcategoriesResponse>("/super-admin/subcategories", {params})).data; }
export async function getSuperAdminSubcategory(id: string) { return (await apiClient.get<SuperAdminSubcategoryResponse>(`/super-admin/subcategories/${id}`)).data; }
export async function createSuperAdminSubcategory(payload: CreateSuperAdminSubcategoryRequest) { return (await apiClient.post<SubcategoryMutationResponse>("/super-admin/subcategories", payload)).data; }
export async function updateSuperAdminSubcategory(id: string, payload: UpdateSuperAdminSubcategoryRequest) { return (await apiClient.patch<SubcategoryMutationResponse>(`/super-admin/subcategories/${id}`, payload)).data; }
export async function deleteSuperAdminSubcategory(id: string) { return (await apiClient.delete(`/super-admin/subcategories/${id}`)).data; }
