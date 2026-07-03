import { httpClient } from "@/lib/api/http-client";
import type {
  AuthTokensDto,
  AuthUserDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  SsoLoginDto,
  VerifyAccessDto
} from "@/modules/auth/types/auth.types";

export const authApi = {
  login: (payload: LoginDto) =>
    httpClient.post<AuthTokensDto>("/auth/login", payload).then((response) => response.data),
  register: (payload: RegisterDto) =>
    httpClient.post<AuthTokensDto>("/auth/register", payload).then((response) => response.data),
  refresh: (refreshToken: string) =>
    httpClient.post<AuthTokensDto>("/auth/refresh", { refreshToken }).then((response) => response.data),
  sso: (payload: SsoLoginDto) =>
    httpClient.post<AuthTokensDto>("/auth/sso", payload).then((response) => response.data),
  me: () => httpClient.get<AuthUserDto>("/auth/me").then((response) => response.data),
  forgotPassword: (payload: ForgotPasswordDto) =>
    httpClient.post<{ ok: boolean; message: string }>("/auth/forgot-password", payload).then((response) => response.data),
  verifyAccess: (payload: VerifyAccessDto) =>
    httpClient.post<AuthTokensDto>("/auth/verify-access", payload).then((response) => response.data),
  passkeyLoginOptions: (email: string) =>
    httpClient.post<Record<string, unknown>>("/auth/passkey/login-options", { email }).then((response) => response.data),
  passkeyLogin: (email: string, response: Record<string, unknown>) =>
    httpClient.post<AuthTokensDto>("/auth/passkey/login", { email, response }).then((res) => res.data),
  passkeyRegisterOptions: () =>
    httpClient.post<{ options: Record<string, unknown> }>("/auth/passkey/register-options").then((response) => response.data),
  passkeyRegister: (response: Record<string, unknown>, deviceName?: string) =>
    httpClient.post<{ ok: boolean }>("/auth/passkey/register", { response, deviceName }).then((res) => res.data),
  logout: () => httpClient.post<void>("/auth/logout").then((response) => response.data)
};
