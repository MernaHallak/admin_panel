import {useQuery} from "@tanstack/react-query";

import {getStores} from "@/api/stores";
import {queryKeys} from "@/api/query-keys";
import {normalizeApiError} from "@/lib/api-error";
import type {StoresListParams} from "@/types/store";

export function useStores(params?: StoresListParams) {
  return useQuery({
    queryKey: queryKeys.stores(params),
    queryFn: () => getStores(params),
    retry: (failureCount, error) => {
      const status = normalizeApiError(error).status;
      return status !== 401 && status !== 403 && failureCount < 2;
    },
  });
}
