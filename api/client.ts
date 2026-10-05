import {routing} from "@/i18n/routing";
import axios, {type InternalAxiosRequestConfig} from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 10_000,
  withCredentials: true,
});

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<void> | null = null;

function redirectToLogin() {
  if (typeof window === "undefined") return;

  const firstPathSegment = window.location.pathname.split("/").filter(Boolean)[0];
  const locale = routing.locales.includes(
    firstPathSegment as (typeof routing.locales)[number],
  )
    ? firstPathSegment
    : routing.defaultLocale;

  window.location.replace(`/${locale}/login`);
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;

    if (status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes("/auth/login")) {
      return Promise.reject(error);
    }

    if (originalRequest._retry || originalRequest.url?.includes("/auth/refresh")) {
      redirectToLogin();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = apiClient
          .post("/auth/refresh")
          .then(() => undefined)
          .finally(() => {
            refreshPromise = null;
          });
      }

      await refreshPromise;
      return apiClient(originalRequest);
    } catch (refreshError) {
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  },
);
