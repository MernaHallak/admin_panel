"use client";

import {useMutation, useQueryClient} from "@tanstack/react-query";

import {updateStore} from "@/api/stores";
import {queryKeys} from "@/api/query-keys";
import type {UpdateStoreRequest} from "@/types/store";

interface UpdateStoreVariables {
  id: string;
  store: UpdateStoreRequest;
}

export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({id, store}: UpdateStoreVariables) => updateStore(id, store),
    onSuccess: async (_data, {id, store}) => {
      const invalidations = [
        queryClient.invalidateQueries({queryKey: queryKeys.store(id)}),
        queryClient.invalidateQueries({queryKey: queryKeys.stores()}),
      ];
      if (store.is_active !== undefined) {
        invalidations.push(queryClient.invalidateQueries({queryKey: queryKeys.overview}));
      }
      await Promise.all(invalidations);
    },
  });
}
