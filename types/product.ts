import type {LocalizedText} from "@/types/store";

export type SuperAdminProductStatus = "all" | "active" | "inactive";
export type SuperAdminProductSort =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc";

export interface SuperAdminProduct {
  id: string;
  store_id: string;
  store_name?: string | null;
  store?: {id: string; slug?: string; is_active?: boolean};
  name: string;
  name_ar: string | null;
  name_i18n?: LocalizedText | null;
  category: string;
  category_slug: string;
  /** Reserved for a future backend response; it is not returned today. */
  category_i18n?: LocalizedText | null;
  subcategory: string | null;
  subcategory_slug: string | null;
  /** Reserved for a future backend response; it is not returned today. */
  subcategory_i18n?: LocalizedText | null;
  price: number;
  description: string | null;
  description_ar: string | null;
  description_i18n?: LocalizedText | null;
  image_url: string | null;
  images?: {url?: string; secure_url?: string; public_id: string}[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SuperAdminProductsPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface SuperAdminProductsResponse {
  data: SuperAdminProduct[];
  pagination: SuperAdminProductsPagination;
}

export interface SuperAdminProductsParams {
  store_id?: string;
  q?: string;
  category?: string;
  category_slug?: string;
  subcategory?: string;
  subcategory_id?: string;
  subcategory_slug?: string;
  status?: SuperAdminProductStatus;
  sort?: SuperAdminProductSort;
  page?: number;
  limit?: number;
}

export interface SuperAdminProductResponse {
  product: SuperAdminProduct;
}

export interface CreateSuperAdminProductRequest {
  store_id: string;
  name: string;
  name_ar?: string | null;
  category: string;
  subcategory_id?: string | null;
  price: number;
  description?: string | null;
  description_ar?: string | null;
  is_active?: boolean;
  images?: File[];
}

export type UpdateSuperAdminProductRequest = Omit<
  Partial<CreateSuperAdminProductRequest>,
  "store_id"
>;

export interface ProductMutationResponse {
  message: string;
  product: Partial<SuperAdminProduct> & Pick<SuperAdminProduct, "id">;
}

export interface DeleteSuperAdminProductResponse {
  message: string;
  deleted_product_id: string;
}
