import { apiClient } from "@/api/client";
import type { CategoryMutationResponse, CategoryOptionsResponse, CreateSuperAdminCategoryRequest, SubcategoryOptionsResponse, SuperAdminCategoriesParams, SuperAdminCategoriesResponse, SuperAdminCategoryResponse, UpdateSuperAdminCategoryRequest } from "@/types/category";

export async function getCategories() { return (await apiClient.get<CategoryOptionsResponse>("/super-admin/categories", { params: { status: "active", limit: 100, sort: "name_asc" } })).data; }

export async function getSubcategories(categoryId: string) { return (await apiClient.get<SubcategoryOptionsResponse>("/super-admin/subcategories", { params: { category_id: categoryId, status: "active", limit: 100, sort: "name_asc" } })).data; }

export async function getSuperAdminCategories(params: SuperAdminCategoriesParams) { return (await apiClient.get<SuperAdminCategoriesResponse>("/super-admin/categories", { params })).data; }

export async function getSuperAdminCategory(id: string) { return (await apiClient.get<SuperAdminCategoryResponse>(`/super-admin/categories/${id}`)).data; }

export async function createSuperAdminCategory(payload: CreateSuperAdminCategoryRequest) { return (await apiClient.post<CategoryMutationResponse>("/super-admin/categories", payload)).data; }

export async function updateSuperAdminCategory(id: string, payload: UpdateSuperAdminCategoryRequest) { return (await apiClient.patch<CategoryMutationResponse>(`/super-admin/categories/${id}`, payload)).data; }

export async function deleteSuperAdminCategory(id: string) { return (await apiClient.delete(`/super-admin/categories/${id}`)).data; }
