import axios from "axios";
import { env } from "@/config/env";
import type { AuthTokensDto } from "@/modules/auth/types/auth.types";
import { refreshTokenKey, setAuthSession } from "@/modules/auth/lib/auth-session";

export async function refreshAuthTokens(): Promise<AuthTokensDto | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const refreshToken = window.localStorage.getItem(refreshTokenKey);
  if (!refreshToken) {
    return null;
  }

  const { data } = await axios.post<AuthTokensDto>(`${env.apiBaseUrl}/auth/refresh`, { refreshToken });
  setAuthSession(data);
  return data;
}
