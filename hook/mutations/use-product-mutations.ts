import {useMutation, useQueryClient} from "@tanstack/react-query";

import {
  createSuperAdminProduct,
  deleteSuperAdminProduct,
  updateSuperAdminProduct,
  deleteSuperAdminProductImage,
} from "@/api/products";
import {queryKeys} from "@/api/query-keys";
import type {
  CreateSuperAdminProductRequest,
  UpdateSuperAdminProductRequest,
} from "@/types/product";

async function invalidateProductQueries(queryClient: ReturnType<typeof useQueryClient>, productId?: string) {
  await Promise.all([
    queryClient.invalidateQueries({queryKey: ["store-products"]}),
    queryClient.invalidateQueries({queryKey: queryKeys.products}),
    queryClient.invalidateQueries({queryKey: queryKeys.overview}),
    ...(productId ? [queryClient.invalidateQueries({queryKey: queryKeys.product(productId)})] : []),
  ]);
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSuperAdminProduct,
    onSuccess: async () => invalidateProductQueries(queryClient),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, product}: {id: string; product: UpdateSuperAdminProductRequest}) =>
      updateSuperAdminProduct(id, product),
    onSuccess: async (_data, variables) => invalidateProductQueries(queryClient, variables.id),
  });
}

export function useToggleProductStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, is_active}: {id: string; is_active: boolean}) =>
      updateSuperAdminProduct(id, {is_active}),
    onSuccess: async (_data, variables) => invalidateProductQueries(queryClient, variables.id),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id}: {id: string}) => deleteSuperAdminProduct(id),
    onSuccess: async (_data, variables) => invalidateProductQueries(queryClient, variables.id),
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({id, publicId}: {id: string; publicId: string}) => deleteSuperAdminProductImage(id, publicId),
    onSuccess: async (_data, variables) => {
      await Promise.all([queryClient.invalidateQueries({queryKey: ["store-products"]}), queryClient.invalidateQueries({queryKey: queryKeys.product(variables.id)})]);
    },
  });
}
