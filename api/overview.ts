import {apiClient} from "@/api/client";
import type {SuperAdminOverview} from "@/types/overview";

export async function getSuperAdminOverview(): Promise<SuperAdminOverview> {
  const response = await apiClient.get<SuperAdminOverview>("/super-admin/overview");
  return response.data;
}
