import {apiClient} from "@/api/client";
import type {
  CreateStoreRequest,
  CreateStoreResponse,
  StoreDetailsResponse,
  StoresListParams,
  StoresListResponse,
  UpdateStoreRequest,
  UpdateStoreResponse,
} from "@/types/store";

export async function getStores(
  params?: StoresListParams,
): Promise<StoresListResponse> {
  const response = await apiClient.get<StoresListResponse>("/super-admin/stores", {
    params,
  });

  return response.data;
}

export async function getStoreDetails(id: string): Promise<StoreDetailsResponse> {
  const response = await apiClient.get<StoreDetailsResponse>(`/super-admin/stores/${id}`);

  return response.data;
}

export async function createStore(
  store: CreateStoreRequest,
): Promise<CreateStoreResponse> {
  const response = await apiClient.post<CreateStoreResponse>(
    "/super-admin/stores",
    store,
  );

  return response.data;
}

export async function updateStore(
  id: string,
  store: UpdateStoreRequest,
): Promise<UpdateStoreResponse> {
  const response = await apiClient.patch<UpdateStoreResponse>(
    `/super-admin/stores/${id}`,
    store,
  );

  return response.data;
}
