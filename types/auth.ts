import type {ApiErrorResponse, ApiValidationError} from "@/types/api";

export type {ApiErrorResponse, ApiValidationError};

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "super_admin";
  full_name: string;
}

export interface AuthProfile extends AuthUser {
  is_active: boolean;
}

export interface BackendLoginResponse {
  message: string;
  session: AuthSession;
  user: AuthUser;
  profile: AuthProfile;
}

export interface LoginResponse {
  message: string;
  user: AuthUser;
  profile: AuthProfile;
}

export interface BackendRefreshResponse {
  message: string;
  session: AuthSession;
  user: AuthUser;
  profile: AuthProfile;
}

export interface SuperAdminIdentityResponse {
  user: AuthUser;
  profile: AuthProfile;
  scope: "global";
}
