export type StoreAdminAssignmentStatus = "all" | "active" | "inactive";
export type StoreAdminAssignmentSort = "newest" | "oldest";

export interface StoreAdminProfile {
  id: string;
  email: string;
  full_name: string;
  role: "admin";
  is_active: boolean;
}

export interface StoreAdminStoreSummary {
  id: string;
  name?: string;
  name_ar?: string | null;
  slug: string;
  is_active: boolean;
}

export interface StoreAdminAssignment {
  id: string;
  user_id: string;
  store_id: string;
  assignment_is_active: boolean;
  profile_is_active: boolean;
  effective_is_active: boolean;
  profile: StoreAdminProfile;
  store: StoreAdminStoreSummary;
}

export interface StoreAdminAssignmentsPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface StoreAdminAssignmentsParams {
  q?: string;
  status?: StoreAdminAssignmentStatus;
  store_id?: string;
  sort?: StoreAdminAssignmentSort;
  page?: number;
  limit?: number;
}

export interface StoreAdminAssignmentsResponse {
  data: StoreAdminAssignment[];
  pagination: StoreAdminAssignmentsPagination;
}

export interface StoreAdminAssignmentResponse {
  assignment: StoreAdminAssignment;
}

export interface CreateStoreAdminRequest {
  email: string;
  password: string;
  full_name: string;
  store_id: string;
}

export interface UpdateStoreAdminRequest {
  full_name?: string;
  profile_is_active?: boolean;
  assignment_is_active?: boolean;
  store_id?: string;
}

export interface StoreAdminMutationResponse {
  message: string;
  assignment: Partial<StoreAdminAssignment> & Pick<StoreAdminAssignment, "id">;
}
