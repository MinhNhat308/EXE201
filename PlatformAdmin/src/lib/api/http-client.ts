import axios from "axios";
import { env } from "@/config/env";
import { clearAuthSession, getAccessToken } from "@/modules/auth/lib/auth-session";
import { refreshAuthTokens } from "@/modules/auth/lib/refresh-auth";

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

let refreshPromise: Promise<string | null> | null = null;

function isAuthEndpoint(url?: string) {
  if (!url) return false;
  return ["/auth/login", "/auth/register", "/auth/refresh", "/auth/sso", "/auth/passkey"].some((path) =>
    url.includes(path)
  );
}

httpClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

    if (
      typeof window !== "undefined" &&
      error?.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAuthTokens()
          .then((data) => data?.accessToken ?? null)
          .catch(() => null)
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return httpClient(originalRequest);
      }

      clearAuthSession();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}
