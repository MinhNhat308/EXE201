import type { AuthTokensDto } from "@/modules/auth/types/auth.types";

export const accessTokenKey = "exe_milktea_access_token";
export const refreshTokenKey = "exe_milktea_refresh_token";

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(accessTokenKey);
}

export function getRefreshToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(refreshTokenKey);
}

export function setAuthSession(data: AuthTokensDto) {
  window.localStorage.setItem(accessTokenKey, data.accessToken);
  window.localStorage.setItem(refreshTokenKey, data.refreshToken);
}

export function clearAuthSession() {
  window.localStorage.removeItem(accessTokenKey);
  window.localStorage.removeItem(refreshTokenKey);
}
