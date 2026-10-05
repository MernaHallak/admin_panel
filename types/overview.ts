export interface OverviewStatusCounts {
  total: number;
  active: number;
  inactive: number;
}

export interface OverviewUserCounts {
  admins: number;
  super_admins: number;
}

export interface OverviewStoreAdminAssignments {
  total: number;
  active: number;
}

export interface SuperAdminOverview {
  scope: "global";
  stores: OverviewStatusCounts;
  products: OverviewStatusCounts;
  categories: OverviewStatusCounts;
  subcategories: OverviewStatusCounts;
  users: OverviewUserCounts;
  store_admin_assignments: OverviewStoreAdminAssignments;
}
