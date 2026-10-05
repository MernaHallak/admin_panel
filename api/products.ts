import {apiClient} from "@/api/client";
import type {
  CreateSuperAdminProductRequest,
  DeleteSuperAdminProductResponse,
  ProductMutationResponse,
  SuperAdminProductResponse,
  SuperAdminProductsParams,
  SuperAdminProductsResponse,
  UpdateSuperAdminProductRequest,
} from "@/types/product";

export async function getSuperAdminProducts(
  params: SuperAdminProductsParams,
): Promise<SuperAdminProductsResponse> {
  const response = await apiClient.get<SuperAdminProductsResponse>(
    "/super-admin/products",
    {params},
  );

  return response.data;
}

export async function getSuperAdminProduct(id: string): Promise<SuperAdminProductResponse> {
  const response = await apiClient.get<SuperAdminProductResponse>(`/super-admin/products/${id}`);
  return response.data;
}

export async function createSuperAdminProduct(
  product: CreateSuperAdminProductRequest,
): Promise<ProductMutationResponse> {
  const response = await apiClient.post<ProductMutationResponse>("/super-admin/products", toFormData(product));
  return response.data;
}

export async function updateSuperAdminProduct(
  id: string,
  product: UpdateSuperAdminProductRequest,
): Promise<ProductMutationResponse> {
  const response = await apiClient.patch<ProductMutationResponse>(`/super-admin/products/${id}`, toFormData(product));
  return response.data;
}

function toFormData(product: CreateSuperAdminProductRequest | UpdateSuperAdminProductRequest) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(product)) {
    if (value === undefined || value === null) continue;
    if (key === "images") { for (const image of value as File[]) formData.append("images", image); }
    else formData.append(key, String(value));
  }
  return formData;
}

export async function deleteSuperAdminProductImage(id: string, publicId: string) {
  return (await apiClient.delete(`/super-admin/products/${id}/images`, {data: {public_id: publicId}})).data;
}

export async function deleteSuperAdminProduct(id: string): Promise<DeleteSuperAdminProductResponse> {
  const response = await apiClient.delete<DeleteSuperAdminProductResponse>(`/super-admin/products/${id}`);
  return response.data;
}
