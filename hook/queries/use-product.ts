import {useQuery} from "@tanstack/react-query";

import {getSuperAdminProduct} from "@/api/products";
import {queryKeys} from "@/api/query-keys";
import {normalizeApiError} from "@/lib/api-error";

export function useProduct(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => getSuperAdminProduct(id),
    enabled,
    retry: (failureCount, error) => {
      const status = normalizeApiError(error).status;
      return status !== 401 && status !== 403 && status !== 404 && failureCount < 2;
    },
  });
}
