import { httpClient } from "@/lib/api/http-client";
import type { SettingsProfileDto, UpdateProfileDto, UpdateSecurityDto } from "@/modules/settings/types/settings.types";

export const settingsApi = {
  getProfile: () => httpClient.get<SettingsProfileDto>("/settings/profile").then((response) => response.data),
  updateProfile: (payload: UpdateProfileDto) => httpClient.patch<SettingsProfileDto>("/settings/profile", payload).then((response) => response.data),
  updateSecurity: (payload: UpdateSecurityDto) => httpClient.patch<void>("/settings/security", payload).then((response) => response.data)
};
