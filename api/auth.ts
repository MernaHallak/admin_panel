import {apiClient} from "@/api/client";
import type {LoginRequest, LoginResponse} from "@/types/auth";

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>("/auth/login", credentials);
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}
