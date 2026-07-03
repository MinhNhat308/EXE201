"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startRegistration, type PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi } from "@/modules/auth/api/auth.api";
import { useSettingsProfile, useUpdateProfile, useUpdateSecurity } from "@/modules/settings/api/settings.queries";
import { updateProfileSchema, updateSecuritySchema } from "@/modules/settings/schemas/settings.schema";
import { useSettingsStore } from "@/modules/settings/stores/settings.store";

type ProfileFormValues = z.infer<typeof updateProfileSchema>;
type SecurityFormValues = z.infer<typeof updateSecuritySchema>;

export function SettingsPanel() {
  const profile = useSettingsProfile();
  const updateProfile = useUpdateProfile();
  const updateSecurity = useUpdateSecurity();
  const { activeTab, setActiveTab } = useSettingsStore();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { fullName: "", email: "" }
  });

  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(updateSecuritySchema),
    defaultValues: { currentPassword: "", newPassword: "" }
  });
  const [passkeyMessage, setPasskeyMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile.data) {
      profileForm.reset({ fullName: profile.data.fullName, email: profile.data.email });
    }
  }, [profile.data, profileForm]);

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <Button variant={activeTab === "profile" ? "default" : "outline"} onClick={() => setActiveTab("profile")}>
          Profile
        </Button>
        <Button variant={activeTab === "security" ? "default" : "outline"} onClick={() => setActiveTab("security")}>
          Security
        </Button>
      </div>

      {activeTab === "profile" ? (
        <Card>
          <CardHeader>
            <CardTitle>Profile settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid max-w-xl gap-4"
              onSubmit={profileForm.handleSubmit((values) => updateProfile.mutate(values))}
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">Full name</label>
                <Input {...profileForm.register("fullName")} />
                {profileForm.formState.errors.fullName ? (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.fullName.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" {...profileForm.register("email")} />
                {profileForm.formState.errors.email ? (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.email.message}</p>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">Role: {profile.data?.role ?? "—"}</p>
              <Button className="w-fit" disabled={updateProfile.isPending || profile.isLoading}>
                Save profile
              </Button>
              {updateProfile.isSuccess ? <p className="text-sm text-emerald-600">Profile updated successfully.</p> : null}
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Security settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid max-w-xl gap-4"
              onSubmit={securityForm.handleSubmit((values) =>
                updateSecurity.mutate(values, {
                  onSuccess: () => securityForm.reset({ currentPassword: "", newPassword: "" })
                })
              )}
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">Current password</label>
                <Input type="password" {...securityForm.register("currentPassword")} />
                {securityForm.formState.errors.currentPassword ? (
                  <p className="text-xs text-destructive">{securityForm.formState.errors.currentPassword.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New password</label>
                <Input type="password" {...securityForm.register("newPassword")} />
                {securityForm.formState.errors.newPassword ? (
                  <p className="text-xs text-destructive">{securityForm.formState.errors.newPassword.message}</p>
                ) : null}
              </div>
              <Button className="w-fit" disabled={updateSecurity.isPending}>
                Update password
              </Button>
              {updateSecurity.isSuccess ? <p className="text-sm text-emerald-600">Password updated successfully.</p> : null}
              {updateSecurity.isError ? <p className="text-sm text-destructive">Could not update password. Check your current password.</p> : null}
            </form>

            <div className="mt-8 border-t pt-6">
              <h3 className="text-sm font-semibold">Passkey</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Đăng ký passkey để đăng nhập không cần mật khẩu trên thiết bị này.
              </p>
              <Button
                className="mt-4"
                type="button"
                variant="outline"
                onClick={async () => {
                  setPasskeyMessage(null);
                  try {
                    const { options } = await authApi.passkeyRegisterOptions();
                    const response = await startRegistration({
                      optionsJSON: options as unknown as PublicKeyCredentialCreationOptionsJSON
                    });
                    await authApi.passkeyRegister(response as unknown as Record<string, unknown>, "Primary device");
                    setPasskeyMessage("Passkey registered successfully.");
                  } catch {
                    setPasskeyMessage("Could not register passkey. Use localhost and a supported browser.");
                  }
                }}
              >
                Register passkey
              </Button>
              {passkeyMessage ? <p className="mt-2 text-sm text-muted-foreground">{passkeyMessage}</p> : null}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
