import {useQuery} from "@tanstack/react-query";

import {getSuperAdminProducts} from "@/api/products";
import {queryKeys} from "@/api/query-keys";
import {normalizeApiError} from "@/lib/api-error";
import type {SuperAdminProductsParams} from "@/types/product";

export function useStoreProducts(params: SuperAdminProductsParams) {
  return useQuery({
    queryKey: queryKeys.storeProducts(params),
    queryFn: () => getSuperAdminProducts(params),
    retry: (failureCount, error) => {
      const status = normalizeApiError(error).status;
      return status !== 401 && status !== 403 && failureCount < 2;
    },
  });
}
