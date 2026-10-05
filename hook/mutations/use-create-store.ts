"use client";

import {useMutation, useQueryClient} from "@tanstack/react-query";

import {createStore} from "@/api/stores";
import {queryKeys} from "@/api/query-keys";
import type {CreateStoreRequest} from "@/types/store";

export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (store: CreateStoreRequest) => createStore(store),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({queryKey: queryKeys.stores()}),
        queryClient.invalidateQueries({queryKey: queryKeys.overview}),
      ]);
    },
  });
}
