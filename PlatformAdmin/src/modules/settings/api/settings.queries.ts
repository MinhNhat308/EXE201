import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/modules/settings/api/settings.api";
import type { UpdateProfileDto, UpdateSecurityDto } from "@/modules/settings/types/settings.types";

export const settingsQueryKeys = {
  profile: ["settings", "profile"] as const
};

export function useSettingsProfile() {
  return useQuery({ queryKey: settingsQueryKeys.profile, queryFn: settingsApi.getProfile });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfileDto) => settingsApi.updateProfile(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsQueryKeys.profile })
  });
}

export function useUpdateSecurity() {
  return useMutation({ mutationFn: (payload: UpdateSecurityDto) => settingsApi.updateSecurity(payload) });
}
