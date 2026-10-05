import "server-only";

import axios from "axios";

export function getBackendClient() {
  const backendApiUrl = process.env.BACKEND_API_URL;
  if (!backendApiUrl) {
    throw new Error("BACKEND_API_URL is not configured");
  }

  return axios.create({
    baseURL: backendApiUrl,
    timeout: 10_000,
  });
}
