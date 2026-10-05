import {useQuery} from "@tanstack/react-query";

import {getStoreDetails} from "@/api/stores";
import {queryKeys} from "@/api/query-keys";
import {normalizeApiError} from "@/lib/api-error";

export function useStoreDetails(id: string) {
  return useQuery({
    queryKey: queryKeys.store(id),
    queryFn: () => getStoreDetails(id),
    retry: (failureCount, error) => {
      const status = normalizeApiError(error).status;
      return status !== 401 && status !== 403 && status !== 404 && failureCount < 2;
    },
  });
}
