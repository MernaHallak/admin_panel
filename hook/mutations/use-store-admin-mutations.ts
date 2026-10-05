import {useMutation, useQueryClient} from "@tanstack/react-query";
import {createStoreAdmin, updateStoreAdmin} from "@/api/store-admins";
import {queryKeys} from "@/api/query-keys";
import type {CreateStoreAdminRequest, UpdateStoreAdminRequest} from "@/types/store-admin";

async function invalidateStoreAdminQueries(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  await Promise.all([
    queryClient.invalidateQueries({queryKey: ["store-admins"]}),
    queryClient.invalidateQueries({queryKey: queryKeys.overview}),
    ...(id ? [queryClient.invalidateQueries({queryKey: queryKeys.storeAdmin(id)})] : []),
  ]);
}

export function useCreateStoreAdmin() {
  const queryClient = useQueryClient();
  return useMutation({mutationFn: createStoreAdmin, onSuccess: async (data) => invalidateStoreAdminQueries(queryClient, data.assignment.id)});
}

export function useUpdateStoreAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, payload}: {id: string; payload: UpdateStoreAdminRequest}) => updateStoreAdmin(id, payload),
    onSuccess: async (_data, variables) => invalidateStoreAdminQueries(queryClient, variables.id),
  });
}
