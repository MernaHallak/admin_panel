import {useQuery} from "@tanstack/react-query";
import {getStoreAdmin, getStoreAdmins} from "@/api/store-admins";
import {queryKeys} from "@/api/query-keys";
import {normalizeApiError} from "@/lib/api-error";
import type {StoreAdminAssignmentsParams} from "@/types/store-admin";

function retry(failureCount: number, error: unknown) {
  const status = normalizeApiError(error).status;
  return status !== 401 && status !== 403 && status !== 404 && failureCount < 2;
}

export function useStoreAdmins(params: StoreAdminAssignmentsParams) {
  return useQuery({queryKey: queryKeys.storeAdmins(params), queryFn: () => getStoreAdmins(params), retry});
}

export function useStoreAdmin(id: string, enabled = true) {
  return useQuery({queryKey: queryKeys.storeAdmin(id), queryFn: () => getStoreAdmin(id), retry, enabled});
}
