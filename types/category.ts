import type {LocalizedText} from "@/types/store";

export interface CategoryOption {id: string; slug: string; name: string; name_i18n?: LocalizedText | null; is_active: boolean;}
export interface SubcategoryOption {id: string; category_id: string; category_slug: string; slug: string; name: string; name_i18n?: LocalizedText | null; is_active: boolean;}
export interface CategoryOptionsResponse {data: CategoryOption[]; pagination: {page: number; total_pages: number};}
export interface SubcategoryOptionsResponse {data: SubcategoryOption[]; pagination: {page: number; total_pages: number};}

export interface SuperAdminCategory extends CategoryOption {
  name_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  description_i18n?: LocalizedText | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SuperAdminCategoriesParams {status?: "all" | "active" | "inactive"; sort?: "name_asc" | "name_desc" | "newest" | "oldest"; page?: number; limit?: number;}
export interface SuperAdminCategoriesResponse {data: SuperAdminCategory[]; pagination: {page: number; limit?: number; total?: number; total_pages: number; has_next?: boolean; has_prev?: boolean;};}
export interface SuperAdminCategoryResponse {category: SuperAdminCategory;}
export interface CreateSuperAdminCategoryRequest {name: string; name_ar?: string | null; description?: string | null; description_ar?: string | null; is_active?: boolean;}
export interface UpdateSuperAdminCategoryRequest {name?: string; name_ar?: string | null; description?: string | null; description_ar?: string | null; is_active?: boolean;}
export interface CategoryMutationResponse {category: SuperAdminCategory; message?: string;}
export interface SuperAdminSubcategory extends SubcategoryOption {name_ar?: string | null; description?: string | null; description_ar?: string | null; description_i18n?: LocalizedText | null; created_at?: string; updated_at?: string;}
export interface SuperAdminSubcategoriesParams {category_id?: string; status?: "all" | "active" | "inactive"; sort?: "name_asc" | "name_desc" | "newest" | "oldest"; page?: number; limit?: number;}
export interface SuperAdminSubcategoriesResponse {data: SuperAdminSubcategory[]; pagination: {page: number; limit?: number; total?: number; total_pages: number; has_next?: boolean; has_prev?: boolean;};}
export interface SuperAdminSubcategoryResponse {subcategory: SuperAdminSubcategory;}
export interface CreateSuperAdminSubcategoryRequest {category_id: string; name: string; name_ar?: string | null; description?: string | null; description_ar?: string | null; is_active?: boolean;}
export interface UpdateSuperAdminSubcategoryRequest {category_id?: string; name?: string; name_ar?: string | null; description?: string | null; description_ar?: string | null; is_active?: boolean;}
export interface SubcategoryMutationResponse {subcategory: SuperAdminSubcategory; message?: string;}
