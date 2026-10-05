import {apiClient} from "@/api/client";
import type {CreateStoreAdminRequest, StoreAdminAssignmentResponse, StoreAdminAssignmentsParams, StoreAdminAssignmentsResponse, StoreAdminMutationResponse, UpdateStoreAdminRequest} from "@/types/store-admin";

export async function getStoreAdmins(params: StoreAdminAssignmentsParams) {
  return (await apiClient.get<StoreAdminAssignmentsResponse>("/super-admin/store-admins", {params})).data;
}

export async function getStoreAdmin(id: string) {
  return (await apiClient.get<StoreAdminAssignmentResponse>(`/super-admin/store-admins/${id}`)).data;
}

export async function createStoreAdmin(payload: CreateStoreAdminRequest) {
  return (await apiClient.post<StoreAdminMutationResponse>("/super-admin/store-admins", payload)).data;
}

export async function updateStoreAdmin(id: string, payload: UpdateStoreAdminRequest) {
  return (await apiClient.patch<StoreAdminMutationResponse>(`/super-admin/store-admins/${id}`, payload)).data;
}
