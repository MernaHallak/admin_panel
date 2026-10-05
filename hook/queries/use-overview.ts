import {useQuery} from "@tanstack/react-query";

import {getSuperAdminOverview} from "@/api/overview";
import {queryKeys} from "@/api/query-keys";
import {normalizeApiError} from "@/lib/api-error";

export function useOverview() {
  return useQuery({
    queryKey: queryKeys.overview,
    queryFn: getSuperAdminOverview,
    retry: (failureCount, error) => {
      const status = normalizeApiError(error).status;
      return status !== 401 && status !== 403 && failureCount < 2;
    },
  });
}
