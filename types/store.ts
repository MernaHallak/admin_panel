import type {SupportedLocale} from "@/i18n/routing";

export type LocalizedText = Partial<Record<SupportedLocale, string | null>>;

export type StoreListStatus = "all" | "active" | "inactive";
export type StoreListSort = "newest" | "oldest" | "name_asc" | "name_desc";

export interface SuperAdminStore {
  id: string;
  name: string;
  name_ar: string | null;
  name_i18n: LocalizedText;
  slug: string;
  description: string | null;
  description_ar: string | null;
  description_i18n: LocalizedText;
  location: string | null;
  location_ar: string | null;
  location_i18n: LocalizedText;
  logo_url: string | null;
  cover_url: string | null;
  phone: string | null;
  whatsapp_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  telegram_url: string | null;
  social_links: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreListPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface StoresListResponse {
  data: SuperAdminStore[];
  pagination: StoreListPagination;
}

export interface StoresListParams {
  q?: string;
  status?: StoreListStatus;
  sort?: StoreListSort;
  page?: number;
  limit?: number;
}

export interface StoreDetailsSummary {
  products: {
    total: number;
    active: number;
  };
  store_admin_assignments: {
    total: number;
    active: number;
  };
}

export interface StoreDetailsResponse {
  store: SuperAdminStore;
  summary: StoreDetailsSummary;
}

export interface CreateStoreRequest {
  name: string;
  name_ar?: string | null;
  slug?: string;
  description?: string | null;
  description_ar?: string | null;
  location?: string | null;
  location_ar?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  phone?: string | null;
  whatsapp_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  telegram_url?: string | null;
  social_links?: Record<string, unknown>;
  is_active?: boolean;
}

export interface CreateStoreResponse {
  message: string;
  store: SuperAdminStore;
}

export interface UpdateStoreRequest {
  name?: string | null;
  name_ar?: string | null;
  slug?: string;
  description?: string | null;
  description_ar?: string | null;
  location?: string | null;
  location_ar?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  phone?: string | null;
  whatsapp_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  telegram_url?: string | null;
  social_links?: Record<string, unknown>;
  is_active?: boolean;
}

export interface UpdateStoreResponse {
  message: string;
  store: Partial<SuperAdminStore> & Pick<SuperAdminStore, "id">;
  summary: StoreDetailsSummary;
}
