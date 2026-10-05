"use client";

import {useMutation, useQueryClient} from "@tanstack/react-query";

import {updateStore} from "@/api/stores";
import {queryKeys} from "@/api/query-keys";

interface ToggleStoreStatusVariables {
  id: string;
  isActive: boolean;
}

export function useToggleStoreStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({id, isActive}: ToggleStoreStatusVariables) =>
      updateStore(id, {is_active: isActive}),
    onSuccess: async (_data, {id}) => {
      await Promise.all([
        queryClient.invalidateQueries({queryKey: queryKeys.store(id)}),
        queryClient.invalidateQueries({queryKey: queryKeys.stores()}),
        queryClient.invalidateQueries({queryKey: queryKeys.overview}),
      ]);
    },
  });
}
