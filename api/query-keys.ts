import type {SuperAdminProductsParams} from "@/types/product";
import type {StoresListParams} from "@/types/store";
import type {StoreAdminAssignmentsParams} from "@/types/store-admin";
import type {SuperAdminCategoriesParams} from "@/types/category";
import type {SuperAdminSubcategoriesParams} from "@/types/category";

export const queryKeys = {
  overview: ["overview"] as const,
  categories: (params?: SuperAdminCategoriesParams) => params ? ["categories", params] as const : ["categories"] as const,
  category: (id: string) => ["category", id] as const,
  subcategories: (params?: SuperAdminSubcategoriesParams) => params ? ["subcategories", params] as const : ["subcategories"] as const,
  subcategory: (id: string) => ["subcategory", id] as const,
  storeAdmins: (params: StoreAdminAssignmentsParams) => ["store-admins", params] as const,
  storeAdmin: (id: string) => ["store-admin", id] as const,
  stores: (params?: StoresListParams) => params === undefined
    ? ["stores"] as const
    : ["stores", params] as const,
  store: (id: string) => ["store", id] as const,
  storeProducts: (params: SuperAdminProductsParams) => ["store-products", params] as const,
  products: ["products"] as const,
  globalProducts: (params: SuperAdminProductsParams) => ["products", params] as const,
  product: (id: string) => ["product", id] as const,
};
